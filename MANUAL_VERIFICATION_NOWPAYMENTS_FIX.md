
# Manual Verification System - NowPayments & USDT Fix

## Problem Summary

The user encountered an error **"Payment has no payment_id"** when trying to approve USDT transactions in the admin panel. The system needed a solution to:

1. Fix the error when validating USDT transactions
2. Allow admin approval without requiring NowPayments API verification
3. Support both NowPayments and direct USDT payment verification

## Root Cause

The Edge Function `manual-verify-payment` was checking for `payment_id` for all payments, but:
- **NowPayments payments** have a `payment_id` field
- **Direct USDT payments** only have a `tx_hash` field (no `payment_id`)

The function was failing when trying to process direct USDT payments because it expected a `payment_id` that didn't exist.

## Solution Implemented

### 1. Enhanced Edge Function (`manual-verify-payment`)

The Edge Function now supports **three verification modes**:

#### Mode 1: Direct USDT Payment (Admin Manual Approval)
- **Trigger:** Payment has `tx_hash` but no `payment_id`
- **Requirement:** Admin must provide `approved_usdt_amount`
- **Process:**
  - Admin verifies transaction on blockchain manually
  - Admin enters approved USDT amount
  - System calculates MXI based on phase price
  - Credits user account immediately

#### Mode 2: NowPayments with API Verification
- **Trigger:** Payment has `payment_id` and NowPayments API key is configured
- **Process:**
  - Checks payment status with NowPayments API
  - Updates payment record with API data
  - Credits user if payment is confirmed

#### Mode 3: NowPayments Manual Approval (NEW)
- **Trigger:** Payment has `payment_id` and admin provides `approved_usdt_amount`
- **Process:**
  - Admin can approve without checking NowPayments API
  - Admin enters approved USDT amount
  - System calculates MXI based on phase price
  - Credits user account immediately
  - **This solves the requirement to approve without NowPayments**

### 2. Updated Admin Panel

The admin panel now:
- **Always requires admin to enter approved USDT amount** for both payment types
- Shows clear warning messages explaining the payment type
- Pre-fills the amount field with the original payment amount
- Allows admin to adjust the amount if needed
- Works for both NowPayments and direct USDT payments

### 3. Key Features

#### Unified Approval Process
- Admin enters approved USDT amount for ALL payment types
- System automatically calculates MXI based on current phase price
- No dependency on external APIs for approval

#### Payment Type Detection
```typescript
const isNowPaymentsPayment = !!payment.payment_id;
const isDirectUSDTPayment = !!payment.tx_hash && !payment.payment_id;
```

#### Flexible Verification
- **With NowPayments API:** Can verify automatically
- **Without NowPayments API:** Admin can approve manually
- **Direct USDT:** Always requires admin manual approval

#### Safety Features
- Prevents double-crediting (checks if already confirmed)
- Validates admin authorization
- Validates approved amount is positive
- Comprehensive error logging
- Transaction history tracking

## Usage Guide

### For Administrators

#### Approving a NowPayments Payment (Manual)
1. Go to **Admin Panel → Verificaciones Manuales**
2. Find the pending NowPayments payment
3. Click **"Aprobar"**
4. Review the pre-filled USDT amount
5. Adjust if necessary (e.g., if user paid different amount)
6. Click **"Aprobar"** to confirm
7. System will credit the user immediately

#### Approving a Direct USDT Payment
1. Go to **Admin Panel → Verificaciones Manuales**
2. Find the pending USDT payment
3. **Verify the transaction on blockchain** (use tx_hash)
4. Click **"Aprobar"**
5. Enter the **actual USDT amount** from blockchain
6. Click **"Aprobar"** to confirm
7. System will calculate MXI and credit the user

### For Users

#### Requesting Manual Verification (NowPayments)
1. Go to **Verificación Manual → NowPayments tab**
2. Find your pending payment
3. Click **"Solicitar Verificación Manual"**
4. Wait for admin approval (up to 2 hours)

#### Requesting Manual Verification (USDT)
1. Go to **Verificación Manual → USDT Directo tab**
2. Select the network (Ethereum, BNB Chain, or Polygon)
3. Enter your transaction hash (0x...)
4. Click **"Solicitar Verificación Manual"**
5. Wait for admin approval (up to 2 hours)

## Technical Details

### Edge Function Flow

```
1. Validate environment & user session
2. Find payment record by order_id
3. Check if already credited (prevent double-credit)
4. Determine payment type:
   - Has payment_id? → NowPayments
   - Has tx_hash only? → Direct USDT
5. Process based on type:
   - NowPayments + approved_amount → Manual approval
   - NowPayments + API key → API verification
   - Direct USDT + approved_amount → Manual approval
6. Calculate MXI = approved_usdt_amount / price_per_mxi
7. Update payment record
8. Credit user account
9. Update metrics
10. Mark as confirmed
```

### Database Updates

When a payment is approved:

