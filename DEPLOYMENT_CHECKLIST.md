
# Deployment Checklist - Security Fixes

## Pre-Deployment Checklist

Before deploying the security fixes, ensure you have:

- [ ] Access to Supabase dashboard
- [ ] Supabase CLI installed and authenticated
- [ ] NOWPayments API key
- [ ] NOWPayments webhook secret
- [ ] Backup of current Edge Functions (if needed)

---

## Step 1: Configure Environment Variables

### 1.1 Set NOWPayments API Key

**Via Supabase Dashboard:**
```
1. Go to Supabase Dashboard
2. Settings → Edge Functions → Secrets
3. Add new secret:
   - Name: NOWPAYMENTS_API_KEY
   - Value: [your-api-key]
```

**Via CLI:**
```bash
supabase secrets set NOWPAYMENTS_API_KEY=your_api_key_here
```

**Verification:**
```bash
supabase secrets list
# Should show: NOWPAYMENTS_API_KEY (value hidden)
```

- [ ] API key configured
- [ ] Verification successful

---

### 1.2 Set NOWPayments Webhook Secret

**Via Supabase Dashboard:**
```
1. Settings → Edge Functions → Secrets
2. Add new secret:
   - Name: NOWPAYMENTS_WEBHOOK_SECRET
   - Value: [your-webhook-secret]
```

**Via CLI:**
```bash
supabase secrets set NOWPAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
```

**Verification:**
```bash
supabase secrets list
# Should show: NOWPAYMENTS_WEBHOOK_SECRET (value hidden)
```

- [ ] Webhook secret configured
- [ ] Verification successful

---

## Step 2: Deploy Edge Functions

### 2.1 Deploy create-nowpayments-order

```bash
supabase functions deploy create-nowpayments-order
```

**Expected output:**
```
Deploying function create-nowpayments-order...
✓ Function deployed successfully
```

**Verify deployment:**
```bash
supabase functions list
# Should show: create-nowpayments-order (deployed)
```

- [ ] Function deployed successfully
- [ ] No deployment errors

---

### 2.2 Deploy nowpayments-webhook

```bash
supabase functions deploy nowpayments-webhook
```

**Expected output:**
```
Deploying function nowpayments-webhook...
✓ Function deployed successfully
```

**Verify deployment:**
```bash
supabase functions list
# Should show: nowpayments-webhook (deployed)
```

- [ ] Function deployed successfully
- [ ] No deployment errors

---

## Step 3: Verify Database Migration

### 3.1 Check Migration Status

The RLS policy migration should have been applied automatically. Verify:

```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'payment_intents';
```

**Expected result:** 4 policies:
1. Users can view their own payment intents
2. Users can insert their own payment intents
3. Users can update their own payment intents
4. Service role can delete payment intents

- [ ] All 4 policies exist
- [ ] Policies include service role access

---

### 3.2 Test RLS Policies

**Test user access:**
```sql
-- As authenticated user (should work)
SELECT * FROM payment_intents WHERE user_id = auth.uid();
```

**Test service role access:**
```sql
-- As service role (should work)
SELECT * FROM payment_intents;
```

- [ ] User can access own intents
- [ ] Service role can access all intents

---

## Step 4: Configure NOWPayments Webhook

### 4.1 Get Webhook URL

Your webhook URL should be:
```
https://[your-project-ref].supabase.co/functions/v1/nowpayments-webhook
```

Find your project ref:
```bash
supabase projects list
# Or check Supabase dashboard URL
```

- [ ] Webhook URL identified

---

### 4.2 Configure in NOWPayments

1. Log in to NOWPayments dashboard
2. Go to Settings → API
3. Set IPN Callback URL to your webhook URL
4. Save settings

- [ ] Webhook URL configured in NOWPayments
- [ ] Settings saved

---

## Step 5: Testing

### 5.1 Test Payment Creation

**Test via app:**
1. Log in to your app
2. Navigate to purchase screen
3. Enter amount (minimum 20 USDT equivalent)
4. Click "Comprar MXI"

**Check logs:**
```bash
supabase functions logs create-nowpayments-order --follow
```

**Expected logs:**
```
✅ User authenticated
✅ Metrics fetched
✅ Transaction history created
✅ NOWPayments response status: 200
✅ Invoice URL received
✅ Order stored successfully
```

- [ ] Payment creation successful
- [ ] Invoice URL received
- [ ] No errors in logs

---

### 5.2 Test Webhook Processing

**Make a test payment:**
1. Use the invoice URL from previous test
2. Complete payment (use testnet if available)
3. Wait for webhook notification

**Check webhook logs:**
```bash
supabase functions logs nowpayments-webhook --follow
```

