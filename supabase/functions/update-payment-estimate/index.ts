
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`\n[${requestId}] ========== UPDATE PAYMENT ESTIMATE ==========`);
  console.log(`[${requestId}] Timestamp:`, new Date().toISOString());

  try {
    // Step 1: Validate environment variables
    console.log(`[${requestId}] Step 1: Validating environment variables...`);
    const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!NOWPAYMENTS_API_KEY) {
      console.error(`[${requestId}] ERROR: NOWPAYMENTS_API_KEY not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOWPayments API key not configured',
          code: 'MISSING_API_KEY',
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[${requestId}] ERROR: Supabase credentials not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase credentials not configured',
          code: 'MISSING_SUPABASE_CREDS',
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Environment variables validated`);

    // Step 2: Get user session
    console.log(`[${requestId}] Step 2: Validating user session...`);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] ERROR: No authorization header`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No authorization header',
          code: 'NO_AUTH_HEADER',
          requestId: requestId,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error(`[${requestId}] ERROR: Invalid user session:`, userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid user session',
          code: 'INVALID_SESSION',
          details: userError?.message,
          requestId: requestId,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ User authenticated: ${user.id}`);

    // Step 3: Parse request body
    console.log(`[${requestId}] Step 3: Parsing request body...`);
    let body: { payment_id: string };
    
    try {
      body = await req.json();
      console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
    } catch (parseError: any) {
      console.error(`[${requestId}] ERROR: Failed to parse request body:`, parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_JSON',
          details: parseError.message,
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { payment_id } = body;

    if (!payment_id) {
      console.error(`[${requestId}] ERROR: Missing payment_id`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing payment_id',
          code: 'MISSING_PAYMENT_ID',
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Request validated`);

    // Step 4: Update merchant estimate in NOWPayments
    console.log(`[${requestId}] Step 4: Updating merchant estimate in NOWPayments...`);
    
    let nowPaymentsResponse;
    try {
      console.log(`[${requestId}] Calling NOWPayments API...`);
      nowPaymentsResponse = await fetch(
        `https://api.nowpayments.io/v1/payment/${payment_id}/update-merchant-estimate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': NOWPAYMENTS_API_KEY,
          },
        }
      );
      console.log(`[${requestId}] NOWPayments API call completed`);
    } catch (fetchError: any) {
      console.error(`[${requestId}] ERROR: Failed to connect to NOWPayments:`, fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to connect to payment provider',
          code: 'NOWPAYMENTS_CONNECTION_ERROR',
          details: fetchError.message,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] NOWPayments response status: ${nowPaymentsResponse.status}`);

    let nowPaymentsText;
    try {
      nowPaymentsText = await nowPaymentsResponse.text();
      console.log(`[${requestId}] NOWPayments response body:`, nowPaymentsText);
    } catch (textError: any) {
      console.error(`[${requestId}] ERROR: Failed to read response text:`, textError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to read payment provider response',
          code: 'NOWPAYMENTS_READ_ERROR',
          details: textError.message,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!nowPaymentsResponse.ok) {
      console.error(`[${requestId}] ERROR: NOWPayments API error - Status ${nowPaymentsResponse.status}`);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(nowPaymentsText);
      } catch {
        errorDetails = { raw: nowPaymentsText };
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al actualizar estimación del pago',
          code: 'NOWPAYMENTS_API_ERROR',
          statusCode: nowPaymentsResponse.status,
          details: errorDetails,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let nowPaymentsData;
    try {
      nowPaymentsData = JSON.parse(nowPaymentsText);
      console.log(`[${requestId}] Parsed NOWPayments data:`, JSON.stringify(nowPaymentsData, null, 2));
    } catch (parseError: any) {
      console.error(`[${requestId}] ERROR: Invalid JSON from NOWPayments`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid response from payment provider',
          code: 'NOWPAYMENTS_INVALID_JSON',
          details: parseError.message,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Merchant estimate updated`);

    // Step 5: Update local database if needed
    console.log(`[${requestId}] Step 5: Updating local database...`);
    
    const { data: localPayment, error: localPaymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', payment_id)
      .eq('user_id', user.id)
      .single();

    if (localPaymentError) {
      console.warn(`[${requestId}] WARNING: Payment not found in local database:`, localPaymentError);
    } else if (localPayment) {
      // Update local payment with new estimate
      const updateData: any = {
        pay_amount: nowPaymentsData.pay_amount,
        expires_at: nowPaymentsData.expiration_estimate_date,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from('payments')
        .update(updateData)
        .eq('id', localPayment.id);

      console.log(`[${requestId}] ✅ Local payment updated`);
    }

    // Step 6: Return success response
    console.log(`[${requestId}] Step 6: Returning success response`);
    const response = {
      success: true,
      estimate: nowPaymentsData,
    };

    console.log(`[${requestId}] ========== SUCCESS ==========\n`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`[${requestId}] ========== UNEXPECTED ERROR ==========`);
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        code: 'UNEXPECTED_ERROR',
        errorType: error.name,
        requestId: requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
