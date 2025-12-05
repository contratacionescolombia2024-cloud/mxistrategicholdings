
# Supabase Setup Instructions for Maxcoin Pool App

## ✅ Database Setup Complete

The database schema has been successfully applied to your Supabase project. All tables, functions, and security policies are now in place.

## Important: Email Verification Configuration

To ensure email verification works correctly, you need to configure your Supabase project settings:

### Step 1: Configure Authentication Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn)
2. Navigate to **Authentication** → **URL Configuration**
3. Set the following URLs:

   **Site URL:**
   ```
   https://natively.dev
   ```

   **Redirect URLs (add these):**
   ```
   https://natively.dev/email-confirmed
   maxcoinpool://*
   ```

### Step 2: Enable Email Confirmation

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure **Enable Email Confirmations** is turned ON
3. This ensures users must verify their email before logging in

### Step 3: Customize Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template:

```html
<h2>Welcome to Maxcoin Pool!</h2>
<p>Thank you for joining the Maxcoin Liquidity Pool.</p>
<p>Please confirm your email address by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email Address</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
<p><strong>Important:</strong> You must verify your email before you can log in to your account.</p>
<p>If you didn't create an account with Maxcoin Pool, please ignore this email.</p>
```

## Database Schema Overview

### Tables Created:

✅ **users** - User profiles and account information
- Stores user details (name, ID number, address, email)
- Tracks MXI balance and USDT contributions
- Manages referral codes and relationships
- Tracks withdrawal eligibility

✅ **contributions** - All USDT contributions and MXI purchases
- Records all transactions (initial, increase, reinvestment)
- Tracks transaction status
- Links to users

✅ **commissions** - Referral commissions (3 levels)
- Calculates 3-level commissions (3%, 2%, 1%)
- Tracks commission status (pending, available, withdrawn)
- Links referrers and referred users

✅ **withdrawals** - USDT and MXI withdrawal requests
- Records withdrawal requests
- Tracks wallet addresses
- Manages withdrawal status

✅ **referrals** - Referral relationships between users
- Tracks 3-level referral chains
- Links referrers and referred users

✅ **metrics** - Global pool metrics
- Total members (starts at 56,527)
- Total USDT contributed
- Total MXI distributed
- Pool close date: January 15, 2025 at 12:00 UTC

### Functions Created:

✅ **generate_referral_code()** - Generates unique referral codes
✅ **process_referral_commissions()** - Calculates and distributes commissions
✅ **check_withdrawal_eligibility()** - Checks if user can withdraw
✅ **increment_total_members()** - Updates member count
✅ **increment_active_referrals()** - Updates active referral count
✅ **update_commission_status()** - Updates commission availability

### Security Features:

✅ **Row Level Security (RLS)** enabled on all tables
✅ Users can only access their own data
✅ Secure password hashing by Supabase Auth
✅ Email verification required
✅ Unique constraints on email and ID number

## Testing the Setup

### 1. Test User Registration

1. Open your app
2. Click "Create Account"
3. Fill in all required fields
4. Submit the form
5. Check your email for verification link
6. Click the verification link
7. Try logging in

### 2. Test Email Verification

1. After registration, check your email inbox
2. Look for email from your Supabase project
3. Click the verification link
4. You should be redirected to a confirmation page
5. Return to the app and log in

### 3. Test Login

1. Try logging in before verifying email (should fail)
2. Verify email
3. Try logging in again (should succeed)
4. Check that user data loads correctly

### 4. Test Referral System

1. Create a user account (User A)
2. Copy User A's referral code
3. Create another account (User B) using User A's referral code
4. Check that referral relationship is created
5. Make a contribution as User B
6. Check that User A receives commission

## Troubleshooting

### Email Verification Not Working

**Problem:** Users not receiving verification emails

**Solutions:**
1. Check Supabase email settings in Authentication → Providers
2. Verify email templates are configured
3. Check spam/junk folder
4. Ensure "Enable Email Confirmations" is ON
5. Check Supabase logs for email delivery errors

**Problem:** Verification link shows error

**Solutions:**
1. Verify redirect URLs are configured correctly
2. Check that Site URL matches your app URL
3. Ensure `https://natively.dev/email-confirmed` is in redirect URLs
4. Check browser console for errors

### Login Issues

**Problem:** "Please verify your email" error

**Solution:** User needs to click verification link in email

**Problem:** "Invalid email or password"

**Solutions:**
1. Check email and password are correct
2. Ensure user account exists in database
3. Check Supabase Auth logs

### Database Errors

**Problem:** "relation does not exist"

**Solution:** Run the migration again (already completed)

**Problem:** "permission denied"

**Solutions:**
1. Check RLS policies are enabled
2. Verify user is authenticated
3. Check Supabase logs for detailed error

### Commission Not Calculating

**Problem:** Referral commissions not appearing

**Solutions:**
1. Verify referral relationship exists in `referrals` table
2. Check that contribution status is 'completed'
3. Verify `process_referral_commissions` function is working
4. Check Supabase logs for function errors

## Monitoring Your App

### View Data in Supabase Dashboard

1. **Table Editor** - View and edit data directly
   - Check user registrations
   - View contributions
   - Monitor commissions
   - Track withdrawals

2. **Database** - Monitor performance
   - Check connection count
   - View query performance
   - Monitor database size

3. **Logs** - View real-time logs
   - Authentication events
   - Database queries
   - Function executions
   - Errors and warnings

4. **API** - Test API endpoints
   - Test queries
   - Verify RLS policies
   - Check function responses

## Important Dates

- **Pool Opens:** Now
- **Pool Closes:** January 15, 2025 at 12:00 UTC
- **MXI Launch:** January 15, 2025 at 12:00 UTC
- **Commission Withdrawal:** Available after 10 days + 5 active referrals

## Key Features

### User Registration
- ✅ Email verification required
- ✅ One account per person (ID number check)
- ✅ Unique email addresses
- ✅ Referral code support

### Contributions
- ✅ Minimum: 50 USDT
- ✅ Maximum: 100,000 USDT per user
- ✅ Conversion rate: 1 MXI = 10 USDT
- ✅ Types: Initial, Increase, Reinvestment

### Referral System
- ✅ 3-level commission structure
- ✅ Level 1: 3% commission
- ✅ Level 2: 2% commission
- ✅ Level 3: 1% commission
- ✅ Automatic commission calculation

### Withdrawals
- ✅ USDT commission withdrawals (requires 5 active referrals + 10 days)
- ✅ MXI withdrawals (available after January 15, 2025)
- ✅ Wallet address required
- ✅ Status tracking (pending, processing, completed, failed)

## Next Steps

1. ✅ Database setup complete
2. ⏳ Configure email verification in Supabase Dashboard
3. ⏳ Test user registration and email verification
4. ⏳ Implement Binance payment integration (see BINANCE_INTEGRATION.md)
5. ⏳ Create admin dashboard for transaction verification
6. ⏳ Test referral system
7. ⏳ Test withdrawal system

## Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Project Dashboard:** https://supabase.com/dashboard/project/aeyfnjuatbtcauiumbhn

## Security Reminders

- ✅ Never share your Supabase API keys
- ✅ Use environment variables for sensitive data
- ✅ Enable RLS on all tables
- ✅ Regularly backup your database
- ✅ Monitor authentication logs
- ✅ Keep Supabase client library updated

---

**Status:** ✅ Database setup complete. Please configure email verification settings in Supabase Dashboard.
