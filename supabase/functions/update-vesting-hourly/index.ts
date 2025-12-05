
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current hour timestamp
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    // Get all users with vesting balance
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, mxi_purchased_directly, mxi_from_unified_commissions, accumulated_yield, last_yield_update')
      .or('mxi_purchased_directly.gt.0,mxi_from_unified_commissions.gt.0');

    if (usersError) {
      throw usersError;
    }

    console.log(`Processing ${users?.length || 0} users with vesting balance`);

    const MONTHLY_YIELD_PERCENTAGE = 0.03;
    const SECONDS_IN_MONTH = 2592000;

    for (const user of users || []) {
      const mxiInVesting = (parseFloat(user.mxi_purchased_directly) || 0) + 
                           (parseFloat(user.mxi_from_unified_commissions) || 0);
      
      if (mxiInVesting === 0) continue;

      // Calculate current yield
      const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;
      const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;
      
      const now = new Date();
      const lastUpdate = new Date(user.last_yield_update);
      const secondsElapsed = (now.getTime() - lastUpdate.getTime()) / 1000;
      
      const sessionYield = yieldPerSecond * secondsElapsed;
      const currentYield = Math.min(
        (parseFloat(user.accumulated_yield) || 0) + sessionYield,
        maxMonthlyYield
      );

      // Get last close value for this user
      const { data: lastCandle } = await supabase
        .from('vesting_hourly_data')
        .select('close_value')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const lastClose = lastCandle ? parseFloat(lastCandle.close_value) : 0;

      // Insert or update hourly data
      const { error: insertError } = await supabase
        .from('vesting_hourly_data')
        .upsert({
          user_id: user.id,
          timestamp: currentHour.toISOString(),
          open_value: lastClose,
          high_value: Math.max(lastClose, currentYield),
          low_value: Math.min(lastClose, currentYield),
          close_value: currentYield,
          volume: currentYield - lastClose,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,timestamp',
        });

      if (insertError) {
        console.error(`Error updating vesting data for user ${user.id}:`, insertError);
      } else {
        console.log(`Updated vesting data for user ${user.id}: ${currentYield.toFixed(8)} MXI`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated vesting data for ${users?.length || 0} users`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in update-vesting-hourly:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
