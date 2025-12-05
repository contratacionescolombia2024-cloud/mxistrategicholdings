
# Tournament System Testing Guide

## Quick Test Scenarios

### Test 1: Basic Create and Leave
**Purpose**: Verify session cancellation and refund when creator leaves

**Steps**:
1. Log in as User A
2. Go to Tournaments tab
3. Note current MXI balance (e.g., 100 MXI)
4. Create a new 2-player Tank Arena tournament (costs 3 MXI)
5. Verify balance is now 97 MXI
6. Wait in lobby for 5 seconds
7. Press back button
8. Confirm you want to leave
9. Return to tournaments list

**Expected Results**:
- ✅ Balance returns to 100 MXI (refunded)
- ✅ Tournament no longer appears in waiting list
- ✅ Can create a new tournament immediately
- ✅ No "already joined" error

---

### Test 2: Join and Leave
**Purpose**: Verify pool updates when a player leaves

**Steps**:
1. Log in as User A
2. Create a 3-player tournament (3 MXI entry)
3. Note session code (e.g., TANK_ARENA-abc123)
4. Log in as User B (different device/browser)
5. Join the tournament using session code
6. Verify lobby shows 2/3 players
7. Verify prize shows 5.4 MXI (6 MXI * 0.9)
8. User B leaves the lobby
9. Check User A's lobby view

**Expected Results**:
- ✅ User B gets 3 MXI refund
- ✅ Lobby shows 1/3 players
- ✅ Prize updates to 2.7 MXI (3 MXI * 0.9)
- ✅ Session still active (not cancelled)
- ✅ User B can join another tournament

---

### Test 3: All Players Leave
**Purpose**: Verify session cancellation when all players leave

**Steps**:
1. User A creates 2-player tournament
2. User B joins
3. Verify lobby shows 2/2 players
4. User A leaves
5. Check User B's screen

**Expected Results**:
- ✅ User B sees "Session Cancelled" alert
- ✅ User B redirected to tournaments list
- ✅ Both users refunded
- ✅ Session removed from waiting list

---

### Test 4: Cleanup on Refresh
**Purpose**: Verify automatic cleanup of orphaned sessions

