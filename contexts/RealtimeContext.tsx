
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { notificationService } from '@/utils/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  isConnected: boolean;
  lastUpdate: Date | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastUpdate: null,
});

export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      // Clean up if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Initialize notification service
    notificationService.initialize();

    // Set up real-time subscription for user-specific updates
    const setupRealtimeSubscription = async () => {
      // Check if already subscribed
      if (channelRef.current?.state === 'subscribed') {
        console.log('Already subscribed to realtime updates');
        return;
      }

      const channel = supabase.channel(`user:${user.id}:updates`, {
        config: {
          broadcast: { self: false, ack: true },
          private: true,
        },
      });

      channelRef.current = channel;

      // Listen for user data updates
      channel
        .on('broadcast', { event: 'user_updated' }, async (payload: any) => {
          console.log('User data updated:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification
          await notificationService.sendLocalNotification({
            title: '🔄 Actualización de Cuenta',
            body: payload.message || 'Tu información de cuenta ha sido actualizada',
            data: {
              type: 'user_update',
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'balance_updated' }, async (payload: any) => {
          console.log('Balance updated:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification
          await notificationService.sendLocalNotification({
            title: '💰 Balance Actualizado',
            body: `Tu balance ha sido actualizado: ${payload.message || 'Revisa tu cuenta'}`,
            data: {
              type: 'balance_update',
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'kyc_status_changed' }, async (payload: any) => {
          console.log('KYC status changed:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification based on status
          const statusEmoji = payload.status === 'approved' ? '✅' : payload.status === 'rejected' ? '❌' : '⏳';
          await notificationService.sendLocalNotification({
            title: `${statusEmoji} Estado KYC Actualizado`,
            body: payload.message || `Tu verificación KYC ha sido ${payload.status}`,
            data: {
              type: 'kyc_update',
              status: payload.status,
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'withdrawal_status_changed' }, async (payload: any) => {
          console.log('Withdrawal status changed:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification
          const statusEmoji = payload.status === 'completed' ? '✅' : payload.status === 'rejected' ? '❌' : '⏳';
          await notificationService.sendLocalNotification({
            title: `${statusEmoji} Estado de Retiro Actualizado`,
            body: payload.message || `Tu solicitud de retiro ha sido ${payload.status}`,
            data: {
              type: 'withdrawal_update',
              status: payload.status,
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'payment_confirmed' }, async (payload: any) => {
          console.log('Payment confirmed:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification
          await notificationService.sendLocalNotification({
            title: '✅ Pago Confirmado',
            body: payload.message || 'Tu pago ha sido confirmado exitosamente',
            data: {
              type: 'payment_confirmed',
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'commission_earned' }, async (payload: any) => {
          console.log('Commission earned:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification
          await notificationService.sendLocalNotification({
            title: '💵 Nueva Comisión',
            body: payload.message || 'Has ganado una nueva comisión',
            data: {
              type: 'commission_earned',
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'ambassador_level_updated' }, async (payload: any) => {
          console.log('Ambassador level updated:', payload);
          setLastUpdate(new Date());
          
          // Refresh user data
          await refreshUser();

          // Show notification
          await notificationService.sendLocalNotification({
            title: '🏆 Nivel de Embajador Actualizado',
            body: payload.message || 'Tu nivel de embajador ha sido actualizado',
            data: {
              type: 'ambassador_update',
              timestamp: new Date().toISOString(),
            },
          });
        })
        .on('broadcast', { event: 'admin_message' }, async (payload: any) => {
          console.log('Admin message:', payload);
          setLastUpdate(new Date());

          // Show notification
          await notificationService.sendLocalNotification({
            title: '📢 Mensaje del Administrador',
            body: payload.message || 'Tienes un nuevo mensaje del administrador',
            data: {
              type: 'admin_message',
              timestamp: new Date().toISOString(),
            },
          });
        })
        .subscribe(async (status, err) => {
          console.log('Realtime subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            console.log('✅ Connected to realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            console.error('❌ Realtime channel error:', err);
          } else if (status === 'CLOSED') {
            setIsConnected(false);
            console.log('🔌 Realtime channel closed');
          }
        });
    };

    setupRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user, refreshUser]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastUpdate }}>
      {children}
    </RealtimeContext.Provider>
  );
}
