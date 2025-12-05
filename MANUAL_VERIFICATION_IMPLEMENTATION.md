
# Manual Payment Verification System - Implementation Guide

## Overview

This document describes the comprehensive manual payment verification system that has been implemented to work alongside the automatic verification system. The manual verification system uses the same logic as the `nowpayments-webhook` edge function to ensure consistency.

## Architecture

### 1. **Automatic Verification System** (Existing)
- **nowpayments-webhook**: Receives webhooks from NOWPayments when payment status changes
- **auto-verify-payments**: Periodic polling function that checks pending payments
- **check-nowpayments-status**: User-triggered status check function
- **PaymentStatusPoller**: React component for real-time UI updates

### 2. **Manual Verification System** (New)
- **manual-verify-payment**: New edge function that combines verification and crediting
- **Enhanced payment-history.tsx**: User interface with "Verify Payment" button
- **Enhanced manual-payment-credit.tsx**: Admin interface for manual verification

## Key Features

### 1. **Unified Crediting Logic**
All verification methods (webhook, automatic, manual) use the same crediting logic:
- Verify payment status with NOWPayments API
- Update payment record in database
- Credit user balance if payment is confirmed
- Update global metrics
- Prevent double-crediting
- Update transaction history

### 2. **Robust Error Handling**
- Detailed logging with unique request IDs
- Comprehensive error messages
- Graceful degradation
- User-friendly error feedback

### 3. **Security**
- JWT authentication required
- User ownership verification
- Admin privilege checking
- Service role key for database operations

### 4. **User Experience**
- Real-time status updates
- Clear visual feedback
- Detailed payment information
- One-click verification
- Automatic refresh after verification

## Implementation Details

### Edge Function: `manual-verify-payment`

**Location**: `supabase/functions/manual-verify-payment/index.ts`

**Purpose**: Provides a robust manual verification endpoint that:
1. Authenticates the user
2. Verifies payment ownership or admin privileges
3. Checks payment status with NOWPayments
4. Credits the user if payment is confirmed
5. Prevents double-crediting
6. Returns detailed response

**Request Format**:
```typescript
POST /functions/v1/manual-verify-payment
Headers:
  Authorization: Bearer <user_token>
  Content-Type: application/json
Body:
  {
    "order_id": "MXI-1764082913255-cop99k"
  }
```

**Response Format**:
```typescript
{
  "success": true,
  "message": "Payment verified and credited successfully",
  "credited": true,
  "payment": {
    "order_id": "MXI-1764082913255-cop99k",
    "status": "confirmed",
    "mxi_amount": "100.00",
    "new_balance": "150.00"
  },
  "requestId": "abc123"
}
```

### User Interface: `payment-history.tsx`

**Location**: `app/(tabs)/(home)/payment-history.tsx`

**Features**:
- Displays all user payments
- Shows "Verify Payment" button for pending payments
- Real-time status updates via Supabase subscriptions
- Loading states during verification
- Success/error feedback
- Automatic refresh after verification

**User Flow**:
1. User views payment history
2. Sees pending payment with "Verify Payment" button
3. Clicks button to trigger verification
4. System checks with NOWPayments
5. If confirmed, credits MXI automatically
6. Shows success message with new balance
7. Payment status updates to "confirmed"

### Admin Interface: `manual-payment-credit.tsx`

**Location**: `app/(tabs)/(admin)/manual-payment-credit.tsx`

**Features**:
- Search payment by Order ID
- View detailed payment information
- View user information
- One-click verification and crediting
- Automatic NOWPayments verification
- Prevents double-crediting
- Detailed logging

**Admin Flow**:
1. Admin enters Order ID
2. Clicks "Search Payment"
3. Reviews payment details
4. Clicks "Verify and Credit Payment"
5. System verifies with NOWPayments
6. If confirmed, credits automatically
7. Shows success message
8. Payment marked as confirmed

## Comparison: Automatic vs Manual Verification

### Automatic Verification (Webhook)
- **Trigger**: NOWPayments sends webhook
- **Timing**: Immediate when payment status changes
- **Reliability**: Depends on webhook delivery
- **Use Case**: Primary verification method

### Automatic Verification (Polling)
- **Trigger**: Cron job or scheduled task
- **Timing**: Every X minutes
- **Reliability**: High, but delayed
- **Use Case**: Backup for missed webhooks

### Manual Verification (User)
- **Trigger**: User clicks "Verify Payment" button
- **Timing**: On-demand
- **Reliability**: High, user-initiated
- **Use Case**: When automatic verification fails

### Manual Verification (Admin)
- **Trigger**: Admin searches and verifies payment
- **Timing**: On-demand
- **Reliability**: Highest, admin-controlled
- **Use Case**: Support cases, troubleshooting

## Security Considerations

### 1. **Authentication**
- All endpoints require valid JWT token
- User session validated before processing
- Service role key used for database operations

### 2. **Authorization**
- Users can only verify their own payments
- Admins can verify any payment
- Admin status checked via `admin_users` table

### 3. **Double-Crediting Prevention**
- Payment status checked before crediting
- Atomic database operations
- Clear success/error responses

### 4. **Data Validation**
- Order ID format validation
- Payment existence verification
- User ownership verification
- NOWPayments response validation

## Error Handling

### Common Errors

1. **Payment Not Found**
   - **Cause**: Invalid Order ID
   - **Response**: 404 with error message
   - **User Action**: Check Order ID

