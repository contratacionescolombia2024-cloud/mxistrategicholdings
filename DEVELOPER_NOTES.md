
# Developer Notes - Binance Integration Implementation

## Implementation Overview

This document provides technical details for developers working with the Binance payment integration.

## Architecture

### Frontend (React Native + Expo)
- **contribute.tsx**: Main payment creation and verification UI
- **binance-payments.tsx**: Payment history and tracking
- **AuthContext.tsx**: User authentication and data management

### Backend (Supabase)
- **Database**: PostgreSQL with RLS policies
- **Edge Functions**: Deno-based serverless functions
- **Authentication**: Supabase Auth with JWT

## Database Schema

### binance_payments Table

```typescript
interface BinancePayment {
  id: string;                    // UUID primary key
  user_id: string;               // Foreign key to users table
  payment_id: string;            // Unique payment identifier (MXI-timestamp-uuid)
  usdt_amount: number;           // Amount in USDT
  mxi_amount: number;            // Calculated MXI tokens (usdt_amount / 10)
  binance_order_id: string;      // Binance order ID (optional)
  binance_transaction_id: string; // User-provided transaction ID
  payment_address: string;       // Generated payment address
  status: PaymentStatus;         // Current payment status
  verification_attempts: number; // Number of verification attempts
  last_verification_at: Date;    // Last verification timestamp
  confirmed_at: Date;            // Confirmation timestamp
  expires_at: Date;              // Expiration timestamp (30 min from creation)
  metadata: object;              // Additional data (transaction_type, etc.)
  created_at: Date;              // Creation timestamp
  updated_at: Date;              // Last update timestamp
}

type PaymentStatus = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'expired';
```

### RLS Policies

