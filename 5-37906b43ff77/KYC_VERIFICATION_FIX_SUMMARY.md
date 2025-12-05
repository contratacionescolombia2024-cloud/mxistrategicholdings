
# KYC Verification Fix Summary

## Issue Reported
The user reported that the KYC verification submit button was not working and documents were not being sent to the database for admin review.

## Root Cause Analysis
The issue was caused by incorrect Row Level Security (RLS) policies on the `kyc_verifications` table. The INSERT policy was set for the `{public}` role instead of `{authenticated}` role, which prevented authenticated users from submitting their KYC documents.

## Changes Made

### 1. Database Migration - RLS Policy Fix
**File**: Migration `fix_kyc_verification_rls_policies`

Fixed the RLS policies on the `kyc_verifications` table:

- **INSERT Policy**: Changed from `{public}` to `{authenticated}` role
  - Allows authenticated users to insert their own KYC verification records
  - Enforces that `user_id` must match `auth.uid()`

- **UPDATE Policy**: Changed from `{public}` to `{authenticated}` role
  - Allows users to update only their own pending KYC records
  - Enforces that `user_id` must match `auth.uid()` and status is 'pending'

- **SELECT Policy**: Changed from `{public}` to `{authenticated}` role
  - Allows users to view only their own KYC records
  - Enforces that `user_id` must match `auth.uid()`

### 2. Enhanced KYC Verification Screen
**File**: `app/(tabs)/(home)/kyc-verification.tsx`

Improvements made:

#### Enhanced Error Handling
- Added comprehensive console logging throughout the submission process
- Added session verification before submission
- Improved error messages with specific details
- Added validation for all required fields

#### Better User Feedback
- Clear loading states during submission
- Detailed success message explaining next steps
- Specific error messages for different failure scenarios
- Real-time status updates via Supabase subscriptions

#### Improved Data Flow
1. **Validation**: Checks all required fields before submission
2. **Session Check**: Verifies user has an active authenticated session
3. **Database Insert**: Inserts KYC verification record with all document URLs
4. **User Status Update**: Updates user's `kyc_status` to 'pending'
5. **Context Update**: Updates local user context
6. **Success Feedback**: Shows detailed success message
7. **Navigation**: Returns to previous screen after confirmation

#### Console Logging
Added detailed logging at each step:
- User authentication status
- Form data being submitted
- Session verification
- Database operation results
- Error details with codes and messages

## How It Works Now

### User Submission Flow
1. User fills out KYC form with personal information
2. User uploads document images (front and back)
3. Images are uploaded to Supabase Storage (`kyc-documents` bucket)
4. User clicks "Submit KYC Verification"
5. System validates all required fields
6. System verifies user has active session
7. System inserts record into `kyc_verifications` table
8. System updates user's `kyc_status` to 'pending'
9. User receives success confirmation
10. Real-time subscription notifies user of status changes

### Admin Review Flow
1. Admin receives real-time notification of new KYC submission
2. Admin navigates to KYC Approvals screen
3. Admin reviews submitted documents and information
4. Admin can:
   - **Approve**: Sets status to 'approved', updates user's `kyc_status`
   - **Reject**: Sets status to 'rejected', provides rejection reason
5. User receives real-time notification of decision
6. User can view status and reason in KYC Verification screen

## Database Structure

### kyc_verifications Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users.id)
- status (text: 'pending', 'under_review', 'approved', 'rejected')
- full_name (text)
- document_type (text: 'passport', 'national_id', 'drivers_license')
- document_number (text)
- document_front_url (text, nullable)
- document_back_url (text, nullable)
- selfie_url (text, nullable)
- rejection_reason (text, nullable)
- submitted_at (timestamp)
- reviewed_at (timestamp, nullable)
- reviewed_by (uuid, nullable, foreign key to admin_users.id)
- admin_notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### RLS Policies
```sql
-- Users can insert their own KYC
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid())

-- Users can view their own KYC
FOR SELECT TO authenticated
USING (user_id = auth.uid())

-- Users can update their own pending KYC
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid())

-- Admins can read all KYC verifications
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))

-- Admins can update all KYC verifications
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
```

