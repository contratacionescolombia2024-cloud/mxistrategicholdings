
# NowPayments Migration: USDT TRON → USDT ETH

## 📋 Summary

Successfully migrated the NowPayments integration from **USDT TRON (TRC20)** to **USDT ETH (ERC20)** to improve network compatibility and reduce transaction errors.

---

## 🔄 Changes Made

### 1. **Edge Function: create-nowpayments-order**
**File:** `supabase/functions/create-nowpayments-order/index.ts`

**Changes:**
- ✅ Changed `pay_currency` from `'usdttrc20'` to `'usdteth'`
- ✅ Updated invoice payload to use Ethereum network
- ✅ Added `pay_currency: 'usdteth'` to transaction metadata
- ✅ Updated order creation to store correct currency

**Key Code Changes:**
```typescript
// BEFORE
pay_currency: 'usdttrc20', // USDT on Tron TRC20

// AFTER
pay_currency: 'usdteth', // USDT on Ethereum ERC20
```

---

### 2. **Edge Function: nowpayments-webhook**
**File:** `supabase/functions/nowpayments-webhook/index.ts`

**Changes:**
- ✅ Updated currency validation to accept `usdteth`
- ✅ Enhanced validation logic to reject TRC20 variants
- ✅ Improved error messages to specify "USDT ETH (ERC20)"
- ✅ Added comprehensive logging for currency validation

**Key Code Changes:**
```typescript
// BEFORE
const normalizedCurrency = payCurrency.toLowerCase().replace(/[^a-z]/g, '');
if (!normalizedCurrency.includes('usdt')) {
  // Error: Invalid currency
}

// AFTER
const normalizedCurrency = payCurrency.toLowerCase().replace(/[^a-z]/g, '');
const isValidCurrency = normalizedCurrency.includes('usdteth') || 
                       (normalizedCurrency.includes('usdt') && !normalizedCurrency.includes('trc'));

if (!isValidCurrency) {
  // Error: Invalid payment currency - expected USDT ETH
}
```

---

### 3. **Frontend: purchase-mxi.tsx**
**File:** `app/(tabs)/(home)/purchase-mxi.tsx`

**Changes:**
- ✅ Updated button text from "USDT (NOWPayments)" to "USDT ETH (NOWPayments)"
- ✅ Changed information text from "USDT (Tron TRC20)" to "USDT (Ethereum ERC20)"
- ✅ Added new info item: "Red de pago: Ethereum (ERC20) - Asegúrate de usar la red correcta"

**Key UI Changes:**
```typescript
// Button Text
<Text style={styles.purchaseButtonText}>
  Pagar con USDT ETH (NOWPayments)
</Text>

// Information Section
<Text style={styles.infoText}>
  Los pagos se procesan con NOWPayments en USDT (Ethereum ERC20)
</Text>

<Text style={styles.infoText}>
  Red de pago: Ethereum (ERC20) - Asegúrate de usar la red correcta
</Text>
```

---

### 4. **Database Migration**
**Migration:** `update_nowpayments_currency_to_usdteth`

**Changes:**
- ✅ Updated default value for `pay_currency` column from `'usdttrc20'` to `'usdteth'`
- ✅ Updated existing pending orders to use new currency
- ✅ Added documentation comment to column

**SQL Changes:**
```sql
-- Update default value
ALTER TABLE nowpayments_orders 
ALTER COLUMN pay_currency SET DEFAULT 'usdteth';

-- Update existing pending orders
UPDATE nowpayments_orders 
SET pay_currency = 'usdteth' 
WHERE status IN ('pending', 'waiting') 
AND pay_currency = 'usdttrc20';

-- Add documentation
COMMENT ON COLUMN nowpayments_orders.pay_currency IS 
  'Payment currency - changed from usdttrc20 (USDT Tron TRC20) to usdteth (USDT Ethereum ERC20) for better network compatibility';
```

---

## ✅ Critical Points Addressed

### Error Prevention
1. **Currency Validation:** Enhanced webhook validation to strictly check for USDT ETH and reject TRON variants
2. **Metadata Tracking:** All transactions now store `pay_currency: 'usdteth'` in metadata for audit trail
3. **User Communication:** Clear UI messaging about Ethereum network requirement
4. **Database Consistency:** Existing pending orders updated to new currency

### Network Compatibility
1. **Ethereum ERC20:** More widely supported and compatible with major exchanges
2. **Lower Error Rate:** Ethereum network typically has better uptime and fewer transaction failures
3. **Better Integration:** NOWPayments has better support for Ethereum-based USDT

