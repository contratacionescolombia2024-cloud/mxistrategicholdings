
# OKX Wallet API Integration Guide

## Overview

This guide explains the complete OKX Wallet API integration that has replaced the previous Binance payment system in the MXI Strategic Presale app.

## What Changed

### Database Changes
- **Table Renamed**: `binance_payments` → `okx_payments`
- **Columns Renamed**:
  - `binance_order_id` → `okx_order_id`
  - `binance_transaction_id` → `okx_transaction_id`
- **New Column Added**: `qr_code_url` for storing payment QR code screenshots

### Edge Function
- **Old**: `binance-payment-verification`
- **New**: `okx-payment-verification`
- Uses OKX API v5 endpoints for transaction verification

### Frontend Changes
- **contribute.tsx**: Updated to use OKX wallet address and API
- **okx-payments.tsx**: New file (replaces binance-payments.tsx) for viewing payment history
- **payment-approvals.tsx**: Updated admin panel to work with OKX payments

## OKX API Configuration

### Required Environment Variables

Set these in your Supabase Edge Functions secrets:

```bash
# OKX API Credentials
OKX_API_KEY=your_okx_api_key
OKX_API_SECRET=your_okx_api_secret
OKX_API_PASSPHRASE=your_okx_api_passphrase
OKX_WALLET_ADDRESS=your_okx_wallet_address
```

### How to Get OKX API Credentials

1. **Log in to OKX**
   - Go to https://www.okx.com
   - Sign in to your account

2. **Create API Key**
   - Navigate to: Profile → API → Create API Key
   - Select permissions: Read-only for deposits
   - Save your API Key, Secret Key, and Passphrase securely

3. **Get Wallet Address**
   - Go to: Assets → Funding Account
   - Select USDT
   - Click "Deposit"
   - Choose TRC20 network
   - Copy your deposit address

4. **Set Environment Variables in Supabase**
   ```bash
   supabase secrets set OKX_API_KEY=your_key_here
   supabase secrets set OKX_API_SECRET=your_secret_here
   supabase secrets set OKX_API_PASSPHRASE=your_passphrase_here
   supabase secrets set OKX_WALLET_ADDRESS=your_address_here
   ```

## How the Payment Flow Works

### 1. User Creates Payment
- User enters USDT amount in contribute.tsx
- System calculates MXI tokens based on current phase price
- Payment record created in `okx_payments` table with status `pending`
- Payment expires in 30 minutes if not completed

### 2. User Sends Payment
- User copies the OKX wallet address
- Sends USDT from their OKX Wallet (TRC20 network recommended)
- Uploads screenshot of payment QR code
- Enters transaction ID (TxID) from OKX

### 3. Automatic Verification
- Edge Function `okx-payment-verification` is called
- Verifies transaction using OKX API v5
- Checks:
  - Transaction ID matches
  - Wallet address matches
  - Amount matches (±1% tolerance for fees)
  - Currency is USDT
  - Transaction status is "credited" (state = 2)

### 4. Payment Confirmation
- **If verification succeeds**:
  - Payment status → `confirmed`
  - User's MXI balance updated
  - Referral commissions processed
  - Yield rate calculated and applied
  - Global metrics updated
  
- **If verification fails**:
  - Payment status → `confirming`
  - Sent to admin panel for manual review
  - Admin can approve or reject manually

## OKX API Endpoints Used

### Deposit History
```
GET /api/v5/asset/deposit-history
```

**Parameters:**
- `txId`: Transaction ID to verify

**Response Fields:**
- `txId`: Transaction hash
- `to`: Deposit address
- `ccy`: Currency (USDT)
- `amt`: Amount deposited
- `state`: Deposit state (2 = credited)

### Authentication
OKX API uses HMAC SHA256 signature:

```typescript
const signature = HMAC-SHA256(
  timestamp + method + requestPath + body,
  secretKey
)
```

Headers required:
- `OK-ACCESS-KEY`: Your API key
- `OK-ACCESS-SIGN`: Base64-encoded signature
- `OK-ACCESS-TIMESTAMP`: ISO 8601 timestamp
- `OK-ACCESS-PASSPHRASE`: Your API passphrase

## Manual Verification Process

If automatic verification fails, admins can manually approve payments:

1. **Admin Panel** → Payment Approvals
2. Filter by "Awaiting Approval"
3. Click on payment to view details
4. Verify transaction on OKX manually:
   - Go to OKX → Assets → Transaction History
   - Find transaction by TxID
   - Verify amount and address match
5. Click "Approve Payment" or "Reject Payment"

## Commission Structure

Referral commissions are automatically processed on payment confirmation:

- **Level 1**: 5% of USDT amount
- **Level 2**: 2% of USDT amount
- **Level 3**: 1% of USDT amount

## Yield Rate Calculation

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

## Testing the Integration

### Test Payment Flow

1. **Create Test Payment**
   ```typescript
   // In contribute.tsx
   - Enter amount: 20 USDT
   - Click "Create Payment"
   - Copy wallet address
   ```

2. **Simulate Payment**
   - Send USDT from OKX to the provided address
   - Upload QR code screenshot
   - Enter transaction ID

3. **Verify Automatic Processing**
   - Check Edge Function logs
   - Verify user balance updated
   - Check commissions created

### Manual Testing

If OKX API credentials are not configured:
- System falls back to manual verification mode
- All payments go to admin panel for approval
- Admins can approve/reject manually

## Troubleshooting

### Common Issues

1. **"Manual verification required - OKX API not configured"**
   - Solution: Set OKX API credentials in Supabase secrets

2. **"Transaction not found or not yet confirmed on OKX"**
   - Solution: Wait a few minutes for blockchain confirmation
   - Or: Admin can manually verify and approve

3. **"Amount mismatch"**
   - Solution: Check if fees were deducted
   - System allows 1% tolerance for fees

4. **Payment Expired**
   - Solution: Create a new payment
   - Payments expire after 30 minutes

### Checking Logs

View Edge Function logs:
```bash
supabase functions logs okx-payment-verification
```

Or in Supabase Dashboard:
- Edge Functions → okx-payment-verification → Logs

## Security Considerations

1. **API Keys**: Never expose OKX API keys in frontend code
2. **RLS Policies**: Ensure users can only view their own payments
3. **Admin Access**: Only verified admins can approve payments
4. **Transaction Verification**: Always verify on blockchain before confirming
5. **Amount Tolerance**: 1% tolerance prevents fee-related issues

## Migration from Binance

The migration was completed automatically:
- Database table renamed
- Column names updated
- RLS policies recreated
- No data loss occurred

All existing payment records are preserved in the `okx_payments` table.

## Support

For issues or questions:
1. Check Edge Function logs
2. Verify OKX API credentials
3. Test with small amounts first
4. Contact support if automatic verification consistently fails

## API Rate Limits

OKX API rate limits:
- **Public endpoints**: 20 requests per 2 seconds
- **Private endpoints**: 10 requests per 2 seconds

The integration respects these limits by:
- Only calling API when user submits transaction ID
- Caching verification results
- Using manual fallback if rate limited

## Future Enhancements

Potential improvements:
1. Webhook integration for real-time notifications
2. Multi-currency support (BTC, ETH, etc.)
3. Automatic retry logic for failed verifications
4. Enhanced fraud detection
5. Payment analytics dashboard

---

**Last Updated**: January 2025
**Version**: 1.0
**Integration Status**: ✅ Complete and Active
