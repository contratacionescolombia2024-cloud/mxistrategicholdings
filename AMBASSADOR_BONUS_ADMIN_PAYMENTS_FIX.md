
# Ambassador Bonus Calculations - Admin Payments & Manual Approvals Fix

## 📋 Summary

This document explains the fix implemented to ensure that admin-added balances with commission and manually approved validations are correctly counted towards ambassador bonus calculations in the Embajadores MXI program.

## 🎯 Problem Statement

The user reported that when an administrator adds balance with commission to a referral, or when manual validation requests are approved by the administrator, these amounts were not being counted towards the ambassador bonus calculations. This meant that referrers were not receiving credit for these valid purchases in the Embajadores MXI program.

## ✅ Solution Implemented

### 1. Database Function Updates

#### `calculate_valid_purchases_level1(p_user_id UUID)`
This function now correctly includes three types of valid purchases:

- **Automatic Payments**: Status is 'finished' or 'confirmed'
- **Manually Approved Payments**: Has an approved manual verification request
- **Admin-Added Payments**: Order ID starts with 'ADMIN-'

All payments must meet these criteria:
- From a direct referral (Level 1)
- Amount >= 50 USDT
- Currency is 'usd'

```sql
SELECT COALESCE(SUM(DISTINCT p.price_amount), 0)
INTO total_valid
FROM referrals r
INNER JOIN payments p ON p.user_id = r.referred_id
LEFT JOIN manual_verification_requests mvr ON mvr.payment_id = p.id
WHERE r.referrer_id = p_user_id
  AND r.level = 1
  AND p.price_amount >= 50
  AND LOWER(p.price_currency) = 'usd'
  AND (
    p.status IN ('finished', 'confirmed')
    OR mvr.status = 'approved'
    OR p.order_id LIKE 'ADMIN-%'
  );
```

#### `admin_add_balance_general_with_commission(p_user_id, p_admin_id, p_amount)`
Enhanced to:

1. **Create Payment Record**: Creates a payment record with order_id starting with 'ADMIN-' that counts towards ambassador calculations
2. **Calculate USDT Equivalent**: Uses current MXI price from metrics table to calculate the USDT value
3. **Update Metrics**: Updates global metrics with the USDT and MXI amounts
4. **Generate Commissions**: Distributes 5%, 2%, and 1% commissions to Level 1, 2, and 3 referrers
5. **Trigger Ambassador Update**: Automatically calls `update_ambassador_level()` for the Level 1 referrer

```sql
-- Calculate USDT equivalent
IF v_current_price > 0 THEN
  v_usdt_amount := p_amount * v_current_price;
ELSE
  v_usdt_amount := p_amount * 0.40; -- Default to phase 1 price
END IF;

-- Create payment record
INSERT INTO payments (
  user_id, order_id, price_amount, price_currency,
  mxi_amount, price_per_mxi, phase, status,
  payment_status, confirmed_at, created_at, updated_at
) VALUES (
  p_user_id, v_order_id, v_usdt_amount, 'usd',
  p_amount, COALESCE(v_current_price, 0.40),
  COALESCE(v_current_phase, 1), 'finished',
  'finished', NOW(), NOW(), NOW()
);

-- Update ambassador level for referrer
PERFORM update_ambassador_level(v_referred_by);
```

### 2. Database Triggers

#### `trigger_recalculate_ambassador_on_payment_change`
Fires on INSERT or UPDATE of payments table when:
- Status becomes 'finished' or 'confirmed'
- Order ID starts with 'ADMIN-'

Automatically recalculates the ambassador level for the referrer.

#### `trigger_recalculate_ambassador_on_manual_approval`
Fires when a manual verification request status changes to 'approved'.

Automatically recalculates the ambassador level for the referrer.

### 3. Helper Functions

#### `admin_recalculate_ambassador_level(p_user_id UUID)`
Allows administrators to manually trigger ambassador level recalculation for a specific user. Useful for:
- Fixing data inconsistencies
- Verifying calculations after manual adjustments
- Troubleshooting ambassador bonus issues

#### `get_ambassador_calculation_details(p_user_id UUID)`
Debug function that returns detailed information about all payments from Level 1 referrals, including:
- Payment ID and order ID
- User name
- Amount and currency
- Payment status
- Whether it's an admin payment
- Whether it has manual approval
- Whether it counts for ambassador bonuses
- Creation date

Example usage:
```sql
SELECT * FROM get_ambassador_calculation_details('user-uuid-here');
```

## 🔄 Data Migration

After implementing the fix, all existing admin payments were automatically recalculated:

```sql
-- Recalculate ambassador levels for all referrers with admin payments
DO $$
DECLARE
  referrer_record RECORD;
BEGIN
  FOR referrer_record IN
    SELECT DISTINCT u.referred_by as referrer_id
    FROM payments p
    INNER JOIN users u ON u.id = p.user_id
    WHERE p.order_id LIKE 'ADMIN-%'
      AND u.referred_by IS NOT NULL
  LOOP
    PERFORM update_ambassador_level(referrer_record.referrer_id);
  END LOOP;
END $$;
```

## 📊 Verification Results

After the fix, the following users had their ambassador levels updated:

| User | Email | Total Valid Purchases | Current Level |
|------|-------|----------------------|---------------|
| Camilo Andress Lopez | inversionesingo@gmail.com | 5,600 USDT | Level 3 (Oro) |
| Zuleiman Zapata | zuleimanzapata@gmail.com | 4,400 USDT | Level 3 (Oro) |

