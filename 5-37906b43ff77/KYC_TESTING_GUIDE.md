
# KYC Verification Testing Guide

## Quick Test Steps

### For Users

1. **Login to the app**
   - Use your registered email and password
   - Ensure you're properly authenticated

2. **Navigate to KYC Verification**
   - Go to Profile tab
   - Tap on "KYC Verification" option
   - Or navigate directly to the KYC screen

3. **Fill Out Personal Information**
   - Enter your full legal name (as it appears on your ID)
   - Select document type:
     - National ID
     - Passport
     - Driver's License
   - Enter your document number

4. **Upload Documents**
   - Tap "Tap to upload front" button
   - Select a clear photo of the front of your ID
   - Wait for upload confirmation (✅ Upload Successful)
   - If not passport, tap "Tap to upload back" button
   - Select a clear photo of the back of your ID
   - Wait for upload confirmation

5. **Submit KYC Verification**
   - Review all information
   - Tap "Submit KYC Verification" button
   - Read the confirmation dialog
   - Tap "Submit" to confirm
   - Wait for success message

6. **Verify Submission**
   - You should see: "✅ KYC Submitted Successfully!"
   - Status should change to "Under Review"
   - You should see a pending notice with timeline

### For Admins

1. **Login as Admin**
   - Use admin credentials
   - Navigate to Admin Panel

2. **Check KYC Approvals**
   - Go to "KYC Approvals" section
   - You should see new submissions in the "Pending" tab
   - Real-time updates should show new submissions automatically

3. **Review Submission**
   - Tap on a pending KYC verification
   - Review all submitted information:
     - Full name
     - Email
     - Document type
     - Document number
   - View uploaded documents:
     - Tap on document images to view full size
     - Verify documents are clear and readable

4. **Make Decision**
   - **To Approve**:
     - Optionally add admin notes
     - Tap "Approve" button
     - Confirm approval
     - User will be notified immediately
   
   - **To Reject**:
     - Add rejection reason (required)
     - Tap "Reject" button
     - Confirm rejection
     - User will be notified with reason

5. **Verify Status Update**
   - Check that status changed to "Approved" or "Rejected"
   - Verify user's kyc_status updated in database
   - Confirm user received notification

## Expected Console Logs

### During Submission (User Side)
```
Starting KYC submission...
User ID: [uuid]
Full Name: John Doe
Document Type: national_id
Document Number: ABC123456
Document Front URL: https://[...]/front_[timestamp].jpg
Document Back URL: https://[...]/back_[timestamp].jpg
Session verified, inserting KYC data...
KYC data inserted successfully: { id: [...], user_id: [...], ... }
Updating user KYC status...
KYC submission completed successfully!
```

### During Review (Admin Side)
```
New KYC submission: { new: { id: [...], user_id: [...], status: 'pending', ... } }
KYC updated: { new: { id: [...], status: 'approved', ... } }
```

## Troubleshooting

### Issue: "No active session" Error
**Solution**: 
- Log out and log back in
- Clear app cache
- Restart the app

### Issue: Upload fails
**Solution**:
- Check internet connection
- Ensure image is under 10MB
- Use supported formats (JPEG, PNG, WebP)
- Try a different image

### Issue: Submit button doesn't work
**Solution**:
- Check all required fields are filled
- Ensure both documents are uploaded (unless passport)
- Check console for error messages
- Verify user is authenticated

### Issue: Admin doesn't see submission
**Solution**:
- Refresh the KYC Approvals page
- Check filter is set to "Pending"
- Verify admin has proper permissions
- Check database for the record

### Issue: Status doesn't update
**Solution**:
- Check real-time subscription is active
- Refresh the page
- Check database trigger is working
- Verify RLS policies are correct

## Database Verification

### Check if KYC was submitted
```sql
SELECT * FROM kyc_verifications 
WHERE user_id = '[user_id]' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check user's KYC status
```sql
SELECT id, name, email, kyc_status, kyc_verified_at 
FROM users 
WHERE id = '[user_id]';
```

### Check uploaded documents
```sql
SELECT name, created_at, metadata 
FROM storage.objects 
WHERE bucket_id = 'kyc-documents' 
AND (storage.foldername(name))[1] = '[user_id]';
```

### Check RLS policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'kyc_verifications';
```

## Success Criteria

✅ **User can submit KYC**
- Form validates correctly
- Documents upload successfully
- Submission completes without errors
- Success message displays
- Status updates to "Under Review"

✅ **Admin can review KYC**
- Submission appears in pending list
- All information is visible
- Documents can be viewed
- Approval/rejection works
- Status updates correctly

✅ **Real-time updates work**
- User receives notification of status change
- Admin receives notification of new submission
- Status updates without page refresh

✅ **Data integrity**
- All data saved correctly in database
- Documents stored in correct location
- User status synchronized
- Audit trail maintained

## Test Scenarios

### Scenario 1: Happy Path
1. User submits complete KYC with all documents
2. Admin reviews and approves
3. User receives approval notification
4. User can proceed with withdrawals (if other requirements met)

### Scenario 2: Rejection and Resubmission
1. User submits KYC with unclear documents
2. Admin reviews and rejects with reason
3. User receives rejection notification with reason
4. User uploads better documents
5. User resubmits KYC
6. Admin reviews and approves

### Scenario 3: Passport Submission
1. User selects "Passport" as document type
2. Only front upload is required
3. User submits with single document
4. Admin reviews passport
5. Admin approves or rejects

### Scenario 4: Multiple Users
1. Multiple users submit KYC simultaneously
2. Admin sees all submissions in queue
3. Admin reviews in order
4. Each user receives their own notification
5. No cross-contamination of data

## Performance Checks

- [ ] Submission completes in under 5 seconds
- [ ] Image upload completes in under 10 seconds per image
- [ ] Admin panel loads pending KYC in under 3 seconds
- [ ] Real-time notifications arrive within 2 seconds
- [ ] Document images load in under 5 seconds

## Security Checks

- [ ] Users can only see their own KYC data
- [ ] Users cannot modify approved/rejected KYC
- [ ] Users can only upload to their own folder
- [ ] Admins can see all KYC submissions
- [ ] Non-admins cannot access admin panel
- [ ] Document URLs are properly secured

## Final Verification

After testing, verify:

1. **Database State**
   - KYC record exists with correct data
   - User's kyc_status is updated
   - Documents are in storage
   - Timestamps are correct

2. **User Experience**
   - Clear feedback at each step
   - No confusing error messages
   - Status is always visible
   - Next steps are clear

3. **Admin Experience**
   - Easy to find pending submissions
   - All information is accessible
   - Decision process is straightforward
   - Audit trail is maintained

4. **System Health**
   - No errors in console
   - No errors in database logs
   - Real-time subscriptions working
   - Storage policies correct

## Support Information

If you encounter issues during testing:

1. **Capture Console Logs**
   - Open browser developer tools
   - Copy all console messages
   - Include in support request

2. **Capture Error Messages**
   - Screenshot any error alerts
   - Note exact error text
   - Include in support request

3. **Provide Context**
   - What were you trying to do?
   - What did you expect to happen?
   - What actually happened?
   - Can you reproduce the issue?

4. **Check Documentation**
   - Review KYC_VERIFICATION_FIX_SUMMARY.md
   - Check ADMIN_KYC_GUIDE.md
   - Review USER_KYC_GUIDE.md

## Contact

For technical support or questions about KYC verification:
- Check the documentation files
- Review console logs for errors
- Test with different user accounts
- Verify database state
