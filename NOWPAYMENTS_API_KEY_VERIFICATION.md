
# NOWPayments API Key Verification and Update Guide

## Current API Key
The API key you want to verify is: `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9`

## Steps to Update the API Key in Supabase

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `aeyfnjuatbtcauiumbhn`

### 2. Update Edge Function Secrets
1. In the left sidebar, click on **Edge Functions**
2. Click on **Settings** or **Secrets** tab
3. Find or add the secret: `NOWPAYMENTS_API_KEY`
4. Update the value to: `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9`
5. Click **Save** or **Update**

### 3. Verify the API Key

#### Option A: Using the Test Function (Recommended)
I've created a test edge function that you can deploy to verify the API key:

```bash
# Deploy the test function
supabase functions deploy test-nowpayments-key

# Test it
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-nowpayments-key
```

The test function will:
- Check if the API key is configured
- Test the NOWPayments status endpoint
- Test the currencies endpoint
- Test the minimum amount endpoint
- Return a comprehensive report

#### Option B: Manual Verification via NOWPayments Dashboard
1. Go to https://nowpayments.io/
2. Log in to your account
3. Navigate to **Settings** → **API Keys**
4. Verify that the key `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9` is listed and active
5. Check the key permissions (should have invoice creation permissions)

#### Option C: Direct API Test
You can test the API key directly using curl:

```bash
# Test 1: Check API status
curl -X GET "https://api.nowpayments.io/v1/status" \
  -H "x-api-key: 7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9"

# Test 2: Get available currencies
curl -X GET "https://api.nowpayments.io/v1/currencies" \
  -H "x-api-key: 7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9"

# Test 3: Get minimum amount
curl -X GET "https://api.nowpayments.io/v1/min-amount?currency_from=usd&currency_to=usdttrc20" \
  -H "x-api-key: 7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9"
```

Expected responses:
- **Status**: Should return `{"message":"OK"}` with status 200
- **Currencies**: Should return an array of supported currencies
- **Min Amount**: Should return minimum payment amounts

### 4. Common Issues and Solutions

#### Issue 1: 401 Unauthorized
**Cause**: Invalid or expired API key
**Solution**: 
- Verify the API key is correct
- Check if the key is active in NOWPayments dashboard
- Ensure there are no extra spaces or characters

#### Issue 2: 400 Bad Request
**Cause**: Invalid request parameters or API key doesn't have required permissions
**Solution**:
- Check that the API key has "Invoice" permissions enabled
- Verify the request payload matches NOWPayments API requirements
- Ensure the IPN callback URL is correctly configured

#### Issue 3: 500 Internal Server Error
**Cause**: Edge function configuration issues
**Solution**:
- Verify all required secrets are set:
  - `NOWPAYMENTS_API_KEY`
  - `NOWPAYMENTS_IPN_SECRET` (for webhook verification)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 5. Required NOWPayments Configuration

In your NOWPayments dashboard, ensure:

1. **API Key Settings**:
   - Key is active
   - Has "Invoice" permissions
   - Has "Payment" permissions

2. **IPN (Instant Payment Notification) Settings**:
   - IPN URL: `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook`
   - IPN Secret: Should match `NOWPAYMENTS_IPN_SECRET` in Supabase

3. **Supported Currencies**:
   - Ensure the following currencies are enabled:
     - USDT (TRC20)
     - USDT (ERC20)
     - USDT (BEP20)
     - BTC
     - ETH
     - BNB
     - TRX

### 6. Testing the Payment Flow

After updating the API key, test the complete payment flow:

1. **Create Payment Intent**:
   ```bash
   curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
     -H "Authorization: Bearer YOUR_USER_JWT" \
     -H "Content-Type: application/json" \
     -d '{
       "order_id": "test-order-001",
       "price_amount": 10,
       "price_currency": "USD"
     }'
   ```

2. **Select Currency**:
   ```bash
   curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
     -H "Authorization: Bearer YOUR_USER_JWT" \
     -H "Content-Type: application/json" \
     -d '{
       "order_id": "test-order-001",
       "price_amount": 10,
       "price_currency": "USD",
       "pay_currency": "usdttrc20"
     }'
   ```

3. **Check Response**:
   - Should return `success: true`
   - Should include `invoice_url`
   - Should include `mxi_amount`

### 7. Monitoring and Debugging

To monitor the edge function logs:

1. Go to Supabase Dashboard → Edge Functions
2. Select `create-payment-intent`
3. Click on **Logs** tab
4. Look for:
   - API key configuration logs
   - NOWPayments API response logs
   - Error messages

### 8. Next Steps After Verification

Once the API key is verified and working:

1. ✅ Test creating a payment intent
2. ✅ Test the webhook endpoint
3. ✅ Verify database records are created correctly
4. ✅ Test the complete payment flow in the app
5. ✅ Monitor for any errors in production

## Troubleshooting Checklist

- [ ] API key is correctly copied (no extra spaces)
- [ ] API key is active in NOWPayments dashboard
- [ ] API key has correct permissions (Invoice, Payment)
- [ ] IPN URL is configured in NOWPayments
- [ ] IPN Secret matches between NOWPayments and Supabase
- [ ] All Supabase secrets are configured
- [ ] Edge functions are deployed with latest code
- [ ] Database tables exist and have correct structure
- [ ] RLS policies allow the operations

## Support

If you continue to experience issues:

1. Check NOWPayments API documentation: https://documenter.getpostman.com/view/7907941/S1a32n38
2. Contact NOWPayments support: support@nowpayments.io
3. Check Supabase Edge Function logs for detailed error messages
4. Review the `NOWPAYMENTS_DRASTIC_FIX_COMPLETE.md` file for previous fixes

## Summary

The API key `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9` needs to be:
1. Added/updated in Supabase Edge Function secrets as `NOWPAYMENTS_API_KEY`
2. Verified using one of the methods above
3. Tested with the payment flow

Once verified, the 401 and 400 errors should be resolved.