## Storage Policies

### kyc-documents Bucket
```sql
-- Users can upload their own KYC documents
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Users can view their own KYC documents
FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Users can update their own KYC documents
FOR UPDATE TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Users can delete their own KYC documents
FOR DELETE TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Admins can view all KYC documents
FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
```

## Real-Time Notifications

### Database Trigger
A trigger `on_kyc_submission` fires on INSERT and UPDATE operations on the `kyc_verifications` table, calling the `notify_kyc_submission()` function to send real-time notifications.

### Subscription Channels
- **User Side**: Subscribes to updates on their own KYC records
- **Admin Side**: Subscribes to all new KYC submissions and updates

## Testing Checklist

### User Testing
- [ ] User can access KYC verification screen
- [ ] User can fill out personal information
- [ ] User can select document type
- [ ] User can upload front document image
- [ ] User can upload back document image (if not passport)
- [ ] User receives upload success confirmation
- [ ] User can submit KYC verification
- [ ] User receives submission success message
- [ ] User's status updates to "Under Review"
- [ ] User can view submission status
- [ ] User receives notification when admin reviews

### Admin Testing
- [ ] Admin receives notification of new submission
- [ ] Admin can view pending KYC verifications
- [ ] Admin can view submitted documents
- [ ] Admin can view user information
- [ ] Admin can approve KYC verification
- [ ] Admin can reject KYC verification with reason
- [ ] User receives notification of approval/rejection
- [ ] User's kyc_status updates correctly

## Troubleshooting

### If Submission Still Fails

1. **Check User Authentication**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```

2. **Check RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'kyc_verifications';
   ```

3. **Check Storage Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

4. **Check Database Logs**
   - Navigate to Supabase Dashboard > Database > Logs
   - Look for any errors related to INSERT operations

5. **Check Browser Console**
   - Open browser developer tools
   - Check console for detailed error messages
   - Look for network errors in Network tab

### Common Issues

1. **"No active session" Error**
   - User needs to log out and log back in
   - Session may have expired

2. **"Permission denied" Error**
   - RLS policies may not be correctly configured
   - User may not be properly authenticated

3. **"Upload failed" Error**
   - Check storage bucket exists
   - Check storage policies are correct
   - Check file size limits (10MB max)
   - Check allowed MIME types

4. **"Insert failed" Error**
   - Check all required fields are provided
   - Check document_type is valid enum value
   - Check user_id exists in users table

## Success Indicators

When working correctly, you should see:

1. **Console Logs** (in order):
   ```
   Starting KYC submission...
   User ID: [uuid]
   Full Name: [name]
   Document Type: [type]
   Document Number: [number]
   Document Front URL: [url]
   Document Back URL: [url]
   Session verified, inserting KYC data...
   KYC data inserted successfully: [data]
   Updating user KYC status...
   KYC submission completed successfully!
   ```

2. **User Sees**:
   - Success alert with detailed next steps
   - Status changes to "Under Review"
   - Pending notice with timeline information

3. **Admin Sees**:
   - New KYC verification in pending list
   - All submitted documents and information
   - Ability to approve or reject

## Additional Notes

- Document images are stored in Supabase Storage under `kyc-documents/{user_id}/`
- Maximum file size: 10MB
- Allowed formats: JPEG, JPG, PNG, WebP, PDF
- Review time: Typically 24-48 hours
- Users can resubmit if rejected
- Only one active KYC submission per user at a time

## Support

If issues persist after implementing these fixes:

1. Check Supabase project logs for detailed error messages
2. Verify all RLS policies are correctly applied
3. Ensure storage bucket and policies are configured
4. Test with a fresh user account
5. Contact support with console logs and error messages
