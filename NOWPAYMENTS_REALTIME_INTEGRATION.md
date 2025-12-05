
# NOWPayments Integration with Realtime Updates

## Overview

This document describes the complete integration of NOWPayments with Supabase Realtime for real-time payment status updates in the MXI Liquidity Pool app.

## Architecture

### Database Structure

#### `public.payments` Table
- **Purpose**: Store payment intents and track payment status
- **Key Columns**:
  - `id` (uuid): Primary key
  - `order_id` (text): Unique order identifier
  - `user_id` (uuid): Reference to user
  - `status` (text): Normalized status (pending, waiting, processing, paid, failed, refunded, expired)
  - `payment_status` (text): Original NOWPayments status
  - `price_amount` (numeric): Amount in USD
  - `price_currency` (text): Currency (usd)
  - `pay_amount` (numeric): Amount to pay in selected cryptocurrency
  - `pay_currency` (text): Selected cryptocurrency
  - `actually_paid` (numeric): Actual amount paid
  - `invoice_url` (text): NOWPayments invoice URL
  - `pay_address` (text): Payment address
  - `payment_id` (text): NOWPayments payment ID
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

#### Indexes
- `idx_payments_order_id`: Unique index on order_id
- `idx_payments_user_id_order_id`: Composite index for user queries
- `idx_payments_status`: Index for status filtering
- `idx_payments_payment_status`: Index for payment_status filtering

#### Row Level Security (RLS)
- **Policy**: Users can only view and insert their own payments
- **Implementation**:
  ```sql
  CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  ```

### Realtime Triggers

#### `payments_broadcast_trigger()`
- **Purpose**: Broadcast payment updates to Realtime channels
- **Trigger**: Fires on INSERT, UPDATE, DELETE
- **Channel Name**: `payment:<order_id>`
- **Payload**: Includes event type, new record, and old record (for updates)

#### `update_payments_updated_at()`
- **Purpose**: Automatically update the `updated_at` timestamp
- **Trigger**: Fires BEFORE UPDATE

### Edge Functions

#### `create-payment-intent`
**Endpoint**: `POST /functions/v1/create-payment-intent`

**Request Body**:
```json
{
  "order_id": "MXI-1234567890-abc123",
  "price_amount": 100.00,
  "price_currency": "usd",
  "pay_currency": "usdttrc20" // Optional
}
```

**Behavior**:
1. **Without `pay_currency`**: Returns available cryptocurrencies
2. **With `pay_currency`**: Creates payment intent and invoice

**Response (currencies)**:
```json
{
  "success": true,
  "intent": {
    "id": "MXI-1234567890-abc123",
    "order_id": "MXI-1234567890-abc123",
    "price_amount": 100.00,
    "price_currency": "usd",
    "pay_currencies": ["usdttrc20", "usdterc20", "usdtbep20", "btc", "eth", "bnb", "trx"],
    "user_id": "user-uuid",
    "created_at": "2025-01-20T12:00:00Z"
  }
}
```

**Response (invoice)**:
```json
{
  "success": true,
  "intent": {
    "id": "nowpayments-id",
    "order_id": "MXI-1234567890-abc123",
    "invoice_url": "https://nowpayments.io/payment/...",
    "pay_address": "TRX_ADDRESS",
    "mxi_amount": 333.33,
    "usdt_amount": 100.00,
    "price_per_mxi": 0.30,
    "phase": 1,
    "pay_currency": "usdttrc20",
    "status": "waiting",
    "payment_status": "waiting"
  }
}
```

#### `nowpayments-webhook`
**Endpoint**: `POST /functions/v1/nowpayments-webhook`

**Security**:
- Validates HMAC-SHA512 signature using `NOWPAYMENTS_IPN_SECRET`
- Rejects requests with invalid signatures

**Status Normalization**:
- `finished`, `confirmed` → `paid`
- `waiting`, `pending`, `confirming` → `processing`
- `failed` → `failed`
- `refunded` → `refunded`
- `expired` → `expired`

**Processing Flow**:
1. Verify webhook signature
2. Log webhook payload
3. Find payment by `order_id`
4. Update payment status
5. If status is `paid`:
   - Update user balances (MXI, USDT)
   - Calculate and add yield rate
   - Create contribution record
   - Update metrics
   - Process referral commissions (5%, 2%, 1%)
   - Mark payment as confirmed
6. Emit Realtime event via trigger

### Client Integration

#### Payment Flow

1. **User enters amount**
   - Validates amount (3-500,000 USDT)
   - Calculates MXI amount based on current phase price

2. **Load currencies**
   - Calls `create-payment-intent` without `pay_currency`
   - Displays available cryptocurrencies in modal

3. **User selects currency**
   - Stores selected currency
   - Enables payment button

