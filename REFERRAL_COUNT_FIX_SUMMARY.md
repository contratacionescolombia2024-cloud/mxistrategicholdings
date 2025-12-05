
# Fix: Referidos Activos (Nivel 1) Count Display Issue

## Problem
The "Referidos Activos (Nivel 1)" count on the referral and embajadores MXI pages was displaying `0` even when users had active referrals who had made valid purchases.

## Root Cause
The database functions responsible for counting active referrals were checking for payment status `'finished'`, but the actual payments in the database had status `'confirmed'`. This mismatch caused the count to always return 0.

## Solution Implemented

### 1. Database Functions Updated
Updated three critical database functions to accept both `'finished'` and `'confirmed'` payment statuses:

#### `calculate_valid_purchases_level1()`
- **Purpose**: Calculates total valid purchases from level 1 referrals
- **Change**: Now accepts `status IN ('finished', 'confirmed')` instead of just `'finished'`
- **Criteria**: 
  - Direct referrals (level 1)
  - Payment amount >= 50 USDT
  - Payment currency = 'usd'
  - Status = 'finished' OR 'confirmed'

#### `update_active_referrals_count()`
- **Purpose**: Trigger function that updates active referrals count when users are added/updated
- **Change**: Now counts referrals with `status IN ('finished', 'confirmed')`
- **Trigger**: Fires on INSERT, UPDATE, or DELETE on the `users` table

#### `recalculate_all_active_referrals()`
- **Purpose**: Recalculates active referrals count for all users
- **Change**: Now counts referrals with `status IN ('finished', 'confirmed')`
- **Usage**: Can be called manually to fix existing data

### 2. New Payment Trigger Added
Created a new trigger `update_active_referrals_on_payment` that:
- Fires when a payment is inserted or updated
- Only triggers when payment status is 'finished' or 'confirmed'
- Only triggers when payment amount >= 50 USDT
- Only triggers when payment currency = 'usd'
- Automatically updates the referrer's `active_referrals` count
- Broadcasts real-time updates via `pg_notify`

### 3. UI Improvements

#### Embajadores MXI Page (`app/(tabs)/(home)/embajadores-mxi.tsx`)
- Added manual refresh button in the header
- Refresh button shows loading indicator while refreshing
- Automatically refreshes user data after loading ambassador data
- Shows success message after manual refresh

#### Referrals Page (`app/(tabs)/(home)/referrals.tsx`)
- Added manual refresh button in the header
- Allows users to manually refresh their referral data

#### AuthContext (`contexts/AuthContext.tsx`)
- Exposed `refreshUser()` function to allow manual data refresh
- Function reloads all user data including active referrals count

## How Active Referrals Are Counted

A referral is considered "active" when ALL of the following conditions are met:

1. **Direct Referral**: The referred user must be a level 1 (direct) referral
2. **Valid Payment**: The referred user must have at least one payment with:
   - Status: `'finished'` OR `'confirmed'`
   - Amount: >= 50 USDT
   - Currency: `'usd'`

## Real-Time Updates

The system now supports real-time updates for active referrals:

1. When a payment is confirmed/finished, the trigger automatically updates the referrer's count
2. The update is broadcast via PostgreSQL's `pg_notify` mechanism
3. The RealtimeContext picks up these updates and refreshes the UI
4. Users can also manually refresh using the refresh button

## Testing the Fix

To verify the fix is working:

1. **Check Current Count**:
   ```sql
   SELECT id, email, active_referrals 
   FROM users 
   WHERE active_referrals > 0;
   ```

2. **Verify Calculation**:
   ```sql
   SELECT u.id, u.email, u.active_referrals,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM payments p 
              WHERE p.user_id = r.referred_id 
              AND p.status IN ('finished', 'confirmed')
              AND p.price_amount >= 50 
              AND p.price_currency = 'usd'
            ) THEN r.referred_id 
          END) as calculated_active
   FROM users u
   LEFT JOIN referrals r ON r.referrer_id = u.id AND r.level = 1
   GROUP BY u.id, u.email, u.active_referrals;
   ```

3. **Manual Recalculation**:
   ```sql
   SELECT recalculate_all_active_referrals();
   ```

## User Instructions

### For Users Seeing 0 Active Referrals

If you see 0 active referrals but believe you should have more:

1. **Tap the Refresh Button**: Use the circular arrow icon in the top-right corner of the Embajadores MXI or Referrals page
2. **Check Requirements**: Ensure your referrals have:
   - Made a payment of at least 50 USDT
   - Payment status is "confirmed" or "finished"
   - Payment was made in USDT (any network)
3. **Wait for Real-Time Updates**: The count should update automatically when payments are confirmed

### For Administrators

To manually fix all active referral counts:

```sql
SELECT recalculate_all_active_referrals();
```

This will recalculate the count for all users based on current payment data.

## Migration Applied

Migration: `fix_active_referrals_count_confirmed_status_v2`

This migration:
- Updates all three database functions
- Creates the new payment trigger
- Runs `recalculate_all_active_referrals()` to fix existing data
- Is idempotent and safe to run multiple times

## Files Modified

1. `contexts/AuthContext.tsx` - Added `refreshUser()` function
2. `app/(tabs)/(home)/embajadores-mxi.tsx` - Added refresh button and manual refresh functionality
3. `app/(tabs)/(home)/referrals.tsx` - Added refresh button
4. Database migration - Updated functions and added trigger

## Notes

- The fix is backward compatible with existing data
- All existing payments with 'confirmed' status will now be counted
- Future payments will automatically update the count via the trigger
- Real-time updates ensure the UI stays in sync with the database
- Users can manually refresh if needed using the refresh button
