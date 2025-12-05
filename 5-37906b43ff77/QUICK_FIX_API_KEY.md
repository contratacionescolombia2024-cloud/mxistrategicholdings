
# Quick Fix: Update NOWPayments API Key

## The Problem
The payment button is not working due to 401 and 400 errors from the NOWPayments API. This is likely because the API key is not configured or is invalid.

## The Solution
Update the `NOWPAYMENTS_API_KEY` in Supabase Edge Function secrets.

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
```
URL: https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn
```

### 2. Navigate to Edge Functions Settings
1. Click on **Edge Functions** in the left sidebar
2. Click on **Settings** or **Manage secrets**

### 3. Update the API Key
1. Find the secret named: `NOWPAYMENTS_API_KEY`
2. Update its value to: `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9`
3. Click **Save**

### 4. Verify the Update
The edge function will automatically use the new key. No redeployment needed.

### 5. Test the Payment Button
1. Open the app
2. Navigate to the payment screen
3. Try to create a payment
4. The button should now work

## What Changed

I've updated the `create-payment-intent` edge function to:
- ✅ Better logging for API key issues
- ✅ Specific error messages for 401 (authentication) errors
- ✅ Hints for troubleshooting
- ✅ API key validation logging

I've also created a test function (`test-nowpayments-key`) that you can use to verify the API key is working correctly.

## Verification Commands

### Test the API Key Directly
```bash
curl -X GET "https://api.nowpayments.io/v1/status" \
  -H "x-api-key: 7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9"
```

Expected response:
```json
{"message":"OK"}
```

### Test via Supabase Edge Function
```bash
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-nowpayments-key
```

This will test:
- API status endpoint
- Currencies endpoint
- Minimum amount endpoint

## Common Errors and Solutions

### Error: "NOWPayments API key not configured"
**Solution**: The secret is not set. Follow steps 1-3 above.

### Error: "NOWPayments API authentication failed" (401)
**Solution**: The API key is invalid. Verify the key in NOWPayments dashboard.

### Error: "Invalid request to NOWPayments" (400)
**Solution**: Check the request parameters. Ensure currency codes are correct.

## Next Steps

After updating the API key:

1. ✅ Test creating a payment intent
2. ✅ Verify the invoice URL is generated
3. ✅ Test the complete payment flow
4. ✅ Check the database for payment records
5. ✅ Monitor edge function logs for any errors

## Need More Help?

See the comprehensive guide: `NOWPAYMENTS_API_KEY_VERIFICATION.md`

## Summary

**What to do**: Update `NOWPAYMENTS_API_KEY` to `7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9` in Supabase Edge Function secrets.

**Where**: Supabase Dashboard → Edge Functions → Settings → Secrets

**Result**: Payment button will work, 401/400 errors will be resolved.
