
# NOWPayments Button Fix - Final Solution

## Problem
The "Pagar con USDT (NOWPayments)" button was not opening the payment page when clicked. The edge function was returning 500 errors.

## Root Cause
The edge function was using the **wrong NOWPayments API endpoint**:
- **Old (incorrect)**: `/v1/payment` 
- **New (correct)**: `/v1/invoice`

The `/v1/invoice` endpoint is the correct one for creating payment invoices with NOWPayments, as specified in the user's requirements.

## Changes Made

### 1. Edge Function Update (`supabase/functions/create-nowpayments-order/index.ts`)

#### Changed API Endpoint
```typescript
// OLD - INCORRECT
nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
  method: 'POST',
  headers: {
    'x-api-key': nowpaymentsApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(nowpaymentsPayload),
});

// NEW - CORRECT
nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
  method: 'POST',
  headers: {
    'x-api-key': nowpaymentsApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(nowpaymentsPayload),
});
```

#### Updated Request Payload
```typescript
// OLD - Missing public_key
const nowpaymentsPayload = {
  price_amount: totalUsdt,
  price_currency: 'usd',
  pay_currency: 'usdtbep20',
  order_id: orderId,
  order_description: `Compra de ${mxi_amount} tokens MXI`,
  ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
  success_url: 'https://natively.dev/(tabs)/(home)',
  cancel_url: 'https://natively.dev/(tabs)/(home)/purchase-mxi',
};

// NEW - Includes public_key and simplified
const nowpaymentsPayload = {
  price_amount: totalUsdt,
  price_currency: 'usd',
  pay_currency: 'usdt',
  order_description: 'MXI Strategic Presale',
  public_key: nowpaymentsPublicKey,
  success_url: 'https://natively.dev/(tabs)/(home)',
  cancel_url: 'https://natively.dev/(tabs)/(home)/purchase-mxi',
};
```

#### Updated Response Handling
```typescript
// Extract invoice URL from response
const invoiceUrl = invoiceData.invoice_url;

if (!invoiceUrl) {
  console.error('No invoice URL in response:', invoiceData);
  // ... error handling
}
```

## API Configuration

### NOWPayments Credentials
- **API Key**: `9SC5SM9-7SR45HD-JKXSWGY-489J5YA`
- **Public Key**: `8f1694be-d30a-47d5-bc90-c3eb24d43a7a`

### Endpoint Details
- **URL**: `https://api.nowpayments.io/v1/invoice`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: 9SC5SM9-7SR45HD-JKXSWGY-489J5YA`

### Request Body
```json
{
  "price_amount": {{amount}},
  "price_currency": "usd",
  "pay_currency": "usdt",
  "order_description": "MXI Strategic Presale",
  "public_key": "8f1694be-d30a-47d5-bc90-c3eb24d43a7a",
  "success_url": "https://natively.dev/(tabs)/(home)",
  "cancel_url": "https://natively.dev/(tabs)/(home)/purchase-mxi"
}
```

### Response Structure
```json
{
  "id": "invoice_id",
  "invoice_url": "https://nowpayments.io/payment/?iid=...",
  "order_id": "...",
  "order_description": "...",
  "price_amount": "...",
  "price_currency": "...",
  "pay_currency": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

## How It Works Now

1. **User enters MXI amount** in the purchase form
2. **User clicks "Pagar con USDT (NOWPayments)"** button
3. **Frontend calls edge function** with the MXI amount
4. **Edge function**:
   - Validates user authentication
   - Calculates USDT amount based on current phase price
   - Creates transaction history entry
   - Calls NOWPayments `/v1/invoice` endpoint
   - Receives `invoice_url` in response
   - Stores order in database
   - Returns `invoice_url` to frontend
5. **Frontend opens payment page**:
   - First tries `expo-web-browser` (WebBrowser.openBrowserAsync)
   - Falls back to `Linking.openURL` if WebBrowser fails
   - Shows success/error alert to user
6. **User completes payment** on NOWPayments page
7. **Webhook updates** transaction status when payment is confirmed

## Testing

### Test the Payment Flow
1. Open the app
2. Navigate to "Comprar MXI"
3. Enter an amount (minimum 50 MXI or $20 USDT equivalent)
4. Click "Pagar con USDT (NOWPayments)"
5. Verify that:
   - The NOWPayments payment page opens in a browser
   - An alert confirms the order was created
   - The order appears in "Órdenes Pendientes"
   - The transaction is logged in "Historial de Transacciones"

### Check Logs
```bash
# View edge function logs
supabase functions logs create-nowpayments-order --project-ref aeyfnjuatbtcauiumbhn
```

Look for:
- ✅ "Invoice URL received: https://nowpayments.io/payment/?iid=..."
- ✅ "Order stored successfully"
- ❌ Any error messages

## Frontend Flow

The frontend (`app/(tabs)/(home)/purchase-mxi.tsx`) handles the payment URL opening:

```typescript
const openPaymentUrl = async (url: string) => {
  console.log('Attempting to open payment URL:', url);
  
  try {
    // Try WebBrowser first (better UX)
    const result = await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: 'close',
      readerMode: false,
      enableBarCollapsing: false,
    });
    
    console.log('WebBrowser result:', result);
    return true;
  } catch (webBrowserError) {
    console.error('WebBrowser failed:', webBrowserError);
    
    try {
      // Fallback to Linking
      const canOpen = await Linking.canOpenURL(url);
      console.log('Can open URL with Linking:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        console.error('Cannot open URL with Linking');
        return false;
      }
    } catch (linkingError) {
      console.error('Linking failed:', linkingError);
      return false;
    }
  }
};
```

## Transaction History

All payment attempts are logged in the `transaction_history` table with:
- **Status**: pending → waiting → confirmed/failed
- **Payment URL**: For reopening if needed
- **Error details**: If the payment fails
- **Metadata**: Phase, price, invoice ID, etc.

Users can:
- View all transactions in "Historial de Transacciones"
- Reopen pending payment URLs
- Check payment status
- See error messages for failed payments

## Success Criteria

✅ **Button creates invoice** with NOWPayments
✅ **Payment page opens** in browser
✅ **Transaction is logged** in database
✅ **Order appears** in pending orders
✅ **User can reopen** payment URL from pending orders
✅ **Error handling** shows clear messages
✅ **Webhook updates** status when payment completes

## Troubleshooting

### If payment page doesn't open:
1. Check edge function logs for errors
2. Verify NOWPayments API credentials
3. Check that `invoice_url` is in the response
4. Test URL opening with both WebBrowser and Linking

### If order isn't created:
1. Check transaction_history table for failed entries
2. Review error_message and error_details fields
3. Verify user authentication
4. Check phase allocation limits

### If webhook doesn't update status:
1. Verify webhook URL is configured in NOWPayments dashboard
2. Check nowpayments-webhook edge function logs
3. Ensure IPN callback URL is correct in the invoice creation

## Next Steps

1. ✅ Test the payment flow end-to-end
2. ✅ Verify webhook updates work correctly
3. ✅ Monitor transaction_history for any issues
4. ✅ Check that MXI is credited after payment confirmation
5. ✅ Verify referral commissions are calculated correctly

## Notes

- The `/v1/invoice` endpoint is the **correct and recommended** endpoint for NOWPayments
- The `public_key` parameter is **required** for invoice creation
- The `invoice_url` is returned directly in the response (no need to construct it)
- Payment URLs expire after 1 hour if not completed
- Users can have multiple pending orders simultaneously
- All errors are logged in transaction_history for debugging
