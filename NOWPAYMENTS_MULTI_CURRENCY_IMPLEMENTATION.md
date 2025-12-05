
# NowPayments Multi-Currency Payment Implementation

## Overview

This implementation provides a complete multi-currency payment system using NowPayments API integrated with Supabase. Users can purchase MXI tokens using various cryptocurrencies (BTC, ETH, USDT, etc.) through a streamlined 3-step payment flow.

## Architecture

### Database Schema

#### `payment_intents` Table
Stores payment intents for the multi-step payment flow:

- **id**: UUID primary key
- **user_id**: Reference to auth.users
- **order_id**: Unique order identifier
- **price_amount**: Amount in fiat currency (USD)
- **price_currency**: Fiat currency code (default: USD)
- **pay_currency**: Selected cryptocurrency
- **pay_amount**: Amount in cryptocurrency
- **pay_address**: Payment address
- **payment_id**: NowPayments payment ID
- **nowpayment_invoice_url**: Payment URL
- **status**: Payment status (pending, waiting, confirming, confirmed, finished, failed, expired)
- **mxi_amount**: Amount of MXI tokens
- **phase**: Current presale phase
- **price_per_mxi**: Price per MXI token
- **pay_currencies**: Supported cryptocurrencies (JSONB)
- **price_currencies**: Supported fiat currencies (JSONB)
- **metadata**: Additional data (JSONB)
- **created_at**, **updated_at**, **expires_at**: Timestamps

**RLS Policies**: Users can only view/insert/update their own payment intents.

### Edge Functions

#### 1. `create-paid-intent`
**Purpose**: Creates or updates a payment intent without cryptocurrency selection.

**Endpoint**: `POST /functions/v1/create-paid-intent`

**Request Body**:
```json
{
  "order_id": "MXI-1234567890-abc123",
  "price_amount": 19.99,
  "price_currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "intent": {
    "id": "uuid",
    "order_id": "MXI-1234567890-abc123",
    "price_amount": 19.99,
    "price_currency": "USD",
    "mxi_amount": 49.975,
    "phase": 1,
    "price_per_mxi": 0.40,
    "pay_currencies": ["usdteth", "btc", "eth", "ltc", "usdc"],
    "price_currencies": ["USD", "EUR", "GBP"],
    "status": "pending",
    "expires_at": "2025-01-23T12:00:00Z"
  }
}
```

**Features**:
- Fetches current phase and MXI price from metrics
- Calculates MXI amount based on current price
- Retrieves supported currencies from NowPayments API
- Creates or updates payment intent in database
- Returns intent with supported currencies for selection

#### 2. `create-payment-intent`
**Purpose**: Generates NowPayments invoice with selected cryptocurrency.

**Endpoint**: `POST /functions/v1/create-payment-intent`

**Request Body**:
```json
{
  "order_id": "MXI-1234567890-abc123",
  "price_amount": 19.99,
  "price_currency": "USD",
  "pay_currency": "usdteth"
}
```

**Response**:
```json
{
  "success": true,
  "intent": {
    "id": "uuid",
    "order_id": "MXI-1234567890-abc123",
    "price_amount": 19.99,
    "price_currency": "USD",
    "pay_currency": "usdteth",
    "pay_amount": 19.99,
    "pay_address": "0x1234...5678",
    "payment_id": "nowpayments_id",
    "nowpayment_invoice_url": "https://nowpayments.io/payment/...",
    "mxi_amount": 49.975,
    "phase": 1,
    "price_per_mxi": 0.40,
    "status": "waiting",
    "expires_at": "2025-01-23T12:00:00Z"
  }
}
```

**Features**:
- Creates NowPayments invoice with selected cryptocurrency
- Updates payment intent with invoice details
- Creates entry in `nowpayments_orders` for backward compatibility
- Returns complete intent with payment URL

**GET Endpoint**: `GET /functions/v1/create-payment-intent/currencies`

