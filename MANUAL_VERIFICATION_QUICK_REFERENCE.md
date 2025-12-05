
# Manual Payment Verification - Quick Reference

## For Users

### How to Verify a Payment Manually

1. **Navigate to Payment History**
   - Go to Home → Payment History
   - Or use the menu to access "Historial de Pagos"

2. **Find Your Pending Payment**
   - Look for payments with status "Esperando Pago" or "Pendiente"
   - These will have a "Verify Payment" button

3. **Click "Verify Payment"**
   - The system will check with NOWPayments
   - Wait for the verification to complete (usually 5-10 seconds)

4. **Check the Result**
   - ✅ **Success**: MXI credited to your account
   - ⏳ **Pending**: Payment not confirmed yet, try again later
   - ℹ️ **Already Credited**: Payment was already processed
   - ❌ **Error**: Contact support with your Order ID

### When to Use Manual Verification

- ✅ Payment completed but not credited after 15 minutes
- ✅ Automatic verification seems stuck
- ✅ You want to check payment status immediately
- ❌ Payment just created (wait at least 10 minutes)
- ❌ Payment already confirmed (no need to verify again)

### Important Notes

- You can verify as many times as needed - system prevents double-crediting
- Each verification checks the latest status with NOWPayments
- If payment is confirmed, MXI is credited immediately
- If not confirmed, you'll see the current status

---

## For Administrators

### How to Verify a Payment Manually (Admin)

1. **Navigate to Admin Panel**
   - Go to Admin → Manual Payment Credit
   - Or use the admin menu

2. **Enter Order ID**
   - Get Order ID from user or payment history
   - Format: `MXI-1764082913255-cop99k`

3. **Click "Search Payment"**
   - System will fetch payment details
   - Review all information carefully

4. **Review Payment Details**
   - Check payment status
   - Check user information
   - Check MXI amount
   - Verify payment is not already credited

5. **Click "Verify and Credit Payment"**
   - System will verify with NOWPayments
   - If confirmed, credits automatically
   - Shows success message with new balance

### Admin Checklist

Before manual verification:
- [ ] Verify payment exists in NOWPayments dashboard
- [ ] Check payment status is "finished" or "confirmed"
- [ ] Verify payment is not already credited in database
- [ ] Confirm user information is correct
- [ ] Document reason for manual intervention

After manual verification:
- [ ] Verify MXI was credited correctly
- [ ] Check user balance updated
- [ ] Verify metrics updated
- [ ] Check transaction history updated
- [ ] Inform user if necessary

### Common Admin Tasks

**Task**: User reports payment not credited
**Steps**:
1. Get Order ID from user
2. Check payment in NOWPayments dashboard
3. If confirmed, use manual verification
4. Inform user of result

**Task**: Webhook failed for multiple payments
**Steps**:
1. Get list of affected Order IDs
2. Verify each payment manually
3. Document incident
4. Check webhook configuration

**Task**: User accidentally paid twice
**Steps**:
1. Verify both payments in NOWPayments
2. Credit both if both confirmed
3. Explain to user both are valid
4. Or process refund if requested

---

## API Reference

### Endpoint: `manual-verify-payment`

**URL**: `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/manual-verify-payment`

**Method**: `POST`

