
# 📱 OKX Payment System - Complete Guide

## 🎯 Overview

The MXI Strategic Presale app uses an **OKX wallet** to receive USDT payments. Users can send USDT from **ANY cryptocurrency wallet** (not just OKX) to the app's OKX wallet address.

---

## ✅ Supported Payment Methods

Users can send USDT from:

- ✅ **OKX Wallet** (recommended)
- ✅ **Binance Wallet**
- ✅ **Trust Wallet**
- ✅ **MetaMask**
- ✅ **Coinbase Wallet**
- ✅ **Any other USDT-compatible wallet**

### Recommended Network

**TRC20 (Tron)** - Lowest fees, fastest confirmation

Other supported networks:
- ERC20 (Ethereum) - Higher fees
- BEP20 (BSC) - Medium fees
- Polygon - Low fees

---

## 🔄 How It Works

### Step 1: User Creates Payment
1. User opens the app and goes to "Contribute"
2. Enters amount (20-100,000 USDT)
3. System calculates MXI tokens based on current phase price
4. Payment record created with unique ID
5. Payment expires in 30 minutes if not completed

### Step 2: User Sends Payment
1. User copies the app's OKX wallet address
2. Opens **their own wallet** (OKX, Binance, Trust Wallet, etc.)
3. Sends USDT to the provided address
4. **Important**: Use TRC20 network for lowest fees

### Step 3: User Provides Proof
1. Takes screenshot of payment confirmation/QR code
2. Uploads screenshot in the app
3. Copies transaction ID (TxID) from their wallet
4. Enters TxID in the app
5. Clicks "Verify Payment"

### Step 4: Automatic Verification
The system automatically:
1. Checks OKX API for incoming transaction
2. Verifies transaction ID matches
3. Confirms wallet address is correct
4. Validates amount (±1% tolerance for fees)
5. Confirms USDT currency
6. Checks transaction status is "credited"

### Step 5: Payment Confirmation
**If automatic verification succeeds:**
- ✅ Payment confirmed instantly
- ✅ MXI balance updated
- ✅ Referral commissions processed
- ✅ Yield rate calculated and applied

**If automatic verification fails:**
- 🔄 Payment sent to admin panel
- 👨‍💼 Admin manually verifies on OKX
- ✅ Admin approves or rejects
- ✅ User notified of result

---

## 🔐 Payment Verification Process

### Automatic Verification (OKX API)

When OKX API credentials are configured, the system automatically verifies payments by:

1. **Calling OKX API** with transaction ID
2. **Checking deposit history** for matching transaction
3. **Validating**:
   - Transaction ID matches
   - Destination address matches app's OKX wallet
   - Currency is USDT
   - Amount matches (±1% tolerance)
   - Transaction status is "credited" (state = 2)

### Manual Verification (Admin Panel)

If automatic verification fails or API is not configured:

1. Payment status changes to "confirming"
2. Admin receives notification
3. Admin logs into OKX and checks:
   - Assets → Transaction History
   - Finds transaction by TxID
   - Verifies amount and address
4. Admin approves or rejects in admin panel
5. User balance updated accordingly

---

## 💡 User Instructions

### For Users Paying from OKX Wallet

1. **In the app:**
   - Enter amount and create payment
   - Copy the wallet address

2. **In OKX Wallet:**
   - Go to Assets → Transfer → Withdraw
   - Select USDT
   - Choose TRC20 network
   - Paste the app's wallet address
   - Enter amount
   - Confirm withdrawal

3. **Back in the app:**
   - Take screenshot of confirmation
   - Upload screenshot
   - Copy TxID from OKX transaction history
   - Enter TxID and verify

### For Users Paying from Other Wallets

1. **In the app:**
   - Enter amount and create payment
   - Copy the wallet address

2. **In your wallet (Binance, Trust Wallet, etc.):**
   - Go to Send/Withdraw
   - Select USDT
   - Choose TRC20 network (recommended)
   - Paste the app's wallet address
   - Enter amount
   - Confirm transaction

3. **Back in the app:**
   - Take screenshot of confirmation
   - Upload screenshot
   - Copy TxID from your wallet's transaction history
   - Enter TxID and verify

