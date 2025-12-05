
# NowPayments Currency Error Fix - Complete Summary

## Problem
Users were encountering the error "No se encontraron criptomonedas" (No cryptocurrencies found) when trying to select a payment method. The `create-paid-intent` Edge Function was returning 500 errors.

## Root Cause
The Edge Function had insufficient error handling and logging, making it difficult to diagnose issues with the NowPayments API integration. The function was failing silently without providing detailed error information.

## Solution Implemented

### 1. Enhanced Edge Function (`create-paid-intent`)
**File:** `supabase/functions/create-paid-intent/index.ts`

**Improvements:**
- Added comprehensive logging at every step of the process
- Enhanced error handling with detailed error messages
- Added validation for API responses
- Improved error reporting to help diagnose issues
- Added checks for:
  - Missing environment variables
  - Invalid API responses
  - Empty currency lists
  - JSON parsing errors
  - Network connectivity issues

**Key Features:**
- Logs request details (method, URL, body)
- Logs API key presence (length only, not the actual key)
- Logs NowPayments API response status and headers
- Logs the number of currencies fetched
- Provides detailed error messages for each failure scenario
- Returns structured error responses with technical details

### 2. Enhanced Frontend (`select-currency.tsx`)
**File:** `app/(tabs)/(home)/select-currency.tsx`

**Improvements:**
- Added detailed error logging in the console
- Enhanced error messages for users
- Added a "Ver Detalles" (View Details) button in error alerts
- Added a refresh button in the header to retry loading currencies
- Improved loading states with more informative messages
- Added retry functionality when no currencies are available
- Better error display with technical details for debugging

**Key Features:**
- Logs all API requests and responses
- Shows detailed error information to help diagnose issues
- Provides multiple options when errors occur (View Details, Retry, Go Back)
- Displays loading substatus ("Conectando con NOWPayments...")
- Shows empty state with retry button when no currencies are available

## Testing the Fix

### 1. Check Edge Function Logs
After deployment, you can check the logs to see detailed information:

```bash
# The logs will show:
- Request method and URL
- User authentication status
- API key presence (length)
- NowPayments API response status
- Number of currencies fetched
- Any errors that occur
```

### 2. Test the Flow
1. Navigate to "Comprar MXI" (Purchase MXI)
2. Enter an amount
3. Click "Seleccionar Criptomoneda" (Select Cryptocurrency)
4. The app should now:
   - Show "Cargando criptomonedas disponibles..." (Loading available cryptocurrencies...)
   - Display "Conectando con NOWPayments..." (Connecting with NOWPayments...)
   - Load the list of available cryptocurrencies
   - If an error occurs, show detailed error information

### 3. If Errors Still Occur
The enhanced logging will now provide detailed information about what's failing:

**Check the Edge Function logs:**
```
supabase functions logs create-paid-intent
```

**Common issues to check:**
1. **API Key Not Set:** Check if `NOWPAYMENTS_API_KEY` is set in Supabase environment variables
2. **Invalid API Key:** Verify the API key is correct in the NowPayments dashboard
3. **API Rate Limiting:** Check if you're hitting NowPayments API rate limits
4. **Network Issues:** Verify Supabase can reach the NowPayments API

## Environment Variables Required

Make sure these are set in your Supabase project:

```
NOWPAYMENTS_API_KEY=your_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## API Endpoints

### NowPayments Currencies API
- **Endpoint:** `https://api.nowpayments.io/v1/currencies`
- **Method:** GET
- **Headers:** 
  - `x-api-key`: Your NowPayments API key
  - `Content-Type`: application/json
- **Response:** 
  ```json
  {
    "currencies": ["btc", "eth", "usdt", "ltc", ...]
  }
  ```

## Error Messages Explained

### "No autorizado. Por favor inicia sesión nuevamente."
- **Cause:** User session expired or invalid
- **Solution:** User needs to log in again

### "Error de configuración del servidor"
- **Cause:** `NOWPAYMENTS_API_KEY` not set in environment variables
- **Solution:** Set the API key in Supabase project settings

### "Error al conectar con el servicio de pagos"
- **Cause:** Network error when calling NowPayments API
- **Solution:** Check network connectivity and API status

### "Error al obtener criptomonedas disponibles"
- **Cause:** NowPayments API returned an error response
- **Solution:** Check API key validity and NowPayments service status

### "No hay criptomonedas disponibles en este momento"
- **Cause:** NowPayments API returned an empty currency list
- **Solution:** Check NowPayments account status and API configuration

## Debugging Tips

### 1. Check Console Logs
The app now logs extensive information to the console:
- API request details
- Response status and headers
- Parsed response data
- Error details and stack traces

### 2. Use the "Ver Detalles" Button
When an error occurs, click "Ver Detalles" to see:
- Full error message
- Error stack trace
- Technical details from the API

### 3. Check Edge Function Logs
Use Supabase dashboard or CLI to view Edge Function logs:
```bash
supabase functions logs create-paid-intent --project-ref aeyfnjuatbtcauiumbhn
```

### 4. Test API Key Manually
You can test your NowPayments API key manually:
```bash
curl -X GET "https://api.nowpayments.io/v1/currencies" \
  -H "x-api-key: YOUR_API_KEY"
```

## Next Steps

1. **Monitor Logs:** Check the Edge Function logs after deployment to see if currencies are being fetched successfully
2. **Verify API Key:** Ensure the NowPayments API key is valid and has the correct permissions
3. **Test Payment Flow:** Try the complete payment flow to ensure everything works end-to-end
4. **User Feedback:** Monitor user reports to see if the error persists

## Files Modified

1. `supabase/functions/create-paid-intent/index.ts` - Enhanced error handling and logging
2. `app/(tabs)/(home)/select-currency.tsx` - Improved error display and retry functionality

## Deployment Status

✅ Edge Function `create-paid-intent` deployed successfully (Version 5)
✅ Frontend code updated with enhanced error handling
✅ Ready for testing

## Support

If the error persists after this fix:
1. Check the Edge Function logs for detailed error information
2. Verify the NowPayments API key is correctly set
3. Test the NowPayments API manually to ensure it's working
4. Contact NowPayments support if the API is not responding correctly

---

**Last Updated:** January 2025
**Status:** Deployed and Ready for Testing
