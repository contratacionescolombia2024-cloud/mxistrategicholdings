
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Manual Payment Verification Edge Function
 * 
 * This function provides a robust manual verification system that:
 * 1. Handles both NowPayments and direct USDT payments
 * 2. For NowPayments: Verifies payment status with NOWPayments API (optional)
 * 3. For USDT: Allows admin to manually approve with specified amount
 * 4. Uses the same crediting logic as the automatic webhook
 * 5. Can be called by users or admins
 * 6. Provides detailed logging and error handling
 * 7. Prevents double-crediting
 * 8. Admin can approve without NowPayments API for manual verification
 */
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`\n[${requestId}] ========== MANUAL VERIFY PAYMENT ==========`);
  console.log(`[${requestId}] Timestamp:`, new Date().toISOString());

  try {
    // Step 1: Validate environment variables
    console.log(`[${requestId}] Step 1: Validating environment variables...`);
    const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
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
    let body: { order_id: string; approved_usdt_amount?: number };
    
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

    const { order_id, approved_usdt_amount } = body;

    if (!order_id) {
      console.error(`[${requestId}] ERROR: Missing order_id`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing order_id',
          code: 'MISSING_ORDER_ID',
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] Order ID: ${order_id}`);
    if (approved_usdt_amount) {
      console.log(`[${requestId}] Approved USDT Amount: ${approved_usdt_amount}`);
    }

    // Step 4: Find payment record
    console.log(`[${requestId}] Step 4: Finding payment record...`);
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order_id)
      .single();

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

    // Check if user owns this payment or is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const isAdmin = !!adminUser;
    const isOwner = payment.user_id === user.id;

    if (!isAdmin && !isOwner) {
      console.error(`[${requestId}] ERROR: Unauthorized access attempt`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          requestId: requestId,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Payment found: ${payment.id}`);
    console.log(`[${requestId}] Payment details: User ${payment.user_id}, Amount ${payment.mxi_amount} MXI`);
    console.log(`[${requestId}] Current status: ${payment.status}`);
    console.log(`[${requestId}] Has payment_id: ${!!payment.payment_id}`);
    console.log(`[${requestId}] Has tx_hash: ${!!payment.tx_hash}`);

    // Step 5: Check if already credited
    if (payment.status === 'finished' || payment.status === 'confirmed') {
      console.log(`[${requestId}] ⚠️ Payment already credited`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment already credited',
          already_credited: true,
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

    // Step 6: Determine payment type and handle accordingly
    const isNowPaymentsPayment = !!payment.payment_id;
    const isDirectUSDTPayment = !!payment.tx_hash && !payment.payment_id;

    console.log(`[${requestId}] Step 6: Processing payment...`);
    console.log(`[${requestId}] Is NowPayments: ${isNowPaymentsPayment}`);
    console.log(`[${requestId}] Is Direct USDT: ${isDirectUSDTPayment}`);

    let paymentStatus = payment.status;
    let actualUsdtAmount = parseFloat(payment.price_amount);
    let actualMxiAmount = parseFloat(payment.mxi_amount);

    // Handle NowPayments payment
    if (isNowPaymentsPayment) {
      console.log(`[${requestId}] Processing NowPayments payment...`);

      // Admin can approve without checking NowPayments API
      if (isAdmin && approved_usdt_amount && approved_usdt_amount > 0) {
        console.log(`[${requestId}] Admin manual approval for NowPayments payment`);
        
        // Calculate MXI based on approved USDT amount and current phase price
        const pricePerMxi = parseFloat(payment.price_per_mxi);
        actualUsdtAmount = approved_usdt_amount;
        actualMxiAmount = actualUsdtAmount / pricePerMxi;

        console.log(`[${requestId}] Calculated MXI: ${actualMxiAmount} (${actualUsdtAmount} USDT / ${pricePerMxi} per MXI)`);

        // Update payment record with approved amounts
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            price_amount: actualUsdtAmount,
            mxi_amount: actualMxiAmount,
            actually_paid: actualUsdtAmount,
            payment_status: 'finished',
            status: 'finished',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error(`[${requestId}] ERROR: Failed to update payment:`, updateError);
          throw new Error(`Failed to update payment: ${updateError.message}`);
        }

        console.log(`[${requestId}] ✅ Payment updated with approved amounts (admin manual approval)`);
        paymentStatus = 'finished';
      } else if (NOWPAYMENTS_API_KEY) {
        // Check with NowPayments API if API key is available
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

        paymentStatus = nowPaymentsData.payment_status;
        console.log(`[${requestId}] Payment status: ${paymentStatus}`);

        // Update payment record with NowPayments data
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
          throw new Error(`Failed to update payment: ${updateError.message}`);
        }

        console.log(`[${requestId}] ✅ Payment updated with NowPayments data`);
      } else {
        console.error(`[${requestId}] ERROR: Cannot verify NowPayments payment - no API key and no admin approval`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Cannot verify NowPayments payment without API key or admin approval amount',
            code: 'MISSING_VERIFICATION_METHOD',
            requestId: requestId,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    // Handle Direct USDT payment
    else if (isDirectUSDTPayment) {
      console.log(`[${requestId}] Processing Direct USDT payment...`);

      // For direct USDT payments, admin must provide approved amount
      if (!isAdmin) {
        console.error(`[${requestId}] ERROR: Only admins can approve direct USDT payments`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Only admins can approve direct USDT payments',
            code: 'ADMIN_ONLY',
            requestId: requestId,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!approved_usdt_amount || approved_usdt_amount <= 0) {
        console.error(`[${requestId}] ERROR: Missing or invalid approved_usdt_amount`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'For direct USDT payments, admin must provide approved_usdt_amount',
            code: 'MISSING_APPROVED_AMOUNT',
            requestId: requestId,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`[${requestId}] Admin approved USDT amount: ${approved_usdt_amount}`);

      // Calculate MXI based on approved USDT amount and current phase price
      const pricePerMxi = parseFloat(payment.price_per_mxi);
      actualUsdtAmount = approved_usdt_amount;
      actualMxiAmount = actualUsdtAmount / pricePerMxi;

      console.log(`[${requestId}] Calculated MXI: ${actualMxiAmount} (${actualUsdtAmount} USDT / ${pricePerMxi} per MXI)`);

      // Update payment record with approved amounts
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          price_amount: actualUsdtAmount,
          mxi_amount: actualMxiAmount,
          usdt: actualUsdtAmount,
          mxi: actualMxiAmount,
          estado: 'confirmado',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error(`[${requestId}] ERROR: Failed to update payment:`, updateError);
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      console.log(`[${requestId}] ✅ Payment updated with approved amounts`);
      paymentStatus = 'confirmed';
    }
    // Unknown payment type
    else {
      console.error(`[${requestId}] ERROR: Unknown payment type`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unknown payment type - no payment_id or tx_hash',
          code: 'UNKNOWN_PAYMENT_TYPE',
          requestId: requestId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 7: Update transaction_history
    console.log(`[${requestId}] Step 7: Updating transaction_history...`);
    
    await supabase
      .from('transaction_history')
      .update({
        status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order_id);

    console.log(`[${requestId}] ✅ Transaction history updated`);

    // Step 8: Credit user if payment is successful
    if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
      console.log(`[${requestId}] Step 8: Crediting user...`);

      // Get user
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', payment.user_id)
        .single();

      if (userDataError || !userData) {
        console.error(`[${requestId}] ERROR: User not found:`, userDataError);
        throw new Error('User not found');
      }

      console.log(`[${requestId}] User: ${userData.id}, Current balance: ${userData.mxi_balance}`);

      // Update user balance
      const newMxiBalance = parseFloat(userData.mxi_balance) + actualMxiAmount;
      const newUsdtContributed = parseFloat(userData.usdt_contributed) + actualUsdtAmount;

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          mxi_balance: newMxiBalance,
          usdt_contributed: newUsdtContributed,
          mxi_purchased_directly: parseFloat(userData.mxi_purchased_directly || 0) + actualMxiAmount,
          is_active_contributor: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);

      if (userUpdateError) {
        console.error(`[${requestId}] ERROR: Failed to update user:`, userUpdateError);
        throw new Error(`Failed to update user: ${userUpdateError.message}`);
      }

      console.log(`[${requestId}] ✅ User credited: ${newMxiBalance} MXI`);

      // Update metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('metrics')
        .select('*')
        .single();

      if (!metricsError && metrics) {
        const newTotalUsdt = parseFloat(metrics.total_usdt_contributed) + actualUsdtAmount;
        const newTotalMxi = parseFloat(metrics.total_mxi_distributed) + actualMxiAmount;
        const newTokensSold = parseFloat(metrics.total_tokens_sold) + actualMxiAmount;

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
        .eq('order_id', order_id);

      console.log(`[${requestId}] ✅ Payment marked as confirmed`);

      console.log(`[${requestId}] ========== SUCCESS - PAYMENT CREDITED ==========\n`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified and credited successfully',
          credited: true,
          payment: {
            order_id: payment.order_id,
            status: 'confirmed',
            usdt_amount: actualUsdtAmount,
            mxi_amount: actualMxiAmount,
            new_balance: newMxiBalance,
          },
          requestId: requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.log(`[${requestId}] ========== SUCCESS - STATUS UPDATED ==========\n`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment status updated',
          credited: false,
          payment: {
            order_id: payment.order_id,
            status: paymentStatus,
            mxi_amount: payment.mxi_amount,
          },
          requestId: requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