```sql
-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON binance_payments FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own payments
CREATE POLICY "Users can insert their own payments"
  ON binance_payments FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

## Edge Functions

### create-binance-payment

**Endpoint**: `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-binance-payment`

**Method**: POST

**Headers**:
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

**Request Body**:
```typescript
{
  usdtAmount: number;           // 50 - 100,000
  transactionType: 'initial' | 'increase' | 'reinvestment';
}
```

**Response**:
```typescript
{
  success: boolean;
  payment: {
    paymentId: string;
    usdtAmount: number;
    mxiAmount: number;
    paymentAddress: string;
    status: string;
    expiresAt: string;
  };
  message: string;
}
```

**Logic**:
1. Authenticate user via JWT
2. Validate USDT amount (50 - 100,000)
3. Calculate MXI amount (usdt_amount / 10)
4. Generate unique payment ID
5. Generate payment address (simulated)
6. Set expiration (30 minutes)
7. Insert payment record
8. Return payment details

### verify-binance-payment

**Endpoint**: `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/verify-binance-payment`

**Method**: POST

**Headers**:
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

**Request Body**:
```typescript
{
  paymentId: string;
  userId: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  status: PaymentStatus;
  message: string;
  mxiAmount?: number;
  newBalance?: number;
  verificationAttempts?: number;
}
```

**Logic**:
1. Authenticate user via JWT
2. Verify user owns payment
3. Check if already confirmed
4. Check if expired
5. Verify payment (currently simulated)
6. If verified:
   - Update payment status to 'confirmed'
   - Create contribution record
   - Calculate yield rate
   - Update user balance
   - Process referral commissions
   - Return success
7. If not verified:
   - Increment verification attempts
   - Return pending status

## Frontend Implementation

### Payment Creation Flow

```typescript
const handleCreatePayment = async () => {
  // 1. Validate amount
  if (amount < 50 || amount > 100000) {
    Alert.alert('Error', 'Invalid amount');
    return;
  }

  // 2. Get session token
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Call Edge Function
  const response = await fetch(
    'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-binance-payment',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usdtAmount: amount,
        transactionType: txType,
      }),
    }
  );

  // 4. Handle response
  const result = await response.json();
  if (result.success) {
    setCurrentPayment(result.payment);
    setShowPaymentModal(true);
  }
};
```

### Payment Verification Flow

```typescript
const handleVerifyPayment = async () => {
  // 1. Update payment with transaction ID
  await supabase
    .from('binance_payments')
    .update({ 
      binance_transaction_id: transactionId,
      status: 'confirming'
    })
    .eq('payment_id', currentPayment.paymentId);

  // 2. Get session token
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Call verification Edge Function
  const response = await fetch(
    'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/verify-binance-payment',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId: currentPayment.paymentId,
        userId: user?.id,
      }),
    }
  );

  // 4. Handle response
  const result = await response.json();
  if (result.success && result.status === 'confirmed') {
    // Payment confirmed - show success message
    Alert.alert('Payment Confirmed!', `You received ${result.mxiAmount} MXI`);
  }
};
```

## State Management

### Payment Modal State

```typescript
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [currentPayment, setCurrentPayment] = useState<BinancePayment | null>(null);
const [verifying, setVerifying] = useState(false);
const [timeRemaining, setTimeRemaining] = useState('');
const [transactionId, setTransactionId] = useState('');
```

### Countdown Timer

```typescript
useEffect(() => {
  if (!currentPayment) return;

  const interval = setInterval(() => {
    const now = new Date();
    const expires = new Date(currentPayment.expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expired');
      clearInterval(interval);
      return;
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, 1000);

  return () => clearInterval(interval);
}, [currentPayment]);
```

## Error Handling

### Common Errors

1. **Invalid Amount**
   - Check: 50 ≤ amount ≤ 100,000
   - Message: "Invalid amount. Must be between 50 and 100,000 USDT"

2. **Unauthorized**
   - Check: Valid JWT token
   - Message: "Please log in to continue"

3. **Payment Not Found**
   - Check: Payment exists and belongs to user
   - Message: "Payment not found"

4. **Payment Expired**
   - Check: Current time < expires_at
   - Message: "Payment has expired"

5. **Verification Failed**
   - Check: Transaction ID valid
   - Message: "Payment not yet confirmed on Binance network"

## Testing

### Unit Tests

```typescript
// Test payment creation
describe('createPayment', () => {
  it('should create payment with valid amount', async () => {
    const result = await createPayment(100);
    expect(result.success).toBe(true);
    expect(result.payment.mxiAmount).toBe(10);
  });

  it('should reject invalid amount', async () => {
    const result = await createPayment(25);
    expect(result.success).toBe(false);
  });
});

// Test payment verification
describe('verifyPayment', () => {
  it('should verify payment with valid transaction ID', async () => {
    const result = await verifyPayment(paymentId, 'valid_tx_id');
    expect(result.success).toBe(true);
    expect(result.status).toBe('confirmed');
  });
});
```

### Integration Tests

1. Create payment with 50 USDT
2. Verify payment modal opens
3. Enter transaction ID
4. Verify payment confirmation
5. Check MXI balance updated
6. Verify user marked as active contributor

## Performance Considerations

1. **Database Queries**
   - Use indexes on user_id, payment_id, status
   - Limit payment history queries to recent records

2. **Edge Functions**
   - Keep functions lightweight
   - Use connection pooling
   - Implement timeout handling

3. **Frontend**
   - Debounce verification attempts
   - Cache payment history
   - Optimize modal rendering

## Security Considerations

1. **Authentication**
   - Always verify JWT token
   - Check user owns payment
   - Validate all inputs

2. **Payment Validation**
   - Verify amount ranges
   - Check payment not already processed
   - Validate transaction IDs

3. **Rate Limiting**
   - Limit verification attempts
   - Prevent spam payment creation
   - Track suspicious activity

## Monitoring

### Key Metrics

1. **Payment Success Rate**: confirmed / total payments
2. **Average Verification Time**: time from creation to confirmation
3. **Expiration Rate**: expired / total payments
4. **Verification Attempts**: average attempts per payment

### Logging

```typescript
console.log('Payment created:', {
  paymentId,
  userId,
  amount,
  timestamp: new Date().toISOString()
});

console.log('Payment verified:', {
  paymentId,
  status,
  verificationAttempts,
  timestamp: new Date().toISOString()
});
```

## Future Improvements

1. **Real Binance API Integration**
   - Connect to Binance API
   - Automatic transaction detection
   - Real-time verification

2. **Webhook Support**
   - Receive payment notifications
   - Automatic status updates
   - Reduce verification time

3. **Enhanced Security**
   - Two-factor authentication
   - IP whitelisting
   - Advanced fraud detection

4. **Performance Optimization**
   - Caching layer
   - Background job processing
   - Database query optimization

## Troubleshooting

### Payment Not Confirming

1. Check transaction ID is correct
2. Verify payment sent to correct address
3. Check payment not expired
4. Review verification attempts
5. Check Edge Function logs

### Balance Not Updating

1. Verify payment status is 'confirmed'
2. Check contribution record created
3. Verify user balance query
4. Review referral commission processing

### Modal Not Showing

1. Check payment creation successful
2. Verify state management
3. Review modal visibility logic
4. Check for JavaScript errors

## Contact

For technical questions or issues:
- Review Edge Function logs in Supabase dashboard
- Check database records in binance_payments table
- Review frontend console logs
- Contact development team

## Changelog

### Version 1.0.0 (Current)
- Initial Binance payment integration
- Automatic payment verification
- Payment history tracking
- Updated pool closing date to February 15, 2026

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