---

## 🛡️ Security Features

### Transaction Verification
- ✅ Blockchain verification via OKX API
- ✅ Transaction ID validation
- ✅ Wallet address matching
- ✅ Amount verification (±1% tolerance)
- ✅ Currency validation (USDT only)

### User Protection
- ✅ Payment expiration (30 minutes)
- ✅ Duplicate transaction prevention
- ✅ Manual admin review fallback
- ✅ QR code proof of payment
- ✅ Transaction ID tracking

### Data Security
- ✅ RLS policies protect user data
- ✅ API keys stored securely in Supabase
- ✅ Admin-only access to approvals
- ✅ Encrypted communication

---

## ⚙️ Technical Implementation

### Database Schema

**Table: `okx_payments`**

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- payment_id (text, unique)
- usdt_amount (numeric)
- mxi_amount (numeric)
- okx_order_id (text, nullable)
- okx_transaction_id (text, nullable)
- payment_address (text, nullable)
- status (text: pending, confirming, confirmed, failed, expired)
- verification_attempts (integer)
- last_verification_at (timestamp)
- confirmed_at (timestamp, nullable)
- expires_at (timestamp)
- qr_code_url (text, nullable)
- metadata (jsonb, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Edge Function: `okx-payment-verification`

**Endpoints:**

1. **Verify Payment** (User-initiated)
   ```json
   POST /functions/v1/okx-payment-verification
   {
     "paymentId": "MXI-1234567890-abc123",
     "action": "verify",
     "transactionId": "0x..."
   }
   ```

2. **Confirm Payment** (Admin-initiated)
   ```json
   POST /functions/v1/okx-payment-verification
   {
     "paymentId": "MXI-1234567890-abc123",
     "action": "confirm"
   }
   ```

3. **Reject Payment** (Admin-initiated)
   ```json
   POST /functions/v1/okx-payment-verification
   {
     "paymentId": "MXI-1234567890-abc123",
     "action": "reject"
   }
   ```

### OKX API Integration

**Endpoint Used:**
```
GET /api/v5/asset/deposit-history?txId={transactionId}
```

**Authentication:**
- HMAC SHA256 signature
- Headers: OK-ACCESS-KEY, OK-ACCESS-SIGN, OK-ACCESS-TIMESTAMP, OK-ACCESS-PASSPHRASE

**Response:**
```json
{
  "code": "0",
  "msg": "",
  "data": [
    {
      "txId": "0x...",
      "to": "wallet_address",
      "ccy": "USDT",
      "amt": "100",
      "state": "2",  // 2 = credited
      "ts": "1234567890000"
    }
  ]
}
```

---

## 📊 Commission & Yield Processing

### Referral Commissions

Automatically processed on payment confirmation:

| Level | Rate | Example (100 USDT) |
|-------|------|-------------------|
| Level 1 | 5% | 5 USDT |
| Level 2 | 2% | 2 USDT |
| Level 3 | 1% | 1 USDT |

### Yield Rate Calculation

Based on total USDT contributed:

| Investment Range | Yield Rate (per minute) | Daily Yield |
|-----------------|------------------------|-------------|
| 20 - 499 USDT | 0.000347222 | 0.5% |
| 500 - 999 USDT | 0.000694444 | 1.0% |
| 1,000 - 4,999 USDT | 0.001388889 | 2.0% |
| 5,000 - 9,999 USDT | 0.002777778 | 4.0% |
| 10,000 - 49,999 USDT | 0.005555556 | 8.0% |
| 50,000 - 99,999 USDT | 0.011111111 | 16.0% |
| 100,000+ USDT | 0.022222222 | 32.0% |

---

## 🔧 Configuration

### Required Environment Variables

Set in Supabase Edge Functions:

```bash
OKX_API_KEY=your_okx_api_key
OKX_API_SECRET=your_okx_secret_key
OKX_API_PASSPHRASE=your_okx_passphrase
OKX_WALLET_ADDRESS=your_okx_wallet_address
```

### Frontend Configuration

**File:** `app/(tabs)/(home)/contribute.tsx`

```typescript
const OKX_WALLET_ADDRESS = 'YOUR_ACTUAL_OKX_WALLET_ADDRESS';
```

---

## 🐛 Troubleshooting

### Common Issues

#### "Manual verification required"
**Cause:** OKX API credentials not configured
**Solution:** Set environment variables in Supabase
**Impact:** All payments require manual admin approval

#### "Transaction not found"
**Cause:** Transaction not yet confirmed on blockchain
**Solution:** Wait 2-5 minutes and try again
**Impact:** Temporary delay, will resolve automatically

#### "Amount mismatch"
**Cause:** Network fees deducted from amount
**Solution:** System allows 1% tolerance, should auto-approve
**Impact:** May require manual approval if fees > 1%

#### "Payment expired"
**Cause:** Payment not completed within 30 minutes
**Solution:** Create a new payment
**Impact:** User must restart payment process

#### "Wrong network used"
**Cause:** User sent on different network than expected
**Solution:** Contact support, may require manual processing
**Impact:** Delay in confirmation

---

## 📈 Monitoring & Analytics

### Admin Dashboard Metrics

- Total payments received
- Pending verifications
- Confirmed payments
- Failed/expired payments
- Average confirmation time
- Total USDT received
- Total MXI distributed

### Edge Function Logs

View logs in Supabase Dashboard:
```
Edge Functions → okx-payment-verification → Logs
```

Or via CLI:
```bash
supabase functions logs okx-payment-verification
```

---

## 🚀 Best Practices

### For Users

1. **Use TRC20 network** for lowest fees
2. **Double-check wallet address** before sending
3. **Send exact amount** to avoid issues
4. **Save transaction ID** immediately
5. **Upload clear QR code screenshot**
6. **Don't close app** until verification complete

### For Admins

1. **Monitor admin panel** regularly
2. **Verify on OKX** before approving
3. **Check transaction ID** matches
4. **Confirm amount** is correct
5. **Document rejections** with reason
6. **Respond quickly** to pending payments

### For Developers

1. **Test with small amounts** first
2. **Monitor Edge Function logs**
3. **Set up alerts** for failed verifications
4. **Keep API credentials** secure
5. **Regular backups** of payment data
6. **Document all changes**

---

## 🔄 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER CREATES PAYMENT                     │
│  (Enter amount → Calculate MXI → Create payment record)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   USER SENDS USDT                            │
│  (From ANY wallet → To app's OKX wallet → TRC20 network)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  USER PROVIDES PROOF                         │
│  (Upload QR code screenshot → Enter TxID → Click verify)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATIC VERIFICATION (OKX API)                │
│  (Check TxID → Verify address → Validate amount)           │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
      SUCCESS │                                │ FAILURE
             ▼                                ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   PAYMENT CONFIRMED      │    │   MANUAL VERIFICATION    │
│  • Balance updated       │    │  • Admin notified        │
│  • Commissions processed │    │  • Admin verifies on OKX │
│  • Yield rate applied    │    │  • Admin approves/rejects│
└──────────────────────────┘    └──────────────────────────┘
```

---

## 📞 Support

### For Users

If payment is not confirmed:
1. Check transaction status in your wallet
2. Verify you used correct address
3. Confirm transaction is completed
4. Wait 5-10 minutes for blockchain confirmation
5. Contact support if issue persists

### For Admins

If automatic verification fails:
1. Check Edge Function logs
2. Verify OKX API credentials
3. Manually check transaction on OKX
4. Approve or reject in admin panel
5. Document reason for manual intervention

---

## 🎉 Success Criteria

A successful payment includes:

✅ User creates payment in app
✅ User sends USDT from their wallet
✅ Transaction confirmed on blockchain
✅ User uploads QR code proof
✅ User enters transaction ID
✅ System verifies transaction (auto or manual)
✅ Payment status changes to "confirmed"
✅ User's MXI balance updated
✅ Referral commissions processed
✅ Yield rate calculated and applied
✅ Global metrics updated

---

**Last Updated:** January 2025
**Version:** 2.0
**Status:** ✅ Production Ready