## 🎯 Ambassador Level Thresholds

| Level | Name | Requirement | Bonus |
|-------|------|-------------|-------|
| 1 | Bronce 🥉 | 300 USDT | 10 USDT |
| 2 | Plata 🥈 | 1,000 USDT | 30 USDT |
| 3 | Oro 🥇 | 2,500 USDT | 100 USDT |
| 4 | Diamante 💎 | 10,000 USDT | 600 USDT |
| 5 | Élite Global 🟪 | 25,000 USDT | 2,000 USDT |
| 6 | Embajador Legendario MXI 🟦 | 50,000 USDT | 5,000 USDT |

## 🔍 How to Verify

### For Administrators

1. **Check Payment Records**:
```sql
SELECT * FROM payments WHERE order_id LIKE 'ADMIN-%' ORDER BY created_at DESC;
```

2. **View Ambassador Calculation Details**:
```sql
SELECT * FROM get_ambassador_calculation_details('referrer-user-id');
```

3. **Manually Recalculate Ambassador Level**:
```sql
SELECT * FROM admin_recalculate_ambassador_level('user-id');
```

### For Users

1. Navigate to **Embajadores MXI** page
2. View **Compras Válidas Acumuladas** - this should include:
   - Automatic payments (finished/confirmed)
   - Manually approved payments
   - Admin-added payments with commission
3. Check **Tu Nivel Actual** - should reflect the correct level based on total valid purchases
4. View **Bono Retirable** - shows accumulated bonuses available for withdrawal

## 📝 Important Notes

### What Counts Towards Ambassador Bonuses

✅ **Included**:
- Automatic payments with status 'finished' or 'confirmed'
- Manual verification requests approved by administrator
- Admin-added balances with commission (order_id starts with 'ADMIN-')
- All payments must be >= 50 USDT in USD currency
- Only from Level 1 (direct) referrals

❌ **Not Included**:
- Payments < 50 USDT
- Payments in other currencies
- Payments from Level 2 or Level 3 referrals
- Admin-added balances WITHOUT commission
- Pending or failed payments

### Withdrawal Requirements

To withdraw ambassador bonuses, users must:
1. ✅ Have reached the ambassador level completely
2. ✅ Have KYC approved
3. ✅ Have at least 1 personal purchase
4. ✅ Use USDT TRC20 address for withdrawal

### Real-time Updates

The system uses Supabase Realtime to push updates when:
- Ambassador level changes
- Withdrawal status changes
- Admin makes changes to user balances

## 🚀 Testing Checklist

- [x] Admin adds balance with commission → Payment record created
- [x] Payment record has correct USDT amount
- [x] Payment record has order_id starting with 'ADMIN-'
- [x] Referrer's ambassador level is automatically updated
- [x] Commissions are distributed to Level 1, 2, 3 referrers
- [x] Manual verification approval triggers ambassador update
- [x] Ambassador calculation includes all three payment types
- [x] Existing admin payments are recalculated
- [x] UI displays correct ambassador level and bonuses
- [x] Withdrawal button is visible when bonuses are available

## 🔧 Troubleshooting

### Issue: Ambassador level not updating after admin adds balance

**Solution**: Manually recalculate the ambassador level:
```sql
SELECT * FROM admin_recalculate_ambassador_level('referrer-user-id');
```

### Issue: Payment not counting towards ambassador bonus

**Check**:
1. Is the payment >= 50 USDT?
2. Is the currency 'usd'?
3. Is the payment from a Level 1 referral?
4. Does the payment meet one of these criteria:
   - Status is 'finished' or 'confirmed'
   - Has approved manual verification
   - Order ID starts with 'ADMIN-'

**Debug**:
```sql
SELECT * FROM get_ambassador_calculation_details('referrer-user-id');
```

### Issue: Trigger not firing

**Check triggers are enabled**:
```sql
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%ambassador%' OR tgname LIKE '%payment%';
```

**Recreate triggers if needed**:
```sql
-- Run the migration again
-- See: fix_ambassador_bonus_calculations_admin_payments_v2
```

## 📚 Related Documentation

- [EMBAJADORES_MXI_IMPLEMENTATION.md](./EMBAJADORES_MXI_IMPLEMENTATION.md) - Original implementation
- [ADMIN_USER_MANAGEMENT_UPDATE.md](./ADMIN_USER_MANAGEMENT_UPDATE.md) - Admin balance management
- [MANUAL_VERIFICATION_IMPLEMENTATION.md](./MANUAL_VERIFICATION_IMPLEMENTATION.md) - Manual verification system

## 🎉 Conclusion

The fix ensures that all valid purchases, regardless of how they were added (automatic, manual approval, or admin addition with commission), are correctly counted towards ambassador bonus calculations. This provides a fair and transparent system for rewarding ambassadors who bring valuable referrals to the platform.

The system now:
- ✅ Counts admin-added balances with commission
- ✅ Counts manually approved validations
- ✅ Counts automatic payments
- ✅ Automatically updates ambassador levels in real-time
- ✅ Provides debugging tools for administrators
- ✅ Shows clear information to users about their progress

---

**Migration Applied**: `fix_ambassador_bonus_calculations_admin_payments_v2`  
**Date**: December 4, 2024  
**Status**: ✅ Complete and Verified
