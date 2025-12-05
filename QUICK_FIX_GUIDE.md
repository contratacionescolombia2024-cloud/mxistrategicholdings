
# ⚡ Quick Fix Guide - NowPayments Webhook

## 🔴 URGENT: Do This First!

### Set the Webhook Secret in Supabase

1. **Go to:** https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/settings/functions
2. **Click:** "Edge Functions" → "Secrets"
3. **Add/Update Secret:**
   - Name: `NOWPAYMENTS_WEBHOOK_SECRET`
   - Value: `WCINfky/2ov0tzmRHd2+DNdIzLsKq6Ld`
4. **Click:** Save

**That's it!** The webhook will now work.

---

## ✅ Test It

### 1. Check the Pending Payment
- Order ID: `MXI-1763946948400-c084e1d6`
- Payment ID: `4520496802`
- Status in NowPayments: **finished** ✅
- Status in database: **waiting** ❌

**To fix this specific payment:**
1. Open your app
2. Go to **Transaction History**
3. Find the transaction with order ID `MXI-1763946948400-c084e1d6`
4. Click the **"Verificar"** button
5. The payment should be processed and MXI credited

### 2. Test with a New Payment
1. Make a small test payment (minimum $3 USDT)
2. Complete the payment on NowPayments
3. Wait 1-2 minutes
4. Check your balance - it should update automatically
5. If not, click "Verificar" button

---

## 🔍 How to Check if It's Working

### Check Webhook Logs
1. Go to: https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn/functions/nowpayments-webhook/logs
2. Look for recent webhook calls
3. **Good signs:**
   - Status: 200 OK ✅
   - Message: "Webhook signature verified successfully" ✅
   - Message: "Payment processed successfully" ✅
4. **Bad signs:**
   - Status: 401 Unauthorized ❌
   - Message: "Invalid signature" ❌

### Check Database
Run this in Supabase SQL Editor:
```sql
-- Check recent webhooks
SELECT * FROM nowpayments_webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check pending transactions
SELECT * FROM transaction_history 
WHERE status IN ('pending', 'waiting', 'confirming')
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Webhook still returns 401?
- ✅ Verify the secret is set in Supabase
- ✅ Check for typos or extra spaces
- ✅ Restart the Edge Function (redeploy)

### Verificar button not working?
- ✅ Check if the order has a `payment_id`
- ✅ Check Edge Function logs for errors
- ✅ Verify NowPayments API key is set

### Payment not credited?
- ✅ Click "Verificar" button to manually process
- ✅ Check if payment currency is USDT ETH (not TRC20)
- ✅ Verify payment amount matches order amount

---

## 📊 What Was Fixed

1. **Webhook Function:**
   - ✅ Better signature verification
   - ✅ Detailed error logging
   - ✅ Improved error messages

2. **Check Status Function:**
   - ✅ Fixed database queries
   - ✅ Better error handling
   - ✅ Spanish error messages
   - ✅ Network error handling

3. **Verificar Button:**
   - ✅ Now makes successful API calls
   - ✅ Processes payments correctly
   - ✅ Shows user-friendly messages

---

## 🎯 Summary

**Before:**
- ❌ Webhook: 401 Unauthorized
- ❌ Verificar: 500 Internal Server Error
- ❌ Payments not processed

**After (once you set the secret):**
- ✅ Webhook: 200 OK
- ✅ Verificar: Works perfectly
- ✅ Payments processed automatically

**Action Required:**
1. Set `NOWPAYMENTS_WEBHOOK_SECRET` in Supabase
2. Click "Verificar" on pending transaction
3. Test with new payment

Done! 🚀
