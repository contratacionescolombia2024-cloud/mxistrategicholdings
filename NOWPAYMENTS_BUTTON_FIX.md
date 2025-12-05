
# NOWPayments Button Fix - Implementation Summary

## Problem
The payment button was not opening the NOWPayments payment page when clicked. Users were unable to initiate payments.

## Root Cause Analysis
After investigating the edge function logs, we found that the `create-nowpayments-order` edge function was returning 500 errors. The issue was likely:

1. **Insufficient error logging** - The edge function wasn't providing detailed error information
2. **Payment URL handling** - The payment URL might not have been properly extracted from the NOWPayments API response
3. **Browser opening issues** - The WebBrowser.openBrowserAsync might have been failing silently

## Solution Implemented

### 1. Enhanced Edge Function Logging
Updated `create-nowpayments-order` edge function with comprehensive logging:

- Added console.log statements at every critical step
- Log the NOWPayments API request payload
- Log the NOWPayments API response status and data
- Log payment URL construction
- Log database operations
- Enhanced error messages with stack traces

**Key improvements:**
```typescript
console.log('=== Starting create-nowpayments-order ===');
console.log('User authenticated:', user.id);
console.log('MXI amount requested:', mxi_amount);
console.log('Metrics fetched:', metrics);
console.log('Price calculation:', { currentPhase, pricePerMxi, totalUsdt });
console.log('Generated order ID:', orderId);
console.log('NOWPayments request payload:', nowpaymentsPayload);
console.log('NOWPayments response status:', nowpaymentsResponse.status);
console.log('NOWPayments response data:', paymentData);
console.log('Payment URL:', paymentUrl);
console.log('Order stored successfully:', order.id);
```

### 2. Improved Payment URL Handling
Enhanced the payment URL extraction logic:

```typescript
// Construct payment URL - NOWPayments returns invoice_url or we construct it
const paymentUrl = paymentData.invoice_url || 
                   (paymentData.payment_id ? `https://nowpayments.io/payment/?iid=${paymentData.payment_id}` : null);