```sql
-- Update payment record
UPDATE payments SET
  price_amount = approved_usdt_amount,
  mxi_amount = calculated_mxi_amount,
  status = 'confirmed',
  confirmed_at = NOW()
WHERE id = payment_id;

-- Update user balance
UPDATE users SET
  mxi_balance = mxi_balance + calculated_mxi_amount,
  usdt_contributed = usdt_contributed + approved_usdt_amount,
  mxi_purchased_directly = mxi_purchased_directly + calculated_mxi_amount,
  is_active_contributor = true
WHERE id = user_id;

-- Update metrics
UPDATE metrics SET
  total_usdt_contributed = total_usdt_contributed + approved_usdt_amount,
  total_mxi_distributed = total_mxi_distributed + calculated_mxi_amount,
  total_tokens_sold = total_tokens_sold + calculated_mxi_amount
WHERE id = metrics_id;
```

### API Request Format

```typescript
POST /functions/v1/manual-verify-payment
Headers:
  Authorization: Bearer <user_access_token>
  Content-Type: application/json

Body:
{
  "order_id": "MXI-MANUAL-1234567890",
  "approved_usdt_amount": 50.00  // Required for approval
}
```

### Response Format

```typescript
// Success - Payment Credited
{
  "success": true,
  "message": "Payment verified and credited successfully",
  "credited": true,
  "payment": {
    "order_id": "MXI-MANUAL-1234567890",
    "status": "confirmed",
    "usdt_amount": 50.00,
    "mxi_amount": 125.00,
    "new_balance": 125.00
  },
  "requestId": "abc12345"
}

// Success - Already Credited
{
  "success": true,
  "message": "Payment already credited",
  "already_credited": true,
  "payment": {
    "order_id": "MXI-MANUAL-1234567890",
    "status": "confirmed",
    "mxi_amount": 125.00,
    "confirmed_at": "2025-01-26T12:00:00Z"
  },
  "requestId": "abc12345"
}

// Error - Missing Amount
{
  "success": false,
  "error": "For direct USDT payments, admin must provide approved_usdt_amount",
  "code": "MISSING_APPROVED_AMOUNT",
  "requestId": "abc12345"
}
```

## Benefits

### For Administrators
- ✅ **No dependency on NowPayments API** for manual approvals
- ✅ **Unified approval process** for all payment types
- ✅ **Flexibility to adjust amounts** if needed
- ✅ **Clear payment type indicators** (NowPayments vs USDT)
- ✅ **Comprehensive logging** for debugging

### For Users
- ✅ **Faster payment processing** (no waiting for API)
- ✅ **Manual verification option** for stuck payments
- ✅ **Real-time status updates** via Supabase Realtime
- ✅ **Clear communication** with admin via info requests

### For System
- ✅ **Prevents double-crediting** with status checks
- ✅ **Accurate MXI calculation** based on phase price
- ✅ **Proper metrics tracking** for all payments
- ✅ **Comprehensive error handling** and logging
- ✅ **Secure authorization** (admin-only for approvals)

## Error Handling

The system handles various error scenarios:

- **Missing payment_id or tx_hash:** Returns "Unknown payment type"
- **Already credited:** Returns success with already_credited flag
- **Missing approved amount:** Returns error asking for amount
- **Unauthorized user:** Returns 403 Forbidden
- **Payment not found:** Returns 404 Not Found
- **Invalid session:** Returns 401 Unauthorized

## Monitoring & Debugging

### Check Edge Function Logs
```bash
# View logs for manual-verify-payment function
supabase functions logs manual-verify-payment --project-ref aeyfnjuatbtcauiumbhn
```

### Check Payment Status
```sql
-- Check payment record
SELECT 
  order_id,
  payment_id,
  tx_hash,
  status,
  price_amount,
  mxi_amount,
  confirmed_at
FROM payments
WHERE order_id = 'MXI-MANUAL-1234567890';

-- Check verification request
SELECT 
  status,
  admin_notes,
  reviewed_at,
  reviewed_by
FROM manual_verification_requests
WHERE order_id = 'MXI-MANUAL-1234567890';
```

## Files Modified

1. **`supabase/functions/manual-verify-payment/index.ts`**
   - Added support for NowPayments manual approval
   - Enhanced payment type detection
   - Improved error messages
   - Added comprehensive logging

2. **`app/(tabs)/(admin)/manual-verification-requests.tsx`**
   - Updated approval modal to always require amount input
   - Added clear warning messages for both payment types
   - Improved user experience with pre-filled amounts
   - Enhanced error handling

## Testing Checklist

- [x] Direct USDT payment approval works
- [x] NowPayments manual approval works (without API)
- [x] NowPayments API verification still works (when API key present)
- [x] Double-crediting prevention works
- [x] Amount validation works
- [x] MXI calculation is correct
- [x] User balance updates correctly
- [x] Metrics update correctly
- [x] Error messages are clear
- [x] Admin authorization works

## Conclusion

The manual verification system now provides a **complete solution** for approving both NowPayments and direct USDT payments without requiring external API verification. Administrators have full control over the approval process and can manually verify and approve any payment type with confidence.

The system is:
- **Flexible:** Works with or without NowPayments API
- **Secure:** Proper authorization and validation
- **Reliable:** Prevents double-crediting and errors
- **User-friendly:** Clear UI and error messages
- **Well-documented:** Comprehensive logging for debugging

---

**Date:** January 26, 2025
**Version:** 5 (Edge Function)
**Status:** ✅ Deployed and Active
