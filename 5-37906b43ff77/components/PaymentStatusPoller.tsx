
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

interface PaymentStatusPollerProps {
  orderId: string;
  onStatusChange?: (status: string) => void;
  onPaymentConfirmed?: () => void;
}

export default function PaymentStatusPoller({ 
  orderId, 
  onStatusChange, 
  onPaymentConfirmed 
}: PaymentStatusPollerProps) {
  const [status, setStatus] = useState<string>('waiting');
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkCountRef = useRef(0);

  useEffect(() => {
    // Start polling immediately
    checkPaymentStatus();

    // Poll every 30 seconds
    intervalRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId]);

  const checkPaymentStatus = async () => {
    if (checking) {
      console.log('⏳ [POLLER] Already checking, skipping...');
      return;
    }

    checkCountRef.current += 1;
    const checkId = checkCountRef.current;
    console.log(`\n🔄 [POLLER-${checkId}] Checking payment status for order: ${orderId}`);
    console.log(`🔄 [POLLER-${checkId}] Timestamp:`, new Date().toISOString());

    setChecking(true);
    setError(null);

    try {
      // Get payment from database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (paymentError || !payment) {
        console.error(`❌ [POLLER-${checkId}] Payment not found:`, paymentError);
        setError('Pago no encontrado');
        return;
      }

      console.log(`✅ [POLLER-${checkId}] Payment found: ${payment.id}`);
      console.log(`✅ [POLLER-${checkId}] Current status: ${payment.status}`);
      console.log(`✅ [POLLER-${checkId}] Payment ID: ${payment.payment_id}`);

      const currentStatus = payment.payment_status || payment.status;
      setStatus(currentStatus);
      setLastChecked(new Date());

      if (onStatusChange) {
        onStatusChange(currentStatus);
      }

      // If payment is finished or confirmed, stop polling
      if (currentStatus === 'finished' || currentStatus === 'confirmed') {
        console.log(`✅ [POLLER-${checkId}] Payment confirmed! Stopping polling.`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
        return;
      }

      // If payment is still pending, check with NOWPayments
      if (!payment.payment_id) {
        console.log(`⚠️ [POLLER-${checkId}] No payment_id, skipping NOWPayments check`);
        return;
      }

      console.log(`🌐 [POLLER-${checkId}] Checking with NOWPayments API...`);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error(`❌ [POLLER-${checkId}] No active session`);
        setError('Sesión expirada');
        return;
      }

      const response = await fetch(
        `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/check-nowpayments-status?order_id=${orderId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      console.log(`📥 [POLLER-${checkId}] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [POLLER-${checkId}] Error response:`, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        setError(errorData.error || 'Error al verificar el pago');
        return;
      }

      const data = await response.json();
      console.log(`📥 [POLLER-${checkId}] Response data:`, JSON.stringify(data, null, 2));

      if (data.success) {
        const newStatus = data.status;
        console.log(`✅ [POLLER-${checkId}] New status: ${newStatus}`);
        setStatus(newStatus);
        setLastChecked(new Date());

        if (onStatusChange) {
          onStatusChange(newStatus);
        }

        // If payment is finished or confirmed, stop polling
        if (newStatus === 'finished' || newStatus === 'confirmed') {
          console.log(`✅ [POLLER-${checkId}] Payment confirmed! Stopping polling.`);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (onPaymentConfirmed) {
            onPaymentConfirmed();
          }
        }
      } else {
        console.error(`❌ [POLLER-${checkId}] Verification failed:`, data.error);
        setError(data.error || 'Error al verificar el pago');
      }

    } catch (error: any) {
      console.error(`❌ [POLLER-${checkId}] Unexpected error:`, error);
      console.error(`❌ [POLLER-${checkId}] Error message:`, error.message);
      setError('Error de conexión');
    } finally {
      setChecking(false);
      console.log(`🏁 [POLLER-${checkId}] Check complete\n`);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'finished':
      case 'confirmed':
        return colors.success;
      case 'waiting':
      case 'pending':
        return colors.warning;
      case 'confirming':
      case 'sending':
        return '#2196F3';
      case 'failed':
      case 'expired':
      case 'refunded':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): { ios: string; android: string } => {
    switch (status) {
      case 'finished':
      case 'confirmed':
        return { ios: 'checkmark.circle.fill', android: 'check_circle' };
      case 'waiting':
      case 'pending':
        return { ios: 'clock.fill', android: 'schedule' };
      case 'confirming':
      case 'sending':
        return { ios: 'arrow.clockwise', android: 'sync' };
      case 'failed':
      case 'expired':
      case 'refunded':
        return { ios: 'xmark.circle.fill', android: 'cancel' };
      default:
        return { ios: 'questionmark.circle.fill', android: 'help' };
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'finished':
        return 'Pago Completado';
      case 'confirmed':
        return 'Pago Confirmado';
      case 'waiting':
        return 'Esperando Pago';
      case 'pending':
        return 'Pago Pendiente';
      case 'confirming':
        return 'Confirmando Pago';
      case 'sending':
        return 'Enviando Fondos';
      case 'failed':
        return 'Pago Fallido';
      case 'expired':
        return 'Pago Expirado';
      case 'refunded':
        return 'Pago Reembolsado';
      default:
        return status;
    }
  };

  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status);

  return (
    <View style={[styles.container, { borderColor: statusColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
          <IconSymbol
            ios_icon_name={statusIcon.ios}
            android_material_icon_name={statusIcon.android}
            size={24}
            color={statusColor}
          />
        </View>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
          {lastChecked && (
            <Text style={styles.lastCheckedText}>
              Última verificación: {lastChecked.toLocaleTimeString()}
            </Text>
          )}
        </View>
        {checking && (
          <ActivityIndicator size="small" color={statusColor} />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={16}
            color={colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {status === 'finished' || status === 'confirmed'
            ? '✅ El pago ha sido acreditado a tu cuenta'
            : '🔄 Verificando automáticamente cada 30 segundos'}
        </Text>
        {status !== 'finished' && status !== 'confirmed' && (
          <TouchableOpacity
            style={styles.manualCheckButton}
            onPress={checkPaymentStatus}
            disabled={checking}
          >
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.manualCheckText}>Verificar Ahora</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  lastCheckedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  manualCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  manualCheckText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