Returns list of supported cryptocurrencies from NowPayments.

#### 3. `nowpayments-webhook`
**Purpose**: Handles webhook notifications from NowPayments.

**Endpoint**: `POST /functions/v1/nowpayments-webhook`

**Features**:
- Verifies HMAC-SHA512 signature
- Logs all webhook events
- Updates `payment_intents` and `nowpayments_orders` tables
- Processes confirmed payments:
  - Updates user MXI balance
  - Creates contribution record
  - Updates metrics
  - Processes referral commissions (5%, 2%, 1%)
  - Calculates and adds yield rate
- Handles failed/expired payments
- Supports real-time updates via Supabase Realtime

## User Flow

### 3-Step Payment Process

#### Step 1: Amount Selection
1. User enters desired MXI amount
2. System calculates total in USD based on current phase price
3. User clicks "Continuar" (Continue)
4. System calls `create-paid-intent` to create payment intent
5. System retrieves supported cryptocurrencies

#### Step 2: Cryptocurrency Selection
1. User sees list of supported cryptocurrencies
2. User selects preferred cryptocurrency (e.g., USDT ETH, BTC, ETH)
3. System calls `create-payment-intent` with selected crypto
4. System generates NowPayments invoice
5. Payment URL opens in browser

#### Step 3: Payment Waiting
1. User completes payment in NowPayments interface
2. System subscribes to real-time updates via Supabase Realtime
3. Webhook receives payment status updates
4. UI automatically updates when payment is confirmed
5. User receives success notification
6. MXI balance is updated automatically

## Real-time Updates

### Supabase Realtime Subscription

```typescript
const channel = supabase
  .channel(`payment-${orderId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'payment_intents',
      filter: `order_id=eq.${orderId}`,
    },
    (payload) => {
      console.log('Payment update received:', payload);
      
      if (payload.new) {
        const newStatus = (payload.new as any).status;
        
        if (newStatus === 'confirmed' || newStatus === 'finished') {
          // Show success message
          // Update UI
        } else if (newStatus === 'failed' || newStatus === 'expired') {
          // Show error message
          // Allow retry
        }
      }
    }
  )
  .subscribe();
```

### Alternative: Polling

For environments where Realtime is not available:

```typescript
const pollPaymentStatus = async () => {
  const { data } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('order_id', orderId)
    .single();
    
  if (data.status === 'confirmed' || data.status === 'finished') {
    // Payment confirmed
    clearInterval(pollingInterval);
  }
};

const pollingInterval = setInterval(pollPaymentStatus, 5000); // Poll every 5 seconds
```

## Supported Cryptocurrencies

The system supports all cryptocurrencies available through NowPayments, including:

- **USDT (Ethereum)** - usdteth (Recommended)
- **Bitcoin** - btc
- **Ethereum** - eth
- **Litecoin** - ltc
- **USD Coin** - usdc
- **Binance Coin** - bnb
- **Cardano** - ada
- **Ripple** - xrp
- **Dogecoin** - doge
- And many more...

## Environment Variables

Required environment variables in Supabase Edge Functions:

```bash
SUPABASE_URL=https://ienxcoudewmbuuldyecb.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NOWPAYMENTS_API_KEY=7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9
NOWPAYMENTS_WEBHOOK_SECRET=7QB99E2-JCE4H3A-QNC2GS3-1T5QDS9
```

## Client Configuration

In your React Native app:

```typescript
const supabase = createClient(
  'https://ienxcoudewmbuuldyecb.supabase.co',
  'your_anon_key'
);

const EDGE_BASE_URL = 'https://ienxcoudewmbuuldyecb.supabase.co/functions/v1';
```

## Webhook Configuration

Configure the webhook URL in NowPayments dashboard:

```
https://ienxcoudewmbuuldyecb.supabase.co/functions/v1/nowpayments-webhook
```

## Payment Status Flow

```
pending → waiting → confirming → confirmed → finished
                              ↓
                           failed/expired
