
# Quick Reference: Vesting System (3% Monthly)

## Core Formula

```
Monthly Yield = Purchased MXI × 0.03
Yield Per Second = Monthly Yield ÷ 2,592,000
```

## Key Constants

- **Monthly Yield**: 3% of purchased MXI balance
- **Seconds in Month**: 2,592,000 (30 days × 24 hours × 60 minutes × 60 seconds)
- **Update Frequency**: Every 1 second (display), Every 10 seconds (database)

## Vesting Base Calculation

```typescript
// Only these balances generate vesting:
const vestingBase = 
  user.mxiPurchasedDirectly + 
  user.mxiFromUnifiedCommissions;

// These do NOT generate vesting:
// - mxi_from_challenges
// - mxi_vesting_locked
```

## Real-Time Calculation

```typescript
// 1. Calculate maximum monthly yield
const maxMonthlyYield = vestingBase * 0.03;

// 2. Calculate yield per second
const yieldPerSecond = maxMonthlyYield / 2592000;

// 3. Calculate elapsed time
const secondsElapsed = (Date.now() - lastYieldUpdate) / 1000;

// 4. Calculate session yield
const sessionYield = yieldPerSecond * secondsElapsed;

// 5. Calculate total yield (capped)
const totalYield = Math.min(
  accumulatedYield + sessionYield,
  maxMonthlyYield
);
```

## On Balance Change (Trigger)

```sql
-- When mxi_purchased_directly or mxi_from_unified_commissions changes:

1. Calculate accumulated yield based on OLD balance
2. Transfer accumulated yield to mxi_vesting_locked
3. Reset accumulated_yield to 0
4. Update last_yield_update to NOW()
5. Start fresh calculation with NEW balance
```

## Example Calculations

### Example 1: 1,000 MXI
```
Purchased MXI: 1,000
Maximum Monthly: 30 MXI (3%)
Per Second: 0.00001157 MXI
Per Minute: 0.00069444 MXI
Per Hour: 0.04166667 MXI
Per Day: 1.00000000 MXI
```

### Example 2: 5,000 MXI
```
Purchased MXI: 5,000
Maximum Monthly: 150 MXI (3%)
Per Second: 0.00005787 MXI
Per Minute: 0.00347222 MXI
Per Hour: 0.20833333 MXI
Per Day: 5.00000000 MXI
```

### Example 3: 10,000 MXI
```
Purchased MXI: 10,000
Maximum Monthly: 300 MXI (3%)
Per Second: 0.00011574 MXI
Per Minute: 0.00694444 MXI
Per Hour: 0.41666667 MXI
Per Day: 10.00000000 MXI
```

## Database Fields

```sql
-- Users table
mxi_purchased_directly      -- Base for vesting (purchased with USDT)
mxi_from_unified_commissions -- Base for vesting (from unified commissions)
accumulated_yield            -- Current cycle accumulated yield
last_yield_update            -- Timestamp of last calculation
mxi_vesting_locked           -- Total vesting yield (locked until launch)
```

## Component Structure

```
VestingCounter.tsx
├── Real-time counter (updates every second)
├── Balance display (vesting base)
├── Progress bar (towards 3% cap)
├── Rate breakdown (second/minute/hour/day)
├── Monthly maximum display
├── Session vs. Accumulated breakdown
└── Info box with explanation
```

## Key Features

✅ **Real-time**: Updates every second
✅ **Accurate**: Precise 3% monthly calculation
✅ **Automatic**: Recalculates on balance changes
✅ **Capped**: Cannot exceed 3% monthly
✅ **Persistent**: Saves to database every 10 seconds
✅ **Transparent**: Shows all rates and progress

## Important Notes

⚠️ **Only purchased MXI generates vesting**
⚠️ **Vesting is locked until MXI launch**
⚠️ **3% cap is per month, not cumulative**
⚠️ **Counter resets on balance changes**
⚠️ **All calculations use high precision (8 decimals)**

## Testing Commands

```sql
-- Check user vesting data
SELECT 
  name,
  mxi_purchased_directly,
  mxi_from_unified_commissions,
  accumulated_yield,
  last_yield_update,
  mxi_vesting_locked
FROM users
WHERE id = 'user_id';

-- Simulate balance change (triggers recalculation)
UPDATE users
SET mxi_purchased_directly = mxi_purchased_directly + 100
WHERE id = 'user_id';

-- Check vesting locked balance
SELECT 
  name,
  mxi_vesting_locked,
  (mxi_purchased_directly + mxi_from_unified_commissions) * 0.03 as max_monthly
FROM users
WHERE id = 'user_id';
```

## Troubleshooting

### Counter not updating?
- Check if user has purchased MXI balance
- Verify `last_yield_update` is recent
- Check browser console for errors

### Calculation seems wrong?
- Verify vesting base (purchased + unified commissions)
- Check if monthly cap (3%) has been reached
- Ensure `accumulated_yield` is not negative

### Balance change not triggering reset?
- Check if trigger is enabled
- Verify `mxi_purchased_directly` or `mxi_from_unified_commissions` changed
- Check database logs for trigger execution

---

**Last Updated**: January 2025
**Version**: 1.0
