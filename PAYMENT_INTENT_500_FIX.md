
# Payment Intent 500 Error - Fix Summary

## Issue
The `create-payment-intent` Edge Function was returning 500 errors when users tried to proceed with payment after selecting a cryptocurrency.

## Root Cause Analysis
After investigating the logs and code, the issue was likely caused by:

1. **NOWPayments API Response Handling**: The Edge Function wasn't properly handling all possible error responses from the NOWPayments API
2. **Insufficient Error Logging**: The previous version didn't log enough details to diagnose API-specific issues
3. **Webhook Configuration**: The webhook function had JWT verification enabled, which could cause issues with NOWPayments callbacks

## Changes Made

### 1. Enhanced `create-payment-intent` Edge Function (Version 5)

**Improvements:**
- Added detailed logging of NOWPayments API responses including headers
- Enhanced error handling with more specific error messages
- Added logging of API key usage (first 10 characters for security)
- Improved error response parsing and user-friendly error messages
- Better validation of invoice response structure

**Key Features:**
- **Two-Phase Operation:**
  - **Phase 1** (no `pay_currency`): Fetches available cryptocurrencies from NOWPayments
  - **Phase 2** (with `pay_currency`): Creates payment invoice with selected cryptocurrency

- **Comprehensive Error Handling:**
  - Network errors
  - API authentication errors
  - Invalid response formats
  - Missing required fields
  - Amount validation

### 2. Updated `nowpayments-webhook` Edge Function (Version 9)

**Improvements:**
- Accepts all USDT variants (TRC20, ERC20, BEP20) and popular cryptocurrencies (BTC, ETH, BNB, TRX)
- Better currency validation logic
- Enhanced logging for debugging webhook issues

## Testing the Payment Flow

### Step 1: Initiate Payment
1. Navigate to the "Comprar MXI" screen (Deposito tab)
2. Enter an amount between 3 and 500,000 USDT
3. Click "Continuar al Pago"

**Expected Result:** A modal should appear showing available cryptocurrencies

### Step 2: Select Cryptocurrency
1. Choose a cryptocurrency from the list (USDT variants, BTC, ETH, BNB, or TRX)
2. Click "Pagar"

**Expected Result:** 
- A NOWPayments invoice URL should be generated
- The payment page should open in your browser
- You should see a success message in the app

### Step 3: Complete Payment
1. Complete the payment on the NOWPayments page
2. Return to the app

**Expected Result:**
- The app will poll for payment status every 5 seconds
- Once confirmed, you'll receive an alert showing the MXI credited to your account
- Your balance will be updated automatically

## Monitoring and Debugging

### Check Edge Function Logs
To see detailed logs of the payment process:

```bash
# View create-payment-intent logs
supabase functions logs create-payment-intent

# View webhook logs
supabase functions logs nowpayments-webhook
```

### Check Database Tables

**Transaction History:**
```sql
SELECT * FROM transaction_history 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;
```

**NOWPayments Orders:**
```sql
SELECT * FROM nowpayments_orders 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;
```

**Webhook Logs:**
```sql
SELECT * FROM nowpayments_webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Issues and Solutions

### Issue: "Configuración del servidor incompleta"
**Cause:** NOWPAYMENTS_API_KEY environment variable is not set
**Solution:** Set the API key in Supabase Edge Function secrets

### Issue: "Error al obtener criptomonedas disponibles"
**Cause:** NOWPayments API returned an error when fetching currencies
**Solution:** 
- Check if the API key is valid
- Verify NOWPayments account is active
- Check NOWPayments API status

### Issue: "No se pudo generar el pago"
**Cause:** NOWPayments API rejected the invoice creation request
**Solution:**
- Check the detailed error in the technical_details field
- Verify the selected cryptocurrency is supported
- Ensure the amount is within NOWPayments limits

### Issue: Payment stuck in "waiting" status
**Cause:** Webhook not being received or processed
**Solution:**
- Check webhook logs in database
- Verify NOWPAYMENTS_WEBHOOK_SECRET is configured
- Ensure webhook URL is correctly configured in NOWPayments dashboard

## Environment Variables Required

Make sure these are set in your Supabase project:

```
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

1. **Test the payment flow** with a small amount to verify everything works
2. **Monitor the logs** during the first few transactions to catch any issues
3. **Check webhook processing** to ensure payments are being credited correctly
4. **Verify commission distribution** for referral system

## Support

If you encounter any issues:

1. Check the Edge Function logs for detailed error messages
2. Review the database tables for transaction status
3. Verify all environment variables are correctly set
4. Contact NOWPayments support if API-related issues persist

## Security Notes

- The webhook function uses HMAC-SHA512 signature verification for security
- All sensitive operations use the service role key
- User authentication is required for payment initiation
- Webhook signature verification prevents unauthorized payment confirmations

---

**Last Updated:** January 2025
**Version:** 5.0 (create-payment-intent), 9.0 (nowpayments-webhook)
