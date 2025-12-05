
# Manual Payment Verification - Deployment Checklist

## 📋 Pre-Deployment

### Environment Variables
- [ ] `NOWPAYMENTS_API_KEY` configured in Supabase
- [ ] `SUPABASE_URL` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `NOWPAYMENTS_IPN_SECRET` configured

### Database
- [ ] `payments` table exists with all required columns
- [ ] `users` table exists with all required columns
- [ ] `metrics` table exists
- [ ] `transaction_history` table exists
- [ ] `admin_users` table exists
- [ ] `payment_webhook_logs` table exists
- [ ] All RLS policies are configured correctly

### Edge Functions
- [ ] `nowpayments-webhook` deployed and working
- [ ] `auto-verify-payments` deployed and working
- [ ] `check-nowpayments-status` deployed and working
- [ ] `manual-verify-payment` ready to deploy

## 🚀 Deployment Steps

### Step 1: Deploy Edge Function
```bash
# Deploy the new manual-verify-payment function
supabase functions deploy manual-verify-payment

# Verify deployment
supabase functions list
```

- [ ] Function deployed successfully
- [ ] Function appears in Supabase dashboard
- [ ] Function URL is accessible

### Step 2: Test Edge Function
```bash
# Test with curl (replace with actual values)
curl -X POST \
  https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/manual-verify-payment \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "TEST_ORDER_ID"}'
```

- [ ] Function responds correctly
- [ ] Authentication works
- [ ] Error handling works
- [ ] Logging is visible in dashboard

### Step 3: Deploy Frontend Changes
```bash
# Build and deploy the app
npm run build
# Or deploy to your hosting platform
```

- [ ] `payment-history.tsx` updated
- [ ] `manual-payment-credit.tsx` updated
- [ ] App builds successfully
- [ ] No TypeScript errors
- [ ] No runtime errors

### Step 4: Test User Interface

**User Interface**:
- [ ] Navigate to Payment History
- [ ] See list of payments
- [ ] "Verify Payment" button appears for pending payments
- [ ] Button is disabled for confirmed payments
- [ ] Click "Verify Payment" works
- [ ] Loading state shows correctly
- [ ] Success message appears
- [ ] Error message appears (test with invalid order)
- [ ] Balance updates after verification

**Admin Interface**:
- [ ] Navigate to Admin → Manual Payment Credit
- [ ] Search for payment by Order ID
- [ ] Payment details display correctly
- [ ] User information displays correctly
- [ ] "Verify and Credit Payment" button works
- [ ] Loading state shows correctly
- [ ] Success message appears
- [ ] Error message appears (test with invalid order)
- [ ] Payment status updates after verification

## ✅ Post-Deployment Testing

### Test Case 1: Successful Verification (User)
1. [ ] Create test payment in NOWPayments
2. [ ] Complete payment
3. [ ] Login as test user
4. [ ] Navigate to Payment History
5. [ ] Click "Verify Payment"
6. [ ] Verify MXI credited
7. [ ] Verify balance updated
8. [ ] Verify payment status changed to "confirmed"
9. [ ] Verify metrics updated

### Test Case 2: Successful Verification (Admin)
1. [ ] Login as admin
2. [ ] Navigate to Manual Payment Credit
3. [ ] Enter test Order ID
4. [ ] Click "Search Payment"
5. [ ] Review payment details
6. [ ] Click "Verify and Credit Payment"
7. [ ] Verify MXI credited
8. [ ] Verify user balance updated
9. [ ] Verify payment status changed
10. [ ] Verify metrics updated

### Test Case 3: Already Credited
1. [ ] Use Order ID from Test Case 1
2. [ ] Try to verify again
3. [ ] Verify "already_credited" message appears
4. [ ] Verify balance not changed
5. [ ] Verify no double-crediting occurred

### Test Case 4: Pending Payment
1. [ ] Create test payment in NOWPayments
2. [ ] Do NOT complete payment
3. [ ] Try to verify
4. [ ] Verify status updated but not credited
5. [ ] Verify appropriate message shown

### Test Case 5: Unauthorized Access
1. [ ] Login as User A
2. [ ] Try to verify User B's payment
3. [ ] Verify 403 error returned
4. [ ] Verify no changes made

### Test Case 6: Invalid Order ID
1. [ ] Enter invalid Order ID
2. [ ] Try to verify
3. [ ] Verify "Payment not found" error
4. [ ] Verify no changes made

### Test Case 7: NOWPayments API Error
1. [ ] Temporarily disable NOWPayments API key
2. [ ] Try to verify payment
3. [ ] Verify appropriate error message
4. [ ] Re-enable API key
5. [ ] Verify verification works again

## 🔍 Monitoring

### Logs to Check
- [ ] Edge function logs in Supabase dashboard
- [ ] No unexpected errors
- [ ] Request IDs are unique
- [ ] All steps logged correctly
- [ ] Success/error messages clear

### Metrics to Monitor
- [ ] Number of manual verifications per day
- [ ] Success rate of manual verifications
- [ ] Average response time
- [ ] Error rate and types
- [ ] Double-crediting attempts (should be 0)

