
# OKX Integration Setup Checklist

## ⚠️ IMPORTANT: Update OKX Wallet Address

Before using the app in production, you **MUST** update the OKX wallet address in the following file:

### File to Update
📁 `app/(tabs)/(home)/contribute.tsx`

**Line to change:**
```typescript
// CURRENT (placeholder):
const OKX_WALLET_ADDRESS = '0xYourOKXWalletAddressHere';

// CHANGE TO (your actual OKX wallet address):
const OKX_WALLET_ADDRESS = 'YOUR_ACTUAL_OKX_WALLET_ADDRESS';
```

## Setup Steps

### 1. Get Your OKX Wallet Address
- [ ] Log in to OKX (https://www.okx.com)
- [ ] Go to: **Assets** → **Funding Account**
- [ ] Select **USDT**
- [ ] Click **Deposit**
- [ ] Choose **TRC20** network (recommended for low fees)
- [ ] Copy your deposit address

### 2. Create OKX API Keys
- [ ] Go to: **Profile** → **API** → **Create API Key**
- [ ] Select permissions: **Read** (for deposit history)
- [ ] Save these securely:
  - API Key
  - Secret Key
  - Passphrase

### 3. Configure Supabase Secrets
Run these commands in your terminal:

```bash
# Set OKX API credentials
supabase secrets set OKX_API_KEY="your_api_key_here"
supabase secrets set OKX_API_SECRET="your_secret_key_here"
supabase secrets set OKX_API_PASSPHRASE="your_passphrase_here"
supabase secrets set OKX_WALLET_ADDRESS="your_wallet_address_here"
```

### 4. Update Frontend Code
- [ ] Open `app/(tabs)/(home)/contribute.tsx`
- [ ] Replace `0xYourOKXWalletAddressHere` with your actual OKX wallet address
- [ ] Save the file

### 5. Test the Integration
- [ ] Create a test payment with minimum amount (20 USDT)
- [ ] Send test payment from OKX
- [ ] Upload QR code screenshot
- [ ] Enter transaction ID
- [ ] Verify automatic confirmation works

### 6. Verify Edge Function
- [ ] Check Edge Function is deployed: `okx-payment-verification`
- [ ] View logs: `supabase functions logs okx-payment-verification`
- [ ] Confirm no errors in logs

## Verification Checklist

### Database
- [x] Table `okx_payments` exists
- [x] RLS policies are active
- [x] Column `qr_code_url` exists

### Edge Function
- [x] `okx-payment-verification` is deployed
- [ ] Environment variables are set
- [ ] Function responds to test requests

### Frontend
- [ ] OKX wallet address is updated in `contribute.tsx`
- [x] Payment flow works end-to-end
- [x] Admin panel shows OKX payments

### Storage
- [x] `payment-qr-codes` bucket exists
- [x] Users can upload QR code images
- [x] Public access is configured

## Testing Scenarios

### Scenario 1: Successful Automatic Verification
1. User creates payment
2. User sends USDT from OKX
3. User uploads QR code
4. User enters TxID
5. System automatically verifies and confirms
6. Balance updated immediately

**Expected Result**: ✅ Payment confirmed, balance updated

### Scenario 2: Manual Verification Required
1. User creates payment
2. User sends USDT from OKX
3. User uploads QR code
4. User enters TxID
5. Automatic verification fails (e.g., API not configured)
6. Payment goes to admin panel
7. Admin manually approves

**Expected Result**: ✅ Payment confirmed after admin approval

### Scenario 3: Payment Expiration
1. User creates payment
2. User does NOT send payment within 30 minutes
3. Payment expires

**Expected Result**: ✅ Payment marked as expired

## Common Issues & Solutions

### Issue: "Manual verification required"
**Cause**: OKX API credentials not set
**Solution**: Set environment variables in Supabase

### Issue: "Transaction not found"
**Cause**: Transaction not yet confirmed on blockchain
**Solution**: Wait 2-5 minutes and try again

### Issue: "Amount mismatch"
**Cause**: Network fees deducted from amount
**Solution**: System allows 1% tolerance, should auto-approve

### Issue: Wallet address not showing
**Cause**: Placeholder address not updated
**Solution**: Update `OKX_WALLET_ADDRESS` in contribute.tsx

## Security Notes

✅ **DO:**
- Keep API keys secure
- Use environment variables for secrets
- Test with small amounts first
- Monitor admin panel regularly
- Enable 2FA on OKX account

❌ **DON'T:**
- Hardcode API keys in frontend
- Share API credentials
- Use same API key for multiple apps
- Disable RLS policies
- Skip testing before production

## Support Contacts

If you encounter issues:
1. Check Edge Function logs
2. Verify API credentials
3. Test with minimum amount (20 USDT)
4. Review OKX_INTEGRATION_GUIDE.md
5. Contact technical support

## Deployment Checklist

Before going live:
- [ ] OKX wallet address updated
- [ ] API credentials configured
- [ ] Test payment completed successfully
- [ ] Admin panel tested
- [ ] Edge Function logs reviewed
- [ ] RLS policies verified
- [ ] Storage bucket configured
- [ ] Documentation reviewed

---

**Status**: 🟡 Requires OKX wallet address update
**Priority**: 🔴 HIGH - Must complete before production use
**Estimated Time**: 15-30 minutes
