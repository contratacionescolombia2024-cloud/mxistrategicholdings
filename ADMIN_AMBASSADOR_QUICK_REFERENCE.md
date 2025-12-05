
# Admin Quick Reference - Ambassador Bonus System

## 🎯 Quick Actions

### Add Balance with Commission (Counts for Ambassador Bonuses)

When you add balance with commission, it automatically:
- ✅ Creates a payment record that counts towards ambassador bonuses
- ✅ Distributes commissions to referrers (5%, 2%, 1%)
- ✅ Updates the referrer's ambassador level
- ✅ Updates global metrics

**How to do it**:
1. Go to **Admin Panel** → **User Management**
2. Select the user
3. Click **"Añadir Con Comisión"**
4. Enter the MXI amount
5. Confirm

**What happens behind the scenes**:
```
User receives: X MXI
Level 1 referrer receives: X * 5% MXI commission
Level 2 referrer receives: X * 2% MXI commission
Level 3 referrer receives: X * 1% MXI commission

Payment record created:
- order_id: ADMIN-{timestamp}-{user_id}
- price_amount: X * current_price USDT
- status: finished
- Counts towards ambassador bonuses if >= 50 USDT
```

### Add Balance without Commission (Does NOT count for Ambassador Bonuses)

Use this when you want to add balance without generating commissions or affecting ambassador calculations.

**How to do it**:
1. Go to **Admin Panel** → **User Management**
2. Select the user
3. Click **"Añadir Sin Comisión"**
4. Enter the MXI amount
5. Confirm

**What happens**:
- User receives the MXI
- No commissions generated
- No payment record created
- Does NOT count towards ambassador bonuses

## 📊 Check Ambassador Status

### View User's Ambassador Details

```sql
-- Get ambassador level and purchases
SELECT 
  u.name,
  u.email,
  al.total_valid_purchases,
  al.current_level,
  al.total_bonus_withdrawn
FROM users u
LEFT JOIN ambassador_levels al ON al.user_id = u.id
WHERE u.email = 'user@example.com';
```

### View All Payments That Count for Ambassador Bonuses

```sql
-- See detailed breakdown of what counts
SELECT * FROM get_ambassador_calculation_details('user-id-here');
```

This shows:
- ✅ Automatic payments (finished/confirmed)
- ✅ Manually approved payments
- ✅ Admin-added payments with commission
- ❌ Payments that don't count (< 50 USDT, wrong currency, etc.)

## 🔄 Manual Recalculation

If you need to manually recalculate a user's ambassador level:

```sql
SELECT * FROM admin_recalculate_ambassador_level('user-id-here');
```

**When to use this**:
- After fixing data inconsistencies
- After bulk updates
- When troubleshooting ambassador bonus issues

## 🔍 Debugging

### Check if Admin Payment Was Created

```sql
SELECT 
  p.id,
  p.order_id,
  p.user_id,
  u.name,
  p.price_amount,
  p.price_currency,
  p.status,
  p.created_at
FROM payments p
JOIN users u ON u.id = p.user_id
WHERE p.order_id LIKE 'ADMIN-%'
ORDER BY p.created_at DESC
LIMIT 10;
```

### Check if Payment Counts for Ambassador Bonus

```sql
-- Replace 'referrer-user-id' with the actual referrer's user ID
SELECT 
  payment_id,
  order_id,
  user_name,
  price_amount,
  is_admin_payment,
  has_manual_approval,
  counts_for_ambassador,
  created_at
FROM get_ambassador_calculation_details('referrer-user-id')
ORDER BY created_at DESC;
```

### View Ambassador Withdrawal Requests

```sql
SELECT 
  abw.id,
  u.name,
  u.email,
  abw.level_achieved,
  abw.bonus_amount,
  abw.usdt_address,
  abw.status,
  abw.created_at
FROM ambassador_bonus_withdrawals abw
JOIN users u ON u.id = abw.user_id
WHERE abw.status = 'pending'
ORDER BY abw.created_at DESC;
```

## 📋 Ambassador Levels Reference

| Level | Name | Requirement | Bonus | Emoji |
|-------|------|-------------|-------|-------|
| 1 | Bronce | 300 USDT | 10 USDT | 🥉 |
| 2 | Plata | 1,000 USDT | 30 USDT | 🥈 |
| 3 | Oro | 2,500 USDT | 100 USDT | 🥇 |
| 4 | Diamante | 10,000 USDT | 600 USDT | 💎 |
| 5 | Élite Global | 25,000 USDT | 2,000 USDT | 🟪 |
| 6 | Embajador Legendario MXI | 50,000 USDT | 5,000 USDT | 🟦 |

**Note**: Bonuses are cumulative. A Level 3 ambassador can withdraw 10 + 30 + 100 = 140 USDT total.

## ✅ What Counts for Ambassador Bonuses

### ✅ Included

1. **Automatic Payments**
   - Status: 'finished' or 'confirmed'
   - From NOWPayments or other payment providers
   - Automatically verified

2. **Manually Approved Payments**
   - User submits manual verification request
   - Admin reviews and approves
   - Status: 'approved' in manual_verification_requests table

3. **Admin-Added Payments with Commission**
   - Admin uses "Añadir Con Comisión" button
   - Creates payment record with order_id starting with 'ADMIN-'
   - Generates commissions for referrers

### ❌ Not Included

- Payments < 50 USDT
- Payments in currencies other than USD
- Payments from Level 2 or Level 3 referrals (only Level 1 counts)
- Admin-added balances WITHOUT commission
- Pending, failed, or cancelled payments

## 🚨 Common Issues & Solutions

### Issue: User says their referral's payment isn't counting

**Check**:
1. Is the payment >= 50 USDT? ✅
2. Is it from a Level 1 (direct) referral? ✅
3. Is the payment status 'finished' or 'confirmed'? ✅
4. Or is it manually approved? ✅
5. Or is it an admin payment with commission? ✅

**Debug**:
```sql
SELECT * FROM get_ambassador_calculation_details('user-id');
```

**Fix**:
```sql
SELECT * FROM admin_recalculate_ambassador_level('user-id');
```

### Issue: Admin added balance but ambassador level didn't update

**Cause**: You used "Añadir Sin Comisión" instead of "Añadir Con Comisión"

**Solution**: 
- Use "Añadir Con Comisión" for payments that should count towards ambassador bonuses
- Or manually recalculate if needed

### Issue: Payment record exists but doesn't count

**Check the payment details**:
```sql
SELECT 
  p.*,
  (p.price_amount >= 50) as amount_ok,
  (LOWER(p.price_currency) = 'usd') as currency_ok,
  (p.status IN ('finished', 'confirmed') OR p.order_id LIKE 'ADMIN-%') as status_ok
FROM payments p
WHERE p.id = 'payment-id-here';
```

## 📞 Support

If you encounter issues not covered here:

1. Check the detailed documentation: [AMBASSADOR_BONUS_ADMIN_PAYMENTS_FIX.md](./AMBASSADOR_BONUS_ADMIN_PAYMENTS_FIX.md)
2. Use the debug functions provided above
3. Check database logs for errors
4. Verify triggers are enabled and functioning

---

**Last Updated**: December 4, 2024  
**Version**: 1.0