4. **Create payment**
   - Calls `create-payment-intent` with `pay_currency`
   - Receives invoice URL
   - **Subscribes to Realtime channel BEFORE opening payment page**
   - Opens invoice URL in browser
   - Shows payment status card

5. **Realtime updates**
   - Listens for `postgres_changes` on `payments` table
   - Filters by `order_id`
   - Updates UI automatically when status changes
   - Shows alerts for completion/failure
   - Unsubscribes after final status

#### Realtime Subscription

```typescript
const subscribeToPaymentUpdates = async (orderId: string) => {
  // Get session token
  const { data: { session } } = await supabase.auth.getSession();
  
  // Set auth token for Realtime
  await supabase.realtime.setAuth(session.access_token);

  // Create private channel
  const channel = supabase.channel(`payment:${orderId}`, {
    config: {
      private: true,
      broadcast: { ack: true },
    },
  });

  // Subscribe to changes
  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        const record = payload.new;
        
        // Update UI
        setPaymentStatus(record);
        
        // Handle completion
        if (record.status === 'paid') {
          Alert.alert('¡Pago Confirmado!', '...');
          channel.unsubscribe();
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsRealtimeConnected(true);
      }
    });
};
```

## Environment Variables

### Required Secrets
- `NOWPAYMENTS_API_KEY`: NOWPayments API key
- `NOWPAYMENTS_IPN_SECRET`: Webhook signature secret (for HMAC verification)
- `SUPABASE_URL`: Supabase project URL (auto-provided)
- `SUPABASE_ANON_KEY`: Supabase anonymous key (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (auto-provided)

### Setting Secrets
```bash
# Set NOWPayments API key
supabase secrets set NOWPAYMENTS_API_KEY=your_api_key_here

# Set IPN secret
supabase secrets set NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
```

## NOWPayments Configuration

### IPN Callback URL
Configure in NOWPayments dashboard:
```
https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/nowpayments-webhook
```

### Supported Cryptocurrencies
- USDT (TRC20, ERC20, BEP20)
- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- TRON (TRX)

## Status Flow

```
pending → waiting → processing → paid
                              ↓
                           failed
                              ↓
                          expired
                              ↓
                         refunded
```

## Security Features

1. **HMAC Signature Verification**
   - All webhook requests are verified using HMAC-SHA512
   - Invalid signatures are rejected with 401 status

2. **Row Level Security**
   - Users can only access their own payments
   - Enforced at database level

3. **Private Realtime Channels**
   - Channels require authentication
   - Users can only subscribe to their own payment channels

4. **Amount Verification**
   - Webhook validates payment amount (5% variance allowed for network fees)
   - Validates payment currency

5. **Idempotency**
   - Prevents double-processing of payments
   - Checks if payment already confirmed before processing

## Error Handling

### Client-Side
- Network errors: Shows alert with error message
- Invalid amount: Shows validation error
- Authentication errors: Prompts user to log in
- Realtime connection errors: Shows connection status indicator

### Server-Side
- Logs all errors with request ID
- Stores failed webhooks in `nowpayments_webhook_logs`
- Returns appropriate HTTP status codes
- Includes error details in response

## Testing

### Test Payment Flow
1. Navigate to "Comprar MXI" or "Depositar"
2. Enter amount (e.g., 10 USDT)
3. Click "Continuar al Pago"
4. Select cryptocurrency (e.g., USDT TRC20)
5. Click "Pagar"
6. Complete payment on NOWPayments page
7. Return to app and watch status update in real-time

### Monitoring
- Check `nowpayments_webhook_logs` table for webhook history
- Check `payments` table for payment records
- Check Edge Function logs for detailed execution logs

## Troubleshooting

### Realtime not connecting
- Verify user is authenticated
- Check that `supabase.realtime.setAuth()` is called with valid token
- Verify RLS policies allow user to read from `payments` table

### Webhook not processing
- Verify `NOWPAYMENTS_IPN_SECRET` is set correctly
- Check `nowpayments_webhook_logs` for signature verification errors
- Verify IPN callback URL is configured in NOWPayments dashboard

### Payment not updating
- Check that trigger `trg_payments_broadcast` is enabled
- Verify Realtime subscription is active
- Check Edge Function logs for processing errors

## Performance Considerations

1. **Database Indexes**: Optimized for common queries
2. **Realtime Channels**: Automatically cleaned up after payment completion
3. **Webhook Logging**: Stores all webhooks for debugging and audit
4. **Idempotency**: Prevents duplicate processing

## Future Enhancements

1. **Payment History**: Add screen to view all past payments
2. **Retry Logic**: Automatic retry for failed payments
3. **Email Notifications**: Send email on payment completion
4. **Push Notifications**: Mobile push notifications for status updates
5. **Multi-Currency Support**: Add more cryptocurrencies
6. **Partial Payments**: Support for partial payment completion

## References

- [NOWPayments API Documentation](https://documenter.getpostman.com/view/7907941/S1a32n38)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
