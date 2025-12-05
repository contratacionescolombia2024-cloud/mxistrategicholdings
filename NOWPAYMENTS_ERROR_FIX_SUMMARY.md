
# NowPayments Error Fix - "Edge Function returned a non-2xx status code"

## Problem
The NowPayments integration was failing with a "Edge Function returned a non-2xx status code" error when users tried to purchase MXI tokens.

## Root Cause
The edge function was sending an incorrect payload to the NowPayments API:
1. **Incorrect parameter**: The `public_key` parameter was being sent in the request body, but the `/v1/invoice` endpoint doesn't accept this parameter
2. **Generic pay_currency**: Using `usdt` instead of the more specific `usdttrc20`
3. **Missing callback URL**: No IPN callback URL was configured for webhook notifications

## Solution Implemented

### 1. Updated Edge Function (`create-nowpayments-order`)
**File**: `supabase/functions/create-nowpayments-order/index.ts`

**Key Changes**:
- ✅ Removed `public_key` from the invoice payload
- ✅ Changed `pay_currency` from `usdt` to `usdttrc20` (USDT on Tron network)
- ✅ Added `ipn_callback_url` for webhook notifications
- ✅ Added `order_id` to the payload for better tracking
- ✅ Enhanced error logging for better debugging

**New Invoice Payload**:
```typescript
const invoicePayload = {
  price_amount: totalUsdt,
  price_currency: 'usd',
  pay_currency: 'usdttrc20',
  ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
  order_id: orderId,
  order_description: 'MXI Strategic Presale Payment',
  success_url: 'https://natively.dev',
  cancel_url: 'https://natively.dev',
};
```

### 2. API Credentials Used
- **API Key**: `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9`
- **Public Key**: `b3e7e5cb-ccf0-4a5c-abbb-1c7bc02afe37` (not used in API calls)

## How It Works Now

1. **User enters MXI amount** → Frontend calculates USDT equivalent
2. **User clicks "Pagar con USDT"** → Frontend calls edge function
3. **Edge function validates** → Checks amount, phase limits, user auth
4. **Creates transaction record** → Stores in `transaction_history` table
5. **Calls NowPayments API** → Creates invoice with correct payload
6. **Returns invoice URL** → Opens payment page in browser
7. **User completes payment** → NowPayments sends webhook notification
8. **Webhook updates status** → MXI credited to user account

## Testing the Fix

### Test Case 1: Minimum Purchase
- Amount: 50 MXI (minimum $20 USDT)
- Expected: Invoice created successfully
- Result: ✅ Should work

### Test Case 2: Standard Purchase
- Amount: 100 MXI
- Expected: Invoice created and payment page opens
- Result: ✅ Should work

### Test Case 3: Error Handling
- Amount: 0 or negative
- Expected: Validation error before API call
- Result: ✅ Should show error message

## Monitoring & Debugging

### Check Edge Function Logs
```bash
# View recent logs
supabase functions logs create-nowpayments-order
```

### Check Transaction History
```sql
SELECT 
  id,
  order_id,
  status,
  error_message,
  error_details,
  created_at
FROM transaction_history
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Common Error Messages
- **"No autorizado"**: User session expired, need to login again
- **"Debes ingresar un monto válido"**: Invalid MXI amount
- **"El monto mínimo de compra es $20 USDT"**: Below minimum purchase
- **"Error al conectar con el servicio de pagos"**: Network error to NowPayments
- **"No se pudo generar el pago"**: NowPayments API returned error

## NowPayments API Documentation
- **Endpoint**: `https://api.nowpayments.io/v1/invoice`
- **Method**: POST
- **Authentication**: `x-api-key` header
- **Documentation**: https://documenter.getpostman.com/view/7907941/S1a32n38

## Next Steps

1. **Test the payment flow** with a small amount (50 MXI)
2. **Monitor the logs** to ensure no errors
3. **Verify webhook** is receiving payment notifications
4. **Check transaction history** to confirm status updates

## Rollback Plan
If issues persist, you can:
1. Check the edge function logs for detailed error messages
2. Verify the API key is valid in NowPayments dashboard
3. Test the API directly using Postman or curl
4. Contact NowPayments support if API issues persist

## Support
If you continue to experience issues:
1. Check the transaction history screen for detailed error messages
2. Review the edge function logs
3. Verify your NowPayments account is active and API key is valid
4. Ensure you have sufficient balance/limits in your NowPayments account
