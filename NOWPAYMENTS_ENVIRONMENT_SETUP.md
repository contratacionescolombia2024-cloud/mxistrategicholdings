
# NOWPayments Environment Variables Setup Guide

## ⚠️ CRITICAL: Environment Variables Required

Your Edge Functions are failing because the required environment variables are not configured in your Supabase project.

## Required Environment Variables

You need to set the following environment variables in your Supabase project:

### 1. NOWPAYMENTS_API_KEY
- **Description**: Your NOWPayments API key for creating payments
- **Where to get it**: https://nowpayments.io/app/settings/api-keys
- **Format**: A long alphanumeric string (e.g., `ABC123...`)

### 2. NOWPAYMENTS_IPN_SECRET
- **Description**: Your NOWPayments IPN secret for validating webhooks
- **Where to get it**: https://nowpayments.io/app/settings/api-keys
- **Format**: A long alphanumeric string (e.g., `XYZ789...`)

### 3. SUPABASE_URL
- **Description**: Your Supabase project URL
- **Value**: `https://aeyfnjuatbtcauiumbhn.supabase.co`
- **Note**: This should already be set automatically

### 4. SUPABASE_SERVICE_ROLE_KEY
- **Description**: Your Supabase service role key
- **Where to get it**: Supabase Dashboard > Project Settings > API
- **Note**: This should already be set automatically

## How to Set Environment Variables

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn
2. Navigate to **Project Settings** > **Edge Functions**
3. Scroll down to **Environment Variables**
4. Add each variable:
   - Click **Add Variable**
   - Enter the **Name** (e.g., `NOWPAYMENTS_API_KEY`)
   - Enter the **Value** (your actual API key)
   - Click **Save**
5. Repeat for all required variables

### Option 2: Using Supabase CLI

```bash
# Set NOWPAYMENTS_API_KEY
supabase secrets set NOWPAYMENTS_API_KEY=your_actual_api_key_here

# Set NOWPAYMENTS_IPN_SECRET
supabase secrets set NOWPAYMENTS_IPN_SECRET=your_actual_ipn_secret_here
```

## Verification Steps

After setting the environment variables:

1. **Redeploy your Edge Functions** (they need to be redeployed to pick up new environment variables)
2. **Test the payment flow** by trying to create a payment in the app
3. **Check the logs** in Supabase Dashboard > Edge Functions > Logs

## Current Error

The error message you're seeing:
```
Error de configuración del servidor. Contacta al soporte técnico.
```

This occurs because the Edge Function cannot find the `NOWPAYMENTS_API_KEY` environment variable.

## Testing NOWPayments Credentials

Once you've set the environment variables, you can test them using the `test-nowpayments-key` Edge Function:

```bash
curl -X POST https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-nowpayments-key \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## NOWPayments Account Setup

If you don't have a NOWPayments account yet:

1. Go to https://nowpayments.io/
2. Sign up for an account
3. Complete KYC verification (if required)
4. Navigate to Settings > API Keys
5. Generate a new API key
6. Copy both the API key and IPN secret
7. Set them as environment variables in Supabase

## IPN Callback URL Configuration

In your NOWPayments dashboard, you also need to configure the IPN callback URL:

1. Go to https://nowpayments.io/app/settings/api-keys
2. Find your API key
3. Set the IPN callback URL to:
   ```
   https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
   ```
4. Save the settings

## Troubleshooting

### Error: "NOWPAYMENTS_API_KEY not configured"
- **Solution**: Set the `NOWPAYMENTS_API_KEY` environment variable in Supabase

### Error: "Invalid API key"
- **Solution**: Verify your API key is correct in NOWPayments dashboard
- **Solution**: Make sure you copied the entire key without extra spaces

### Error: "Invalid webhook signature"
- **Solution**: Verify your `NOWPAYMENTS_IPN_SECRET` is correct
- **Solution**: Make sure the IPN secret matches the one in NOWPayments dashboard

### Payments not updating automatically
- **Solution**: Verify the IPN callback URL is set correctly in NOWPayments
- **Solution**: Check the `payment_webhook_logs` table for webhook delivery issues

## Support

If you continue to have issues after setting up the environment variables:

1. Check the Edge Function logs in Supabase Dashboard
2. Check the `payment_webhook_logs` table for webhook errors
3. Verify your NOWPayments account is active and verified
4. Contact NOWPayments support: https://nowpayments.io/help

## Security Notes

- **Never commit API keys to version control**
- **Never share your service role key publicly**
- **Use environment variables for all sensitive data**
- **Rotate your API keys periodically**
- **Monitor your NOWPayments dashboard for suspicious activity**
