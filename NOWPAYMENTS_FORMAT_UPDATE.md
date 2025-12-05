
# NOWPayments Format Update - Complete

## Overview
Updated both `create-payment-intent` and `nowpayments-webhook` edge functions to properly handle the specified request/response formats.

## Changes Made

### 1. create-payment-intent Edge Function (v18)

**New Request Format:**
```
POST /functions/v1/create-payment-intent
Headers:
  Authorization: Bearer <jwt_usuario_valido>
  Content-Type: application/json
Body:
{
  "amount_fiat": 10,
  "fiat_currency": "USD",
  "crypto_currency": "USDTTRC20",
  "order_id": "debug_1234567890"
}
```

**Key Changes:**
- Changed field names from `price_amount` → `amount_fiat`
- Changed field names from `price_currency` → `fiat_currency`
- Changed field names from `pay_currency` → `crypto_currency`
- All fields are now required (no optional currency selection step)
- Validates all 4 required fields: `order_id`, `amount_fiat`, `fiat_currency`, `crypto_currency`
- Normalizes crypto currency to lowercase before sending to NOWPayments
- Maintains backward compatibility by storing in all 3 tables: `payments`, `transaction_history`, `nowpayments_orders`

**Response Format:**
```json
{
  "success": true,
  "intent": {
    "id": "invoice_id_from_nowpayments",
    "order_id": "debug_1234567890",
    "invoice_url": "https://nowpayments.io/payment/...",
    "mxi_amount": 33.33,
    "usdt_amount": 10,
    "price_per_mxi": 0.30,
    "phase": 1,
    "pay_currency": "usdttrc20",
    "fiat_currency": "USD"
  }
}
```

### 2. nowpayments-webhook Edge Function (v12)

**Expected Webhook Format:**
```
POST /functions/v1/nowpayments-webhook
Headers:
  Content-Type: application/json
  x-nowpayments-sig: <hmac_signature> (optional but recommended)
Body:
{
  "payment_id": "test",
  "payment_status": "finished"
}
```

**Key Changes:**
- Supports minimal webhook format with just `payment_id` and `payment_status`
- Also supports full NOWPayments IPN format with additional fields
- Tries to find payment by `payment_id` first, then falls back to `order_id`
- Properly handles both field names: `payment_status` and `status`
- Maintains HMAC signature verification for security (when configured)
- Logs all webhook attempts to `nowpayments_webhook_logs` table

**Status Normalization:**
- `finished` or `confirmed` → `paid`
- `waiting`, `pending`, or `confirming` → `processing`
- `failed` → `failed`
- `expired` → `expired`
- `refunded` → `refunded`

## Testing

### Test create-payment-intent:
```bash
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_fiat": 10,
    "fiat_currency": "USD",
    "crypto_currency": "USDTTRC20",
    "order_id": "debug_'$(date +%s)'"
  }'
```

### Test nowpayments-webhook:
```bash
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test",
    "payment_status": "finished"
  }'
```

## Error Handling

### create-payment-intent Errors:
- **401**: Missing or invalid JWT token
- **400**: Missing required fields or invalid amount
- **500**: NOWPayments API error, database error, or configuration issue

### nowpayments-webhook Errors:
- **400**: Invalid JSON payload
- **401**: Invalid HMAC signature (if signature verification is enabled)
- **404**: Payment not found in database
- **500**: Internal server error during processing

## Security Features

1. **JWT Authentication**: All requests to `create-payment-intent` require valid JWT
2. **HMAC Signature Verification**: Webhook validates signature if `NOWPAYMENTS_IPN_SECRET` is configured
3. **Double-Processing Prevention**: Checks if payment is already marked as `paid` before processing
4. **Comprehensive Logging**: All webhook attempts logged to `nowpayments_webhook_logs`
5. **RLS Policies**: Database operations use service role key to bypass RLS

## Database Tables Updated

Both functions interact with:
- `payments` (primary table)
- `nowpayments_orders` (backward compatibility)
- `transaction_history` (transaction tracking)
- `nowpayments_webhook_logs` (webhook audit trail)
- `users` (balance updates on payment completion)
- `metrics` (global statistics)
- `contributions` (contribution records)
- `commissions` (referral commissions)

## Environment Variables Required

- `NOWPAYMENTS_API_KEY`: Your NOWPayments API key (e.g., 7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9)
- `NOWPAYMENTS_IPN_SECRET`: Webhook signature secret (optional but recommended)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Next Steps

1. Test the new format with a real payment
2. Monitor the logs in Supabase Dashboard → Edge Functions
3. Check `nowpayments_webhook_logs` table for webhook activity
4. Verify that payments are properly recorded in all tables
5. Confirm that user balances are updated correctly

## Troubleshooting

### If create-payment-intent returns 401:
- Check that you're sending a valid JWT in the Authorization header
- Verify the JWT hasn't expired
- Ensure the user exists in the database

### If create-payment-intent returns 400:
- Verify all 4 required fields are present: `amount_fiat`, `fiat_currency`, `crypto_currency`, `order_id`
- Check that `amount_fiat` is a number between 3 and 500000
- Ensure `crypto_currency` is a valid NOWPayments currency code

### If nowpayments-webhook returns 404:
- Check that the payment exists in the `payments` table
- Verify the `payment_id` or `order_id` matches a record
- Look at `nowpayments_webhook_logs` for details

### If payments aren't processing:
- Check the Edge Function logs in Supabase Dashboard
- Verify the NOWPayments API key is correct
- Ensure the webhook URL is configured in NOWPayments dashboard
- Check that the `metrics` table has valid data

## Summary

✅ **create-payment-intent** now accepts the new format with `amount_fiat`, `fiat_currency`, and `crypto_currency`

✅ **nowpayments-webhook** now handles the minimal format with just `payment_id` and `payment_status`

✅ Both functions maintain backward compatibility with existing database structure

✅ Comprehensive error handling and logging throughout

✅ Security features including JWT auth and HMAC signature verification

✅ Full payment processing flow including user balances, metrics, and referral commissions
