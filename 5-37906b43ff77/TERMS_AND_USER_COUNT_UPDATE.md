
# Terms and Conditions & User Count Update

## Summary

This update implements the following changes as requested:

1. **Removed User Counter from Home Page**: The liquidity pool user counter (56,000+ users) has been completely removed from the home page. Only MXI tokens sold are now displayed.

2. **Terms Acceptance Only Once**: Terms and conditions are now only required to be accepted during user registration, not on every login.

3. **Database Changes**: Added `terms_accepted_at` field to track when users accepted terms during registration.

## Changes Made

### 1. Database Migration

**File**: Migration applied via `apply_migration` tool

**Changes**:
- Added `terms_accepted_at` column to `users` table
- This timestamp records when the user accepted terms during registration

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp without time zone;
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user accepted terms and conditions during registration';
```

### 2. Home Page Updates

**File**: `app/(tabs)/(home)/index.tsx`

**Changes**:
- Removed `poolMembers` state variable (was showing 56,527 users)
- Removed the "Miembros" stat from the stats card
- Updated stats card to only show:
  - **MXI Vendidos** (MXI Sold) - from phase data
  - **Referidos Activos** (Active Referrals) - user's personal referrals
- The user count is no longer displayed anywhere on the home page

**Before**:
```tsx
<View style={styles.statItem}>
  <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="group" size={24} color={colors.primary} />
  <Text style={styles.statValue}>{poolMembers.toLocaleString()}</Text>
  <Text style={styles.statLabel}>Miembros</Text>
</View>
```

**After**:
```tsx
<View style={styles.statItem}>
  <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar_chart" size={24} color={colors.primary} />
  <Text style={styles.statValue}>{formatNumber(phaseData.totalTokensSold)}</Text>
  <Text style={styles.statLabel}>MXI Vendidos</Text>
</View>
```

### 3. Login Screen Updates

**File**: `app/(auth)/login.tsx`

**Changes**:
- **Removed** terms and conditions acceptance checkbox from login
- **Removed** `acceptedTerms` state and validation
- Added a link to view terms and conditions (optional, for reference)
- Users can now login without accepting terms each time
- Terms modal is still available for viewing but not required

**Key Changes**:
- Removed terms acceptance requirement from `handleLogin` function
- Removed terms checkbox UI component
- Added "Ver Términos y Condiciones" link for optional viewing

### 4. Registration Screen Updates

**File**: `app/(auth)/register.tsx`

**Changes**:
- Terms acceptance is **still required** during registration (unchanged)
- Added code to save `terms_accepted_at` timestamp when user registers
- After successful registration, the timestamp is saved to the database

**New Code**:
```tsx
if (result.success && result.userId) {
  // Save terms acceptance timestamp
  const { error: termsError } = await supabase
    .from('users')
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq('id', result.userId);

  if (termsError) {
    console.error('Error saving terms acceptance:', termsError);
  }
}
```

## User Experience Flow

### Registration (First Time)
1. User fills out registration form
2. User **must** accept terms and conditions checkbox
3. User creates account
4. `terms_accepted_at` timestamp is saved to database
5. User receives email verification

### Login (Subsequent Times)
1. User enters email and password
2. **No terms acceptance required**
3. User can optionally view terms via link
4. User logs in successfully

## Benefits

1. **Better UX**: Users don't need to accept terms every time they log in
2. **Compliance**: Terms acceptance is tracked with timestamp in database
3. **Cleaner UI**: Home page focuses on relevant metrics (MXI sold, personal referrals)
4. **Transparency**: Total user count is not displayed, only MXI tokens sold

## Testing Checklist

- [x] Database migration applied successfully
- [x] Home page displays MXI sold instead of user count
- [x] Login works without terms acceptance
- [x] Registration still requires terms acceptance
- [x] Terms acceptance timestamp is saved to database
- [x] Terms modal can be viewed from login screen (optional)

## Notes

- The `metrics` table still has `total_members` field for admin tracking, but it's not displayed to users
- Users who registered before this update will have `NULL` for `terms_accepted_at` - this is acceptable as they already accepted terms
- The terms and conditions text remains unchanged and available for viewing

## Database Schema

```sql
-- users table now includes:
terms_accepted_at timestamp without time zone
  -- Timestamp when user accepted terms and conditions during registration
  -- NULL for users who registered before this feature
  -- Set automatically during registration
```

---

**Date**: January 2026
**Version**: 1.1
**Status**: ✅ Implemented
