
# 💳 Complete Payment Flow - How It Works

## 🔄 Normal Payment Flow (Automatic)

### Step 1: User Initiates Payment
```
User clicks "Comprar MXI" → Enters amount → Selects cryptocurrency
```
**What happens:**
- App creates order in `nowpayments_orders` table
- App creates payment intent in `payment_intents` table
- App creates transaction record in `transaction_history` table
- Status: `pending`

### Step 2: NowPayments Invoice Created
```
App calls create-payment-intent → NowPayments API → Invoice URL returned
```
**What happens:**
- NowPayments generates payment invoice
- Invoice URL is saved to database
- Payment page opens in browser
- Status: `waiting`

### Step 3: User Completes Payment
```
User sends crypto → NowPayments confirms → Payment status: finished
```
**What happens:**
- User sends cryptocurrency to NowPayments address
- NowPayments waits for blockchain confirmations
- Payment status changes: `waiting` → `confirming` → `finished`

### Step 4: Webhook Processes Payment ✨
```
NowPayments → Webhook → Signature Verified → Payment Processed
```
**What happens:**
1. **NowPayments sends webhook** with payment data
2. **Webhook verifies HMAC signature** (using `NOWPAYMENTS_WEBHOOK_SECRET`)
3. **If signature valid:**
   - Updates order status to `confirmed`
   - Credits MXI to user balance
   - Processes referral commissions (5%, 2%, 1%)
   - Updates global metrics
   - Creates contribution record
   - Updates transaction history to `finished`
4. **User sees updated balance** in app (real-time)

---

## 🔧 Manual Payment Flow (Verificar Button)

### When to Use Verificar Button:
- ✅ Payment is finished in NowPayments but not credited
- ✅ Webhook failed (401 error)
- ✅ Want to manually check payment status
- ✅ Payment stuck in "waiting" status

### What Happens When You Click Verificar:

```
User clicks "Verificar" → API call → NowPayments API → Process payment
```

**Step-by-step:**
1. **App calls** `check-nowpayments-status` function
2. **Function queries** NowPayments API for latest status
3. **If payment is finished:**
   - Same processing as webhook
   - Credits MXI to user
   - Processes commissions
   - Updates all tables
   - Shows success message
4. **If payment is still pending:**
   - Updates status in database
   - Shows current status to user
   - User can try again later

---

## 🔐 Webhook Security (HMAC Signature)

### Why Signature Verification?
- Prevents fake webhook calls
- Ensures webhook is from NowPayments
- Protects against unauthorized credits

### How It Works:
```
1. NowPayments creates signature:
   HMAC-SHA512(webhook_body, IPN_SECRET) = signature

2. NowPayments sends webhook:
   Headers: x-nowpayments-sig: <signature>
   Body: { payment_id, order_id, payment_status, ... }

3. Your webhook verifies:
   HMAC-SHA512(received_body, YOUR_SECRET) = computed_signature
   
4. Compare:
   if (computed_signature === received_signature) {
     ✅ Process payment
   } else {
     ❌ Reject (401 Unauthorized)
   }
```

**This is why setting the correct `NOWPAYMENTS_WEBHOOK_SECRET` is critical!**

---

## 📊 Database Flow

### Tables Updated During Payment:

1. **`nowpayments_orders`**
   ```sql
   status: pending → waiting → confirming → confirmed
   payment_status: waiting → finished
   actually_paid: <amount>
   confirmed_at: <timestamp>
   ```

2. **`payment_intents`**
   ```sql
   status: pending → waiting → confirmed
   pay_amount: <amount>
   updated_at: <timestamp>
   ```

3. **`transaction_history`**
   ```sql
   status: pending → waiting → finished
   completed_at: <timestamp>
   ```

4. **`users`**
   ```sql
   mxi_balance: +<mxi_amount>
   mxi_purchased_directly: +<mxi_amount>
   usdt_contributed: +<usdt_amount>
   is_active_contributor: true
   yield_rate_per_minute: +<yield_rate>
   ```

5. **`contributions`**
   ```sql
   INSERT new record with transaction details
   ```

6. **`metrics`**
   ```sql
   phase_X_tokens_sold: +<mxi_amount>
   total_tokens_sold: +<mxi_amount>
   total_usdt_contributed: +<usdt_amount>
   ```

