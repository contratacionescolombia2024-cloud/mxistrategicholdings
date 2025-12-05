
# NowPayments Integration Fix - Complete

## Issues Fixed

### 1. Payment Button Not Working
**Problem:** The payment flow was trying to use non-existent wrapper functions (`create-paid-intent` and `create-payment-intent`) instead of the actual `create-nowpayments-order` function.

**Solution:** 
- Updated `payment-flow.tsx` to directly call `create-nowpayments-order`
- Simplified the payment flow to a single-step process
- Removed the multi-step cryptocurrency selection (NowPayments handles this on their page)

### 2. Verify Button Not Working
**Problem:** The `check-nowpayments-status` function was returning 500 errors due to:
- Trying to query both `payment_intents` and `nowpayments_orders` tables
- Poor error handling when tables didn't exist or had no data
- Not properly handling missing payment_id

**Solution:**
- Updated `check-nowpayments-status` to only query `transaction_history` table
- Added comprehensive error handling with user-friendly messages
- Improved logging for debugging
- Properly handle cases where payment_id is missing

### 3. Webhook Signature Verification
**Problem:** Webhooks were returning 401 errors due to signature verification failures.

**Status:** The webhook function already has proper signature verification implemented. The 401 errors indicate that:
- Either the webhook secret in Supabase doesn't match the one in NowPayments dashboard
- Or NowPayments is not sending the signature header

**Action Required:**
1. Go to NowPayments Dashboard → Settings → IPN/Callbacks
2. Verify the IPN Secret Key matches the `NOWPAYMENTS_WEBHOOK_SECRET` environment variable in Supabase
3. Ensure the IPN callback URL is set to: `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook`

## Updated Files

### 1. `app/(tabs)/(home)/payment-flow.tsx`
- Simplified to single-step payment creation
- Removed cryptocurrency selection (handled by NowPayments)
- Direct integration with `create-nowpayments-order`
- Real-time payment status updates via Supabase Realtime
- Better error handling and user feedback

### 2. `supabase/functions/check-nowpayments-status/index.ts`
- Query only `transaction_history` table
- Comprehensive error handling
- Better logging for debugging
- User-friendly error messages in Spanish
- Proper handling of missing payment_id

## How It Works Now

### Payment Flow:
1. User enters MXI amount
2. App calculates USDT equivalent
3. User clicks "Crear Orden de Pago"
4. App calls `create-nowpayments-order` edge function
5. Edge function creates order and returns NowPayments invoice URL
6. App opens invoice URL in browser
7. User completes payment on NowPayments page
8. NowPayments sends webhook to `nowpayments-webhook` function
9. Webhook processes payment and updates user balance
10. App receives real-time update via Supabase Realtime

### Verify Button Flow:
1. User clicks "Verificar" on pending transaction
2. App calls `check-nowpayments-status` with order_id
3. Function queries transaction from `transaction_history`
4. Function calls NowPayments API to get latest status
5. If payment is confirmed, function processes it (updates balances, metrics, commissions)
6. Function returns status to app
7. App shows success/failure message to user

## Environment Variables Required

Make sure these are set in Supabase Edge Functions:

```
SUPABASE_URL=https://aeyfnjuatbtcauiumbhn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NOWPAYMENTS_API_KEY=<your-nowpayments-api-key>
NOWPAYMENTS_WEBHOOK_SECRET=<your-nowpayments-webhook-secret>
```

## Testing Checklist

- [x] Payment button creates order successfully
- [x] Payment URL opens in browser
- [x] Verify button checks payment status
- [ ] Webhook processes confirmed payments (requires actual payment)
- [ ] Real-time updates work when payment is confirmed

## Known Limitations

1. **Webhook Signature Verification:** Currently returning 401 errors. This needs to be verified in NowPayments dashboard.
2. **Currency:** Only USDT (Ethereum ERC20) is supported. This is hardcoded in `create-nowpayments-order`.
3. **Minimum Amount:** $20 USDT minimum purchase (can be adjusted in the code).

## Next Steps

1. **Verify Webhook Configuration:**
   - Check NowPayments dashboard IPN settings
   - Ensure webhook secret matches environment variable
   - Test with a real payment to confirm webhook processing

2. **Monitor Logs:**
   - Check edge function logs for any errors
   - Monitor transaction_history table for status updates
   - Verify user balances are updated correctly

3. **User Testing:**
   - Test complete payment flow with small amount
   - Verify all balances update correctly
   - Check referral commissions are calculated properly

## Support

If issues persist:
1. Check edge function logs: Supabase Dashboard → Edge Functions → Logs
2. Check transaction_history table for error details
3. Verify environment variables are set correctly
4. Contact NowPayments support if webhook issues continue
