
# Binance Integration Guide for Maxcoin Pool

## Overview

This document outlines the plan for integrating Binance payment functionality into the Maxcoin Pool app. The integration will allow users to link their Binance wallets and make USDT contributions directly through Binance.

## Current Status

✅ **Completed:**
- User authentication with email verification
- Database schema for users, contributions, and withdrawals
- Referral system (3-level commission structure)
- MXI token balance tracking
- Withdrawal request system

🔄 **In Progress:**
- Binance wallet integration
- Payment processing through Binance

## Integration Options

### Option 1: Binance Pay API (Recommended)

**Pros:**
- Official Binance integration
- Supports multiple cryptocurrencies including USDT
- Built-in security and compliance
- Direct wallet-to-wallet transfers

**Cons:**
- Requires Binance merchant account
- API key management needed
- Transaction fees apply

**Implementation Steps:**
1. Register for Binance Merchant account
2. Obtain API credentials (API Key, Secret Key)
3. Implement Binance Pay SDK or REST API
4. Create payment flow in the app
5. Handle webhooks for payment confirmation

### Option 2: Binance Connect (Wallet Linking)

**Pros:**
- Users can link their existing Binance wallets
- Seamless user experience
- OAuth-based authentication

**Cons:**
- Limited to Binance users only
- Requires user consent for wallet access

**Implementation Steps:**
1. Register app with Binance OAuth
2. Implement OAuth flow for wallet linking
3. Request necessary permissions (wallet read, transaction)
4. Store wallet connection securely
5. Initiate transfers through Binance API

### Option 3: Manual Verification (Temporary Solution)

**Pros:**
- No API integration required initially
- Can be implemented quickly
- Works with any wallet

**Cons:**
- Manual verification process
- Slower user experience
- Requires admin intervention

**Implementation Steps:**
1. User provides Binance wallet address
2. User sends USDT to designated pool wallet
3. User submits transaction ID
4. Admin verifies transaction
5. Admin approves contribution in dashboard

## Recommended Approach

**Phase 1: Manual Verification (Immediate)**
- Implement manual verification system
- Create admin dashboard for transaction verification
- Allow users to submit transaction IDs
- Manual approval process

**Phase 2: Binance Pay Integration (Next Sprint)**
- Register for Binance Merchant account
- Integrate Binance Pay API
- Automate payment processing
- Implement webhook handlers

## Technical Requirements

### Dependencies Needed

```json
{
  "dependencies": {
    "@binance/connector": "^3.0.0",
    "crypto-js": "^4.2.0"
  }
}
```

### Environment Variables

```
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key
BINANCE_MERCHANT_ID=your_merchant_id
POOL_WALLET_ADDRESS=your_pool_wallet_address
```

### Database Schema Updates

```sql
-- Add Binance wallet information to users table
ALTER TABLE users ADD COLUMN binance_wallet_address TEXT;
ALTER TABLE users ADD COLUMN binance_wallet_verified BOOLEAN DEFAULT FALSE;

-- Add transaction verification table
CREATE TABLE payment_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_id TEXT NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  proof_url TEXT,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);
```

## Implementation Plan

### Phase 1: Manual Verification (Week 1-2)

1. **Update Database Schema**
   - Add wallet address fields
   - Create payment verification table

2. **Create User Interface**
   - Wallet address input screen
   - Transaction ID submission form
   - Payment proof upload (optional)

3. **Admin Dashboard**
   - View pending verifications
   - Approve/reject transactions
   - Manual balance updates

4. **Notification System**
   - Email notifications for verification status
   - In-app notifications

### Phase 2: Binance Pay Integration (Week 3-4)

1. **Binance Merchant Setup**
   - Register merchant account
   - Obtain API credentials
   - Configure webhook endpoints

2. **Payment Flow Implementation**
   - Create payment request
   - Generate QR code for payment
   - Handle payment confirmation
   - Update user balance automatically

3. **Security Measures**
   - API key encryption
   - Request signing
   - Webhook verification
   - Rate limiting

4. **Testing**
   - Test with Binance testnet
   - Verify payment flows
   - Test error handling
   - Security audit

## Security Considerations

1. **API Key Management**
   - Store API keys in secure environment variables
   - Never expose keys in client-side code
   - Use Supabase Edge Functions for API calls

2. **Transaction Verification**
   - Verify transaction signatures
   - Check transaction amounts
   - Prevent double-spending
   - Implement idempotency

3. **User Data Protection**
   - Encrypt wallet addresses
   - Secure storage of transaction data
   - Comply with data protection regulations

4. **Rate Limiting**
   - Limit API calls per user
   - Prevent abuse
   - Monitor suspicious activity

## User Flow

### Manual Verification Flow

1. User navigates to "Add Contribution" screen
2. User enters USDT amount (50-100,000)
3. App displays pool wallet address
4. User sends USDT from Binance to pool wallet
5. User submits transaction ID
6. User optionally uploads payment proof
7. Admin receives notification
8. Admin verifies transaction on Binance
9. Admin approves contribution
10. User balance updated automatically
11. Referral commissions processed

### Automated Binance Pay Flow

1. User navigates to "Add Contribution" screen
2. User enters USDT amount (50-100,000)
3. User clicks "Pay with Binance"
4. App generates payment request
5. User scans QR code or clicks payment link
6. User completes payment in Binance app
7. Binance sends webhook to app
8. App verifies payment
9. User balance updated automatically
10. Referral commissions processed
11. User receives confirmation

## Testing Checklist

- [ ] User can link Binance wallet
- [ ] User can submit transaction ID
- [ ] Admin can verify transactions
- [ ] Balance updates correctly
- [ ] Referral commissions calculated correctly
- [ ] Withdrawal requests work properly
- [ ] Email notifications sent
- [ ] Error handling works
- [ ] Security measures in place
- [ ] Rate limiting functional

## Resources

- [Binance Pay API Documentation](https://developers.binance.com/docs/binance-pay/introduction)
- [Binance Connect Documentation](https://www.binance.com/en/binance-api)
- [Binance Merchant Portal](https://merchant.binance.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Next Steps

1. **Immediate Actions:**
   - Decide on integration approach
   - Register Binance merchant account (if using Binance Pay)
   - Update database schema for wallet addresses
   - Create manual verification UI

2. **Short-term Goals:**
   - Implement manual verification system
   - Create admin dashboard
   - Test with real transactions

3. **Long-term Goals:**
   - Integrate Binance Pay API
   - Automate payment processing
   - Add support for other cryptocurrencies
   - Implement advanced analytics

## Support

For questions or issues with Binance integration:
- Binance Support: https://www.binance.com/en/support
- Developer Forum: https://dev.binance.vision/
- Technical Documentation: https://developers.binance.com/

---

**Note:** This is a living document and will be updated as the integration progresses.
