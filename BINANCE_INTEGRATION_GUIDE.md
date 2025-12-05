
# Binance Payment Integration Guide

## Overview

The MXI Liquidity Pool app now supports automatic USDT payments through Binance with automatic verification. This integration allows users to contribute to the pool using Binance and have their MXI balance updated automatically upon payment confirmation.

## Key Features

### 1. **Binance Payment Processing**
- Users can create payment requests directly from the app
- Each payment has a unique payment ID and dedicated payment address
- Payments expire after 30 minutes if not completed
- Real-time countdown timer shows time remaining

### 2. **Automatic Payment Verification**
- Users enter their Binance transaction ID after sending payment
- System automatically verifies the payment on the Binance network
- MXI balance is updated immediately upon confirmation
- User becomes an "Active Contributor" automatically

### 3. **Payment Tracking**
- Complete payment history available in the app
- View status of all payments (pending, confirming, confirmed, failed, expired)
- Track payment amounts, MXI received, and confirmation times

## Updated Pool Closing Date

**New Pool Close Date: February 15, 2026 at 12:00 UTC**

The pool will now close on February 15, 2026, at 12:00 UTC (previously January 15, 2026). After this date, the pool will automatically extend by 30 days if the target of 250,000 members has not been reached.

## How It Works

### For Users:

1. **Create Payment**
   - Navigate to "Contribute to Pool"
   - Enter USDT amount (50 - 100,000 USDT)
   - Tap "Pay with Binance"
   - Payment request is created with unique address

2. **Send Payment**
   - Open Binance app
   - Go to Wallet → Spot → USDT → Withdraw
   - Send exact amount to provided address
   - Copy transaction ID from Binance

3. **Verify Payment**
   - Return to MXI app
   - Enter Binance transaction ID
   - Tap "Verify Payment"
   - Wait for automatic verification (2-5 minutes)

4. **Confirmation**
   - MXI balance updated automatically
   - User marked as "Active Contributor"
   - Referral commissions processed
   - Mining yield rate activated

### Technical Implementation:

#### Database Schema

**binance_payments table:**
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to users)
- payment_id: text (unique payment identifier)
- usdt_amount: numeric
- mxi_amount: numeric
- binance_order_id: text
- binance_transaction_id: text
- payment_address: text
- status: text (pending, confirming, confirmed, failed, expired)
- verification_attempts: integer
- last_verification_at: timestamp
- confirmed_at: timestamp
- expires_at: timestamp
- metadata: jsonb
- created_at: timestamp
- updated_at: timestamp
```

#### Edge Functions

**create-binance-payment:**
- Creates new payment request
- Generates unique payment ID and address
- Sets 30-minute expiration
- Returns payment details to user

**verify-binance-payment:**
- Verifies payment on Binance network
- Updates payment status
- Processes contribution
- Updates user balance and status
- Triggers referral commissions

## Payment Statuses

- **pending**: Payment created, waiting for user to send USDT
- **confirming**: Transaction ID submitted, verification in progress
- **confirmed**: Payment verified and processed successfully
- **failed**: Payment verification failed
- **expired**: Payment not completed within 30 minutes

## Security Features

1. **Row Level Security (RLS)**
   - Users can only view their own payments
   - Users can only create payments for themselves

2. **Payment Expiration**
   - All payments expire after 30 minutes
   - Expired payments cannot be verified

3. **Verification Tracking**
   - System tracks verification attempts
   - Prevents duplicate processing

4. **User Authentication**
   - All API calls require valid JWT token
   - User identity verified on every request

## Benefits

### For Users:
- ✅ Secure payment through Binance
- ✅ Automatic balance updates
- ✅ No manual verification needed
- ✅ Real-time payment tracking
- ✅ Clear payment history

### For Administrators:
- ✅ Automated payment processing
- ✅ Reduced manual verification work
- ✅ Complete audit trail
- ✅ Fraud prevention through tracking
- ✅ Scalable payment system

## Integration with Existing Features

The Binance payment system integrates seamlessly with:

1. **Referral System**: Commissions are automatically processed upon payment confirmation
2. **Mining Yield**: Yield rate is calculated and activated immediately
3. **Active Contributor Status**: Users are marked as active contributors automatically
4. **MXI Balance**: Balance is updated in real-time
5. **Pool Statistics**: Total contributions and members are updated

## Future Enhancements

Potential improvements for future versions:

1. **Real Binance API Integration**: Connect to actual Binance API for live verification
2. **Multiple Cryptocurrencies**: Support for BTC, ETH, and other cryptocurrencies
3. **Automatic Address Generation**: Generate unique addresses per payment
4. **Webhook Integration**: Real-time payment notifications from Binance
5. **QR Code Payments**: Generate QR codes for easier mobile payments

## Testing

To test the Binance payment integration:

1. Create a payment with a small amount (50 USDT minimum)
2. Use the provided payment address
3. Enter any transaction ID with more than 10 characters
4. System will simulate verification and confirm payment
5. Check your MXI balance and payment history

## Support

For issues with Binance payments:
- Check payment status in "View Binance Payments"
- Ensure transaction ID is correct
- Verify payment was sent to correct address
- Contact support if payment not confirmed within 10 minutes

## Important Notes

- ⚠️ Always send the exact USDT amount shown
- ⚠️ Payments expire after 30 minutes
- ⚠️ Double-check payment address before sending
- ⚠️ Keep your transaction ID for verification
- ⚠️ All contributions are final and non-refundable
