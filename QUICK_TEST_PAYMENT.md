
# Quick Payment Test Guide

## Prerequisites
✅ User account created and logged in
✅ NOWPayments API key configured
✅ Webhook secret configured
✅ Edge Functions deployed

## Test Steps

### 1. Access Payment Screen
- Open app
- Navigate to "Deposito" tab or "Comprar MXI" button
- You should see the payment form

### 2. Enter Amount
- Enter amount: **3** USDT (minimum for testing)
- Expected MXI: **10 MXI** (at 0.30 USDT per MXI)
- Click "Continuar al Pago"

### 3. Select Cryptocurrency
- Modal should appear with currencies
- Select **USDT (TRC20)** or **USDT (ERC20)**
- Click "Pagar"

### 4. Complete Payment
- NOWPayments page opens in browser
- Complete the test payment
- Return to app

### 5. Verify Payment
- App polls every 5 seconds
- Status updates automatically
- Alert appears when confirmed
- Check balance updated

## Expected Logs

### create-payment-intent (Phase 1 - Get Currencies)
```
=== CREATE PAYMENT INTENT - FIXED VERSION ===
✓ API Key found, length: XX
✓ User authenticated: user-id
✓ Request validated
=== ACTION A: Fetching available currencies ===
✓ Successfully fetched XX currencies
```

### create-payment-intent (Phase 2 - Create Invoice)
```
=== ACTION B: Generating invoice with currency: usdttrc20 ===
Phase data: { currentPhase: 1, pricePerMxi: 0.3, totalUsdt: 3, mxiAmount: 10 }
✓ Transaction history created
✓ Invoice data parsed
✓ Invoice URL received
✓ Order stored successfully
=== SUCCESS: Invoice created ===
```

### nowpayments-webhook (Payment Confirmed)
```
=== NOWPayments Webhook Received ===
✓ Webhook signature verified successfully
Order found: order-id
Processing finished/confirmed payment
Payment currency validated: usdttrc20
User found: user-id
Updating user balances
✓ Payment processed successfully
```

## Quick Checks

### Database Queries

**Check Transaction:**
```sql
SELECT 
  order_id, 
  status, 
  mxi_amount, 
  usdt_amount,
  created_at
FROM transaction_history 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

**Check Order:**
```sql
SELECT 
  order_id,
  status,
  payment_url,
  mxi_amount,
  created_at
FROM nowpayments_orders
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Check User Balance:**
```sql
SELECT 
  mxi_balance,
  mxi_purchased_directly,
  usdt_contributed,
  yield_rate_per_minute
FROM users
WHERE id = 'YOUR_USER_ID';
```

## Troubleshooting

### ❌ 500 Error on "Continuar al Pago"
**Check:**
- Edge Function logs: `supabase functions logs create-payment-intent`
- Look for "NOWPAYMENTS_API_KEY not found" or API errors
- Verify API key is valid in NOWPayments dashboard

### ❌ 500 Error on "Pagar"
**Check:**
- Edge Function logs for detailed NOWPayments API response
- Verify selected currency is supported
- Check amount is within limits

### ❌ Payment Stuck in "waiting"
**Check:**
- Webhook logs: `SELECT * FROM nowpayments_webhook_logs ORDER BY created_at DESC LIMIT 5;`
- Verify webhook URL in NOWPayments dashboard
- Check webhook secret is configured

### ❌ Balance Not Updated
**Check:**
- Webhook processed: `SELECT processed FROM nowpayments_webhook_logs WHERE order_id = 'YOUR_ORDER_ID';`
- Order status: `SELECT status FROM nowpayments_orders WHERE order_id = 'YOUR_ORDER_ID';`
- User balance query above

## Success Indicators

✅ Currencies load in modal
✅ Invoice URL generated
✅ Payment page opens
✅ Webhook received and processed
✅ Balance updated
✅ Transaction marked as "finished"
✅ Commissions distributed (if referrals exist)

## Test Amounts

| Amount (USDT) | MXI Received | Phase | Price per MXI |
|---------------|--------------|-------|---------------|
| 3             | 10           | 1     | 0.30          |
| 10            | 33.33        | 1     | 0.30          |
| 50            | 166.67       | 1     | 0.30          |
| 100           | 333.33       | 1     | 0.30          |

## Contact Support

If issues persist after checking logs:
1. Export Edge Function logs
2. Export database query results
3. Note exact error messages
4. Contact NOWPayments support if API-related

---

**Quick Command Reference:**

```bash
# View logs
supabase functions logs create-payment-intent --tail
supabase functions logs nowpayments-webhook --tail

# Check database
psql $DATABASE_URL -c "SELECT * FROM transaction_history ORDER BY created_at DESC LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM nowpayments_webhook_logs ORDER BY created_at DESC LIMIT 5;"
```
