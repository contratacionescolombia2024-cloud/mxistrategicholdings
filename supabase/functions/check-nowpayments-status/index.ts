
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Check NowPayments Status
 * 
 * This function checks the status of a payment with NowPayments API
 * and updates the local database accordingly.
 * 
 * It also credits the user if the payment is confirmed.
 */
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`\n[${requestId}] ========== CHECK NOWPAYMENTS STATUS ==========`);
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

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 2: Get user session (optional - for user-specific checks)
    console.log(`[${requestId}] Step 2: Checking user session...`);
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      try {
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          global: {
            headers: { Authorization: authHeader },
          },
        });

        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
        
        if (!userError && user) {
          userId = user.id;
          console.log(`[${requestId}] ✅ User authenticated: ${userId}`);
        } else {
          console.log(`[${requestId}] ⚠️ No valid user session, continuing as service...`);
        }
      } catch (authError) {
        console.log(`[${requestId}] ⚠️ Auth error, continuing as service:`, authError);
      }
    } else {
      console.log(`[${requestId}] ⚠️ No authorization header, continuing as service...`);
    }

    // Step 3: Get order_id from query params
    console.log(`[${requestId}] Step 3: Getting order_id...`);
    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');

    if (!orderId) {
      console.error(`[${requestId}] ERROR: Missing order_id parameter`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing order_id parameter',
          code: 'MISSING_ORDER_ID',
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] Order ID: ${orderId}`);

    // Step 4: Find payment record
    console.log(`[${requestId}] Step 4: Finding payment record...`);
    let paymentQuery = supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);

    // If user is authenticated, filter by user_id
    if (userId) {
      paymentQuery = paymentQuery.eq('user_id', userId);
    }

    const { data: payment, error: paymentError } = await paymentQuery.single();

    if (paymentError || !payment) {
      console.error(`[${requestId}] ERROR: Payment not found:`, paymentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND',
          details: paymentError?.message,
          requestId: requestId,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Payment found: ${payment.id}`);
    console.log(`[${requestId}] Current status: ${payment.status}`);

    // Step 5: Check if already confirmed
    if (payment.status === 'finished' || payment.status === 'confirmed') {
      console.log(`[${requestId}] ⚠️ Payment already confirmed`);
      return new Response(
        JSON.stringify({
          success: true,
          status: payment.status,
          already_confirmed: true,
          payment: {
            order_id: payment.order_id,
            status: payment.status,
            mxi_amount: payment.mxi_amount,
            confirmed_at: payment.confirmed_at,
          },
          requestId: requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 6: Check payment status with NOWPayments
    console.log(`[${requestId}] Step 6: Checking payment status with NOWPayments...`);
    
    if (!payment.payment_id) {
      console.error(`[${requestId}] ERROR: Payment has no payment_id`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment has no payment_id',
          code: 'NO_PAYMENT_ID',
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] Checking payment ID: ${payment.payment_id}`);

    const nowPaymentsResponse = await fetch(
      `https://api.nowpayments.io/v1/payment/${payment.payment_id}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      }
    );

    console.log(`[${requestId}] NOWPayments response status: ${nowPaymentsResponse.status}`);

    if (!nowPaymentsResponse.ok) {
      const errorText = await nowPaymentsResponse.text();
      console.error(`[${requestId}] ERROR: NOWPayments API error:`, errorText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { raw: errorText };
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to check payment status with NOWPayments',
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

    const nowPaymentsData = await nowPaymentsResponse.json();
    console.log(`[${requestId}] NOWPayments data:`, JSON.stringify(nowPaymentsData, null, 2));

    const paymentStatus = nowPaymentsData.payment_status;
    console.log(`[${requestId}] Payment status: ${paymentStatus}`);

    // Step 7: Update payment record
    console.log(`[${requestId}] Step 7: Updating payment record...`);
    
    const updateData: any = {
      payment_status: paymentStatus,
      status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (nowPaymentsData.actually_paid) {
      updateData.actually_paid = parseFloat(nowPaymentsData.actually_paid);
    }

    if (nowPaymentsData.outcome_amount) {
      updateData.outcome_amount = parseFloat(nowPaymentsData.outcome_amount);
    }

    if (nowPaymentsData.network_fee) {
      updateData.network_fee = parseFloat(nowPaymentsData.network_fee);
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    if (updateError) {
      console.error(`[${requestId}] ERROR: Failed to update payment:`, updateError);
    } else {
      console.log(`[${requestId}] ✅ Payment updated`);
    }

    // Step 8: Update transaction_history
    console.log(`[${requestId}] Step 8: Updating transaction_history...`);
    
    await supabase
      .from('transaction_history')
      .update({
        status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    console.log(`[${requestId}] ✅ Transaction history updated`);

    // Step 9: Credit user if payment is successful
    if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
      console.log(`[${requestId}] Step 9: Crediting user...`);

      // Get user
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', payment.user_id)
        .single();

      if (userDataError || !userData) {
        console.error(`[${requestId}] ERROR: User not found:`, userDataError);
      } else {
        console.log(`[${requestId}] User: ${userData.id}, Current balance: ${userData.mxi_balance}`);

        // Update user balance
        const newMxiBalance = parseFloat(userData.mxi_balance) + parseFloat(payment.mxi_amount);
        const newUsdtContributed = parseFloat(userData.usdt_contributed) + parseFloat(payment.price_amount);

        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            mxi_balance: newMxiBalance,
            usdt_contributed: newUsdtContributed,
            mxi_purchased_directly: parseFloat(userData.mxi_purchased_directly || 0) + parseFloat(payment.mxi_amount),
            is_active_contributor: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.user_id);

        if (userUpdateError) {
          console.error(`[${requestId}] ERROR: Failed to update user:`, userUpdateError);
        } else {
          console.log(`[${requestId}] ✅ User credited: ${newMxiBalance} MXI`);

          // Update metrics
          const { data: metrics, error: metricsError } = await supabase
            .from('metrics')
            .select('*')
            .single();

          if (!metricsError && metrics) {
            const newTotalUsdt = parseFloat(metrics.total_usdt_contributed) + parseFloat(payment.price_amount);
            const newTotalMxi = parseFloat(metrics.total_mxi_distributed) + parseFloat(payment.mxi_amount);
            const newTokensSold = parseFloat(metrics.total_tokens_sold) + parseFloat(payment.mxi_amount);

            await supabase
              .from('metrics')
              .update({
                total_usdt_contributed: newTotalUsdt,
                total_mxi_distributed: newTotalMxi,
                total_tokens_sold: newTokensSold,
                updated_at: new Date().toISOString(),
              })
              .eq('id', metrics.id);

            console.log(`[${requestId}] ✅ Metrics updated`);
          }

          // Mark payment as confirmed
          await supabase
            .from('payments')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          // Update transaction history
          await supabase
            .from('transaction_history')
            .update({
              status: 'finished',
              completed_at: new Date().toISOString(),
            })
            .eq('order_id', orderId);

          console.log(`[${requestId}] ✅ Payment marked as confirmed`);
        }
      }
    }

    console.log(`[${requestId}] ========== SUCCESS ==========\n`);

    return new Response(
      JSON.stringify({
        success: true,
        status: paymentStatus,
        payment: nowPaymentsData,
        credited: paymentStatus === 'finished' || paymentStatus === 'confirmed',
        requestId: requestId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[${requestId}] ========== UNEXPECTED ERROR ==========`);
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Error message:`, error.message);
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
