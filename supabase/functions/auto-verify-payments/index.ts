
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
  console.log(`\n[${requestId}] ========== AUTO VERIFY PAYMENTS ==========`);
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
          requestId: requestId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] ✅ Environment variables validated`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 2: Find all pending payments (created in last 24 hours)
    console.log(`[${requestId}] Step 2: Finding pending payments...`);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .in('status', ['waiting', 'pending', 'confirming', 'sending'])
      .gte('created_at', twentyFourHoursAgo)
      .not('payment_id', 'is', null);

    if (paymentsError) {
      console.error(`[${requestId}] ERROR: Failed to fetch pending payments:`, paymentsError);
      throw new Error(`Failed to fetch pending payments: ${paymentsError.message}`);
    }

    console.log(`[${requestId}] Found ${pendingPayments?.length || 0} pending payments`);

    if (!pendingPayments || pendingPayments.length === 0) {
      console.log(`[${requestId}] No pending payments to verify`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending payments to verify',
          verified: 0,
          requestId: requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Check each payment with NOWPayments
    console.log(`[${requestId}] Step 3: Checking payments with NOWPayments...`);
    const results = [];
    let verifiedCount = 0;
    let errorCount = 0;

    for (const payment of pendingPayments) {
      const paymentRequestId = `${requestId}-${payment.id.substring(0, 6)}`;
      console.log(`\n[${paymentRequestId}] Checking payment: ${payment.order_id}`);
      console.log(`[${paymentRequestId}] Payment ID: ${payment.payment_id}`);
      console.log(`[${paymentRequestId}] Current status: ${payment.status}`);

      try {
        // Check payment status with NOWPayments
        const nowPaymentsResponse = await fetch(
          `https://api.nowpayments.io/v1/payment/${payment.payment_id}`,
          {
            method: 'GET',
            headers: {
              'x-api-key': NOWPAYMENTS_API_KEY,
            },
          }
        );

        console.log(`[${paymentRequestId}] NOWPayments response status: ${nowPaymentsResponse.status}`);

        if (!nowPaymentsResponse.ok) {
          const errorText = await nowPaymentsResponse.text();
          console.error(`[${paymentRequestId}] ERROR: NOWPayments API error:`, errorText);
          errorCount++;
          results.push({
            order_id: payment.order_id,
            success: false,
            error: 'NOWPayments API error',
            status_code: nowPaymentsResponse.status,
          });
          continue;
        }

        const nowPaymentsData = await nowPaymentsResponse.json();
        console.log(`[${paymentRequestId}] NOWPayments data:`, JSON.stringify(nowPaymentsData, null, 2));

        const paymentStatus = nowPaymentsData.payment_status;
        console.log(`[${paymentRequestId}] Payment status: ${paymentStatus}`);

        // Update payment record
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
          console.error(`[${paymentRequestId}] ERROR: Failed to update payment:`, updateError);
          errorCount++;
          results.push({
            order_id: payment.order_id,
            success: false,
            error: 'Failed to update payment',
          });
          continue;
        }

        console.log(`[${paymentRequestId}] ✅ Payment updated`);

        // Update transaction_history
        await supabase
          .from('transaction_history')
          .update({
            status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', payment.order_id);

        // Credit user if payment is successful
        if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
          console.log(`[${paymentRequestId}] Payment is finished/confirmed, crediting user...`);

          // Check if already credited
          if (payment.status === 'finished' || payment.status === 'confirmed') {
            console.log(`[${paymentRequestId}] ⚠️ Payment already credited, skipping`);
          } else {
            // Get user
            const { data: userData, error: userDataError } = await supabase
              .from('users')
              .select('*')
              .eq('id', payment.user_id)
              .single();

            if (userDataError || !userData) {
              console.error(`[${paymentRequestId}] ERROR: User not found:`, userDataError);
              errorCount++;
              results.push({
                order_id: payment.order_id,
                success: false,
                error: 'User not found',
              });
              continue;
            }

            console.log(`[${paymentRequestId}] User: ${userData.id}, Current balance: ${userData.mxi_balance}`);

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
              console.error(`[${paymentRequestId}] ERROR: Failed to update user:`, userUpdateError);
              errorCount++;
              results.push({
                order_id: payment.order_id,
                success: false,
                error: 'Failed to update user',
              });
              continue;
            }

            console.log(`[${paymentRequestId}] ✅ User credited: ${newMxiBalance} MXI`);

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

              console.log(`[${paymentRequestId}] ✅ Metrics updated`);
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
              .eq('order_id', payment.order_id);

            console.log(`[${paymentRequestId}] ✅ Payment marked as confirmed`);
            verifiedCount++;
          }
        }

        results.push({
          order_id: payment.order_id,
          success: true,
          status: paymentStatus,
          credited: paymentStatus === 'finished' || paymentStatus === 'confirmed',
        });

      } catch (error: any) {
        console.error(`[${paymentRequestId}] ERROR: Unexpected error:`, error);
        errorCount++;
        results.push({
          order_id: payment.order_id,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`[${requestId}] ========== VERIFICATION COMPLETE ==========`);
    console.log(`[${requestId}] Total payments checked: ${pendingPayments.length}`);
    console.log(`[${requestId}] Successfully verified: ${verifiedCount}`);
    console.log(`[${requestId}] Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verification complete',
        total_checked: pendingPayments.length,
        verified: verifiedCount,
        errors: errorCount,
        results: results,
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
        requestId: requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