**Expected logs:**
```
✅ Webhook secret configured: true
✅ Signature verification result: true
✅ Order found
✅ Payment currency validated
✅ Amount verification passed
✅ User balances updated
✅ Payment processed successfully
```

- [ ] Webhook received
- [ ] Signature verified
- [ ] Payment processed
- [ ] User balance updated

---

### 5.3 Test Error Handling

**Test missing API key:**
1. Temporarily unset the API key:
   ```bash
   supabase secrets unset NOWPAYMENTS_API_KEY
   ```
2. Try to create a payment
3. Should see error: "Error de configuración del servidor"
4. Restore the API key:
   ```bash
   supabase secrets set NOWPAYMENTS_API_KEY=your_api_key_here
   ```

- [ ] Error handling works correctly
- [ ] API key restored

---

## Step 6: Security Verification

### 6.1 Verify No Hardcoded Secrets

**Check Edge Function code:**
```bash
# Search for hardcoded secrets
grep -r "7QB99E2" supabase/functions/
# Should return: no results
```

- [ ] No hardcoded API keys found
- [ ] All secrets use environment variables

---

### 6.2 Verify RLS Protection

**Test unauthorized access:**
```sql
-- Try to access another user's payment intent (should fail)
SELECT * FROM payment_intents WHERE user_id != auth.uid();
```

**Expected result:** Empty result set (no access to other users' data)

- [ ] RLS prevents unauthorized access
- [ ] Users can only see own data

---

### 6.3 Verify Webhook Security

**Check webhook signature verification:**
```bash
# Send test webhook without signature
curl -X POST https://[your-project-ref].supabase.co/functions/v1/nowpayments-webhook \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"test","order_id":"test","payment_status":"finished"}'
```

**Expected response:** 401 Unauthorized (if signature verification is enabled)

- [ ] Webhook signature verification working
- [ ] Unauthorized requests rejected

---

## Step 7: Monitoring Setup

### 7.1 Enable Logging

**Check Edge Function logs are accessible:**
```bash
supabase functions logs create-nowpayments-order
supabase functions logs nowpayments-webhook
```

- [ ] Logs accessible
- [ ] No errors in recent logs

---

### 7.2 Set Up Alerts (Optional)

Consider setting up alerts for:
- Failed webhook signature verifications
- Payment processing errors
- Unusual payment patterns

- [ ] Alerts configured (if applicable)

---

## Step 8: Documentation Update

### 8.1 Update Team Documentation

- [ ] Share SECURITY_FIX_SUMMARY.md with team
- [ ] Share ENVIRONMENT_VARIABLES_SETUP.md with team
- [ ] Update internal wiki/docs with new setup

---

### 8.2 Update Runbooks

- [ ] Update deployment runbook
- [ ] Update troubleshooting guide
- [ ] Update security incident response plan

---

## Post-Deployment Verification

### Final Checks

- [ ] All environment variables configured
- [ ] Edge Functions deployed successfully
- [ ] Database migration applied
- [ ] NOWPayments webhook configured
- [ ] Payment creation tested
- [ ] Webhook processing tested
- [ ] Error handling verified
- [ ] Security measures verified
- [ ] Monitoring enabled
- [ ] Documentation updated

---

## Rollback Plan

If critical issues occur:

### 1. Rollback Edge Functions
```bash
# Redeploy previous version from git
git checkout [previous-commit]
supabase functions deploy create-nowpayments-order
supabase functions deploy nowpayments-webhook
```

### 2. Rollback Database Migration
```sql
-- See SECURITY_FIX_SUMMARY.md for rollback SQL
```

### 3. Notify Team
- [ ] Alert team of rollback
- [ ] Document issues encountered
- [ ] Plan remediation steps

---

## Success Criteria

Deployment is successful when:

✅ All environment variables are configured  
✅ Edge Functions deploy without errors  
✅ Database migration is applied  
✅ Payment creation works end-to-end  
✅ Webhook processing works correctly  
✅ No hardcoded secrets in code  
✅ RLS policies protect user data  
✅ Webhook signatures are verified  
✅ Error handling works as expected  
✅ Monitoring is in place  

---

## Support Contacts

If you encounter issues during deployment:

1. Check the logs first:
   ```bash
   supabase functions logs [function-name] --follow
   ```

2. Review error messages in:
   - Edge Function logs
   - Database logs
   - NOWPayments dashboard

3. Consult documentation:
   - SECURITY_FIX_SUMMARY.md
   - ENVIRONMENT_VARIABLES_SETUP.md

4. Contact development team if issues persist

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verification By:** _____________  
**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back

---

**Version:** 1.0  
**Last Updated:** 2025  
**Classification:** Internal - Deployment Critical
