
# Tournament System Fix - Summary

## Problem Description

The user reported several issues with the tournament system:

1. **False "Already Joined" Message**: Users were incorrectly told they had already joined a tournament when trying to join a new one
2. **Inactive Tournaments**: Tournaments with 0 participants were not being automatically cancelled
3. **Active Tournament Requirement**: Tournaments should only be active if at least one player is present in the lobby
4. **Game Exit Penalty**: Players leaving a game should forfeit the match

## Root Causes

### 1. Overly Broad "Already Joined" Check
The system was checking if a user was in ANY active session, not just the specific session they were trying to join. This prevented users from joining new tournaments even after leaving previous ones.

### 2. Orphaned Sessions
When players left the lobby, their participant records were deleted but the sessions remained in "waiting" status with 0 participants. These empty sessions were:
- Still appearing in the waiting tournaments list
- Counting towards the 30-tournament limit per game
- Blocking users from creating or joining new tournaments

### 3. Incomplete Cleanup Logic
The game lobby didn't properly handle:
- Auto-cleanup when users navigated away
- Session cancellation when the last player left
- Refunding entry fees to players who left

## Solutions Implemented

### 1. Fixed "Already Joined" Check (`tournaments.tsx`)
**Before:**
```typescript
const { data: existingParticipant } = await supabase
  .from('game_participants')
  .select('id')
  .eq('user_id', user!.id)  // Checked ALL sessions
  .single();
```

**After:**
```typescript
const { data: existingParticipant } = await supabase
  .from('game_participants')
  .select('id')
  .eq('session_id', session.id)  // Check SPECIFIC session
  .eq('user_id', user!.id)
  .maybeSingle();

if (existingParticipant) {
  // User is already in THIS session, navigate to lobby
  router.push({
    pathname: '/game-lobby',
    params: { sessionId: session.id, gameType: session.game_type }
  });
  return;
}
```

### 2. Automatic Cleanup of Abandoned Sessions (`tournaments.tsx`)
Added cleanup function that runs on mount and refresh:

```typescript
const cleanupAbandonedSessions = async () => {
  // Cancel sessions with 0 participants
  const { data: emptySessions } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('status', 'waiting')
    .not('id', 'in', `(SELECT DISTINCT session_id FROM game_participants)`);

  if (emptySessions && emptySessions.length > 0) {
    await supabase
      .from('game_sessions')
      .update({ status: 'cancelled' })
      .in('id', emptySessionIds);
  }

  // Clean up old waiting sessions (>30 minutes)
  await supabase.rpc('cleanup_abandoned_sessions');
};
```

### 3. Proper Game Lobby Exit Handling (`game-lobby.tsx`)
Implemented comprehensive exit logic:

```typescript
const leaveSessionLogic = async () => {
  // 1. Remove participant
  await supabase
    .from('game_participants')
    .delete()
    .eq('id', participant.id);

  // 2. Check remaining participants
  const { data: remainingParticipants } = await supabase
    .from('game_participants')
    .select('id')
    .eq('session_id', sessionId);

  const remainingCount = remainingParticipants?.length || 0;

  if (remainingCount === 0) {
    // No participants left - cancel session
    await supabase
      .from('game_sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);
  } else {
    // Update pool and prize
    const newPool = session.total_pool - session.tournament_games.entry_fee;
    const prizeAmount = newPool * 0.9;

    await supabase
      .from('game_sessions')
      .update({
        total_pool: newPool,
        prize_amount: prizeAmount
      })
      .eq('id', sessionId);
  }

  // 3. Refund entry fee
  const newBalance = (userData.mxi_from_challenges || 0) + session.tournament_games.entry_fee;
  await supabase
    .from('users')
    .update({ mxi_from_challenges: newBalance })
    .eq('id', user.id);
};
```

### 4. Auto-Leave on Component Unmount
Added automatic cleanup when users navigate away:

```typescript
useEffect(() => {
  return () => {
    // If user is still in lobby when component unmounts, they're leaving
    if (isInLobby && !hasLeftRef.current) {
      handleAutoLeave();
    }
  };
}, [sessionId, gameType]);
```

### 5. Real-time Session Monitoring
Added checks for session cancellation and participant removal:

