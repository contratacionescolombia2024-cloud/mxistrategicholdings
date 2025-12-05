
# NowPayments USDT(ETH) - Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Get NowPayments Credentials

1. Go to [NowPayments Dashboard](https://nowpayments.io)
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Copy your **API Key**
5. Navigate to **Settings → IPN**
6. Generate and copy your **IPN Secret**

### Step 2: Configure Supabase Secrets

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions → Settings**
3. Add these secrets:
   ```
   NOWPAYMENTS_API_KEY=your_api_key_here
   NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
   ```

### Step 3: Configure IPN Callback URL

1. In NowPayments Dashboard, go to **Settings → IPN**
2. Set IPN Callback URL to:
   ```
   https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
   ```
3. Save settings

### Step 4: Enable USDT(ETH)

1. In NowPayments Dashboard, go to **Settings → Currencies**
2. Ensure **USDT (ERC20)** is enabled
3. Save settings

### Step 5: Test the Integration

1. Open your app
2. Go to "Comprar MXI"
3. Enter amount (minimum 3 USDT)
4. Click "Pagar con USDT (ETH)"
5. Complete test payment
6. Verify balance is credited

---

## ✅ Verification Checklist

- [ ] API Key configured in Supabase
- [ ] IPN Secret configured in Supabase
- [ ] IPN URL configured in NowPayments
- [ ] USDT(ETH) enabled in NowPayments
- [ ] Test payment successful
- [ ] Balance credited correctly
- [ ] Webhook logs show successful processing

---

## 🔍 Quick Test

### Test Payment Creation

```bash
# Get your JWT token from the app
JWT_TOKEN="your_jwt_token_here"

# Create test payment
curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_fiat": 10,
    "fiat_currency": "usd",
    "crypto_currency": "usdteth"
  }'
```

### Check Payment in Database

```sql
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check Webhook Logs

```sql
SELECT * FROM payment_webhook_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🚨 Common Issues

### Issue: "NOWPAYMENTS_API_KEY not configured"

**Solution:** Add API key to Supabase Edge Function secrets

### Issue: "Invalid signature"

**Solution:** Verify IPN secret matches in both NowPayments and Supabase

### Issue: "Invalid payment currency"

**Solution:** Ensure payment is made with USDT on Ethereum network

### Issue: Balance not credited

**Solution:** Check webhook logs for errors

---

## 📞 Need Help?

- Check full documentation: `NOWPAYMENTS_USDT_ETH_INTEGRATION.md`
- Review webhook logs in database
- Contact support with order ID

---

**Setup Time:** ~5 minutes  
**Status:** ✅ Ready to use
