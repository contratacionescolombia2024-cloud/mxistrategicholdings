
# Environment Variables Setup Guide

## Quick Setup for NOWPayments Integration

This guide will help you configure the required environment variables for the NOWPayments integration.

---

## Required Environment Variables

### 1. NOWPAYMENTS_API_KEY (CRITICAL)

**What it is:** Your NOWPayments API key for creating payment invoices.

**Where to get it:**
1. Log in to your NOWPayments account
2. Go to Settings → API Keys
3. Copy your API key

**How to set it:**

#### Option A: Supabase Dashboard
1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Edge Functions**
4. Click on **Secrets**
5. Click **Add new secret**
6. Name: `NOWPAYMENTS_API_KEY`
7. Value: Paste your NOWPayments API key
8. Click **Save**

#### Option B: Supabase CLI
```bash
supabase secrets set NOWPAYMENTS_API_KEY=your_api_key_here
```

---

### 2. NOWPAYMENTS_WEBHOOK_SECRET (RECOMMENDED)

**What it is:** Secret key for verifying webhook signatures from NOWPayments.

**Where to get it:**
1. Log in to your NOWPayments account
2. Go to Settings → API Keys
3. Look for "IPN Secret Key" or "Webhook Secret"
4. Copy the secret

**How to set it:**

#### Option A: Supabase Dashboard
1. Go to **Settings** → **Edge Functions** → **Secrets**
2. Click **Add new secret**
3. Name: `NOWPAYMENTS_WEBHOOK_SECRET`
4. Value: Paste your webhook secret
5. Click **Save**

#### Option B: Supabase CLI
```bash
supabase secrets set NOWPAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Auto-Configured Variables

These are automatically available in Supabase Edge Functions:

- ✅ `SUPABASE_URL` - Your project URL
- ✅ `SUPABASE_ANON_KEY` - Anonymous key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key

**No action needed** - these are set up automatically by Supabase.

---

## Verification

After setting up the environment variables, verify they are configured correctly:

### 1. Check via Supabase Dashboard
1. Go to **Settings** → **Edge Functions** → **Secrets**
2. You should see:
   - `NOWPAYMENTS_API_KEY` (value hidden)
   - `NOWPAYMENTS_WEBHOOK_SECRET` (value hidden)

### 2. Test via Edge Function
Deploy the Edge Functions and check the logs:

```bash
# Deploy functions
supabase functions deploy create-nowpayments-order
supabase functions deploy nowpayments-webhook

# Check logs
supabase functions logs create-nowpayments-order
```

Look for these log messages:
- ✅ "Webhook secret configured: true"
- ❌ "NOWPAYMENTS_API_KEY environment variable is not set" (if missing)

---

## Troubleshooting

### Issue: "NOWPAYMENTS_API_KEY environment variable is not set"

**Solution:**
1. Verify the secret is set in Supabase dashboard
2. Redeploy the Edge Function:
   ```bash
   supabase functions deploy create-nowpayments-order
   ```
3. Wait a few minutes for the deployment to complete
4. Test again

### Issue: "Invalid webhook signature"

**Possible causes:**
1. `NOWPAYMENTS_WEBHOOK_SECRET` not set or incorrect
2. NOWPayments webhook secret doesn't match
3. Webhook payload was modified in transit

**Solution:**
1. Verify the webhook secret in NOWPayments dashboard
2. Update the secret in Supabase:
   ```bash
   supabase secrets set NOWPAYMENTS_WEBHOOK_SECRET=correct_secret_here
   ```
3. Redeploy the webhook function:
   ```bash
   supabase functions deploy nowpayments-webhook
   ```

### Issue: Secrets not updating

**Solution:**
1. Delete the old secret:
   ```bash
   supabase secrets unset NOWPAYMENTS_API_KEY
   ```
2. Set the new secret:
   ```bash
   supabase secrets set NOWPAYMENTS_API_KEY=new_api_key_here
   ```
3. Redeploy all functions:
   ```bash
   supabase functions deploy create-nowpayments-order
   supabase functions deploy nowpayments-webhook
   ```

---

## Security Best Practices

### ✅ DO:
- Store secrets in Supabase Edge Function secrets
- Rotate API keys regularly (every 3-6 months)
- Use different API keys for development and production
- Monitor logs for unauthorized access attempts
- Keep webhook secrets confidential

### ❌ DON'T:
- Commit secrets to version control
- Share API keys via email or chat
- Use the same API key across multiple projects
- Expose secrets in client-side code
- Log secret values in production

---

## Quick Reference Commands

```bash
# List all secrets
supabase secrets list

# Set a secret
supabase secrets set SECRET_NAME=secret_value

# Remove a secret
supabase secrets unset SECRET_NAME

# Deploy Edge Function
supabase functions deploy function-name

# View Edge Function logs
supabase functions logs function-name

# View real-time logs
supabase functions logs function-name --follow
```

---

## NOWPayments Configuration

Don't forget to configure the webhook URL in your NOWPayments dashboard:

1. Log in to NOWPayments
2. Go to Settings → API
3. Set IPN Callback URL to:
   ```
   https://[your-project-ref].supabase.co/functions/v1/nowpayments-webhook
   ```
4. Save the settings

Replace `[your-project-ref]` with your actual Supabase project reference.

---

## Testing the Setup

### 1. Test Payment Creation
```bash
# Create a test payment via your app
# Check logs for successful API call
supabase functions logs create-nowpayments-order --follow
```

Expected log output:
```
✅ User authenticated: [user-id]
✅ Metrics fetched: {...}
✅ Transaction history created: [transaction-id]
✅ NOWPayments response status: 200
✅ Invoice URL received: https://nowpayments.io/payment/...
```

### 2. Test Webhook Processing
```bash
# Make a test payment
# Check webhook logs
supabase functions logs nowpayments-webhook --follow
```

Expected log output:
```
✅ Webhook secret configured: true
✅ Signature verification result: true
✅ Order found: [order-id]
✅ Payment processed successfully: [order-id]
```

---

## Support

If you need help with environment variable setup:

1. Check the Supabase documentation: https://supabase.com/docs/guides/functions/secrets
2. Review the Edge Function logs for error messages
3. Verify your NOWPayments account settings
4. Contact the development team if issues persist

---

**Last Updated:** 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