```

- **pending**: Intent created, no crypto selected yet
- **waiting**: Invoice generated, waiting for payment
- **confirming**: Payment received, waiting for blockchain confirmations
- **confirmed**: Payment confirmed, processing user balance update
- **finished**: Payment fully processed, user balance updated
- **failed**: Payment failed
- **expired**: Payment expired (1 hour timeout)

## Security Features

1. **HMAC-SHA512 Signature Verification**: All webhook requests are verified
2. **Row Level Security (RLS)**: Users can only access their own payment intents
3. **JWT Authentication**: All API calls require valid Supabase session
4. **Service Role Key**: Webhook uses service role for database operations
5. **Amount Verification**: Webhook verifies payment amount (5% variance allowed for fees)
6. **Currency Verification**: Webhook verifies payment currency matches intent
7. **Double-Processing Prevention**: Checks if payment already processed

## Error Handling

### Client-Side Errors
- Invalid amount (< $3 minimum)
- Session expired
- Network errors
- Browser blocking payment URL

### Server-Side Errors
- NowPayments API errors
- Database errors
- Invalid webhook signatures
- Amount/currency mismatches
- User not found
- Metrics update failures

All errors are logged and displayed to users with actionable messages.

## Testing

### Test Payment Flow

1. Navigate to "Comprar MXI" screen
2. Click "🆕 Pago Multi-Moneda" button
3. Enter MXI amount (minimum $3)
4. Click "Continuar"
5. Select cryptocurrency (e.g., USDT ETH)
6. Complete payment in NowPayments interface
7. Return to app and wait for confirmation
8. Verify MXI balance updated

### Test Webhook

Use NowPayments sandbox environment or send test webhook:

```bash
curl -X POST https://ienxcoudewmbuuldyecb.supabase.co/functions/v1/nowpayments-webhook \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: your_signature" \
  -d '{
    "payment_id": "test_123",
    "order_id": "MXI-1234567890-abc123",
    "payment_status": "finished",
    "pay_currency": "usdteth",
    "actually_paid": 19.99,
    "outcome_amount": 19.99
  }'
```

## Monitoring

### Check Webhook Logs

```sql
SELECT * FROM nowpayments_webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Payment Intents

```sql
SELECT * FROM payment_intents 
WHERE status IN ('waiting', 'confirming') 
ORDER BY created_at DESC;
```

### Check Failed Payments

```sql
SELECT * FROM payment_intents 
WHERE status IN ('failed', 'expired') 
ORDER BY created_at DESC;
```

## Troubleshooting

### Payment Not Confirming

1. Check webhook logs for errors
2. Verify webhook URL configured in NowPayments
3. Check payment status in NowPayments dashboard
4. Verify blockchain confirmations
5. Check Supabase Edge Function logs

### Real-time Not Working

1. Verify Supabase Realtime is enabled
2. Check RLS policies on `payment_intents` table
3. Use polling as fallback
4. Check browser console for subscription errors

### Amount Mismatch

1. Verify network fees are within 5% variance
2. Check payment currency matches intent
3. Review webhook payload in logs
4. Verify exchange rates at time of payment

## Future Enhancements

1. **Multi-Currency Pricing**: Support EUR, GBP pricing
2. **QR Code Display**: Show payment QR code in app
3. **Payment History**: Detailed payment history with filters
4. **Refund Support**: Handle refund webhooks
5. **Partial Payments**: Support partial payment completion
6. **Payment Reminders**: Notify users of pending payments
7. **Analytics Dashboard**: Track payment success rates, popular currencies

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Review NowPayments documentation
- Check webhook logs in database
- Contact NowPayments support for payment issues

## Changelog

### Version 1.0.0 (2025-01-23)
- Initial implementation
- Multi-currency payment support
- Real-time payment updates
- Webhook integration
- 3-step payment flow
- Support for 10+ cryptocurrencies
