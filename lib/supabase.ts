
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Supabase configuration
const supabaseUrl = 'https://aeyfnjuatbtcauiumbhn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleWZuanVhdGJ0Y2F1aXVtYmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDI3NTEsImV4cCI6MjA3ODM3ODc1MX0.pefpNdgFtsbBifAtKXaQiWq7S7TioQ9PSGbycmivvDI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Handle deep linking for email confirmation
export const handleDeepLink = async (url: string) => {
  console.log('Handling deep link:', url);
  
  try {
    const { data, error } = await supabase.auth.getSessionFromUrl({ url });
    
    if (error) {
      console.error('Error getting session from URL:', error);
      return { success: false, error: error.message };
    }
    
    if (data.session) {
      console.log('Session obtained from URL:', data.session);
      return { success: true, session: data.session };
    }
    
    return { success: false, error: 'No session found' };
  } catch (error: any) {
    console.error('Exception handling deep link:', error);
    return { success: false, error: error.message };
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          id_number: string;
          address: string;
          email: string;
          email_verified: boolean;
          mxi_balance: number;
          usdt_contributed: number;
          referral_code: string;
          referred_by: string | null;
          active_referrals: number;
          can_withdraw: boolean;
          last_withdrawal_date: string | null;
          joined_date: string;
          created_at: string;
          updated_at: string;
          is_active_contributor: boolean;
          yield_rate_per_minute: number;
          last_yield_update: string;
          accumulated_yield: number;
        };
        Insert: {
          id?: string;
          name: string;
          id_number: string;
          address: string;
          email: string;
          email_verified?: boolean;
          mxi_balance?: number;
          usdt_contributed?: number;
          referral_code: string;
          referred_by?: string | null;
          active_referrals?: number;
          can_withdraw?: boolean;
          last_withdrawal_date?: string | null;
          joined_date?: string;
          created_at?: string;
          updated_at?: string;
          is_active_contributor?: boolean;
          yield_rate_per_minute?: number;
          last_yield_update?: string;
          accumulated_yield?: number;
        };
        Update: {
          id?: string;
          name?: string;
          id_number?: string;
          address?: string;
          email?: string;
          email_verified?: boolean;
          mxi_balance?: number;
          usdt_contributed?: number;
          referral_code?: string;
          referred_by?: string | null;
          active_referrals?: number;
          can_withdraw?: boolean;
          last_withdrawal_date?: string | null;
          joined_date?: string;
          created_at?: string;
          updated_at?: string;
          is_active_contributor?: boolean;
          yield_rate_per_minute?: number;
          last_yield_update?: string;
          accumulated_yield?: number;
        };
      };
      contributions: {
        Row: {
          id: string;
          user_id: string;
          usdt_amount: number;
          mxi_amount: number;
          transaction_type: 'initial' | 'increase' | 'reinvestment';
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          usdt_amount: number;
          mxi_amount: number;
          transaction_type: 'initial' | 'increase' | 'reinvestment';
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          usdt_amount?: number;
          mxi_amount?: number;
          transaction_type?: 'initial' | 'increase' | 'reinvestment';
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
        };
      };
      commissions: {
        Row: {
          id: string;
          user_id: string;
          from_user_id: string;
          level: number;
          amount: number;
          percentage: number;
          status: 'pending' | 'available' | 'withdrawn';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_user_id: string;
          level: number;
          amount: number;
          percentage: number;
          status?: 'pending' | 'available' | 'withdrawn';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_user_id?: string;
          level?: number;
          amount?: number;
          percentage?: number;
          status?: 'pending' | 'available' | 'withdrawn';
          created_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: 'USDT' | 'MXI';
          wallet_address: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency: 'USDT' | 'MXI';
          wallet_address: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: 'USDT' | 'MXI';
          wallet_address?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          level: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          level: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string;
          level?: number;
          created_at?: string;
        };
      };
      metrics: {
        Row: {
          id: string;
          total_members: number;
          total_usdt_contributed: number;
          total_mxi_distributed: number;
          pool_close_date: string;
          mxi_launch_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_members?: number;
          total_usdt_contributed?: number;
          total_mxi_distributed?: number;
          pool_close_date?: string;
          mxi_launch_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_members?: number;
          total_usdt_contributed?: number;
          total_mxi_distributed?: number;
          pool_close_date?: string;
          mxi_launch_date?: string;
          updated_at?: string;
        };
      };
    };
  };
}
