
# MXI Withdrawal Requirements Update

## Overview
This update implements two key features for the Maxcoin (MXI) liquidity pool application:

1. **MXI Withdrawal Condition**: Mined MXI can only be withdrawn if the user has 10 active referrals AND the pool launch date has passed.
2. **Pool Date Auto-Extension**: After the pool's maximum date is reached, the date automatically extends by 30 days.

## Changes Implemented

### 1. Database Functions (Migration)

#### `check_and_extend_pool_date()`
- Automatically checks if the current time has passed the pool close date
- If passed, extends both `pool_close_date` and `mxi_launch_date` by 30 days
- Called automatically when getting pool status

#### `check_mxi_withdrawal_eligibility(p_user_id UUID)`
- Checks if a user can withdraw MXI tokens
- Requirements:
  - User must have 10 or more active referrals
  - MXI launch date must have passed
- Returns: BOOLEAN

#### `get_pool_status()`
- Returns comprehensive pool status information:
  - `pool_close_date`: Current pool closing date
  - `mxi_launch_date`: Current MXI launch date
  - `is_pool_closed`: Whether pool has closed
  - `is_mxi_launched`: Whether MXI is available for withdrawal
  - `days_until_close`: Days remaining until pool closes
  - `days_until_launch`: Days remaining until MXI launch
- Automatically extends dates if needed before returning status

### 2. AuthContext Updates

#### New Interface: `PoolStatus`
```typescript
interface PoolStatus {
  pool_close_date: string;
  mxi_launch_date: string;
  is_pool_closed: boolean;
  is_mxi_launched: boolean;
  days_until_close: number;
  days_until_launch: number;
}
```

#### New Functions
- `getPoolStatus()`: Fetches current pool status with auto-extension
- `checkMXIWithdrawalEligibility()`: Checks if user can withdraw MXI

#### Updated `withdrawMXI()` Function
- Now checks MXI withdrawal eligibility before allowing withdrawal
- Provides detailed error messages:
  - If user has less than 10 active referrals
  - If launch date hasn't passed yet
  - Shows days remaining and current referral count

### 3. UI Updates

#### Home Screen (`app/(tabs)/(home)/index.tsx`)
- Dynamic pool close date display (loads from database)
- Countdown timer updates based on actual pool close date
- Shows "Pool extends by 30 days after closing" message
- Auto-reloads pool status when date is reached
- New "Withdraw MXI" button with referral progress badge (shows X/10)

#### New Screen: MXI Withdrawal (`app/(tabs)/(home)/withdraw-mxi.tsx`)
- Dedicated screen for MXI withdrawals
- Shows current MXI balance
- Displays eligibility status with visual indicators:
  - Active referrals progress bar (X/10)
  - Pool launch date status
- Withdrawal form (only shown when eligible)
- Detailed requirements list
- Promotion card to invite friends if not eligible

#### Referrals Screen (`app/(tabs)/(home)/referrals.tsx`)
- Updated info section to mention MXI withdrawal requirements
- Shows: "MXI withdrawals: 10+ active referrals + pool launch date"

#### Profile Screen (`app/(tabs)/profile.tsx`)
- New eligibility banner showing MXI withdrawal status
- Green banner if 10+ referrals (unlocked)
- Yellow banner if less than 10 referrals (shows how many more needed)
- Updated footer with new information

### 4. Navigation Updates
- Added `withdraw-mxi` route to home layout
- Accessible from home screen via "Withdraw MXI" button

## User Experience Flow

### For Users with Less Than 10 Referrals:
1. See "Withdraw MXI" button on home screen with badge showing progress (e.g., "3/10")
2. Click button to see detailed requirements
3. View progress bars and status indicators
4. Get prompted to invite more friends
5. Can navigate to referrals screen to share code

### For Users with 10+ Referrals (Before Launch Date):
1. See "Withdraw MXI" button showing "10/10"
2. Click to see eligibility screen
3. See green checkmark for referrals requirement
4. See countdown for launch date
5. Cannot withdraw yet, but knows exactly when they can

### For Users with 10+ Referrals (After Launch Date):
1. See "Withdraw MXI" button showing "10/10"
2. Click to access withdrawal form
3. Enter amount and wallet address
4. Submit withdrawal request
5. Receive confirmation

## Automatic Pool Extension

When the pool close date is reached:
1. System automatically extends dates by 30 days
2. Countdown timer updates to show new date
3. Users see "Pool Closed - Extending..." briefly
4. New date loads and countdown continues
5. No manual intervention required

## Key Benefits

1. **Clear Requirements**: Users know exactly what they need to do
2. **Visual Progress**: Progress bars and badges show advancement
3. **Automatic Extension**: No manual date updates needed
4. **Detailed Feedback**: Error messages explain why withdrawal isn't available
5. **Motivation**: Referral progress encourages user engagement

## Technical Notes

- All date checks use UTC timezone
- Pool status is cached in component state but refreshed on pull-to-refresh
- Database functions handle all date logic centrally
- RLS policies ensure users can only withdraw their own MXI
- Withdrawal requests are created with 'pending' status for admin processing

## Testing Checklist

- [ ] Verify pool date extends automatically after close date
- [ ] Test MXI withdrawal with less than 10 referrals (should fail)
- [ ] Test MXI withdrawal with 10+ referrals before launch (should fail)
- [ ] Test MXI withdrawal with 10+ referrals after launch (should succeed)
- [ ] Verify countdown timer updates correctly
- [ ] Check progress badges display correct referral count
- [ ] Test pull-to-refresh updates pool status
- [ ] Verify error messages are clear and helpful
