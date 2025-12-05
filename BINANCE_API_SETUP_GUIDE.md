
# Binance API Setup Guide - Step by Step

## 🎯 Goal
Configure Binance API credentials to enable **automatic payment verification** in your MXI Liquidity Pool app.

---

## 📋 Prerequisites

- Active Binance account
- Completed KYC verification on Binance
- Access to Supabase Dashboard
- Admin access to your project

---

## 🔑 Step 1: Create Binance API Key

### 1.1 Log in to Binance
- Go to https://www.binance.com
- Log in with your credentials
- Complete 2FA if prompted

### 1.2 Navigate to API Management
- Click on your **profile icon** (top right)
- Select **"API Management"** from dropdown menu
- Or go directly to: https://www.binance.com/en/my/settings/api-management

### 1.3 Create New API Key
1. Click **"Create API"** button
2. Choose **"System generated"** (recommended)
3. Enter a label: `MXI Pool Payment Verification`
4. Complete security verification (2FA, email, etc.)

### 1.4 Configure API Permissions
**IMPORTANT**: Only enable these permissions:

✅ **Enable Reading** - Required to read deposit history
❌ **Enable Spot & Margin Trading** - NOT needed
❌ **Enable Futures** - NOT needed
❌ **Enable Withdrawals** - NEVER enable (security risk!)

### 1.5 Save Your Credentials
1. **API Key**: Copy and save securely
2. **Secret Key**: Copy and save securely (shown only once!)

⚠️ **WARNING**: Never share your Secret Key with anyone!

---

## 💰 Step 2: Get Your Binance Wallet Address

### 2.1 Navigate to Wallet
- Click **"Wallet"** in top menu
- Select **"Spot Wallet"**

### 2.2 Find USDT
- Search for **"USDT"** in the search bar
- Click on **USDT** in the list

### 2.3 Get Deposit Address
1. Click **"Deposit"** button
2. Select **Network**: Choose **TRC20** (recommended for low fees)
   - Alternative: BEP20 (BSC) or ERC20 (Ethereum)
3. **Copy the address** that appears
4. Save this address securely

⚠️ **IMPORTANT**: Make sure you select the correct network! Users must send USDT on the same network.

---

## 🔧 Step 3: Configure Supabase Edge Function Secrets

### 3.1 Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project: `aeyfnjuatbtcauiumbhn`

### 3.2 Navigate to Edge Functions
- Click **"Edge Functions"** in left sidebar
- Click **"Manage secrets"** or **"Secrets"** tab

### 3.3 Add Environment Variables
Add these three secrets:

**1. BINANCE_API_KEY**
```
Name: BINANCE_API_KEY
Value: [paste your API key here]
```

**2. BINANCE_API_SECRET**
```
Name: BINANCE_API_SECRET
Value: [paste your secret key here]
```

**3. BINANCE_WALLET_ADDRESS**
```
Name: BINANCE_WALLET_ADDRESS
Value: [paste your USDT deposit address here]
```

### 3.4 Save Secrets
- Click **"Add secret"** for each one
- Verify all three are saved correctly

---

## 📝 Step 4: Update Code with Wallet Address

### 4.1 Open contribute.tsx
File location: `app/(tabs)/(home)/contribute.tsx`

### 4.2 Find BINANCE_WALLET_ADDRESS Constant
Look for this line (around line 30):
```typescript
const BINANCE_WALLET_ADDRESS = 'TYourBinanceWalletAddressHere123456789';
```

### 4.3 Replace with Your Address
```typescript
const BINANCE_WALLET_ADDRESS = 'YOUR_ACTUAL_BINANCE_ADDRESS';
```

Example:
```typescript
const BINANCE_WALLET_ADDRESS = 'TYxK8fN9Qn7W3mP5vR2sT4uV6wX8yZ1aB3cD5eF7gH9';
```

### 4.4 Save the File
- Save changes
- Commit to version control (if using Git)

---

## ✅ Step 5: Test the Integration

### 5.1 Create Test Payment
1. Open your app
2. Navigate to **"Contribute to Pool"**
3. Enter a small test amount (e.g., 50 USDT)
4. Click **"Create Payment"**

### 5.2 Send Test Transaction
1. Open Binance app/website
2. Go to **Wallet → Spot → USDT → Withdraw**
3. Enter the payment address shown in your app
4. Enter the exact amount
5. Select **TRC20** network
6. Complete the withdrawal

### 5.3 Verify Payment
1. Wait for transaction to complete (1-5 minutes)
2. Copy the **Transaction ID (TxID)** from Binance
3. Return to your app
4. Paste the TxID
5. Click **"Verify Payment"**