2. **Already Credited**
   - **Cause**: Payment already processed
   - **Response**: 200 with already_credited flag
   - **User Action**: No action needed

3. **Payment Not Confirmed**
   - **Cause**: NOWPayments hasn't confirmed yet
   - **Response**: 200 with current status
   - **User Action**: Wait and try again

4. **NOWPayments API Error**
   - **Cause**: API connection issue
   - **Response**: 500 with error details
   - **User Action**: Try again later

5. **Unauthorized**
   - **Cause**: Invalid session or not payment owner
   - **Response**: 403 with error message
   - **User Action**: Login again

## Testing

### Test Scenarios

1. **Successful Verification**
   - Create payment in NOWPayments
   - Complete payment
   - Verify manually
   - Check balance updated

2. **Already Credited**
   - Verify same payment twice
   - Check second attempt returns already_credited

3. **Pending Payment**
   - Create payment
   - Don't complete payment
   - Verify manually
   - Check status updated but not credited

4. **Unauthorized Access**
   - Try to verify another user's payment
   - Check 403 response

5. **Admin Verification**
   - Login as admin
   - Verify any user's payment
   - Check successful

## Monitoring and Logging

### Log Format
```
[requestId] ========== MANUAL VERIFY PAYMENT ==========
[requestId] Timestamp: 2025-01-15T12:00:00.000Z
[requestId] Step 1: Validating environment variables...
[requestId] ✅ Environment variables validated
[requestId] Step 2: Validating user session...
[requestId] ✅ User authenticated: user-id
[requestId] Step 3: Parsing request body...
[requestId] Order ID: MXI-1764082913255-cop99k
[requestId] Step 4: Finding payment record...
[requestId] ✅ Payment found: payment-id
[requestId] Step 5: Check if already credited
[requestId] Step 6: Checking payment status with NOWPayments...
[requestId] NOWPayments response status: 200
[requestId] Payment status: finished
[requestId] Step 7: Updating payment record...
[requestId] ✅ Payment updated
[requestId] Step 8: Updating transaction_history...
[requestId] ✅ Transaction history updated
[requestId] Step 9: Crediting user...
[requestId] User: user-id, Current balance: 50.00
[requestId] ✅ User credited: 150.00 MXI
[requestId] ✅ Metrics updated
[requestId] ✅ Payment marked as confirmed
[requestId] ========== SUCCESS - PAYMENT CREDITED ==========
```

### Monitoring Points
- Request count per endpoint
- Success/failure rates
- Average response time
- Error types and frequencies
- Double-crediting attempts
- NOWPayments API errors

## Best Practices

### For Users
1. Wait at least 10 minutes after payment before manual verification
2. Check payment status in NOWPayments dashboard first
3. Only verify once - system prevents double-crediting
4. Contact support if verification fails repeatedly

### For Admins
1. Always verify payment status in NOWPayments before manual crediting
2. Check user balance before and after crediting
3. Document reason for manual intervention
4. Monitor logs for any errors
5. Use admin interface for all manual operations

### For Developers
1. Always use service role key for database operations
2. Validate all inputs before processing
3. Use atomic database operations
4. Log all steps with unique request IDs
5. Return detailed error messages
6. Test double-crediting prevention
7. Monitor NOWPayments API rate limits

## Troubleshooting

### Payment Not Crediting

**Symptoms**: User completed payment but MXI not credited

**Diagnosis**:
1. Check payment status in database
2. Check NOWPayments dashboard
3. Check webhook logs
4. Check edge function logs

**Solution**:
1. If payment confirmed in NOWPayments but not in database:
   - Use manual verification
2. If payment not confirmed in NOWPayments:
   - Wait for confirmation
   - Check transaction on blockchain
3. If webhook failed:
   - Check webhook URL configuration
   - Check IPN secret configuration
   - Use manual verification

### Double-Crediting Concerns

**Prevention**:
- Payment status checked before crediting
- Only credits if status is not 'finished' or 'confirmed'
- Atomic database operations
- Clear logging of all operations

**Detection**:
- Monitor user balance changes
- Check payment status history
- Review edge function logs
- Check metrics updates

**Resolution**:
- If double-credited, manually adjust user balance
- Document incident
- Review logs to identify cause
- Implement additional safeguards if needed

## Future Improvements

1. **Automatic Retry Logic**
   - Retry failed verifications automatically
   - Exponential backoff
   - Maximum retry limit

2. **Batch Verification**
   - Verify multiple payments at once
   - Admin bulk operations
   - Scheduled batch processing

3. **Enhanced Monitoring**
   - Real-time alerts for failures
   - Dashboard for verification metrics
   - Automated health checks

4. **User Notifications**
   - Email notifications for successful crediting
   - Push notifications for payment status changes
   - SMS alerts for large payments

5. **Advanced Analytics**
   - Payment success rates
   - Average verification time
   - Common failure patterns
   - User behavior analysis

## Conclusion

The manual verification system provides a robust fallback mechanism for the automatic verification system. It uses the same crediting logic to ensure consistency and prevents double-crediting through careful status checking. The system is designed to be user-friendly for both regular users and administrators, with clear feedback and detailed logging for troubleshooting.

The implementation follows best practices for security, error handling, and user experience, making it a reliable solution for handling payment verification in cases where the automatic system fails or is delayed.
