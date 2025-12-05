
# MXI Yield Generation Feature

## Overview
The MXI yield generation feature allows active contributors to earn MXI tokens continuously based on their investment amount. The yield is calculated in real-time and displayed with per-second updates.

## Key Features

### 1. **Dynamic Yield Calculation**
- **Base Rate**: 0.00002 MXI per minute for the minimum investment (50 USDT)
- **Scaling**: Yield rate increases proportionally with investment amount
- **Formula**: `yield_rate = 0.00002 × (investment / 50)`

### 2. **Real-Time Display**
- Updates every second showing accumulated yield
- Displays current session yield and total accumulated yield
- Shows yield rates per minute, hour, and day

### 3. **Automatic Yield Tracking**
- Yield starts accumulating immediately after contribution
- Tracked in the database with timestamps
- Automatically updates when new contributions are made

## Database Schema

### New Columns in `users` Table:
- `yield_rate_per_minute`: Current yield rate based on investment
- `last_yield_update`: Timestamp of last yield calculation
- `accumulated_yield`: Total MXI earned through yield

### Database Functions:
1. **`calculate_yield_rate(investment_amount)`**: Calculates yield rate based on investment
2. **`update_user_yield_rate(user_id)`**: Updates user's yield rate after contribution
3. **`calculate_accumulated_yield(user_id)`**: Calculates yield earned since last update
4. **`claim_yield(user_id)`**: Claims accumulated yield and adds to MXI balance

### Triggers:
- **`update_yield_rate_on_contribution`**: Automatically updates yield rate when a contribution is completed

## User Interface

### Home Screen (`index.tsx`)
- **YieldDisplay Component**: Shows real-time yield generation
  - Current session yield (updates every second)
  - Total accumulated yield
  - Yield rates (per minute, hour, day)
  - Claim button to add yield to balance
  - Information about how yield works

### Contribute Screen (`contribute.tsx`)
- **Yield Rate Preview**: Shows expected yield rates before contributing
  - Displays per minute, hour, and day rates
  - Updates dynamically as user enters amount
  - Helps users understand the benefit of larger investments

## How It Works

### 1. **Making a Contribution**
```
User contributes → Contribution recorded → Yield rate calculated → Yield tracking starts
```

### 2. **Yield Accumulation**
```
Every second: Current yield = yield_rate_per_minute × (minutes_elapsed / 60)
```

### 3. **Claiming Yield**
```
User clicks "Claim Yield" → Accumulated yield calculated → Added to MXI balance → Timer resets
```

## Examples

### Example 1: Minimum Investment (50 USDT)
- **Investment**: 50 USDT
- **Yield Rate**: 0.00002 MXI/minute
- **Per Hour**: 0.0012 MXI
- **Per Day**: 0.0288 MXI
- **Per Month**: ~0.864 MXI

### Example 2: Medium Investment (1,000 USDT)
- **Investment**: 1,000 USDT
- **Yield Rate**: 0.0004 MXI/minute (20× base rate)
- **Per Hour**: 0.024 MXI
- **Per Day**: 0.576 MXI
- **Per Month**: ~17.28 MXI

### Example 3: Large Investment (10,000 USDT)
- **Investment**: 10,000 USDT
- **Yield Rate**: 0.004 MXI/minute (200× base rate)
- **Per Hour**: 0.24 MXI
- **Per Day**: 5.76 MXI
- **Per Month**: ~172.8 MXI

## Benefits

1. **Passive Income**: Users earn MXI continuously without any action
2. **Incentivizes Larger Investments**: Higher investments = higher yield rates
3. **Real-Time Feedback**: Users can see their earnings grow every second
4. **Transparent**: All calculations are visible and verifiable
5. **Flexible**: Users can claim yield whenever they want

## Technical Implementation

### Frontend (React Native)
- **YieldDisplay Component**: Real-time display with 1-second updates
- **useEffect Hook**: Updates yield display every second
- **Context API**: Manages yield state and calculations

### Backend (Supabase)
- **PostgreSQL Functions**: Handle yield calculations
- **Triggers**: Automatically update yield rates
- **RLS Policies**: Secure access to yield data

### Performance Optimization
- Client-side calculation for real-time display (no API calls every second)
- Database updates only when claiming yield
- Efficient timestamp-based calculations

## Security Considerations

1. **Server-Side Validation**: All yield calculations verified on server
2. **Timestamp Integrity**: Last update timestamp prevents manipulation
3. **RLS Policies**: Users can only access their own yield data
4. **Atomic Operations**: Claiming yield is a single database transaction

## Future Enhancements

1. **Yield Boost Events**: Temporary multipliers for special occasions
2. **Compound Yield**: Option to auto-reinvest yield
3. **Yield History**: Track historical yield earnings
4. **Leaderboards**: Show top yield earners
5. **Notifications**: Alert users when yield reaches certain thresholds