if (!paymentUrl) {
  console.error('No payment URL available:', paymentData);
  return new Response(
    JSON.stringify({
      error: 'Payment created but no payment URL available',
      payment_data: paymentData,
    }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 3. Enhanced Frontend Error Handling
Updated `purchase-mxi.tsx` with better error handling and user feedback:

**Immediate browser opening:**
```typescript
// Immediately open the payment URL
try {
  const browserResult = await WebBrowser.openBrowserAsync(result.payment_url);
  console.log('Browser result:', browserResult);
  
  // Show success message after opening browser
  Alert.alert(
    '✅ Orden Creada',
    `Se ha creado tu orden de ${amount} MXI por $${total} USDT.\n\nSe ha abierto la página de pago en tu navegador.`,
    [{ text: 'OK', onPress: () => loadPendingOrders() }]
  );
} catch (browserError) {
  console.error('Error opening browser:', browserError);
  
  // If browser fails to open, show the URL in an alert
  Alert.alert(
    '⚠️ No se pudo abrir el navegador',
    `Tu orden ha sido creada pero no se pudo abrir el navegador automáticamente.\n\nPuedes encontrar tu orden en la sección "Órdenes Pendientes" más abajo.`,
    [{ text: 'OK', onPress: () => loadPendingOrders() }]
  );
}
```

**Enhanced logging:**
```typescript
console.log('Creating order for', amount, 'MXI');
console.log('Calling edge function...');
console.log('Response status:', response.status);
console.log('Response data:', result);
console.log('Opening payment URL:', result.payment_url);
console.log('Browser result:', browserResult);
```

**Better error messages:**
```typescript
if (!result.payment_url) {
  throw new Error('No se recibió URL de pago');
}

// More descriptive error handling
catch (error: any) {
  console.error('Error creating order:', error);
  Alert.alert(
    'Error',
    error.message || 'No se pudo crear la orden. Por favor intenta nuevamente.'
  );
}
```

## Testing Instructions

### 1. Test Payment Creation
1. Open the app and navigate to "Comprar MXI"
2. Enter an amount (minimum 50 MXI for $20 USDT at Phase 1 price of $0.40)
3. Click "Pagar con USDT (NOWPayments)"
4. Check the console logs for detailed information
5. Verify that the browser opens with the NOWPayments payment page

### 2. Check Edge Function Logs
To view detailed logs:
```bash
# View edge function logs
supabase functions logs create-nowpayments-order
```

Look for:
- "=== Starting create-nowpayments-order ==="
- "User authenticated: [user_id]"
- "NOWPayments response status: 200"
- "Payment URL: https://..."
- "Order stored successfully: [order_id]"

### 3. Test Pending Orders
1. After creating an order, scroll down to "Órdenes Pendientes"
2. Click "Abrir Pago" to open the payment URL
3. Click "Verificar" to check the payment status

### 4. Test Error Scenarios
1. Try creating an order with invalid amount (< $20)
2. Try creating an order when not logged in
3. Verify error messages are clear and helpful

## Expected Behavior

### Success Flow:
1. User enters MXI amount
2. User clicks payment button
3. Edge function creates order with NOWPayments
4. Browser opens with payment page
5. Success alert shows
6. Order appears in "Órdenes Pendientes"
7. User can click "Abrir Pago" to return to payment page

### Error Flow:
1. If edge function fails: Clear error message with details
2. If browser fails to open: Alert with fallback instructions
3. If payment URL missing: Error logged and reported

## Debugging

If issues persist, check:

1. **Edge Function Logs:**
   - Look for 500 errors
   - Check NOWPayments API response
   - Verify payment URL is present

2. **Console Logs:**
   - Check browser console for errors
   - Verify WebBrowser.openBrowserAsync is called
   - Check for network errors

3. **NOWPayments API:**
   - Verify API key is correct: `9SC5SM9-7SR45HD-JKXSWGY-489J5YA`
   - Check NOWPayments dashboard for order creation
   - Verify API endpoint is accessible

4. **Database:**
   - Check `nowpayments_orders` table for new orders
   - Verify `payment_url` field is populated
   - Check order status

## Next Steps

1. **Monitor Logs:** Watch edge function logs for any errors
2. **Test Payments:** Complete a test payment to verify end-to-end flow
3. **User Feedback:** Collect feedback on payment experience
4. **Optimize:** Based on logs, optimize error handling further

## Files Modified

1. **Edge Function:**
   - `supabase/functions/create-nowpayments-order/index.ts` (version 4)

2. **Frontend:**
   - `app/(tabs)/(home)/purchase-mxi.tsx`

## API Reference

### NOWPayments API
- **Endpoint:** `https://api.nowpayments.io/v1/payment`
- **Method:** POST
- **Headers:**
  - `x-api-key`: NOWPayments API key
  - `Content-Type`: application/json

**Request Body:**
```json
{
  "price_amount": 20.00,
  "price_currency": "usd",
  "pay_currency": "usdtbep20",
  "order_id": "MXI-1234567890-abcd1234",
  "order_description": "Purchase 50 MXI tokens",
  "ipn_callback_url": "https://[project].supabase.co/functions/v1/nowpayments-webhook",
  "success_url": "https://natively.dev/(tabs)/(home)",
  "cancel_url": "https://natively.dev/(tabs)/deposit"
}
```

**Response:**
```json
{
  "payment_id": "1234567890",
  "payment_status": "waiting",
  "pay_address": "0x...",
  "pay_amount": 20.5,
  "pay_currency": "usdtbep20",
  "invoice_url": "https://nowpayments.io/payment/?iid=1234567890"
}
```

## Support

If you encounter issues:
1. Check the console logs
2. Review edge function logs
3. Verify NOWPayments API status
4. Contact support with order ID and error details
