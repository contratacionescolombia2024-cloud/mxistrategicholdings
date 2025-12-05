
# Multi-User Challenge System Implementation

## Overview
This document describes the implementation of the multi-user challenge system with ranking, tie-breaking, and history tracking for MXI AirBall and other challenges.

## Key Features Implemented

### 1. Challenge History Tracking
- **New Table**: `challenge_history`
  - Tracks all user wins, losses, ties, and forfeits
  - Records amount won/lost, score, rank, and total participants
  - Automatically expires after 10 days (configurable for disputes)
  - Includes challenge type and challenge ID for reference

### 2. Tie-Breaking System
- **Automatic Tiebreaker Creation**: When multiple users tie for first place, a tiebreaker round is automatically created
- **Time Limits**:
  - **10 minutes** for individual participants to complete the tiebreaker
  - **1 hour** total timeout - if no one plays, prize goes to administration
  - If some play and others don't, non-players get score of 0
- **No Entry Fee**: Tiebreaker rounds are free to enter
- **Notifications**: All tied players receive notifications about the tiebreaker

### 3. Rolling Leaderboard
- **Real-Time Updates**: Leaderboard updates as each user completes their challenge
- **Dynamic Ranking**: Best scores always appear first
- **Continuous Flow**: New competitions start automatically when previous ones complete
- **User Pacing**: Each user can complete the challenge at their own pace

### 4. Database Schema Changes

#### New Tables
```sql
challenge_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  challenge_type TEXT, -- 'airball', 'clicker', 'tap_duo', 'lottery'
  challenge_id UUID,
  result TEXT, -- 'win', 'loss', 'tie', 'forfeit'
  amount_won NUMERIC,
  amount_lost NUMERIC,
  score NUMERIC,
  rank INTEGER,
  total_participants INTEGER,
  created_at TIMESTAMP,
  expires_at TIMESTAMP -- NOW() + 10 days
)
```

#### Updated Tables
- **airball_competitions** & **clicker_competitions**:
  - `is_tiebreaker BOOLEAN` - Identifies tiebreaker rounds
  - `parent_competition_id UUID` - Links to original competition
  - `tiebreaker_deadline TIMESTAMP` - Deadline for tiebreaker completion
  - `tiebreaker_status TEXT` - 'waiting', 'in_progress', 'completed', 'expired'

- **airball_participants** & **clicker_participants**:
  - `is_tiebreaker_participant BOOLEAN` - Marks tiebreaker participants
  - `tiebreaker_joined_at TIMESTAMP` - When user joined tiebreaker

### 5. New Database Functions

#### `record_challenge_history()`
Records challenge results in history table with all relevant details.

#### `create_airball_tiebreaker()` / `create_clicker_tiebreaker()`
Creates tiebreaker competitions with:
- No entry fee
- Only tied participants
- 10-minute deadline
- Automatic notifications

#### `check_tiebreaker_timeouts()`
Monitors tiebreaker deadlines and:
- Sets non-players' scores to 0 after 10 minutes
- Forfeits prize to admin if no one plays within 1 hour
- Triggers completion checks when timeouts occur

#### Updated `submit_airball_score()` / `submit_clicker_score()`
Enhanced to:
- Detect ties automatically
- Create tiebreaker rounds
- Record all results in history
- Handle recursive tiebreakers (ties in tiebreakers)

### 6. New UI Components

#### Challenge History Screen (`challenge-history.tsx`)
- **Stats Dashboard**: Shows total wins, losses, ties, winnings, and losses
- **Filter Tabs**: Filter by all, wins, losses, or ties
- **History List**: Displays all challenge results with:
  - Challenge type and icon
  - Result (win/loss/tie/forfeit)
  - Score and rank
  - Amount won/lost
  - Time ago
  - Days until expiry
- **Refresh Control**: Pull to refresh history

#### Updated MXI AirBall Screen
- **Tiebreaker Warning**: Prominent warning when in tiebreaker with countdown timer
- **History Button**: Quick access to challenge history
- **Tiebreaker Indicator**: Shows when competition is a tiebreaker
- **Updated Rules**: Explains tiebreaker system

## User Flow

### Normal Competition
1. User joins competition (pays entry fee)
2. User completes challenge at their own pace
3. Score is submitted and leaderboard updates
4. When all participants finish:
   - If no tie: Winner gets 90% of pool, history recorded
   - If tie: Tiebreaker created, tied players notified

### Tiebreaker Flow
1. Tied players receive notification
2. Tiebreaker competition created (no entry fee)
3. 10-minute countdown starts for each player
4. Players complete tiebreaker:
   - **Scenario A**: All play within 10 minutes → Normal winner determination
   - **Scenario B**: Some play, some don't → Non-players get score 0
   - **Scenario C**: No one plays within 1 hour → Prize to admin, all forfeit
5. Results recorded in history

### History Tracking
- All results automatically recorded
- Includes win/loss amounts, scores, ranks
- Stored for 10 days minimum
- Extended storage for disputes
- Accessible via Challenge History screen

## Admin Features

### Automatic Prize Distribution
- Winners receive MXI automatically
- Losers' entry fees contribute to pool
- Admin fee (10%) automatically calculated
- Tiebreaker forfeits go to admin wallet

### Monitoring
- View all challenge history
- Track tiebreaker timeouts
- Monitor prize distributions
- Access dispute records

## Technical Implementation

### Real-Time Updates
- Supabase Realtime subscriptions for:
  - Competition status changes
  - Participant updates
  - Tiebreaker notifications
  - Leaderboard changes

### Notifications
- Push notifications for:
  - Tiebreaker creation
  - Tiebreaker deadlines
  - Competition completion
  - Wins and losses

### Data Cleanup
- Automatic cleanup function: `cleanup_expired_challenge_history()`
- Runs daily to remove expired records
- Preserves disputed records

## Security

### Row Level Security (RLS)
- Users can only view their own history
- System functions can insert/update all records
- Admin access for monitoring

### Data Integrity
- Foreign key constraints
- Check constraints on enums
- Transaction safety in functions

## Future Enhancements

### Potential Additions
1. **Dispute System**: Allow users to dispute results within 10-day window
2. **Leaderboard Archives**: Historical leaderboards for past competitions
3. **Statistics Dashboard**: Detailed analytics for users
4. **Achievement System**: Badges for milestones
5. **Tournament Mode**: Multi-round competitions
6. **Spectator Mode**: Watch live competitions

### Performance Optimizations
1. **Pagination**: For large history lists
2. **Caching**: Cache leaderboard data
3. **Indexing**: Additional indexes for common queries
4. **Archiving**: Move old records to archive table

## Testing Checklist

- [ ] Normal competition flow
- [ ] Tie detection and tiebreaker creation
- [ ] Tiebreaker timeout (10 minutes)
- [ ] Tiebreaker forfeit (1 hour)
- [ ] History recording for all scenarios
- [ ] History expiry (10 days)
- [ ] Real-time leaderboard updates
- [ ] Notifications delivery
- [ ] Prize distribution
- [ ] Multiple consecutive tiebreakers

## Deployment Notes

1. **Database Migrations**: Run all migrations in order
2. **Cron Jobs**: Set up daily cleanup job
3. **Monitoring**: Monitor tiebreaker timeouts
4. **Notifications**: Ensure push notification service is configured
5. **Testing**: Test all scenarios in staging environment

## Support

For issues or questions:
- Check challenge history for transaction records
- Review tiebreaker status in database
- Monitor notification delivery
- Verify prize distribution in user balances
