
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  paymentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  orderIdContainer: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  orderIdLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  verifyingText: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  successBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  requestVerificationButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  requestVerificationButtonDisabled: {
    opacity: 0.5,
  },
  requestVerificationButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#EF5350',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#2196F3' + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#2196F3',
    lineHeight: 18,
  },
  pendingVerificationBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingVerificationText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  reviewingBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewingText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvedText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  rejectedBadge: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectedText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  moreInfoRequestedBadge: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#BA68C8',
  },
  moreInfoRequestedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  moreInfoRequestedText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 12,
  },
  respondButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  respondButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C27B0',
  },
  actionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
  },
  buttonHalf: {
    flex: 1,
  },
  fullWidthButton: {
    width: '100%',
  },
  pagarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#66BB6A',
  },
  pagarButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#333333',
  },
  modalButtonSubmit: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: colors.text,
  },
  modalButtonTextSubmit: {
    color: '#000000',
  },
  adminRequestBox: {
    backgroundColor: '#9C27B0' + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  adminRequestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BA68C8',
    marginBottom: 4,
  },
  adminRequestText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingPayments, setVerifyingPayments] = useState<Set<string>>(new Set());
  const [requestingVerification, setRequestingVerification] = useState<Set<string>>(new Set());
  const [cancelingPayments, setCancelingPayments] = useState<Set<string>>(new Set());
  const [verificationRequests, setVerificationRequests] = useState<Map<string, any>>(new Map());
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedVerificationRequest, setSelectedVerificationRequest] = useState<any>(null);
  const [userResponse, setUserResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (user) {
      loadPayments();
      loadVerificationRequests();

      // Subscribe to payment updates
      const paymentsChannel = supabase
        .channel('payment-history-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Payment update received:', payload);
            loadPayments();
          }
        )
        .subscribe();

      // Subscribe to verification request updates
      const verificationsChannel = supabase
        .channel('verification-requests-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'manual_verification_requests',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Verification request update received:', payload);
            loadVerificationRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(paymentsChannel);
        supabase.removeChannel(verificationsChannel);
      };
    }
  }, [user]);

  const loadPayments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled') // Exclude cancelled payments from display
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded payments:', data?.length || 0);
      console.log('Payment statuses:', data?.map(p => ({ order_id: p.order_id, status: p.status, payment_id: p.payment_id })));
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadVerificationRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('manual_verification_requests')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Create a map of payment_id to verification request
      const requestsMap = new Map();
      (data || []).forEach((request: any) => {
        requestsMap.set(request.payment_id, request);
      });
      console.log('Loaded verification requests:', requestsMap.size);
      setVerificationRequests(requestsMap);
    } catch (error) {
      console.error('Error loading verification requests:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
    loadVerificationRequests();
  };

  const verifyPayment = async (payment: any) => {
    if (!session) {
      Alert.alert('Error', 'Sesión no válida');
      return;
    }

    setVerifyingPayments(prev => new Set(prev).add(payment.id));

    try {
      console.log('🔍 Verifying payment:', payment.order_id);

      const response = await fetch(
        'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/manual-verify-payment',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: payment.order_id,
          }),
        }
      );

      const data = await response.json();
      console.log('✅ Verification response:', data);

      if (data.success) {
        if (data.credited) {
          Alert.alert(
            '✅ Pago Verificado',
            `Tu pago ha sido verificado y acreditado exitosamente.\n\n` +
            `${data.payment.mxi_amount} MXI han sido agregados a tu cuenta.\n\n` +
            `Nuevo balance: ${data.payment.new_balance} MXI`,
            [
              {
                text: 'OK',
                onPress: () => loadPayments(),
              },
            ]
          );
        } else if (data.already_credited) {
          Alert.alert(
            'ℹ️ Ya Acreditado',
            'Este pago ya ha sido acreditado anteriormente.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'ℹ️ Estado Actualizado',
            `Estado del pago: ${data.payment.status}\n\n` +
            `El pago aún no ha sido confirmado por NOWPayments. Por favor, espera a que se confirme o solicita verificación manual.`,
            [
              {
                text: 'OK',
                onPress: () => loadPayments(),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Error',
          data.error || 'Error al verificar el pago',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error verifying payment:', error);
      Alert.alert(
        'Error',
        'Error de conexión al verificar el pago. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setVerifyingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(payment.id);
        return newSet;
      });
    }
  };

  const requestManualVerification = async (payment: any) => {
    if (!user) {
      Alert.alert('Error', 'Sesión no válida');
      return;
    }

    Alert.alert(
      'Solicitar Verificación Manual',
      `¿Deseas solicitar la verificación manual de este pago?\n\n` +
      `Monto: ${parseFloat(payment.price_amount).toFixed(2)} USDT\n` +
      `MXI: ${parseFloat(payment.mxi_amount).toFixed(2)} MXI\n\n` +
      `Un administrador revisará tu pago y lo aprobará manualmente. Este proceso puede tomar hasta 2 horas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: async () => {
            setRequestingVerification(prev => new Set(prev).add(payment.id));

            try {
              console.log('📝 Creating manual verification request for payment:', payment.id);
              
              const { data, error } = await supabase
                .from('manual_verification_requests')
                .insert({
                  payment_id: payment.id,
                  user_id: user.id,
                  order_id: payment.order_id,
                  status: 'pending',
                })
                .select()
                .single();

              if (error) {
                console.error('❌ Error creating verification request:', error);
                throw error;
              }

              console.log('✅ Verification request created:', data);

              Alert.alert(
                '✅ Solicitud Enviada',
                `Tu solicitud de verificación manual ha sido enviada exitosamente.\n\n` +
                `Un administrador revisará tu pago en las próximas 2 horas y lo aprobará manualmente.\n\n` +
                `Recibirás una notificación cuando tu pago sea verificado.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadVerificationRequests();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Error requesting verification:', error);
              Alert.alert(
                'Error',
                error.message || 'Error al solicitar la verificación manual',
                [{ text: 'OK' }]
              );
            } finally {
              setRequestingVerification(prev => {
                const newSet = new Set(prev);
                newSet.delete(payment.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const openResponseModal = (verificationRequest: any) => {
    setSelectedVerificationRequest(verificationRequest);
    setUserResponse('');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!userResponse.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu respuesta');
      return;
    }

    setSubmittingResponse(true);

    try {
      await supabase
        .from('manual_verification_requests')
        .update({
          user_response: userResponse.trim(),
          user_response_at: new Date().toISOString(),
          status: 'pending', // Change status back to pending so admin can review
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedVerificationRequest.id);

      setShowResponseModal(false);
      setUserResponse('');
      setSelectedVerificationRequest(null);

      Alert.alert(
        '✅ Respuesta Enviada',
        'Tu respuesta ha sido enviada al administrador. Recibirás una notificación cuando tu solicitud sea revisada.',
        [
          {
            text: 'OK',
            onPress: () => loadVerificationRequests(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting response:', error);
      Alert.alert(
        'Error',
        error.message || 'Error al enviar la respuesta',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmittingResponse(false);
    }
  };

  const cancelPayment = async (payment: any) => {
    if (!user) {
      Alert.alert('Error', 'Sesión no válida');
      return;
    }

    Alert.alert(
      '⚠️ Cancelar Pago',
      `¿Estás seguro de que deseas cancelar este pago?\n\n` +
      `Orden: ${payment.order_id}\n` +
      `Monto: ${parseFloat(payment.price_amount).toFixed(2)} USDT\n\n` +
      `Esta acción no se puede deshacer. El pago será cancelado y eliminado del historial.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelingPayments(prev => new Set(prev).add(payment.id));

            try {
              console.log('🗑️ Canceling payment:', payment.order_id);

              // Update payment status to cancelled
              const { error: updateError } = await supabase
                .from('payments')
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', payment.id);

              if (updateError) {
                console.error('❌ Error updating payment status:', updateError);
                throw updateError;
              }

              console.log('✅ Payment status updated to cancelled');

              // Update transaction history
              const { error: txError } = await supabase
                .from('transaction_history')
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString(),
                })
                .eq('order_id', payment.order_id);

              if (txError) {
                console.error('⚠️ Error updating transaction history:', txError);
                // Don't fail the whole operation
              }

              // Delete any pending verification requests
              const { error: deleteError } = await supabase
                .from('manual_verification_requests')
                .delete()
                .eq('payment_id', payment.id);

              if (deleteError) {
                console.error('⚠️ Error deleting verification requests:', deleteError);
                // Don't fail the whole operation
              }

              console.log('✅ Payment cancelled successfully');

              Alert.alert(
                '✅ Pago Cancelado',
                'El pago ha sido cancelado exitosamente y eliminado del historial.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadPayments();
                      loadVerificationRequests();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Error canceling payment:', error);
              Alert.alert(
                'Error',
                error.message || 'Error al cancelar el pago. Por favor, intenta nuevamente.',
                [{ text: 'OK' }]
              );
            } finally {
              setCancelingPayments(prev => {
                const newSet = new Set(prev);
                newSet.delete(payment.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const openPaymentUrl = (payment: any) => {
    if (payment.payment_url) {
      Alert.alert(
        'Abrir Pago',
        '¿Deseas abrir el enlace de pago en tu navegador?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir',
            onPress: () => {
              // Open payment URL in browser
              if (typeof window !== 'undefined') {
                window.open(payment.payment_url, '_blank');
              }
            },
          },
        ]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
      case 'confirmed':
        return '#4CAF50';
      case 'waiting':
      case 'pending':
        return colors.primary;
      case 'confirming':
        return '#2196F3';
      case 'failed':
      case 'expired':
      case 'cancelled':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished':
        return 'Completado';
      case 'confirmed':
        return 'Confirmado';
      case 'waiting':
        return 'Esperando Pago';
      case 'pending':
        return 'Pendiente';
      case 'confirming':
        return 'Confirmando';
      case 'failed':
        return 'Fallido';
      case 'expired':
        return 'Expirado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const isPendingPayment = (payment: any) => {
    // Payment is pending if it's waiting, pending, or confirming
    // NOT if it's finished, confirmed, failed, expired, or cancelled
    const pendingStatuses = ['waiting', 'pending', 'confirming'];
    const result = pendingStatuses.includes(payment.status);
    console.log(`isPendingPayment for ${payment.order_id}: status=${payment.status}, result=${result}`);
    return result;
  };

  const getFilteredPayments = () => {
    switch (activeFilter) {
      case 'pending':
        return payments.filter(p => ['waiting', 'pending', 'confirming'].includes(p.status));
      case 'success':
        return payments.filter(p => ['finished', 'confirmed'].includes(p.status));
      case 'failed':
        return payments.filter(p => ['failed', 'expired'].includes(p.status));
      default:
        return payments;
    }
  };

  const getPaymentStats = () => {
    const total = payments.length;
    const pending = payments.filter(p => ['waiting', 'pending', 'confirming'].includes(p.status)).length;
    const success = payments.filter(p => ['finished', 'confirmed'].includes(p.status)).length;
    const failed = payments.filter(p => ['failed', 'expired'].includes(p.status)).length;
    return { total, pending, success, failed };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial de Transacciones</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = getPaymentStats();
  const filteredPayments = getFilteredPayments();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Transacciones</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="doc.text"
            android_material_icon_name="description"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            No tienes pagos registrados aún.{'\n'}
            Realiza tu primera compra de MXI para comenzar.
          </Text>
        </View>
      ) : (
        <React.Fragment>
          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.success}</Text>
              <Text style={styles.statLabel}>Exitosas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.failed}</Text>
              <Text style={styles.statLabel}>Fallidas</Text>
            </View>
          </View>

          {/* Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 'all' && styles.filterButtonTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'pending' && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter('pending')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 'pending' && styles.filterButtonTextActive,
                ]}
              >
                Pendientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'success' && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter('success')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 'success' && styles.filterButtonTextActive,
                ]}
              >
                Exitosas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'failed' && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter('failed')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 'failed' && styles.filterButtonTextActive,
                ]}
              >
                Fallidas
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {filteredPayments.map((payment, index) => {
              const isVerifying = verifyingPayments.has(payment.id);
              const isRequestingVerification = requestingVerification.has(payment.id);
              const isCanceling = cancelingPayments.has(payment.id);
              const verificationRequest = verificationRequests.get(payment.id);
              const isPending = isPendingPayment(payment);

              console.log(`🔍 Rendering payment ${payment.order_id}:`, {
                status: payment.status,
                isPending,
                payment_id: payment.payment_id,
                verificationRequest: verificationRequest?.status,
              });

              return (
                <View key={index} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>
                      {parseFloat(payment.price_amount).toFixed(2)} USDT
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(payment.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>MXI:</Text>
                    <Text style={styles.paymentValue}>
                      {parseFloat(payment.mxi_amount).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>USDT:</Text>
                    <Text style={styles.paymentValue}>
                      ${parseFloat(payment.price_amount).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>Orden:</Text>
                    <Text style={styles.orderIdText}>{payment.order_id}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Fecha:</Text>
                    <Text style={styles.paymentValue}>
                      {new Date(payment.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* DRASTIC FIX: ALWAYS SHOW BUTTONS FOR PENDING PAYMENTS */}
                  {isPending && (
                    <React.Fragment>
                      {/* Pagar Button - Opens payment URL */}
                      {payment.payment_url && (
                        <TouchableOpacity
                          style={styles.pagarButton}
                          onPress={() => openPaymentUrl(payment)}
                        >
                          <IconSymbol
                            ios_icon_name="creditcard.fill"
                            android_material_icon_name="payment"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.pagarButtonText}>Pagar</Text>
                        </TouchableOpacity>
                      )}

                      {/* Verificar Button - Automatic verification */}
                      {payment.payment_id && (
                        <TouchableOpacity
                          style={[
                            styles.verifyButton,
                            isVerifying && styles.verifyButtonDisabled,
                          ]}
                          onPress={() => verifyPayment(payment)}
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <React.Fragment>
                              <ActivityIndicator size="small" color="#000000" />
                              <Text style={styles.verifyButtonText}>Verificando...</Text>
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <IconSymbol
                                ios_icon_name="checkmark.circle.fill"
                                android_material_icon_name="check_circle"
                                size={20}
                                color="#000000"
                              />
                              <Text style={styles.verifyButtonText}>Verificar</Text>
                            </React.Fragment>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* 🚨 DRASTIC FIX: SOLICITAR VERIFICACIÓN MANUAL BUTTON - ALWAYS SHOW FOR ALL PENDING PAYMENTS 🚨 */}
                      {!verificationRequest && (
                        <TouchableOpacity
                          style={[
                            styles.requestVerificationButton,
                            isRequestingVerification && styles.requestVerificationButtonDisabled,
                          ]}
                          onPress={() => requestManualVerification(payment)}
                          disabled={isRequestingVerification}
                        >
                          {isRequestingVerification ? (
                            <React.Fragment>
                              <ActivityIndicator size="small" color="#FFFFFF" />
                              <Text style={styles.requestVerificationButtonText}>Enviando...</Text>
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <IconSymbol
                                ios_icon_name="person.fill.checkmark"
                                android_material_icon_name="admin_panel_settings"
                                size={20}
                                color="#FFFFFF"
                              />
                              <Text style={styles.requestVerificationButtonText}>
                                Solicitar Verificación Manual
                              </Text>
                            </React.Fragment>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Cancelar Button */}
                      <TouchableOpacity
                        style={[
                          styles.cancelButton,
                          isCanceling && styles.cancelButtonDisabled,
                        ]}
                        onPress={() => cancelPayment(payment)}
                        disabled={isCanceling}
                      >
                        {isCanceling ? (
                          <React.Fragment>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.cancelButtonText}>Cancelando...</Text>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <IconSymbol
                              ios_icon_name="xmark.circle.fill"
                              android_material_icon_name="cancel"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                          </React.Fragment>
                        )}
                      </TouchableOpacity>

                      {/* Info Box */}
                      <View style={styles.infoBox}>
                        <IconSymbol
                          ios_icon_name="info.circle.fill"
                          android_material_icon_name="info"
                          size={20}
                          color="#2196F3"
                        />
                        <Text style={styles.infoText}>
                          Si la verificación automática no funciona, solicita verificación manual. Un administrador revisará tu pago en las próximas 2 horas.
                        </Text>
                      </View>
                    </React.Fragment>
                  )}

                  {/* Verification Request Status Badges */}
                  {verificationRequest && verificationRequest.status === 'pending' && (
                    <View style={styles.pendingVerificationBadge}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.pendingVerificationText}>
                        ⏳ Verificación manual solicitada. Un administrador revisará tu pago pronto.
                      </Text>
                    </View>
                  )}

                  {verificationRequest && verificationRequest.status === 'reviewing' && (
                    <View style={styles.reviewingBadge}>
                      <IconSymbol
                        ios_icon_name="eye.fill"
                        android_material_icon_name="visibility"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.reviewingText}>
                        👀 Un administrador está revisando tu pago ahora.
                      </Text>
                    </View>
                  )}

                  {verificationRequest && verificationRequest.status === 'more_info_requested' && (
                    <View style={styles.moreInfoRequestedBadge}>
                      <Text style={styles.moreInfoRequestedTitle}>
                        📋 El administrador solicita más información
                      </Text>
                      {verificationRequest.admin_request_info && (
                        <View style={styles.adminRequestBox}>
                          <Text style={styles.adminRequestLabel}>Información solicitada:</Text>
                          <Text style={styles.adminRequestText}>
                            {verificationRequest.admin_request_info}
                          </Text>
                        </View>
                      )}
                      {verificationRequest.user_response ? (
                        <View style={styles.infoBox}>
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check_circle"
                            size={20}
                            color="#2196F3"
                          />
                          <Text style={styles.infoText}>
                            ✅ Respuesta enviada. El administrador la revisará pronto.
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.respondButton}
                          onPress={() => openResponseModal(verificationRequest)}
                        >
                          <IconSymbol
                            ios_icon_name="text.bubble.fill"
                            android_material_icon_name="chat"
                            size={20}
                            color="#9C27B0"
                          />
                          <Text style={styles.respondButtonText}>Responder</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {verificationRequest && verificationRequest.status === 'approved' && (
                    <View style={styles.approvedBadge}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.approvedText}>
                        ✅ Verificación manual aprobada
                      </Text>
                    </View>
                  )}

                  {verificationRequest && verificationRequest.status === 'rejected' && (
                    <View style={styles.rejectedBadge}>
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.rejectedText}>
                        ❌ Rechazado: {verificationRequest.admin_notes || 'Sin motivo'}
                      </Text>
                    </View>
                  )}

                  {/* Success Badge for Completed Payments */}
                  {(payment.status === 'finished' || payment.status === 'confirmed') && (
                    <View style={styles.successBadge}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.successText}>
                        ✅ Pago acreditado exitosamente
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={{ height: 100 }} />
          </ScrollView>
        </React.Fragment>
      )}

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Responder al Administrador</Text>
            {selectedVerificationRequest?.admin_request_info && (
              <View style={styles.adminRequestBox}>
                <Text style={styles.adminRequestLabel}>Información solicitada:</Text>
                <Text style={styles.adminRequestText}>
                  {selectedVerificationRequest.admin_request_info}
                </Text>
              </View>
            )}
            <Text style={[styles.paymentLabel, { marginTop: 16, marginBottom: 12 }]}>
              Tu respuesta:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor={colors.textSecondary}
              value={userResponse}
              onChangeText={setUserResponse}
              multiline
              numberOfLines={4}
              editable={!submittingResponse}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowResponseModal(false);
                  setUserResponse('');
                  setSelectedVerificationRequest(null);
                }}
                disabled={submittingResponse}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={submitResponse}
                disabled={submittingResponse}
              >
                {submittingResponse ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSubmit]}>
                    Enviar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
