
# NowPayments Pending Transaction Fix - Complete Solution

## Problem Summary

Transactions were getting stuck in "pending" state with the following issues:

1. **All payment creation requests were failing with 500 errors** - The edge function was consistently returning errors
2. **Transaction history entries had no `payment_id`** - Transactions were created but NowPayments API calls were failing
3. **No proper error tracking** - Failed transactions weren't being marked as failed, leaving them in perpetual "pending" state
4. **No user-facing tools to manage stuck transactions** - Users couldn't cancel or retry failed payments

## Root Cause

The `create-nowpayments-order` edge function was:
- Creating transaction history entries AFTER attempting the NowPayments API call
- Not updating transaction status when API calls failed
- Not providing detailed error information to users
- Leaving transactions in "pending" state even when the payment creation failed

## Solution Implemented

### 1. **Edge Function Improvements** (`create-nowpayments-order`)

**Key Changes:**
- ✅ Create transaction history entry FIRST before calling NowPayments API
- ✅ Update transaction status to "failed" when any error occurs
- ✅ Store detailed error messages and error details in transaction_history
- ✅ Comprehensive error handling at every step
- ✅ Better logging for debugging

**Flow:**
```
1. Authenticate user
2. Validate MXI amount and phase limits
3. CREATE TRANSACTION HISTORY (status: 'pending')
4. Call NowPayments API
   - If success: Update transaction with payment_id and payment_url
   - If failure: Update transaction status to 'failed' with error details
5. Store order in nowpayments_orders table
6. Return response to client
```

### 2. **Webhook Improvements** (`nowpayments-webhook`)

**Key Changes:**
- ✅ Update transaction_history table alongside nowpayments_orders
- ✅ Mark transactions as 'finished' when payment completes
- ✅ Mark transactions as 'failed'/'expired'/'cancelled' based on webhook status
- ✅ Store error details for failed payments

### 3. **Enhanced Transaction History UI**

**New Features:**
- ✅ **Verify Button** - Check payment status with NowPayments API
- ✅ **Cancel Button** - Allow users to cancel stuck pending transactions
- ✅ **Better Error Display** - Show detailed error messages and technical details
- ✅ **Smart Actions** - Different actions based on transaction state:
  - Pending with payment_url: Show "Pagar", "Verificar", "Cancelar"
  - Pending without payment_id: Show warning and "Cancelar" option
  - Failed/Expired: Show error message

### 4. **Transaction Status Flow**

```
PENDING (initial)
    ↓
    ├─→ WAITING (payment URL created, awaiting user payment)
    │       ↓
    │       ├─→ CONFIRMING (payment received, confirming on blockchain)
    │       │       ↓
    │       │       └─→ FINISHED (payment confirmed, MXI credited)
    │       │
    │       └─→ EXPIRED (payment window expired)
    │
    ├─→ FAILED (API error, validation error, or payment failed)
    │
    └─→ CANCELLED (user cancelled the transaction)
```

## User Actions

### For Pending Transactions:

1. **If transaction has payment URL:**
   - Click "Pagar" to open payment page
   - Click "Verificar" to check current status
   - Click "Cancelar" to cancel if no longer needed

2. **If transaction has no payment_id:**
   - This means payment creation failed
   - Click "Verificar" to see error details
   - Click "Cancelar" to remove from pending list
   - Create a new order to try again

### For Failed Transactions:

- View error message to understand what went wrong
- Click "Ver detalles técnicos" for full error information
- Create a new order to retry the purchase

## Database Schema

### transaction_history Table

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- transaction_type (text: 'nowpayments_order', 'okx_payment', etc.)
- order_id (text, unique identifier)
- payment_id (text, NowPayments payment ID)
- mxi_amount (numeric)
- usdt_amount (numeric)
- status (text: 'pending', 'waiting', 'confirming', 'finished', 'failed', 'expired', 'cancelled')
- error_message (text, user-friendly error message)
- error_details (jsonb, technical error details)
- payment_url (text, URL to complete payment)
- metadata (jsonb, additional payment metadata)
- created_at (timestamp)
- updated_at (timestamp)
- completed_at (timestamp)
```

## Testing Checklist

- [x] Transaction history created before API call
- [x] Failed API calls update transaction status to 'failed'
- [x] Error messages stored in transaction_history
- [x] Webhook updates transaction_history
- [x] Users can cancel pending transactions
- [x] Users can verify transaction status
- [x] Payment URLs open correctly
- [x] Successful payments credit MXI balance
- [x] Failed payments show error details

## Monitoring

### Check for Stuck Transactions:

```sql
-- Find transactions pending for more than 1 hour
SELECT 
  th.id,
  th.order_id,
  th.status,
  th.error_message,
  th.created_at,
  u.email
FROM transaction_history th
LEFT JOIN users u ON u.id = th.user_id
WHERE th.status IN ('pending', 'waiting', 'confirming')
  AND th.created_at < NOW() - INTERVAL '1 hour'
ORDER BY th.created_at DESC;
```

### Check Edge Function Logs:

```bash
# View recent logs for create-nowpayments-order
supabase functions logs create-nowpayments-order --tail

# View webhook logs
supabase functions logs nowpayments-webhook --tail
```

## Next Steps

1. **Monitor transaction success rate** - Track how many transactions complete successfully
2. **Set up alerts** - Alert when transaction failure rate exceeds threshold
3. **Auto-expire old pending transactions** - Create a cron job to auto-cancel transactions pending for >24 hours
4. **Add retry mechanism** - Allow automatic retry for certain types of failures

## Support

If users report stuck transactions:

1. Check transaction_history table for error details
2. Check edge function logs for detailed error messages
3. Verify NowPayments API status
4. Check if API key is valid and has correct permissions
5. Verify webhook URL is accessible from NowPayments servers

## Summary

This fix ensures that:
- ✅ No transactions get stuck in pending state indefinitely
- ✅ All errors are properly tracked and displayed to users
- ✅ Users have tools to manage their transactions
- ✅ Comprehensive logging for debugging
- ✅ Proper status updates throughout the payment lifecycle
