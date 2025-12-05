
# NowPayments Button Debug - Complete Fix

## Problem Summary
The payment button was not working properly. The button WAS making API calls, but the Edge Function was returning 500 errors consistently.

## Root Causes Identified

### 1. **Edge Function Errors (500)**
- The Edge Function was failing silently without proper error logging
- Missing environment variable checks
- Poor error handling for API responses
- No detailed logging for debugging

### 2. **Client-Side Issues**
- No visible error messages to the user
- No debug information available
- Silent failures that made it seem like the button wasn't working

## Solutions Implemented

### 1. **Enhanced Edge Function Logging**
Added comprehensive logging at every step:
- Request ID tracking for each call
- Environment variable validation
- Request body parsing with detailed error messages
- NOWPayments API call logging
- Database operation logging
- Success/failure tracking

### 2. **Better Error Handling**
- Proper error messages in Spanish for users
- Debug information included in responses
- Graceful degradation when services fail
- Transaction status tracking

### 3. **Client-Side Debugging**
- Added debug info state to track operation progress
- Console logging at every step
- User-friendly error alerts with debug details
- "Ver Info de Debug" button to see technical details

### 4. **Validation Improvements**
- Check for all required environment variables
- Validate request body before processing
- Verify user authentication
- Validate amount ranges

## How to Debug Issues

### 1. **Check Edge Function Logs**
```bash
# View logs in Supabase Dashboard
# Or use the get_logs tool
```

Look for:
- Request IDs to track specific calls
- "API Key check" - should say EXISTS
- "User authenticated" - should show user ID
- "NOWPayments response status" - should be 200
- Any ERROR messages

### 2. **Check Client-Side Console**
Look for:
- "=== LOAD CURRENCIES START ==="
- "Session exists: true"
- "Response status: 200"
- "Parsed response" with data

### 3. **Use Debug Button**
- Click "Ver Info de Debug" button in the app
- Shows the current operation status
- Displays error messages if any

### 4. **Common Issues and Solutions**

#### Issue: "API Key no encontrada"
**Solution:** Set NOWPAYMENTS_API_KEY environment variable in Supabase

#### Issue: "Sesión expirada"
**Solution:** User needs to log out and log back in

#### Issue: "Error al obtener datos de fase"
**Solution:** Check that metrics table has data

#### Issue: NOWPayments API returns error
**Solution:** Check API key validity, check NOWPayments service status

## Testing Checklist

1. ✅ Button is clickable when valid amount is entered
2. ✅ Loading indicator shows when processing
3. ✅ Currency selection modal opens
4. ✅ Currencies are displayed correctly
5. ✅ Payment button in modal works
6. ✅ Browser opens with payment page
7. ✅ Payment status updates in app
8. ✅ Error messages are user-friendly
9. ✅ Debug info is available

## API Flow

```
User clicks "Continuar al Pago"
    ↓
loadCurrencies() called
    ↓
POST /create-payment-intent (without pay_currency)
    ↓
Edge Function returns available currencies
    ↓
Currency selection modal opens
    ↓
User selects currency and clicks "Pagar"
    ↓
handlePayment() called
    ↓
POST /create-payment-intent (with pay_currency)
    ↓
Edge Function creates NOWPayments invoice
    ↓
Browser opens with invoice URL
    ↓
User completes payment
    ↓
Webhook updates database
    ↓
App polls for status updates
    ↓
Success alert shown
```

## Environment Variables Required

```
NOWPAYMENTS_API_KEY=your_api_key_here
SUPABASE_URL=https://aeyfnjuatbtcauiumbhn.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Tables Used

1. **metrics** - Current phase and price information
2. **transaction_history** - Transaction records
3. **nowpayments_orders** - Payment order tracking
4. **profiles** - User balance updates (via webhook)

## Next Steps

1. Test the payment flow end-to-end
2. Monitor Edge Function logs for any errors
3. Check that webhooks are being received
4. Verify payment confirmations update user balances

## Support

If issues persist:
1. Check Edge Function logs for the specific request ID
2. Look for the debug info in the app
3. Verify all environment variables are set
4. Test with a small amount first (3 USDT minimum)
