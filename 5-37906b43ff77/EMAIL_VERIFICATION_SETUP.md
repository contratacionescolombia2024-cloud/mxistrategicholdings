
# Email Verification Setup - Fixed

## What Was Fixed

### 1. **Deep Linking Configuration (app.json)**
- Added Android intent filters for handling `https://natively.dev/email-confirmed` URLs
- Configured proper scheme (`maxcoinpool`) for deep linking
- Added web browser plugin configuration for better redirect handling

### 2. **Supabase Client Configuration (lib/supabase.ts)**
- Enabled `detectSessionInUrl: true` to properly handle email confirmation links
- Added `flowType: 'pkce'` for enhanced security
- Created `handleDeepLink` function to process email confirmation URLs
- Maintained proper session persistence with AsyncStorage

### 3. **Email Confirmation Screen (app/email-confirmed.tsx)**
- Created dedicated screen to handle email verification redirects
- Automatically extracts and processes authentication tokens from URLs
- Updates user's `email_verified` status in the database
- Provides visual feedback (loading, success, error states)
- Automatically redirects to login after verification

### 4. **Root Layout Deep Link Handling (app/_layout.tsx)**
- Added deep link event listener to catch email confirmation URLs
- Handles both app launch and runtime deep links
- Properly routes to email confirmation screen when verification link is clicked
- Prevents navigation conflicts during email verification flow

## How It Works

### Registration Flow:
1. User registers with email and password
2. Supabase sends verification email with link: `https://natively.dev/email-confirmed?token=...`
3. User clicks the link in their email
4. Link opens the app (via deep linking)
5. App navigates to `/email-confirmed` screen
6. Screen extracts token and verifies with Supabase
7. Database updated: `email_verified = true`
8. User redirected to login screen
9. User can now log in successfully

### Login Flow:
1. User enters email and password
2. System checks if email is verified
3. If not verified, shows error with option to resend verification email
4. If verified, user is logged in and redirected to home screen

## Configuration Requirements

### Supabase Dashboard Settings:
1. Go to Authentication → URL Configuration
2. Add to **Redirect URLs**:
   - `https://natively.dev/email-confirmed`
   - `maxcoinpool://email-confirmed` (for mobile deep linking)
3. Set **Site URL** to: `https://natively.dev`

### Email Template (Optional):
You can customize the email template in Supabase Dashboard:
- Go to Authentication → Email Templates
- Edit "Confirm signup" template
- Ensure the confirmation link uses: `{{ .ConfirmationURL }}`

## Testing Email Verification

### On Development:
1. Register a new account
2. Check your email inbox
3. Click the verification link
4. App should open and show "Email Verified!" message
5. Try logging in - should work without errors

### Common Issues:

**Issue**: Email link doesn't open the app
- **Solution**: Make sure you're testing on a physical device or properly configured emulator
- Deep linking doesn't work well in Expo Go - use development build

**Issue**: "Email not verified" error persists
- **Solution**: Check that the `email_verified` column in the `users` table is set to `true`
- Run this SQL to manually verify:
  ```sql
  UPDATE users SET email_verified = true WHERE email = 'user@example.com';
  ```

**Issue**: Redirect URL not working
- **Solution**: Verify Supabase dashboard has correct redirect URLs configured
- Check that app.json scheme matches your configuration

## Code Changes Summary

### Files Modified:
- ✅ `app.json` - Added deep linking configuration
- ✅ `lib/supabase.ts` - Enhanced with deep link handling
- ✅ `app/_layout.tsx` - Added deep link event listeners
- ✅ `app/email-confirmed.tsx` - New screen for handling verification

### Files Already Correct:
- ✅ `contexts/AuthContext.tsx` - Already using correct redirect URL
- ✅ `app/(auth)/login.tsx` - Already checking email verification
- ✅ `app/(auth)/register.tsx` - Already showing verification reminder

## Next Steps

1. **Test the flow**: Register a new account and verify the email works
2. **Configure Supabase**: Ensure redirect URLs are set in dashboard
3. **Build the app**: Create a development build to test deep linking properly
   ```bash
   npx expo prebuild
   npx expo run:android
   # or
   npx expo run:ios
   ```

## Important Notes

- Email verification is **required** before users can log in
- The redirect URL `https://natively.dev/email-confirmed` is a Natively standard URL
- Deep linking works best on physical devices or proper development builds
- Expo Go has limitations with deep linking - use development builds for testing
- Users can resend verification emails from the login screen if needed

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Check app console logs for deep link events
3. Verify database `email_verified` column values
4. Ensure redirect URLs are configured in Supabase dashboard
