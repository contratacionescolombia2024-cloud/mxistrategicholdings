
# NowPayments USDT(ETH) Integration - Complete Guide

## 📋 Overview

This document describes the complete NowPayments integration for receiving payments in **USDT on the Ethereum network (ERC20)** for purchasing MXI tokens.

---

## 🏗️ Architecture

### Components

1. **Database Tables**
   - `payments` - Stores all payment orders
   - `payment_webhook_logs` - Logs webhook calls for debugging

2. **Edge Functions**
   - `create-payment-intent` - Creates payment invoices
   - `nowpayments-webhook` - Processes payment confirmations

3. **Frontend Screens**
   - `contrataciones.tsx` - Main payment screen
   - `payment-history.tsx` - Payment history view

---

## 🗄️ Database Schema

### `payments` Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id TEXT NOT NULL UNIQUE,
  payment_id TEXT,
  invoice_url TEXT,
  price_amount NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'usd',
  pay_amount NUMERIC,
  pay_currency TEXT NOT NULL DEFAULT 'usdteth',
  mxi_amount NUMERIC NOT NULL,
  price_per_mxi NUMERIC NOT NULL,
  phase INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  actually_paid NUMERIC,
  outcome_amount NUMERIC,
  network_fee NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status Values:**
- `pending` - Payment created, not yet sent to NowPayments
- `waiting` - Waiting for user to send payment
- `confirming` - Payment detected, awaiting blockchain confirmations
- `confirmed` - Payment confirmed, processing balance credit
- `finished` - Payment complete, balance credited
- `failed` - Payment failed
- `expired` - Payment window expired (1 hour)
- `cancelled` - Payment cancelled by user

### `payment_webhook_logs` Table

```sql
CREATE TABLE payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id TEXT,
  order_id TEXT,
  payload JSONB NOT NULL,
  status TEXT,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔧 Edge Functions

### 1. `create-payment-intent`

**Endpoint:** `POST /functions/v1/create-payment-intent`

**Purpose:** Creates a NowPayments invoice for purchasing MXI tokens

**Authentication:** Requires valid JWT token in Authorization header

**Request Body:**
```json
{
  "amount_fiat": 100,
  "fiat_currency": "usd",
  "crypto_currency": "usdteth",
  "order_id": "MXI-1234567890-abc123"
}
```

**Parameters:**
- `amount_fiat` (required): Amount in fiat currency (min: 3, max: 500,000)
- `fiat_currency` (optional): Fiat currency code (default: "usd")
- `crypto_currency` (optional): Cryptocurrency to use (default: "usdteth")
- `order_id` (optional): Custom order ID (auto-generated if not provided)

**Response (Success):**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "order_id": "MXI-1234567890-abc123",
    "payment_id": "nowpayments_id",
    "invoice_url": "https://nowpayments.io/payment/...",
    "mxi_amount": 333.33,
    "usdt_amount": 100,
    "price_per_mxi": 0.30,
    "phase": 1,
    "pay_currency": "usdteth",
    "status": "waiting",
    "expires_at": "2025-01-15T13:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

**Process Flow:**
1. Validates user authentication
2. Validates amount (3-500,000 USDT)
3. Fetches current phase and price from metrics
4. Calculates MXI amount
5. Creates invoice with NowPayments API
6. Stores payment in database
7. Returns invoice URL to frontend

---

### 2. `nowpayments-webhook`

**Endpoint:** `POST /functions/v1/nowpayments-webhook`

**Purpose:** Receives payment status updates from NowPayments

**Authentication:** HMAC signature verification (x-nowpayments-sig header)

**Webhook Payload:**
```json
{
  "payment_id": "12345",
  "order_id": "MXI-1234567890-abc123",
  "payment_status": "finished",
  "pay_currency": "usdteth",
  "actually_paid": "100.5",
  "outcome_amount": "100.0"
}
```

**Process Flow:**
1. Verifies HMAC signature
2. Logs webhook payload
3. Finds payment in database
4. Updates payment status
5. If status is `finished` or `confirmed`:
   - Validates currency (must be USDT ETH)
   - Validates amount (allows 5% variance for fees)
   - Credits MXI to user balance
   - Updates user's `mxi_purchased_directly`
   - Calculates and adds yield rate (0.005% per hour)
   - Processes referral commissions (5%, 2%, 1%)
   - Updates metrics
   - Creates contribution record
   - Marks payment as finished

**Security Features:**
- HMAC SHA-512 signature verification
- Currency validation (only USDT ETH accepted)
- Amount validation (5% variance allowed)
- Idempotent processing (prevents double-crediting)

---

## 💻 Frontend Implementation

### Payment Flow Screen (`contrataciones.tsx`)

**Features:**
- Amount input with validation
- Real-time MXI calculation
- Payment creation
- Opens NowPayments invoice in browser
- Status polling (every 5 seconds)
- Recent payments display
- Real-time updates via Supabase Realtime

**User Flow:**
1. User enters USDT amount
2. System calculates MXI amount based on current phase price
3. User clicks "Pagar con USDT (ETH)"
4. System creates payment intent
5. Opens NowPayments invoice in browser
6. User completes payment on NowPayments
7. App polls for status updates
8. Shows confirmation when payment completes

**Key Functions:**
```typescript
const handleCreatePayment = async () => {
  // 1. Validate amount
  // 2. Get session token
  // 3. Call create-payment-intent
  // 4. Open invoice URL
  // 5. Start polling for updates
}