**Headers**:
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "order_id": "MXI-1764082913255-cop99k"
}
```

**Success Response** (Payment Credited):
```json
{
  "success": true,
  "message": "Payment verified and credited successfully",
  "credited": true,
  "payment": {
    "order_id": "MXI-1764082913255-cop99k",
    "status": "confirmed",
    "mxi_amount": "100.00",
    "new_balance": "150.00"
  },
  "requestId": "abc123"
}
```

**Success Response** (Already Credited):
```json
{
  "success": true,
  "message": "Payment already credited",
  "already_credited": true,
  "payment": {
    "order_id": "MXI-1764082913255-cop99k",
    "status": "confirmed",
    "mxi_amount": "100.00",
    "confirmed_at": "2025-01-15T12:00:00.000Z"
  },
  "requestId": "abc123"
}
```

**Success Response** (Status Updated, Not Credited):
```json
{
  "success": true,
  "message": "Payment status updated",
  "credited": false,
  "payment": {
    "order_id": "MXI-1764082913255-cop99k",
    "status": "waiting",
    "mxi_amount": "100.00"
  },
  "requestId": "abc123"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Payment not found",
  "code": "PAYMENT_NOT_FOUND",
  "requestId": "abc123"
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `MISSING_API_KEY` | NOWPayments API key not configured | Contact developer |
| `MISSING_SUPABASE_CREDS` | Supabase credentials not configured | Contact developer |
| `NO_AUTH_HEADER` | No authorization header | Login again |
| `INVALID_SESSION` | Invalid user session | Login again |
| `INVALID_JSON` | Invalid request body | Check request format |
| `MISSING_ORDER_ID` | Missing order_id parameter | Provide Order ID |
| `PAYMENT_NOT_FOUND` | Payment not found | Check Order ID |
| `UNAUTHORIZED` | Not payment owner or admin | Check permissions |
| `NO_PAYMENT_ID` | Payment has no payment_id | Contact support |
| `NOWPAYMENTS_API_ERROR` | NOWPayments API error | Try again later |
| `UNEXPECTED_ERROR` | Unexpected error | Contact support |

---

## Troubleshooting

### Problem: "Payment not found"
**Cause**: Invalid Order ID
**Solution**: Double-check Order ID format and spelling

### Problem: "Payment has no payment_id"
**Cause**: Payment was not created in NOWPayments
**Solution**: Contact support with Order ID

### Problem: "Unauthorized"
**Cause**: Trying to verify another user's payment
**Solution**: Login with correct account or use admin account

### Problem: "NOWPayments API error"
**Cause**: NOWPayments API is down or rate limited
**Solution**: Wait a few minutes and try again

### Problem: Payment verified but not credited
**Cause**: Payment not confirmed in NOWPayments yet
**Solution**: Wait for confirmation and try again

### Problem: "Already credited" but balance not updated
**Cause**: UI not refreshed
**Solution**: Refresh the page or logout/login

---

## Support

### For Users
- Check this guide first
- Try manual verification
- If still not working, contact support with:
  - Order ID
  - Payment amount
  - Time of payment
  - Screenshot of payment confirmation

### For Administrators
- Check edge function logs
- Check NOWPayments dashboard
- Check database directly
- Review webhook logs
- Use manual verification as last resort

### Contact Information
- Support Email: support@maxcoin.com
- Admin Panel: [Admin Dashboard]
- Documentation: [Full Documentation](MANUAL_VERIFICATION_IMPLEMENTATION.md)

---

## Quick Commands

### Check Payment Status (SQL)
```sql
SELECT * FROM payments WHERE order_id = 'MXI-1764082913255-cop99k';
```

### Check User Balance (SQL)
```sql
SELECT id, email, mxi_balance, usdt_contributed 
FROM users 
WHERE id = 'user-id';
```

### Check Webhook Logs (SQL)
```sql
SELECT * FROM payment_webhook_logs 
WHERE order_id = 'MXI-1764082913255-cop99k'
ORDER BY created_at DESC;
```

### Check Transaction History (SQL)
```sql
SELECT * FROM transaction_history 
WHERE order_id = 'MXI-1764082913255-cop99k';
```

---

## Best Practices

### ✅ Do
- Wait at least 10 minutes after payment before manual verification
- Check NOWPayments dashboard first
- Use manual verification for stuck payments
- Document all manual interventions
- Monitor logs for errors

### ❌ Don't
- Verify immediately after payment creation
- Verify multiple times rapidly (wait between attempts)
- Manually adjust database without verification
- Skip checking NOWPayments dashboard
- Ignore error messages

---

## Version History

- **v1.0** (2025-01-15): Initial implementation
  - Created manual-verify-payment edge function
  - Enhanced payment-history.tsx with verify button
  - Enhanced manual-payment-credit.tsx for admins
  - Added comprehensive documentation

---

## Related Documentation

- [Full Implementation Guide](MANUAL_VERIFICATION_IMPLEMENTATION.md)
- [NOWPayments Integration Guide](NOWPAYMENTS_INTEGRATION_COMPLETE.md)
- [Payment Flow Explained](PAYMENT_FLOW_EXPLAINED.md)
- [Webhook Setup Guide](NOWPAYMENTS_WEBHOOK_FIX_COMPLETE.md)