7. **`commissions`** (if user has referrers)
   ```sql
   INSERT 3 records (levels 1, 2, 3)
   Level 1: 5% of MXI
   Level 2: 2% of MXI
   Level 3: 1% of MXI
   ```

---

## 🎯 Payment Status Meanings

| Status | Meaning | What to Do |
|--------|---------|------------|
| `pending` | Order created, waiting for invoice | Wait for invoice URL |
| `waiting` | Invoice created, waiting for payment | Complete payment on NowPayments |
| `confirming` | Payment received, waiting for confirmations | Wait for blockchain confirmations |
| `confirmed` | Payment confirmed, MXI credited | ✅ Done! |
| `finished` | Payment fully processed | ✅ Done! |
| `failed` | Payment failed | Create new order |
| `expired` | Payment window expired | Create new order |
| `cancelled` | User cancelled | Create new order |

---

## 🔍 Monitoring Your Payments

### Check Payment Status in App:
1. Go to **Transaction History**
2. Find your transaction
3. Check status badge
4. If stuck in "waiting", click **"Verificar"**

### Check in Database:
```sql
-- Your recent transactions
SELECT 
  order_id,
  payment_id,
  status,
  mxi_amount,
  usdt_amount,
  created_at,
  updated_at
FROM transaction_history
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC;
```

### Check Webhook Logs:
```sql
-- Recent webhook attempts
SELECT 
  order_id,
  payment_id,
  status,
  processed,
  error,
  created_at
FROM nowpayments_webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🚨 Common Scenarios

### Scenario 1: Payment Finished but Not Credited
**Cause:** Webhook failed (401 error due to wrong secret)

**Solution:**
1. Set correct `NOWPAYMENTS_WEBHOOK_SECRET` in Supabase
2. Click "Verificar" button to manually process
3. MXI will be credited immediately

### Scenario 2: Payment Stuck in "Waiting"
**Cause:** User hasn't completed payment yet

**Solution:**
1. Click "Pagar" button to reopen payment page
2. Complete the payment
3. Wait for confirmations
4. Or click "Verificar" to check status

### Scenario 3: Payment Shows "Confirming"
**Cause:** Waiting for blockchain confirmations

**Solution:**
1. Wait 5-10 minutes for confirmations
2. Click "Verificar" to check latest status
3. Once confirmed, MXI will be credited

### Scenario 4: Multiple Webhooks for Same Payment
**Cause:** NowPayments sends multiple status updates

**Solution:**
- ✅ Webhook checks if already processed
- ✅ Prevents double-crediting
- ✅ Safe to receive multiple webhooks

---

## 📈 Referral Commission Flow

When a payment is processed, referral commissions are automatically calculated:

```
User A (buyer) → $100 USDT → 333.33 MXI

Referrer Level 1 (User B):
  - Gets: 333.33 × 5% = 16.67 MXI
  - Added to: mxi_from_unified_commissions
  - Commission record created

Referrer Level 2 (User C):
  - Gets: 333.33 × 2% = 6.67 MXI
  - Added to: mxi_from_unified_commissions
  - Commission record created

Referrer Level 3 (User D):
  - Gets: 333.33 × 1% = 3.33 MXI
  - Added to: mxi_from_unified_commissions
  - Commission record created
```

**All commissions also generate yield at 0.005% per hour!**

---

## ✅ Summary

**Automatic Flow:**
1. User pays → NowPayments confirms → Webhook processes → MXI credited

**Manual Flow:**
1. User pays → NowPayments confirms → User clicks "Verificar" → MXI credited

**Both flows:**
- ✅ Credit MXI to user
- ✅ Process referral commissions
- ✅ Update all database tables
- ✅ Generate yield rate
- ✅ Update global metrics

**Key Point:**
The webhook is the preferred method (automatic), but "Verificar" button provides a manual backup in case the webhook fails.

---

## 🎉 Everything is Fixed!

Once you set the `NOWPAYMENTS_WEBHOOK_SECRET`:
- ✅ Webhooks will work automatically
- ✅ Payments will be processed in real-time
- ✅ Verificar button works as backup
- ✅ No more 401 or 500 errors

**Your pending payment (ID: 4520496802) can now be processed by clicking "Verificar"!** 🚀