const startPolling = (orderId: string) => {
  // Poll every 5 seconds
  // Stop when status is finished/failed/expired
}
```

---

### Payment History Screen (`payment-history.tsx`)

**Features:**
- Lists all user payments
- Color-coded status badges
- Pull-to-refresh
- Real-time updates via Supabase Realtime
- Detailed payment information

**Status Colors:**
- 🟢 Green: `finished`, `confirmed`
- 🟡 Yellow: `waiting`, `pending`
- 🔵 Blue: `confirming`
- 🔴 Red: `failed`, `expired`, `cancelled`

---

## 🔐 Security

### Row Level Security (RLS)

**payments table:**
```sql
-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments
CREATE POLICY "Users can update their own payments"
  ON payments FOR UPDATE
  USING (auth.uid() = user_id);
```

**payment_webhook_logs table:**
```sql
-- Only service role can access
CREATE POLICY "Service role can access webhook logs"
  ON payment_webhook_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

### Webhook Security

**HMAC Signature Verification:**
```typescript
async function verifySignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedSignature === signature;
}
```

---

## ⚙️ Configuration

### Environment Variables

**Required in Supabase Edge Function Secrets:**

```bash
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
SUPABASE_URL=https://aeyfnjuatbtcauiumbhn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**How to Set:**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → Settings
3. Add secrets:
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`

### NowPayments Dashboard Configuration

1. **API Key:** Generate in NowPayments dashboard
2. **IPN Secret:** Generate in NowPayments dashboard
3. **IPN Callback URL:** Set to:
   ```
   https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
   ```
4. **Enabled Currencies:** Ensure `usdteth` is enabled

---

## 🧪 Testing

### Test Payment Flow

1. **Create Test Payment:**
   ```bash
   curl -X POST \
     https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "amount_fiat": 10,
       "fiat_currency": "usd",
       "crypto_currency": "usdteth"
     }'
   ```

2. **Check Payment in Database:**
   ```sql
   SELECT * FROM payments 
   WHERE user_id = 'your_user_id' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Test Webhook (Manual):**
   ```bash
   curl -X POST \
     https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook \
     -H "Content-Type: application/json" \
     -H "x-nowpayments-sig: YOUR_SIGNATURE" \
     -d '{
       "payment_id": "test123",
       "order_id": "MXI-1234567890-abc123",
       "payment_status": "finished",
       "pay_currency": "usdteth",
       "actually_paid": "10.0",
       "outcome_amount": "10.0"
     }'
   ```

4. **Verify Balance Update:**
   ```sql
   SELECT mxi_balance, mxi_purchased_directly, usdt_contributed 
   FROM users 
   WHERE id = 'your_user_id';
   ```

---

## 📊 Monitoring

### Check Recent Payments

```sql
SELECT 
  p.order_id,
  p.status,
  p.price_amount,
  p.mxi_amount,
  p.created_at,
  u.email
FROM payments p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### Check Webhook Logs

```sql
SELECT 
  payment_id,
  order_id,
  status,
  processed,
  error,
  created_at
FROM payment_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Failed Payments

```sql
SELECT * FROM payments 
WHERE status IN ('failed', 'expired', 'cancelled')
ORDER BY created_at DESC;
```

### Check Pending Payments

```sql
SELECT * FROM payments 
WHERE status IN ('waiting', 'pending', 'confirming')
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔄 Payment Status Flow

```
User Creates Payment
        ↓
    [pending]
        ↓
Edge Function Creates Invoice
        ↓
    [waiting] ← User sees invoice URL
        ↓
User Sends Payment
        ↓
    [pending] ← NowPayments detects payment
        ↓
Blockchain Confirmations
        ↓
  [confirming] ← Waiting for confirmations
        ↓
Payment Confirmed
        ↓
  [confirmed] ← Webhook processes payment
        ↓
Balance Credited
        ↓
   [finished] ← Complete! ✅
```

**Alternative Flows:**
- Payment not sent → `[expired]` (after 1 hour)
- Payment fails → `[failed]`
- User cancels → `[cancelled]`

---

## 💰 Commission Processing

When a payment is confirmed, the system automatically processes referral commissions:

**3-Level Commission Structure:**
- **Level 1:** 5% of MXI amount
- **Level 2:** 2% of MXI amount
- **Level 3:** 1% of MXI amount

**Process:**
1. Find user's referrer (Level 1)
2. Credit 5% of MXI to referrer
3. Add to `mxi_from_unified_commissions`
4. Calculate and add yield rate
5. Create commission record
6. Repeat for Level 2 and Level 3

**Example:**
- User buys 1000 MXI
- Level 1 referrer gets: 50 MXI (5%)
- Level 2 referrer gets: 20 MXI (2%)
- Level 3 referrer gets: 10 MXI (1%)

