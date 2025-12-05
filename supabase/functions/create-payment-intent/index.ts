
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  order_id: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  invoice_id?: string; // Optional: if creating payment on existing invoice
  payout_address?: string; // Optional: for crypto2crypto payments
  payout_currency?: string; // Optional: for crypto2crypto payments
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`\n[${requestId}] ========== CREATE PAYMENT INTENT ==========`);
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
    console.log(`[${requestId}] API Key present: ${NOWPAYMENTS_API_KEY.substring(0, 10)}...`);

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
    let body: PaymentRequest;
    
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

    const { order_id, price_amount, price_currency, pay_currency, invoice_id, payout_address, payout_currency } = body;

    if (!order_id || !price_amount || !price_currency || !pay_currency) {
      console.error(`[${requestId}] ERROR: Missing required fields`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
          required: ['order_id', 'price_amount', 'price_currency', 'pay_currency'],
          received: { order_id, price_amount, price_currency, pay_currency },
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Request validated`);

    // Step 4: Get current phase info
    console.log(`[${requestId}] Step 4: Getting phase info...`);
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('current_phase, current_price_usdt')
      .single();

    if (metricsError || !metrics) {
      console.error(`[${requestId}] ERROR: Failed to get metrics:`, metricsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get phase information',
          code: 'METRICS_ERROR',
          details: metricsError?.message,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const currentPhase = metrics.current_phase;
    const pricePerMxi = metrics.current_price_usdt;
    const mxiAmount = price_amount / pricePerMxi;

    console.log(`[${requestId}] Phase: ${currentPhase}, Price: ${pricePerMxi} USDT, MXI: ${mxiAmount}`);

    // Step 5: Get user email for NOWPayments
    console.log(`[${requestId}] Step 5: Getting user email...`);
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    const customerEmail = userData?.email || user.email || 'noreply@maxcoin.io';
    console.log(`[${requestId}] Customer email: ${customerEmail}`);

    // Step 6: Create NOWPayments invoice or payment
    console.log(`[${requestId}] Step 6: Creating NOWPayments payment...`);
    
    // IMPORTANT: NOWPayments expects lowercase currency codes
    const normalizedPayCurrency = pay_currency.toLowerCase();
    const normalizedPriceCurrency = price_currency.toLowerCase();
    
    let nowPaymentsResponse;
    let nowPaymentsPayload: any;
    let apiEndpoint: string;

    // Determine which API endpoint to use
    if (invoice_id) {
      // Use invoice-payment endpoint for existing invoice
      console.log(`[${requestId}] Using invoice-payment endpoint with invoice_id: ${invoice_id}`);
      apiEndpoint = 'https://api.nowpayments.io/v1/invoice-payment';
      
      nowPaymentsPayload = {
        iid: invoice_id,
        pay_currency: normalizedPayCurrency,
        purchase_id: order_id,
        order_description: `Purchase ${mxiAmount.toFixed(2)} MXI tokens`,
        customer_email: customerEmail,
      };

      // Add payout info if provided (for crypto2crypto)
      if (payout_address && payout_currency) {
        nowPaymentsPayload.payout_address = payout_address;
        nowPaymentsPayload.payout_currency = payout_currency.toLowerCase();
        nowPaymentsPayload.payout_extra_id = null;
      }
    } else {
      // Use standard invoice endpoint
      console.log(`[${requestId}] Using standard invoice endpoint`);
      apiEndpoint = 'https://api.nowpayments.io/v1/invoice';
      
      nowPaymentsPayload = {
        price_amount: price_amount,
        price_currency: normalizedPriceCurrency,
        pay_currency: normalizedPayCurrency,
        order_id: order_id,
        order_description: `Purchase ${mxiAmount.toFixed(2)} MXI tokens`,
        ipn_callback_url: `${SUPABASE_URL}/functions/v1/nowpayments-webhook`,
        success_url: 'https://natively.dev',
        cancel_url: 'https://natively.dev',
      };
    }

    console.log(`[${requestId}] API Endpoint: ${apiEndpoint}`);
    console.log(`[${requestId}] NOWPayments payload:`, JSON.stringify(nowPaymentsPayload, null, 2));
    console.log(`[${requestId}] Using API key: ${NOWPAYMENTS_API_KEY.substring(0, 15)}...`);

    try {
      console.log(`[${requestId}] Calling NOWPayments API...`);
      nowPaymentsResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
        body: JSON.stringify(nowPaymentsPayload),
      });
      console.log(`[${requestId}] NOWPayments API call completed`);
    } catch (fetchError: any) {
      console.error(`[${requestId}] ERROR: Failed to connect to NOWPayments:`, fetchError);
      console.error(`[${requestId}] Fetch error details:`, {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
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
    console.log(`[${requestId}] NOWPayments response headers:`, Object.fromEntries(nowPaymentsResponse.headers.entries()));

    let nowPaymentsText;
    try {
      nowPaymentsText = await nowPaymentsResponse.text();
      console.log(`[${requestId}] NOWPayments response body (first 500 chars):`, nowPaymentsText.substring(0, 500));
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
      console.error(`[${requestId}] Response body:`, nowPaymentsText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(nowPaymentsText);
        console.error(`[${requestId}] Parsed error:`, errorDetails);
      } catch {
        errorDetails = { raw: nowPaymentsText };
      }

      // Provide user-friendly error messages
      let userMessage = 'Error al procesar el pago con NOWPayments';
      if (nowPaymentsResponse.status === 400) {
        userMessage = 'Datos de pago inválidos. Por favor verifica la información e intenta nuevamente.';
      } else if (nowPaymentsResponse.status === 401) {
        userMessage = 'Error de autenticación con el proveedor de pagos. Por favor contacta al soporte.';
      } else if (nowPaymentsResponse.status === 429) {
        userMessage = 'Demasiadas solicitudes. Por favor espera un momento e intenta nuevamente.';
      } else if (nowPaymentsResponse.status >= 500) {
        userMessage = 'El proveedor de pagos está experimentando problemas. Por favor intenta más tarde.';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
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
      console.error(`[${requestId}] Parse error:`, parseError);
      console.error(`[${requestId}] Response text:`, nowPaymentsText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid response from payment provider',
          code: 'NOWPAYMENTS_INVALID_JSON',
          details: parseError.message,
          raw: nowPaymentsText.substring(0, 500),
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different response structures based on endpoint used
    let paymentId: string;
    let invoiceUrl: string | null = null;
    let payAddress: string | null = null;
    let payAmount: number | null = null;
    let paymentStatus: string;
    let expirationDate: string | null = null;

    if (invoice_id) {
      // Response from invoice-payment endpoint
      paymentId = nowPaymentsData.payment_id?.toString() || '';
      paymentStatus = nowPaymentsData.payment_status || 'waiting';
      payAddress = nowPaymentsData.pay_address || null;
      payAmount = nowPaymentsData.pay_amount || null;
      expirationDate = nowPaymentsData.expiration_estimate_date || null;
      
      // For invoice-payment, we need to construct the payment URL
      if (paymentId) {
        invoiceUrl = `https://nowpayments.io/payment/?iid=${invoice_id}&paymentId=${paymentId}`;
      }
    } else {
      // Response from standard invoice endpoint
      paymentId = nowPaymentsData.id?.toString() || '';
      invoiceUrl = nowPaymentsData.invoice_url || null;
      payAddress = nowPaymentsData.pay_address || null;
      payAmount = nowPaymentsData.pay_amount || null;
      paymentStatus = nowPaymentsData.payment_status || 'waiting';
      expirationDate = nowPaymentsData.expiration_estimate_date || null;
    }

    // Validate that we got the required fields
    if (!paymentId) {
      console.error(`[${requestId}] ERROR: Missing payment_id in NOWPayments response`);
      console.error(`[${requestId}] Response data:`, nowPaymentsData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Incomplete response from payment provider',
          code: 'NOWPAYMENTS_INCOMPLETE_RESPONSE',
          details: 'Missing payment_id',
          received: nowPaymentsData,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Payment created: ${paymentId}`);

    // Step 7: Store payment in database
    console.log(`[${requestId}] Step 7: Storing payment in database...`);
    const paymentRecord = {
      user_id: user.id,
      order_id: order_id,
      payment_id: paymentId,
      invoice_url: invoiceUrl,
      price_amount: price_amount,
      price_currency: price_currency,
      pay_amount: payAmount,
      pay_currency: normalizedPayCurrency,
      pay_address: payAddress,
      mxi_amount: mxiAmount,
      price_per_mxi: pricePerMxi,
      phase: currentPhase,
      status: 'waiting',
      payment_status: paymentStatus,
      expires_at: expirationDate,
    };

    console.log(`[${requestId}] Payment record:`, JSON.stringify(paymentRecord, null, 2));

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      console.error(`[${requestId}] ERROR: Failed to store payment:`, paymentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to store payment record',
          code: 'DATABASE_ERROR',
          details: paymentError.message,
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Payment stored: ${payment.id}`);

    // Step 8: Return success response
    console.log(`[${requestId}] Step 8: Returning success response`);
    const response = {
      success: true,
      intent: {
        id: paymentId,
        order_id: order_id,
        invoice_url: invoiceUrl,
        payment_id: paymentId,
        pay_address: payAddress,
        pay_amount: payAmount,
        pay_currency: normalizedPayCurrency,
        price_amount: price_amount,
        price_currency: price_currency,
        mxi_amount: mxiAmount,
        payment_status: paymentStatus,
        expires_at: expirationDate,
        network: nowPaymentsData.network || null,
        network_precision: nowPaymentsData.network_precision || null,
      },
    };

    console.log(`[${requestId}] Response:`, JSON.stringify(response, null, 2));
    console.log(`[${requestId}] ========== SUCCESS ==========\n`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`[${requestId}] ========== UNEXPECTED ERROR ==========`);
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Error message:`, error.message);
    console.error(`[${requestId}] Error name:`, error.name);
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