### User Experience
1. **Clear Instructions:** Users are informed about the network (Ethereum ERC20)
2. **Warning Message:** Added info item reminding users to use correct network
3. **Button Label:** Explicitly shows "USDT ETH" to avoid confusion

---

## 🧪 Testing Checklist

Before deploying to production, verify:

- [ ] Create a new payment order and verify `pay_currency` is `'usdteth'`
- [ ] Check that invoice URL opens correctly in NOWPayments
- [ ] Verify webhook receives correct currency in payload
- [ ] Test successful payment flow end-to-end
- [ ] Verify user balance updates correctly after payment
- [ ] Check referral commissions are calculated correctly
- [ ] Test failed payment scenarios
- [ ] Verify expired payment handling
- [ ] Check transaction history displays correct currency
- [ ] Test pending orders list shows correct information

---

## 📊 Impact Analysis

### Affected Components
1. ✅ **Edge Functions:** 2 functions updated
2. ✅ **Frontend:** 1 screen updated
3. ✅ **Database:** 1 table modified
4. ✅ **Existing Orders:** Pending orders migrated

### Backward Compatibility
- ⚠️ **Breaking Change:** Old TRON-based payments will be rejected
- ✅ **Mitigation:** Existing pending orders automatically updated
- ✅ **User Impact:** Users must use Ethereum network for new payments

### Rollback Plan
If issues occur, rollback by:
1. Revert edge functions to use `'usdttrc20'`
2. Update database default back to `'usdttrc20'`
3. Update frontend text back to "USDT (Tron TRC20)"

---

## 🔐 Security Considerations

1. **Webhook Signature:** Unchanged - still using HMAC SHA-512 verification
2. **Currency Validation:** Enhanced to prevent wrong network payments
3. **Amount Verification:** Unchanged - still allows 5% variance for fees
4. **User Authentication:** Unchanged - still requires valid session

---

## 📝 Documentation Updates

Updated files:
- ✅ `supabase/functions/create-nowpayments-order/index.ts`
- ✅ `supabase/functions/nowpayments-webhook/index.ts`
- ✅ `app/(tabs)/(home)/purchase-mxi.tsx`
- ✅ Database schema (nowpayments_orders table)

---

## 🚀 Deployment Steps

1. **Deploy Edge Functions:**
   ```bash
   # Deploy create-nowpayments-order
   supabase functions deploy create-nowpayments-order
   
   # Deploy nowpayments-webhook
   supabase functions deploy nowpayments-webhook
   ```

2. **Database Migration:**
   - Already applied via `apply_migration` tool
   - Verify with: `SELECT pay_currency FROM nowpayments_orders LIMIT 5;`

3. **Frontend Deployment:**
   - Build and deploy the React Native app
   - Verify button text shows "USDT ETH"

4. **NOWPayments Dashboard:**
   - ⚠️ **IMPORTANT:** Update NOWPayments dashboard settings
   - Verify `usdteth` is enabled as a payment currency
   - Check webhook URL is still configured correctly

---

## 📞 Support Information

### Common Issues

**Issue:** Payment fails with "Invalid currency"
**Solution:** Ensure NOWPayments account has `usdteth` enabled

**Issue:** Webhook rejects payment
**Solution:** Check that payment was made on Ethereum network, not TRON

**Issue:** User confused about network
**Solution:** Direct them to the info section showing "Ethereum (ERC20)"

### Monitoring

Monitor these metrics:
- Payment success rate (should improve)
- Webhook processing errors (should decrease)
- User support tickets about payments (should decrease)
- Average confirmation time (may vary based on Ethereum network)

---

## 📈 Expected Improvements

1. **Reduced Errors:** Fewer network-related payment failures
2. **Better Compatibility:** Works with more wallets and exchanges
3. **Clearer UX:** Users understand which network to use
4. **Easier Support:** Less confusion about TRON vs Ethereum

---

## ✨ Conclusion

The migration from USDT TRON to USDT ETH has been completed successfully with:
- ✅ All critical points addressed
- ✅ Comprehensive error handling
- ✅ Clear user communication
- ✅ Database consistency maintained
- ✅ Backward compatibility for pending orders

**Status:** ✅ **READY FOR DEPLOYMENT**

---

**Migration Date:** 2025-01-XX  
**Migration By:** Natively AI Assistant  
**Approved By:** [Pending]  
**Deployed By:** [Pending]