### Database Checks
```sql
-- Check recent manual verifications
SELECT * FROM payments 
WHERE status = 'confirmed' 
AND confirmed_at > NOW() - INTERVAL '1 hour'
ORDER BY confirmed_at DESC;

-- Check for double-crediting
SELECT order_id, COUNT(*) as count
FROM payments
WHERE status = 'confirmed'
GROUP BY order_id
HAVING COUNT(*) > 1;

-- Check user balances
SELECT id, email, mxi_balance, usdt_contributed
FROM users
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Check metrics
SELECT * FROM metrics;
```

- [ ] No duplicate confirmed payments
- [ ] User balances correct
- [ ] Metrics updated correctly
- [ ] Transaction history updated

## 📚 Documentation

### Documentation to Review
- [ ] `MANUAL_VERIFICATION_IMPLEMENTATION.md` is complete
- [ ] `MANUAL_VERIFICATION_QUICK_REFERENCE.md` is complete
- [ ] `MANUAL_VERIFICATION_SUMMARY.md` is complete
- [ ] All code is commented
- [ ] API endpoints documented
- [ ] Error codes documented

### User Communication
- [ ] Announce new feature to users
- [ ] Provide link to quick reference guide
- [ ] Explain when to use manual verification
- [ ] Provide support contact information

### Admin Training
- [ ] Train admins on new interface
- [ ] Explain verification process
- [ ] Review error handling
- [ ] Practice with test payments
- [ ] Provide troubleshooting guide

## 🔒 Security Review

### Authentication
- [ ] JWT validation working
- [ ] Session validation working
- [ ] Service role key secure
- [ ] No tokens in logs

### Authorization
- [ ] Users can only verify own payments
- [ ] Admins can verify any payment
- [ ] Admin status checked correctly
- [ ] No privilege escalation possible

### Data Validation
- [ ] Order ID validated
- [ ] Payment existence verified
- [ ] User ownership verified
- [ ] NOWPayments response validated

### Double-Crediting Prevention
- [ ] Payment status checked before crediting
- [ ] Atomic database operations
- [ ] Clear success/error responses
- [ ] Logging of all operations

## 🚨 Rollback Plan

### If Issues Occur

**Minor Issues** (UI bugs, non-critical errors):
1. [ ] Document the issue
2. [ ] Create hotfix
3. [ ] Test hotfix
4. [ ] Deploy hotfix
5. [ ] Verify fix

**Major Issues** (data corruption, security issues):
1. [ ] Immediately disable edge function
2. [ ] Revert frontend changes
3. [ ] Investigate issue
4. [ ] Fix issue
5. [ ] Re-test thoroughly
6. [ ] Re-deploy

### Rollback Commands
```bash
# Disable edge function
supabase functions delete manual-verify-payment

# Revert frontend
git revert <commit-hash>
npm run build
# Deploy reverted version
```

## ✅ Sign-Off

### Development Team
- [ ] Code reviewed
- [ ] Tests passed
- [ ] Documentation complete
- [ ] Ready for deployment

**Developer**: _________________ Date: _______

### QA Team
- [ ] All test cases passed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Ready for production

**QA Lead**: _________________ Date: _______

### Product Team
- [ ] Feature meets requirements
- [ ] User experience acceptable
- [ ] Documentation adequate
- [ ] Ready for release

**Product Manager**: _________________ Date: _______

### Operations Team
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Ready for deployment

**DevOps Lead**: _________________ Date: _______

## 📊 Success Criteria

### Day 1
- [ ] No critical errors
- [ ] At least 5 successful manual verifications
- [ ] No double-crediting incidents
- [ ] User feedback positive

### Week 1
- [ ] Manual verification success rate > 95%
- [ ] Average response time < 5 seconds
- [ ] No security incidents
- [ ] User adoption growing

### Month 1
- [ ] Manual verifications < 10% of total verifications
- [ ] Automatic verification working well
- [ ] User satisfaction high
- [ ] No major issues

## 🎉 Post-Deployment

### Immediate Actions
- [ ] Monitor logs for first hour
- [ ] Check for any errors
- [ ] Verify first manual verifications work
- [ ] Respond to any user issues quickly

### First Week
- [ ] Daily monitoring of metrics
- [ ] Review user feedback
- [ ] Address any issues promptly
- [ ] Document any learnings

### First Month
- [ ] Weekly review of metrics
- [ ] Analyze usage patterns
- [ ] Identify improvement opportunities
- [ ] Plan next iteration

## 📝 Notes

### Deployment Date: _________________

### Deployment Team:
- Developer: _________________
- QA: _________________
- DevOps: _________________
- Product: _________________

### Issues Encountered:
_________________________________________________
_________________________________________________
_________________________________________________

### Resolutions:
_________________________________________________
_________________________________________________
_________________________________________________

### Lessons Learned:
_________________________________________________
_________________________________________________
_________________________________________________

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed

**Overall Deployment Status**: _________________

**Approved for Production**: ⬜ Yes | ⬜ No

**Signature**: _________________ Date: _______
