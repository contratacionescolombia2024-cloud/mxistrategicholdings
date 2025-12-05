
# Embajadores MXI - Implementation Summary

## Overview
The "Embajadores MXI" (MXI Ambassadors) program has been successfully implemented. This is a bonus system that rewards users based on the total valid purchases made by their Level 1 (direct) referrals.

## Key Features

### 1. Ambassador Levels
The system includes 6 levels with cumulative bonuses:

- **🥉 Nivel 1 - Bronce**: 300 USDT → +10 USDT bonus
- **🥈 Nivel 2 - Plata**: 1,000 USDT → +30 USDT bonus
- **🥇 Nivel 3 - Oro**: 2,500 USDT → +100 USDT bonus
- **💎 Nivel 4 - Diamante**: 10,000 USDT → +600 USDT bonus
- **🟪 Nivel 5 - Élite Global**: 25,000 USDT → +2,000 USDT bonus
- **🟦 Nivel 6 - Embajador Legendario MXI**: 50,000 USDT → +5,000 USDT bonus

**Important**: All bonuses are cumulative. For example, reaching Level 3 allows withdrawal of 10 + 30 + 100 = 140 USDT (if requirements are met).

### 2. Valid Purchase Definition
A purchase counts as valid if it meets ALL these criteria:
- Made by a direct referral (Level 1 only)
- Paid in USDT (any network)
- Minimum amount: 50 USDT per purchase
- Status: 'finished' in the payments table

### 3. Withdrawal Requirements
To withdraw ambassador bonuses, users must meet ALL these conditions:
1. ✅ **Level achieved**: Total valid purchases >= level requirement
2. ✅ **KYC approved**: User must have kyc_status = 'approved'
3. ✅ **Personal purchase**: User must have at least 1 personal purchase (mxi_purchased_directly > 0)
4. ✅ **Withdrawal method**: USDT TRC20 only

### 4. Database Structure

#### New Tables Created:

**ambassador_levels**
- Tracks user progress in the ambassador program
- Stores total valid purchases from Level 1 referrals
- Tracks current level and which bonuses have been withdrawn
- One record per user (unique constraint on user_id)

**ambassador_bonus_withdrawals**
- Tracks all bonus withdrawal requests
- Includes user info, level achieved, bonus amount, USDT address
- Status: pending, processing, completed, rejected
- Reviewed by admin with notes

#### New Functions Created:

**calculate_valid_purchases_level1(p_user_id UUID)**
- Calculates total valid purchases from Level 1 referrals
- Filters by: level = 1, status = 'finished', price_amount >= 50, price_currency = 'usd'

**get_ambassador_level(p_total_purchases NUMERIC)**
- Determines ambassador level based on total purchases
- Returns integer 0-6

**calculate_withdrawable_bonus(p_level INTEGER, p_withdrawn_levels JSONB)**
- Calculates total withdrawable bonus based on level and withdrawal history
- Returns cumulative bonus amount

**update_ambassador_level(p_user_id UUID)**
- Updates or creates ambassador_levels record
- Returns current ambassador data as JSONB

**request_ambassador_bonus_withdrawal(p_user_id UUID, p_usdt_address TEXT)**
- Validates all withdrawal requirements
- Creates withdrawal request if eligible
- Returns success/error response

## User Interface

### 1. Embajadores MXI Screen (`app/(tabs)/(home)/embajadores-mxi.tsx`)
Accessible from:
- Home page (button below Yield Display)
- Referrals page (button at top)
- Main Referrals tab (button at top)

Features:
- **Current Level Card**: Shows user's current ambassador level with emoji and name
- **Valid Purchases Card**: Displays total accumulated valid purchases from Level 1 referrals
- **Progress Bar**: Visual progress toward next level
- **Withdrawable Bonus Card**: Shows total available bonus in USDT
- **Withdrawal Form**: Input for USDT TRC20 address with validation
- **All Levels List**: Shows all 6 levels with requirements and bonuses
- **Requirements Card**: Checklist showing which requirements are met

### 2. Admin Panel (`app/(tabs)/(admin)/ambassador-withdrawals.tsx`)
Features:
- View all ambassador bonus withdrawal requests
- Filter by status (pending, processing, completed, rejected)
- Approve or reject withdrawals
- Add admin notes
- Automatically marks bonuses as withdrawn when approved

### 3. Buttons Added
- **Home Screen**: "Embajadores MXI" button with trophy emoji
- **Referrals Screen (Home)**: Same button at top of page
- **Referrals Tab**: Same button at top of page
- **Admin Dashboard**: "Bonos Embajadores" button in quick actions

## Technical Implementation

### Calculation Logic
```typescript
// Valid purchases = SUM of all Level 1 referral purchases where:
// - status = 'finished'
// - price_amount >= 50
// - price_currency = 'usd'

// Level determination:
if (total >= 50000) return 6;
else if (total >= 25000) return 5;
else if (total >= 10000) return 4;
else if (total >= 2500) return 3;
else if (total >= 1000) return 2;
else if (total >= 300) return 1;
else return 0;

// Withdrawable bonus = cumulative sum of all achieved levels not yet withdrawn
```

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only view/update their own ambassador data
- Admin-only functions for withdrawal approval
- Validation of TRC20 address format (starts with 'T', 34 characters)

### Data Flow
1. User's Level 1 referrals make purchases
2. System calculates valid purchases (>= 50 USDT, finished status)
3. Ambassador level is determined based on total
4. User can request withdrawal if all requirements are met
5. Admin reviews and approves/rejects withdrawal
6. On approval, bonuses are marked as withdrawn in database

## Testing Checklist

### User Flow
- [ ] Navigate to Embajadores MXI from Home
- [ ] Navigate to Embajadores MXI from Referrals
- [ ] View current level and valid purchases
- [ ] See progress bar to next level
- [ ] View all 6 levels with requirements
- [ ] Check withdrawal requirements
- [ ] Request bonus withdrawal (if eligible)
- [ ] Validate TRC20 address format

### Admin Flow
- [ ] Access ambassador withdrawals from admin panel
- [ ] View all withdrawal requests
- [ ] Review pending requests
- [ ] Approve withdrawal with notes
- [ ] Reject withdrawal with reason
- [ ] Verify bonuses marked as withdrawn

### Database
- [ ] Valid purchases calculated correctly
- [ ] Level determination accurate
- [ ] Bonus calculation cumulative
- [ ] Withdrawal requirements enforced
- [ ] RLS policies working

## Notes

### Important Differences from Regular Commissions
- **Regular commissions**: 5% of referral purchases, paid in MXI, requires 5 active referrals
- **Ambassador bonuses**: Fixed USDT amounts based on total Level 1 purchases, requires KYC + personal purchase

### Bonus Accumulation Example
If a user reaches Level 3:
- Level 1: 10 USDT
- Level 2: 30 USDT
- Level 3: 100 USDT
- **Total withdrawable**: 140 USDT (if all requirements met)

### Valid Purchase Example
User A refers User B (Level 1 referral):
- User B purchases 100 USDT worth of MXI → ✅ Counts (>= 50 USDT)
- User B purchases 30 USDT worth of MXI → ❌ Does not count (< 50 USDT)
- User A's total valid purchases: 100 USDT

## Future Enhancements
- Email notifications when level is achieved
- Push notifications for bonus availability
- Detailed analytics of referral purchases
- Leaderboard of top ambassadors
- Special badges/recognition for high-level ambassadors
