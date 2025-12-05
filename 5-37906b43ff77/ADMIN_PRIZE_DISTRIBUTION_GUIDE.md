
# Administrator Guide: Prize Distribution System

## Overview
All games in the MXI platform now use a **90/10 prize distribution model**:
- **90%** goes to the winner(s)
- **10%** goes to platform administration

## Games Affected

### 1. Tap Duo (1v1 Battles)
- **Entry**: 1-2000 MXI per player
- **Total Pot**: Wager × 2
- **Winner Gets**: 90% of total pot
- **Admin Fee**: 10% of total pot
- **Tie Scenario**: Full refund to both players

### 2. AirBall Duo (1v1 Battles)
- **Entry**: 1-2000 MXI per player
- **Total Pot**: Wager × 2
- **Winner Gets**: 90% of total pot
- **Admin Fee**: 10% of total pot
- **Tie Scenario**: Full refund to both players

### 3. AirBall Competition (Multi-player)
- **Entry**: 3 MXI per player
- **Max Players**: 50
- **Total Pot**: Entry fee × Number of participants
- **Winner Gets**: 90% of total pot
- **Admin Fee**: 10% of total pot
- **Tie Scenario**: Automatic tiebreaker round

### 4. Clickers Competition (Multi-player)
- **Entry**: 10 MXI per player
- **Max Players**: 50
- **Total Pot**: Entry fee × Number of participants
- **Winner Gets**: 90% of total pot
- **Admin Fee**: 10% of total pot
- **Tie Scenario**: Automatic tiebreaker round

### 5. Lottery/Bonus MXI
- **Entry**: 2 MXI per ticket
- **Max Tickets**: 1000
- **Total Pot**: Ticket price × Tickets sold
- **Winner Gets**: 90% of total pot
- **Admin Fee**: 10% of total pot

## Admin Fee Collection

Admin fees are automatically calculated and deducted when:
- A battle/competition is completed
- A winner is determined
- Prize is distributed

The admin fee is stored in the `admin_fee` column of each game table.

## Monitoring Admin Revenue

### SQL Query to Check Total Admin Fees

```sql
-- Tap Duo Admin Fees
SELECT SUM(admin_fee) as tap_duo_fees
FROM tap_duo_battles
WHERE status = 'completed';

-- AirBall Duo Admin Fees
SELECT SUM(admin_fee) as airball_duo_fees
FROM airball_duo_battles
WHERE status = 'completed';

-- AirBall Competition Admin Fees
SELECT SUM(admin_fee) as airball_comp_fees
FROM airball_competitions
WHERE status = 'completed';

-- Clicker Competition Admin Fees
SELECT SUM(admin_fee) as clicker_fees
FROM clicker_competitions
WHERE status = 'completed';

-- Total Admin Revenue
SELECT 
  (SELECT COALESCE(SUM(admin_fee), 0) FROM tap_duo_battles WHERE status = 'completed') +
  (SELECT COALESCE(SUM(admin_fee), 0) FROM airball_duo_battles WHERE status = 'completed') +
  (SELECT COALESCE(SUM(admin_fee), 0) FROM airball_competitions WHERE status = 'completed') +
  (SELECT COALESCE(SUM(admin_fee), 0) FROM clicker_competitions WHERE status = 'completed')
  as total_admin_revenue;
```

## Adjusting Prize Distribution

If you need to change the prize distribution percentage in the future:

### For Duo Battles (Tap Duo, AirBall Duo)
Update the calculation in the battle creation logic:
```typescript
const prizeAmount = totalPot * 0.90; // Change 0.90 to desired percentage
const adminFee = totalPot * 0.10;    // Change 0.10 to desired percentage
```

### For Competitions (AirBall, Clickers)
Update the RPC functions that handle competition completion:
- `complete_airball_competition()`
- `complete_clicker_competition()`

Change the prize calculation:
```sql
v_prize_amount := v_total_pool * 0.90; -- Change 0.90 to desired percentage
v_admin_fee := v_total_pool * 0.10;    -- Change 0.10 to desired percentage
```

## Admin Settings

You can also create admin settings to control prize distribution dynamically:

```sql
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES 
  ('prize_winner_percentage', '0.90', 'Percentage of pot that goes to winner'),
  ('prize_admin_percentage', '0.10', 'Percentage of pot that goes to admin');
```

Then update the code to read from these settings instead of hardcoded values.

## Reporting

### Daily Revenue Report
```sql
SELECT 
  DATE(completed_at) as date,
  COUNT(*) as battles_completed,
  SUM(admin_fee) as daily_admin_revenue
FROM (
  SELECT completed_at, admin_fee FROM tap_duo_battles WHERE status = 'completed'
  UNION ALL
  SELECT completed_at, admin_fee FROM airball_duo_battles WHERE status = 'completed'
  UNION ALL
  SELECT completed_at, admin_fee FROM airball_competitions WHERE status = 'completed'
  UNION ALL
  SELECT completed_at, admin_fee FROM clicker_competitions WHERE status = 'completed'
) as all_games
WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(completed_at)
ORDER BY date DESC;
```

### Game Type Revenue Breakdown
```sql
SELECT 
  'Tap Duo' as game_type,
  COUNT(*) as completed_battles,
  SUM(admin_fee) as total_admin_fees
FROM tap_duo_battles
WHERE status = 'completed'

UNION ALL

SELECT 
  'AirBall Duo' as game_type,
  COUNT(*) as completed_battles,
  SUM(admin_fee) as total_admin_fees
FROM airball_duo_battles
WHERE status = 'completed'

UNION ALL

SELECT 
  'AirBall Competition' as game_type,
  COUNT(*) as completed_competitions,
  SUM(admin_fee) as total_admin_fees
FROM airball_competitions
WHERE status = 'completed'

UNION ALL

SELECT 
  'Clickers' as game_type,
  COUNT(*) as completed_competitions,
  SUM(admin_fee) as total_admin_fees
FROM clicker_competitions
WHERE status = 'completed';
```

## Important Notes

1. **Tie Scenarios**: In 1v1 battles, ties result in full refunds. No admin fee is collected.

2. **Tiebreakers**: In multi-player competitions, tiebreakers have no entry fee. The original pot is carried over.

3. **Expired Battles**: If a tiebreaker expires without completion, the pot goes to administration (100%).

4. **Challenge History**: All transactions are recorded in the `challenge_history` table for 10 days for dispute resolution.

5. **Balance Updates**: Winner balances are updated automatically when battles/competitions complete.

## Support & Troubleshooting

If users report prize distribution issues:

1. Check the battle/competition status in the database
2. Verify the `admin_fee` and `prize_amount` calculations
3. Check the `challenge_history` table for transaction records
4. Review the user's balance update history

For disputes, the `challenge_history` table maintains records for 10 days with:
- Challenge type
- Result (win/loss/tie/forfeit)
- Amount won/lost
- Score/rank
- Timestamp

## Conclusion

The 90/10 prize distribution model provides:
- Attractive prizes for winners (90%)
- Sustainable revenue for platform operations (10%)
- Transparent and fair competition
- Automatic fee collection and tracking
