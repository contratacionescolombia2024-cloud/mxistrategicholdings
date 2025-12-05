
# MXI AirBall Duo Implementation & Prize Distribution Update

## Overview
This document outlines the implementation of the MXI AirBall Duo challenge mode and the update to prize distribution across all games from 95%/5% to 90%/10%.

## Changes Made

### 1. Database Schema

#### New Tables Created
- **airball_duo_battles**: Stores 1v1 AirBall challenge battles
  - Supports friend challenges (via referral code) and random opponent matching
  - Tracks wager amounts (1-2000 MXI range, same as Tap Duo)
  - Records center time scores for both players
  - Implements 90/10 prize split (90% to winner, 10% to admin)
  - Includes battle status tracking (waiting, matched, in_progress, completed, cancelled)

- **airball_duo_notifications**: Manages battle notifications
  - Challenge received notifications
  - Battle matched notifications
  - Opponent finished notifications
  - Battle completed notifications

#### Database Functions
- **complete_airball_duo_battle()**: Handles battle completion logic
  - Determines winner based on center time
  - Handles tie scenarios (refunds both players)
  - Awards 90% of pot to winner
  - Records results in challenge_history
  - Creates completion notifications

#### Updated Tables
- **challenge_history**: Added 'airball_duo' to challenge_type constraint
- **tap_duo_battles**: Updated to use 90/10 split
- **airball_competitions**: Updated to use 90/10 split
- **clicker_competitions**: Added admin_fee column and updated to 90/10 split

### 2. Prize Distribution Update

All games now use the 90/10 split:
- **Winner receives**: 90% of the total pot
- **Administrator receives**: 10% of the total pot

This applies to:
- Tap Duo battles
- AirBall Duo battles
- AirBall competitions (multi-player)
- Clicker competitions
- Lottery rounds

### 3. New Screen: MXI AirBall Duo

**File**: `app/(tabs)/(home)/mxi-airball-duo.tsx`

#### Features
- **Challenge Creation**:
  - Challenge a friend using their referral code
  - Create random opponent challenge
  - Set wager amount (1-2000 MXI)
  - Real-time prize calculation display

- **Gameplay**:
  - 40-second game duration
  - Blow into microphone to control ball
  - Keep ball in center zone to score
  - Real-time blow strength indicator
  - Visual feedback for center zone positioning

- **Battle Flow**:
  1. Create or accept challenge
  2. Both players complete the game
  3. System compares center time scores
  4. Winner receives 90% of pot
  5. Tie results in full refund to both players

- **Real-time Updates**:
  - Live battle status updates via Supabase Realtime
  - Push notifications for battle events
  - Automatic opponent notification when finished

### 4. Updated Screens

#### XMI Tap Duo (`app/(tabs)/(home)/xmi-tap-duo.tsx`)
- Updated prize display to show "90%" instead of "95%"
- Added admin fee display in challenge creation modal
- Updated prize calculation logic
- Updated "How to Play" section

#### Challenge History (`app/(tabs)/(home)/challenge-history.tsx`)
- Added AirBall Duo to challenge type icons and labels
- Icon: 🎈⚔️
- Label: "AirBall Duo"

#### Home Screen (`app/(tabs)/(home)/index.tsx`)
- Added "AirBall Duo" button in Games & Challenges section
- Added "History" button for easy access to challenge records

### 5. Security & RLS Policies

All new tables have Row Level Security (RLS) enabled:

**airball_duo_battles**:
- Users can view their own battles (challenger or opponent)
- Users can create battles (as challenger)
- Users can update their own battles

**airball_duo_notifications**:
- Users can view their own notifications
- Users can update their own notifications (mark as read)

### 6. Notifications

Push notifications are sent for:
- Challenge received (friend challenges)
- Battle matched (random opponent found)
- Opponent finished (your turn to play)
- Battle completed (results available)

### 7. Game Mechanics

#### AirBall Duo Specifics
- **Ball Physics**: Gravity pulls ball down, blow strength pushes up
- **Center Zone**: 150px height zone in middle of game area
- **Scoring**: Time spent in center zone (in seconds)
- **Win Condition**: Longest center time wins
- **Tie Handling**: Equal center times result in full refund

#### Wager Limits
- Minimum: 1 MXI
- Maximum: 2000 MXI
- Same limits as Tap Duo for consistency

### 8. Database Indexes

Created indexes for optimal performance:
- `idx_airball_duo_battles_challenger`
- `idx_airball_duo_battles_opponent`
- `idx_airball_duo_battles_status`
- `idx_airball_duo_notifications_user`
- `idx_airball_duo_notifications_battle`

## Testing Checklist

- [ ] Create friend challenge with referral code
- [ ] Create random opponent challenge
- [ ] Accept waiting challenge
- [ ] Complete game and verify score submission
- [ ] Verify winner receives 90% of pot
- [ ] Verify tie scenario refunds both players
- [ ] Test notifications for all battle events
- [ ] Verify challenge history records correctly
- [ ] Test with insufficient balance
- [ ] Test with invalid referral code
- [ ] Verify real-time updates work correctly

## Migration Notes

All existing battles and competitions have been updated to use the new 90/10 split. Only incomplete battles were updated to preserve historical data integrity.

## Future Enhancements

Potential improvements for future versions:
- Tournament mode with multiple rounds
- Leaderboards for top AirBall Duo players
- Replay functionality to review past battles
- Spectator mode for watching live battles
- Custom game duration options
- Power-ups or special abilities

## API Endpoints Used

- Supabase Realtime: Battle and notification updates
- Supabase RPC: `complete_airball_duo_battle()`
- Expo Notifications: Push notification delivery
- Expo Audio: Microphone input for gameplay

## Dependencies

No new dependencies were added. The implementation uses existing packages:
- `expo-av`: Audio recording for microphone input
- `expo-notifications`: Push notifications
- `@supabase/supabase-js`: Database and real-time subscriptions
- `react-native-reanimated`: Smooth ball animations

## Conclusion

The MXI AirBall Duo feature is now fully implemented with the same challenge mechanics as Tap Duo but using the unique AirBall gameplay. All games now use the updated 90/10 prize distribution, providing more revenue for platform administration while still offering attractive prizes to winners.