### 5.4 Check Results
**If successful:**
- ✅ You'll see "Payment verified and confirmed automatically!"
- ✅ Your balance will be updated immediately
- ✅ Yield generation will be activated

**If manual review needed:**
- 📋 You'll see "Payment submitted for manual verification"
- 📋 Admin can approve from Payment Approvals panel
- 📋 Check Edge Function logs for details

---

## 🔍 Step 6: Verify Configuration

### 6.1 Check Edge Function Logs
1. Go to Supabase Dashboard
2. Click **"Edge Functions"**
3. Select **"binance-payment-verification"**
4. Click **"Logs"** tab
5. Look for verification attempts

**Good log messages:**
```
Verifying payment MXI-1234567890-abc123 with transaction ID xyz789
Payment verified successfully, processing...
```

**Configuration issues:**
```
Binance API credentials not configured, using manual verification mode
```

### 6.2 Test Automatic Verification
- Create a real payment
- Send USDT from Binance
- Submit transaction ID
- Should verify automatically within seconds

---

## 🚨 Troubleshooting

### Issue: "Manual verification required - Binance API not configured"

**Cause**: Environment variables not set correctly

**Solution**:
1. Check Supabase Edge Function secrets
2. Verify all three variables are present:
   - BINANCE_API_KEY
   - BINANCE_API_SECRET
   - BINANCE_WALLET_ADDRESS
3. Redeploy Edge Function if needed

### Issue: "Binance API error: Invalid API-key"

**Cause**: API key is incorrect or expired

**Solution**:
1. Verify API key in Binance dashboard
2. Check if API key is still active
3. Regenerate API key if needed
4. Update in Supabase secrets

### Issue: "Transaction not found or not yet confirmed"

**Cause**: Transaction not yet confirmed on blockchain

**Solution**:
1. Wait 2-5 minutes for confirmation
2. Check transaction status on Binance
3. Try verification again
4. If still fails, admin can manually approve

### Issue: "Amount mismatch"

**Cause**: Sent amount differs from payment amount

**Solution**:
1. Verify exact amount was sent
2. Check for transaction fees
3. Admin can manually verify and approve

---

## 🔐 Security Best Practices

### API Key Security
- ✅ Store API keys only in Supabase secrets
- ✅ Never commit API keys to version control
- ✅ Never share API keys with anyone
- ✅ Disable withdrawal permissions
- ✅ Enable IP whitelist if possible
- ✅ Rotate API keys periodically

### Wallet Security
- ✅ Use a dedicated wallet for the pool
- ✅ Enable 2FA on Binance account
- ✅ Monitor wallet activity regularly
- ✅ Set up withdrawal whitelist
- ✅ Keep backup of wallet address

### Code Security
- ✅ Never expose API keys in client code
- ✅ Use environment variables
- ✅ Implement rate limiting
- ✅ Log all verification attempts
- ✅ Monitor for suspicious activity

---

## 📊 Monitoring & Maintenance

### Daily Checks
- Review payment approvals in admin panel
- Check Edge Function logs for errors
- Monitor wallet balance on Binance
- Verify automatic verifications are working

### Weekly Checks
- Review verification success rate
- Check for failed verifications
- Update API keys if needed
- Review security logs

### Monthly Checks
- Rotate API keys (recommended)
- Review and update RLS policies
- Audit payment history
- Update documentation

---

## 📞 Support Resources

### Binance Support
- Help Center: https://www.binance.com/en/support
- API Documentation: https://binance-docs.github.io/apidocs/
- Developer Forum: https://dev.binance.vision/

### Supabase Support
- Documentation: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- Community: https://github.com/supabase/supabase/discussions

---

## ✅ Configuration Checklist

- [ ] Created Binance API key
- [ ] Configured API permissions (reading only)
- [ ] Saved API key and secret securely
- [ ] Got Binance USDT deposit address (TRC20)
- [ ] Added BINANCE_API_KEY to Supabase secrets
- [ ] Added BINANCE_API_SECRET to Supabase secrets
- [ ] Added BINANCE_WALLET_ADDRESS to Supabase secrets
- [ ] Updated BINANCE_WALLET_ADDRESS in contribute.tsx
- [ ] Tested with real transaction
- [ ] Verified automatic verification works
- [ ] Documented wallet address for team
- [ ] Set up monitoring and alerts

---

## 🎉 You're All Set!

Once you complete all steps above, your MXI Liquidity Pool app will have **fully automated payment verification**!

**What happens now:**
1. Users create payments in the app
2. Users send USDT to your Binance wallet
3. Users submit transaction ID
4. System automatically verifies on Binance
5. Balance updates instantly
6. Referral commissions processed
7. Yield generation activated

**No admin intervention needed!** 🚀

---

**Need help?** Review the troubleshooting section or check Edge Function logs for detailed error messages.