---

## 📈 Metrics Updates

When a payment is confirmed, the system updates global metrics:

```typescript
await supabase
  .from('metrics')
  .update({
    total_usdt_contributed: current + usdtAmount,
    total_mxi_distributed: current + mxiAmount,
    total_tokens_sold: current + mxiAmount,
    updated_at: new Date().toISOString(),
  })
  .eq('id', metrics.id);
```

---

## 🚨 Error Handling

### Common Errors

**1. "Minimum payment amount is 3 USDT"**
- User entered amount less than 3
- Solution: Enter at least 3 USDT

**2. "Maximum payment amount is 500,000 USDT"**
- User entered amount more than 500,000
- Solution: Enter less than 500,000 USDT

**3. "Failed to create payment"**
- NowPayments API error
- Check API key configuration
- Check NowPayments dashboard

**4. "Invalid payment currency"**
- Payment made with wrong currency
- Only USDT(ETH) is accepted
- User must use Ethereum network

**5. "Amount mismatch"**
- Paid amount differs from expected by more than 5%
- Check network fees
- Contact support

**6. "Invalid signature"**
- Webhook signature verification failed
- Check IPN secret configuration
- Possible security issue

---

## 🛠️ Troubleshooting

### Payment Stuck in "Waiting"

**Possible Causes:**
- User hasn't completed payment
- Payment expired (1 hour timeout)
- User sent to wrong address

**Solutions:**
- Check NowPayments dashboard
- Create new payment
- Contact support

### Balance Not Credited

**Possible Causes:**
- Webhook not received
- Webhook processing error
- Payment not confirmed

**Solutions:**
1. Check webhook logs:
   ```sql
   SELECT * FROM payment_webhook_logs 
   WHERE order_id = 'YOUR_ORDER_ID';
   ```
2. Check payment status:
   ```sql
   SELECT * FROM payments 
   WHERE order_id = 'YOUR_ORDER_ID';
   ```
3. Manually trigger webhook processing if needed

### Webhook Not Received

**Possible Causes:**
- IPN URL not configured in NowPayments
- Firewall blocking requests
- Edge Function error

**Solutions:**
1. Verify IPN URL in NowPayments dashboard
2. Check Edge Function logs
3. Test webhook manually

---

## 📝 Best Practices

### For Users

1. **Always use Ethereum network** when sending USDT
2. **Double-check the amount** before confirming
3. **Complete payment within 1 hour** to avoid expiration
4. **Keep transaction hash** for reference
5. **Wait for confirmations** (usually 5-10 minutes)

### For Developers

1. **Always validate amounts** on backend
2. **Use HMAC signature verification** for webhooks
3. **Log all webhook calls** for debugging
4. **Implement idempotent processing** to prevent double-crediting
5. **Monitor failed payments** regularly
6. **Set up alerts** for webhook errors

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)

- **Payment Success Rate:** % of payments that reach `finished` status
- **Average Confirmation Time:** Time from `waiting` to `finished`
- **Failed Payment Rate:** % of payments that fail
- **Webhook Processing Time:** Time to process webhook
- **User Satisfaction:** Based on support tickets

### Target Metrics

- Payment Success Rate: > 95%
- Average Confirmation Time: < 15 minutes
- Failed Payment Rate: < 5%
- Webhook Processing Time: < 2 seconds

---

## 🔮 Future Enhancements

### Planned Features

1. **Multiple Cryptocurrencies**
   - Add BTC, ETH, BNB support
   - Currency selection modal

2. **QR Code Payments**
   - Display QR code for direct wallet payments
   - Faster payment process

3. **Push Notifications**
   - Notify users when payment is confirmed
   - Alert for expiring payments

4. **Email Receipts**
   - Send email confirmation
   - Include transaction details

5. **Payment Analytics**
   - Dashboard for payment statistics
   - Revenue tracking

6. **Recurring Payments**
   - Subscription-based purchases
   - Automatic renewals

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Set `NOWPAYMENTS_API_KEY` in Supabase secrets
- [ ] Set `NOWPAYMENTS_IPN_SECRET` in Supabase secrets
- [ ] Configure IPN URL in NowPayments dashboard
- [ ] Enable `usdteth` currency in NowPayments
- [ ] Test payment creation
- [ ] Test webhook processing
- [ ] Verify balance crediting
- [ ] Test commission processing
- [ ] Check RLS policies
- [ ] Monitor webhook logs
- [ ] Set up error alerts
- [ ] Document support procedures

---

## 📞 Support

### For Users

**Payment Issues:**
- Check payment status in app
- View payment history
- Contact support with order ID

**Balance Issues:**
- Refresh app
- Check transaction history
- Contact support with transaction details

### For Developers

**Technical Issues:**
- Check Edge Function logs
- Review webhook logs
- Monitor database queries
- Check NowPayments dashboard

**Contact:**
- Email: support@maxcoin.io
- Discord: [Your Discord]
- Telegram: [Your Telegram]

---

## 📄 License

This integration is part of the Maxcoin (MXI) Liquidity Pool application.

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
