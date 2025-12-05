
# Vesting Calculation Fix - 3% Monthly Yield

## Overview
Fixed the vesting calculation system to ensure accurate 3% monthly yield on purchased MXI tokens, with real-time updates every second and automatic recalculation on balance changes.

## Key Changes

### 1. **Accurate 3% Monthly Calculation**
- **Formula**: `Monthly Yield = Purchased MXI Balance × 0.03`
- **Per Second Rate**: `Monthly Yield ÷ 2,592,000 seconds (30 days)`
- **Base Balance**: Only `mxi_purchased_directly` + `mxi_from_unified_commissions` generate vesting
- **Maximum Cap**: Yield cannot exceed 3% of the purchased MXI balance per month

### 2. **Real-Time Updates**
- Counter updates **every second** for smooth, live display
- Database persistence every **10 seconds** to avoid excessive writes
- Accurate time tracking using `last_yield_update` timestamp
- Session yield calculated as: `yield_per_second × seconds_elapsed`

### 3. **Automatic Recalculation on Balance Changes**
- **Database Trigger**: `trigger_reset_vesting_on_balance_change`
- Monitors changes to `mxi_purchased_directly` and `mxi_from_unified_commissions`
- When balance changes:
  1. Calculates accumulated yield based on OLD balance
  2. Transfers accumulated yield to `mxi_vesting_locked`
  3. Resets `accumulated_yield` to 0
  4. Updates `last_yield_update` to current time
  5. Starts fresh calculation with NEW balance

### 4. **Enhanced Display Components**

#### VestingCounter Component (`components/VestingCounter.tsx`)
- **Real-time counter** showing accumulated yield with 8 decimal precision
- **Live indicator** with animated dot showing per-second updates
- **Balance display** showing MXI in vesting (purchased + unified commissions)
- **Progress bar** showing percentage towards 3% monthly cap
- **Rate breakdown**:
  - Per second rate
  - Per minute rate
  - Per hour rate
  - Per day rate
- **Monthly maximum display** showing the 3% cap
- **Session vs. Accumulated** breakdown
- **Warning indicator** when approaching 95% of monthly cap

## Technical Implementation

### Database Schema
```sql
-- Users table fields used for vesting:
- mxi_purchased_directly: MXI bought with USDT
- mxi_from_unified_commissions: MXI from unified commissions
- accumulated_yield: Current accumulated yield in this cycle
- last_yield_update: Timestamp of last yield calculation
- mxi_vesting_locked: Total vesting yield (locked until launch)
```

### Calculation Logic
```typescript
const MONTHLY_YIELD_PERCENTAGE = 0.03; // 3%
const SECONDS_IN_MONTH = 2592000; // 30 days

// Base for vesting calculation
const mxiInVesting = mxiPurchasedDirectly + mxiFromUnifiedCommissions;

// Maximum monthly yield
const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;

// Yield per second
const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;

// Calculate elapsed time
const secondsElapsed = (now - lastYieldUpdate) / 1000;

// Calculate session yield
const sessionYield = yieldPerSecond * secondsElapsed;

// Total yield (capped at 3% monthly)
const totalYield = Math.min(
  accumulatedYield + sessionYield,
  maxMonthlyYield
);
```

### Trigger Function
```sql
CREATE OR REPLACE FUNCTION reset_vesting_on_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate accumulated yield based on OLD balance
  -- Transfer to mxi_vesting_locked
  -- Reset accumulated_yield to 0
  -- Update last_yield_update to NOW()
  -- Start fresh with NEW balance
END;
$$ LANGUAGE plpgsql;
```

## User Experience

### What Users See
1. **Real-time counter** updating every second
2. **Precise calculations** to 8 decimal places
3. **Clear progress** towards monthly 3% cap
4. **Rate breakdown** showing earnings at different time intervals
5. **Balance information** showing which MXI generates vesting
6. **Automatic updates** when purchasing more MXI

### Example Scenario
```
User has 1,000 MXI purchased:
- Maximum monthly yield: 30 MXI (3%)
- Yield per second: 0.00001157 MXI
- Yield per minute: 0.00069444 MXI
- Yield per hour: 0.04166667 MXI
- Yield per day: 1.00000000 MXI

After 15 days:
- Accumulated: 15 MXI
- Progress: 50% of monthly cap
- Remaining: 15 MXI until cap

User purchases 500 more MXI:
- Previous 15 MXI transferred to vesting locked
- New calculation starts with 1,500 MXI base
- New maximum monthly yield: 45 MXI (3%)
- Counter resets and begins accumulating again
```

## Benefits

### For Users
- ✅ **Transparent**: See exactly how much is being earned per second
- ✅ **Accurate**: Precise 3% monthly calculation
- ✅ **Real-time**: Live updates every second
- ✅ **Fair**: Automatic recalculation on purchases
- ✅ **Clear**: Easy to understand progress and limits

### For System
- ✅ **Efficient**: Database updates only every 10 seconds
- ✅ **Reliable**: Trigger ensures consistency
- ✅ **Scalable**: Calculations done client-side
- ✅ **Auditable**: All changes logged with timestamps
- ✅ **Maintainable**: Clean, well-documented code

## Testing Checklist

- [x] Vesting counter updates every second
- [x] Calculation is accurate (3% monthly)
- [x] Progress bar shows correct percentage
- [x] Rate breakdown displays correctly
- [x] Balance changes trigger recalculation
- [x] Accumulated yield transfers to vesting locked
- [x] Counter resets after balance change
- [x] Monthly cap is enforced
- [x] Database persistence works
- [x] No performance issues with real-time updates

## Future Enhancements

1. **Monthly Reset**: Implement automatic monthly reset of accumulated yield
2. **Historical Tracking**: Store vesting history for analytics
3. **Notifications**: Alert users when approaching monthly cap
4. **Withdrawal Integration**: Connect vesting locked balance to withdrawal system
5. **Admin Dashboard**: Show aggregate vesting statistics

## Notes

- Vesting yield is **locked until MXI launch date**
- Only **purchased MXI** generates vesting (not challenge winnings)
- Yield is calculated **continuously** (no gaps or pauses)
- System is **self-correcting** on balance changes
- All calculations use **high precision** (8 decimals)

---

**Implementation Date**: January 2025
**Status**: ✅ Complete and Tested
**Version**: 1.0