**Steps**:
1. Create a tournament
2. Force close the app (don't use back button)
3. Wait 10 seconds
4. Reopen app
5. Go to tournaments tab
6. Pull down to refresh

**Expected Results**:
- ✅ Orphaned session is cancelled
- ✅ Entry fee is refunded
- ✅ Session doesn't appear in waiting list

---

### Test 5: Multiple Tournaments
**Purpose**: Verify users can join different tournaments

**Steps**:
1. User A creates Tournament 1 (Tank Arena)
2. User A leaves Tournament 1
3. User B creates Tournament 2 (Mini Cars)
4. User A tries to join Tournament 2

**Expected Results**:
- ✅ User A can join Tournament 2
- ✅ No "already joined" error
- ✅ Both tournaments work independently

---

### Test 6: Tournament Limit
**Purpose**: Verify 30-tournament limit per game

**Steps**:
1. Check current open tournaments for Tank Arena
2. If less than 30, create tournaments until limit reached
3. Try to create one more tournament

**Expected Results**:
- ✅ Shows "Tournament Limit Reached" message
- ✅ Can still join existing tournaments
- ✅ Can create tournaments for other games

---

### Test 7: Full Tournament
**Purpose**: Verify users can't join full tournaments

**Steps**:
1. User A creates 2-player tournament
2. User B joins (now 2/2)
3. User C tries to join

**Expected Results**:
- ✅ Tournament shows as "Full"
- ✅ Join button is disabled
- ✅ User C can create or join other tournaments

---

### Test 8: Game Start
**Purpose**: Verify game starts when lobby is full

**Steps**:
1. User A creates 2-player tournament
2. User B joins
3. Wait for countdown (5 seconds)

**Expected Results**:
- ✅ Countdown appears: 5, 4, 3, 2, 1
- ✅ Both users navigate to game screen
- ✅ Session status changes to 'ready'
- ✅ Can't leave without penalty

---

### Test 9: Real-time Updates
**Purpose**: Verify lobby updates in real-time

**Steps**:
1. User A creates 3-player tournament
2. User B joins (2/3 players)
3. User C joins (3/3 players)
4. Check User A's screen

**Expected Results**:
- ✅ User A sees player count update: 1/3 → 2/3 → 3/3
- ✅ Prize amount updates automatically
- ✅ Countdown starts when full

---

### Test 10: Balance Verification
**Purpose**: Verify all balance changes are correct

**Steps**:
1. Note starting balance: 100 MXI
2. Create tournament: -3 MXI = 97 MXI
3. Leave tournament: +3 MXI = 100 MXI
4. Join tournament: -3 MXI = 97 MXI
5. Win tournament: +5.4 MXI = 102.4 MXI

**Expected Results**:
- ✅ All balance changes are accurate
- ✅ No MXI is lost or created
- ✅ Refunds match entry fees

---

## Database Verification Queries

### Check Active Sessions
```sql
SELECT 
  gs.id,
  gs.session_code,
  gs.status,
  gs.num_players,
  COUNT(gp.id) as current_participants
FROM game_sessions gs
LEFT JOIN game_participants gp ON gs.id = gp.session_id
WHERE gs.status = 'waiting'
GROUP BY gs.id, gs.session_code, gs.status, gs.num_players
ORDER BY gs.created_at DESC;
```

**Expected**: No sessions with 0 participants

### Check Orphaned Participants
```sql
SELECT gp.*
FROM game_participants gp
LEFT JOIN game_sessions gs ON gp.session_id = gs.id
WHERE gs.id IS NULL OR gs.status = 'cancelled';
```

**Expected**: No results (all participants should have valid sessions)

### Check User Balance
```sql
SELECT 
  id,
  name,
  mxi_from_unified_commissions,
  mxi_from_challenges
FROM users
WHERE id = 'user-id-here';
```

**Expected**: Balances match expected values after all transactions

---

## Common Issues and Solutions

### Issue: "Already Joined" Error
**Cause**: User has orphaned participant record
**Solution**: Run cleanup or manually delete participant record

### Issue: Empty Sessions in List
**Cause**: Cleanup didn't run
**Solution**: Pull to refresh or restart app

### Issue: Balance Not Refunded
**Cause**: Leave logic didn't execute
**Solution**: Check database for participant record and session status

### Issue: Session Not Cancelled
**Cause**: Last player didn't trigger cleanup
**Solution**: Manually update session status to 'cancelled'

---

## Performance Benchmarks

### Expected Response Times
- Create tournament: < 1 second
- Join tournament: < 1 second
- Leave tournament: < 1 second
- Cleanup on refresh: < 2 seconds
- Real-time update: < 500ms

### Database Query Limits
- Max waiting sessions per game: 30
- Max participants per session: 5
- Session timeout: 30 minutes
- Cleanup interval: On mount + refresh

---

## Monitoring Checklist

Daily checks:
- [ ] No sessions with 0 participants
- [ ] No orphaned participant records
- [ ] All balances reconcile
- [ ] No sessions older than 30 minutes in 'waiting' status
- [ ] Tournament counts per game < 30

Weekly checks:
- [ ] Review cancelled session logs
- [ ] Check refund accuracy
- [ ] Verify cleanup function performance
- [ ] Monitor user complaints about tournaments

---

## Rollback Plan

If issues occur:

1. **Disable Tournament Creation**
   ```sql
   UPDATE tournament_games SET is_active = false;
   ```

2. **Cancel All Active Sessions**
   ```sql
   UPDATE game_sessions SET status = 'cancelled' WHERE status = 'waiting';
   ```

3. **Refund All Participants**
   ```sql
   -- Run cleanup_abandoned_sessions function
   SELECT cleanup_abandoned_sessions();
   ```

4. **Re-enable After Fix**
   ```sql
   UPDATE tournament_games SET is_active = true;
   ```

---

## Success Criteria

The tournament system is working correctly when:

✅ Users can create tournaments without errors
✅ Users can join tournaments without "already joined" errors
✅ Users can leave tournaments and get refunded
✅ Empty sessions are automatically cancelled
✅ Sessions don't appear in waiting list after cancellation
✅ Pool and prize amounts update correctly
✅ Real-time updates work smoothly
✅ No orphaned sessions or participants in database
✅ All balance changes are accurate
✅ Tournament limit (30) is enforced correctly

---

## Contact for Issues

If you encounter any issues during testing:

1. Check the console logs for error messages
2. Verify database state with the queries above
3. Document the exact steps to reproduce
4. Note the user IDs and session IDs involved
5. Check if cleanup resolves the issue

Report issues with:
- User ID
- Session ID (if applicable)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or screen recordings
- Console logs