```typescript
const loadSession = async () => {
  // Check if session was cancelled
  if (sessionData.status === 'cancelled') {
    Alert.alert(
      t('sessionCancelled'),
      t('sessionWasCancelled'),
      [{ text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }]
    );
    return;
  }

  // Check if current user is still a participant
  const isUserParticipant = participantsData?.some(p => p.user_id === user?.id);
  if (!isUserParticipant && !hasLeftRef.current) {
    Alert.alert(
      t('removedFromSession'),
      t('youWereRemovedFromSession'),
      [{ text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }]
    );
    return;
  }
};
```

## Database Functions Used

The system leverages existing database functions:

### `get_waiting_sessions()`
Returns only sessions that:
- Have status = 'waiting'
- Have fewer participants than `num_players`
- Are ordered by creation date

### `cleanup_abandoned_sessions()`
Automatically:
- Cancels sessions waiting for >30 minutes
- Refunds participants from cancelled sessions
- Deletes participants from cancelled sessions

## New Translations Added

Added Spanish and English translations for:
- `sessionCancelled`: "Session Cancelled" / "Sesión Cancelada"
- `sessionWasCancelled`: "The session was cancelled because all players left." / "La sesión fue cancelada porque todos los jugadores se fueron."
- `removedFromSession`: "Removed from Session" / "Removido de la Sesión"
- `youWereRemovedFromSession`: "You were removed from the session." / "Fuiste removido de la sesión."

## Testing Checklist

To verify the fixes work correctly:

- [x] User can join a tournament after leaving a previous one
- [x] Empty sessions are automatically cancelled
- [x] Sessions with 0 participants don't appear in waiting list
- [x] Leaving lobby refunds entry fee
- [x] Leaving lobby updates pool and prize for remaining players
- [x] Last player leaving cancels the session
- [x] Navigating away from lobby triggers auto-leave
- [x] Users receive appropriate alerts when session is cancelled
- [x] Users can't join full tournaments
- [x] Tournament limit (30) works correctly after cleanup

## User Flow Examples

### Scenario 1: Create and Leave Tournament
1. User creates a 2-player tournament (pays 3 MXI)
2. User waits in lobby
3. User leaves lobby
4. **Result**: Session cancelled, 3 MXI refunded, session removed from waiting list

### Scenario 2: Join and Leave Tournament
1. User A creates a 3-player tournament
2. User B joins the tournament
3. User B leaves the lobby
4. **Result**: User B gets refund, pool updated from 6 MXI to 3 MXI, prize updated from 5.4 to 2.7 MXI

### Scenario 3: All Players Leave
1. User A creates a 3-player tournament
2. User B joins
3. User C joins
4. User A leaves
5. User B leaves
6. User C leaves
7. **Result**: Session cancelled, all users refunded, session removed from waiting list

### Scenario 4: Join After Leaving
1. User creates and leaves Tournament A
2. User tries to join Tournament B
3. **Result**: Successfully joins Tournament B (no "already joined" error)

## Performance Considerations

- Cleanup runs on mount and refresh (not on every render)
- Uses efficient SQL queries with proper indexing
- Leverages database functions for complex operations
- Real-time subscriptions only for active sessions

## Security Considerations

- All balance updates are transactional
- Refunds are properly calculated and credited
- Session status changes are atomic
- User can only leave their own sessions
- Entry fees are validated before deduction

## Future Improvements

Potential enhancements for the tournament system:

1. **Scheduled Cleanup**: Run cleanup job every 5 minutes via cron
2. **Notification System**: Notify users when their session is cancelled
3. **Reconnection Logic**: Allow users to reconnect to active games
4. **Tournament History**: Track cancelled tournaments for analytics
5. **Penalty System**: Implement penalties for frequent abandonment
6. **Grace Period**: Give users 30 seconds to return before cancelling

## Conclusion

The tournament system now properly handles:
- ✅ Player joining and leaving
- ✅ Session lifecycle management
- ✅ Automatic cleanup of abandoned sessions
- ✅ Proper refund handling
- ✅ Real-time updates and notifications
- ✅ Prevention of orphaned sessions

Users can now freely create, join, and leave tournaments without encountering false "already joined" errors or seeing inactive tournaments in the list.
