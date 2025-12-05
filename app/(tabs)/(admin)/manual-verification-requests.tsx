
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
  TextInput,
  Modal,
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestAmount: {
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
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  requestValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  orderIdContainer: {
    backgroundColor: colors.background,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  moreInfoButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoBox: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.border,
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
  userResponseBox: {
    backgroundColor: '#2196F3' + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  userResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  userResponseText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  adminRequestBox: {
    backgroundColor: '#FF9800' + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  adminRequestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 4,
  },
  adminRequestText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  paymentTypeBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  paymentTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amountInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: '#FF9800' + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  warningText: {
    fontSize: 13,
    color: '#FF9800',
    lineHeight: 18,
  },
});

export default function ManualVerificationRequestsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [moreInfoText, setMoreInfoText] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvedUsdtAmount, setApprovedUsdtAmount] = useState('');

  useEffect(() => {
    loadRequests();

    // Subscribe to verification request updates
    const channel = supabase
      .channel('admin-verification-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_verification_requests',
        },
        (payload) => {
          console.log('Verification request update:', payload);
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      let query = supabase
        .from('manual_verification_requests')
        .select(`
          *,
          payments (
            id,
            order_id,
            payment_id,
            price_amount,
            mxi_amount,
            price_per_mxi,
            phase,
            pay_currency,
            status,
            tx_hash,
            created_at
          ),
          users (
            id,
            email,
            name,
            mxi_balance
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'pending') {
        query = query.in('status', ['pending', 'reviewing', 'more_info_requested']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading verification requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const openApproveModal = (request: any) => {
    setSelectedRequest(request);
    
    // Pre-fill with the payment amount
    setApprovedUsdtAmount(parseFloat(request.payments.price_amount).toFixed(2));
    
    setShowApproveModal(true);
  };

  const approveRequest = async () => {
    if (!session) {
      Alert.alert('Error', 'Sesión no válida');
      return;
    }

    const request = selectedRequest;
    const isDirectUSDT = request.payments.tx_hash && !request.payments.payment_id;
    const isNowPayments = !!request.payments.payment_id;

    // Validate approved amount
    const amount = parseFloat(approvedUsdtAmount);
    if (!approvedUsdtAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida de USDT aprobada');
      return;
    }

    setShowApproveModal(false);
    setProcessingRequests(prev => new Set(prev).add(request.id));

    try {
      // First, update the request status to reviewing
      await supabase
        .from('manual_verification_requests')
        .update({
          status: 'reviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      // Prepare request body
      const requestBody: any = {
        order_id: request.payments.order_id,
        approved_usdt_amount: parseFloat(approvedUsdtAmount),
      };

      console.log('Calling manual-verify-payment with:', requestBody);

      // Call the manual verification edge function
      const response = await fetch(
        'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/manual-verify-payment',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      console.log('Verification response:', data);

      if (data.success) {
        if (data.credited) {
          // Update request status to approved
          await supabase
            .from('manual_verification_requests')
            .update({
              status: 'approved',
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
              admin_notes: `Pago verificado y acreditado exitosamente. Monto aprobado: ${approvedUsdtAmount} USDT`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', request.id);

          Alert.alert(
            '✅ Pago Aprobado',
            `El pago ha sido verificado y acreditado exitosamente.\n\n` +
            `${data.payment.mxi_amount} MXI han sido agregados a la cuenta del usuario.\n` +
            `\nMonto USDT aprobado: ${approvedUsdtAmount}`,
            [
              {
                text: 'OK',
                onPress: () => loadRequests(),
              },
            ]
          );
        } else if (data.already_credited) {
          // Update request status to approved
          await supabase
            .from('manual_verification_requests')
            .update({
              status: 'approved',
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
              admin_notes: 'Pago ya había sido acreditado anteriormente',
              updated_at: new Date().toISOString(),
            })
            .eq('id', request.id);

          Alert.alert(
            'ℹ️ Ya Acreditado',
            'Este pago ya había sido acreditado anteriormente.',
            [
              {
                text: 'OK',
                onPress: () => loadRequests(),
              },
            ]
          );
        } else {
          // Payment not confirmed yet, update status back to pending
          await supabase
            .from('manual_verification_requests')
            .update({
              status: 'pending',
              admin_notes: `Estado del pago: ${data.payment.status}. Aún no confirmado.`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', request.id);

          Alert.alert(
            'ℹ️ Pago No Confirmado',
            `El pago aún no ha sido confirmado.\n\n` +
            `Estado actual: ${data.payment.status}\n\n` +
            `Por favor, espera a que el pago sea confirmado antes de aprobarlo.`,
            [{ text: 'OK', onPress: () => loadRequests() }]
          );
        }
      } else {
        // Update status back to pending with error
        await supabase
          .from('manual_verification_requests')
          .update({
            status: 'pending',
            admin_notes: `Error: ${data.error}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.id);

        Alert.alert(
          'Error',
          data.error || 'Error al verificar el pago',
          [{ text: 'OK', onPress: () => loadRequests() }]
        );
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      
      // Update status back to pending with error
      await supabase
        .from('manual_verification_requests')
        .update({
          status: 'pending',
          admin_notes: `Error: ${error.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      Alert.alert(
        'Error',
        error.message || 'Error al aprobar la solicitud',
        [{ text: 'OK', onPress: () => loadRequests() }]
      );
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
      setSelectedRequest(null);
      setApprovedUsdtAmount('');
    }
  };

  const openRejectModal = (request: any) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const rejectRequest = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Por favor ingresa un motivo de rechazo');
      return;
    }

    setShowRejectModal(false);
    setProcessingRequests(prev => new Set(prev).add(selectedRequest.id));

    try {
      await supabase
        .from('manual_verification_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: rejectReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      Alert.alert(
        '✅ Solicitud Rechazada',
        'La solicitud ha sido rechazada exitosamente. El usuario recibirá una notificación con el motivo.',
        [
          {
            text: 'OK',
            onPress: () => loadRequests(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      Alert.alert(
        'Error',
        error.message || 'Error al rechazar la solicitud',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedRequest.id);
        return newSet;
      });
      setSelectedRequest(null);
      setRejectReason('');
    }
  };

  const openMoreInfoModal = (request: any) => {
    setSelectedRequest(request);
    setMoreInfoText('');
    setShowMoreInfoModal(true);
  };

  const requestMoreInfo = async () => {
    if (!moreInfoText.trim()) {
      Alert.alert('Error', 'Por favor ingresa la información que necesitas');
      return;
    }

    setShowMoreInfoModal(false);
    setProcessingRequests(prev => new Set(prev).add(selectedRequest.id));

    try {
      await supabase
        .from('manual_verification_requests')
        .update({
          status: 'more_info_requested',
          admin_request_info: moreInfoText.trim(),
          admin_request_info_at: new Date().toISOString(),
          reviewed_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      Alert.alert(
        '✅ Información Solicitada',
        'Se ha solicitado más información al usuario. El usuario recibirá una notificación.',
        [
          {
            text: 'OK',
            onPress: () => loadRequests(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error requesting more info:', error);
      Alert.alert(
        'Error',
        error.message || 'Error al solicitar más información',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedRequest.id);
        return newSet;
      });
      setSelectedRequest(null);
      setMoreInfoText('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'reviewing':
        return '#2196F3';
      case 'rejected':
        return '#F44336';
      case 'more_info_requested':
        return '#9C27B0';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'reviewing':
        return 'Revisando';
      case 'rejected':
        return 'Rechazado';
      case 'more_info_requested':
        return 'Info Solicitada';
      default:
        return status;
    }
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
          <Text style={styles.headerTitle}>Verificaciones Manuales</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Verificaciones Manuales</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="checkmark.circle"
            android_material_icon_name="check_circle"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'pending'
              ? 'No hay solicitudes de verificación pendientes.'
              : 'No hay solicitudes de verificación.'}
          </Text>
        </View>
      ) : (
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
          {requests.map((request, index) => {
            const isProcessing = processingRequests.has(request.id);
            const isPending = ['pending', 'reviewing', 'more_info_requested'].includes(request.status);
            const isDirectUSDT = request.payments.tx_hash && !request.payments.payment_id;
            const isNowPayments = !!request.payments.payment_id;

            return (
              <View key={index} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestAmount}>
                    {parseFloat(request.payments.price_amount).toFixed(2)} USDT
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                </View>

                {/* Payment Type Badge */}
                <View style={[styles.paymentTypeBadge, { backgroundColor: isDirectUSDT ? '#FF9800' : '#2196F3' }]}>
                  <Text style={styles.paymentTypeText}>
                    {isDirectUSDT ? '💰 USDT Directo' : '🔄 NowPayments'}
                  </Text>
                </View>

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Usuario:</Text>
                  <Text style={styles.requestValue}>{request.users.email}</Text>
                </View>

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Nombre:</Text>
                  <Text style={styles.requestValue}>{request.users.name}</Text>
                </View>

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>MXI a Acreditar:</Text>
                  <Text style={styles.requestValue}>
                    {parseFloat(request.payments.mxi_amount).toFixed(2)} MXI
                  </Text>
                </View>

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Balance Actual:</Text>
                  <Text style={styles.requestValue}>
                    {parseFloat(request.users.mxi_balance).toFixed(2)} MXI
                  </Text>
                </View>

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Fase:</Text>
                  <Text style={styles.requestValue}>Fase {request.payments.phase}</Text>
                </View>

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Moneda:</Text>
                  <Text style={styles.requestValue}>
                    {request.payments.pay_currency.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.requestRow}>
                  <Text style={styles.requestLabel}>Solicitado:</Text>
                  <Text style={styles.requestValue}>
                    {new Date(request.created_at).toLocaleString()}
                  </Text>
                </View>

                {request.reviewed_at && (
                  <View style={styles.requestRow}>
                    <Text style={styles.requestLabel}>Revisado:</Text>
                    <Text style={styles.requestValue}>
                      {new Date(request.reviewed_at).toLocaleString()}
                    </Text>
                  </View>
                )}

                <View style={styles.orderIdContainer}>
                  <Text style={styles.orderIdLabel}>ID de Orden:</Text>
                  <Text style={styles.orderIdText}>{request.payments.order_id}</Text>
                </View>

                {request.payments.payment_id && (
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>Payment ID:</Text>
                    <Text style={styles.orderIdText}>{request.payments.payment_id}</Text>
                  </View>
                )}

                {request.payments.tx_hash && (
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>Transaction Hash:</Text>
                    <Text style={styles.orderIdText}>{request.payments.tx_hash}</Text>
                  </View>
                )}

                {request.admin_request_info && (
                  <View style={styles.adminRequestBox}>
                    <Text style={styles.adminRequestLabel}>
                      📋 Información Solicitada al Usuario:
                    </Text>
                    <Text style={styles.adminRequestText}>{request.admin_request_info}</Text>
                    {request.admin_request_info_at && (
                      <Text style={[styles.adminRequestText, { fontSize: 11, marginTop: 4, fontStyle: 'italic' }]}>
                        Solicitado: {new Date(request.admin_request_info_at).toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}

                {request.user_response && (
                  <View style={styles.userResponseBox}>
                    <Text style={styles.userResponseLabel}>
                      💬 Respuesta del Usuario:
                    </Text>
                    <Text style={styles.userResponseText}>{request.user_response}</Text>
                    {request.user_response_at && (
                      <Text style={[styles.userResponseText, { fontSize: 11, marginTop: 4, fontStyle: 'italic' }]}>
                        Respondido: {new Date(request.user_response_at).toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}

                {request.admin_notes && (
                  <View style={styles.infoBox}>
                    <IconSymbol
                      ios_icon_name="note.text"
                      android_material_icon_name="note"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.infoText}>{request.admin_notes}</Text>
                  </View>
                )}

                {isPending && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => openApproveModal(request)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <React.Fragment>
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check_circle"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.buttonText}>Aprobar</Text>
                        </React.Fragment>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.moreInfoButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => openMoreInfoModal(request)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <React.Fragment>
                          <IconSymbol
                            ios_icon_name="questionmark.circle.fill"
                            android_material_icon_name="help"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.buttonText}>Más Info</Text>
                        </React.Fragment>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => openRejectModal(request)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <React.Fragment>
                          <IconSymbol
                            ios_icon_name="xmark.circle.fill"
                            android_material_icon_name="cancel"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.buttonText}>Rechazar</Text>
                        </React.Fragment>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aprobar Verificación</Text>
            
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {selectedRequest && selectedRequest.payments.tx_hash && !selectedRequest.payments.payment_id
                  ? '⚠️ Este es un pago USDT directo. Verifica la transacción en la blockchain y ajusta el monto si es necesario.'
                  : '⚠️ Este es un pago de NowPayments. Puedes aprobar manualmente sin verificar con la API de NowPayments. Ajusta el monto si es necesario.'}
              </Text>
            </View>
            
            <Text style={styles.amountInputLabel}>Cantidad USDT Aprobada:</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Ej: 50.00"
              placeholderTextColor={colors.textSecondary}
              value={approvedUsdtAmount}
              onChangeText={setApprovedUsdtAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowApproveModal(false);
                  setApprovedUsdtAmount('');
                  setSelectedRequest(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={approveRequest}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSubmit]}>
                  Aprobar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* More Info Modal */}
      <Modal
        visible={showMoreInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Más Información</Text>
            <Text style={[styles.requestLabel, { marginBottom: 12 }]}>
              ¿Qué información necesitas del usuario?
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Por favor proporciona el comprobante de pago o más detalles sobre la transacción..."
              placeholderTextColor={colors.textSecondary}
              value={moreInfoText}
              onChangeText={setMoreInfoText}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowMoreInfoModal(false);
                  setMoreInfoText('');
                  setSelectedRequest(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={requestMoreInfo}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSubmit]}>
                  Enviar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
            <Text style={[styles.requestLabel, { marginBottom: 12 }]}>
              ¿Por qué estás rechazando esta solicitud?
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: La transacción no se encontró en la blockchain, el monto es insuficiente, etc..."
              placeholderTextColor={colors.textSecondary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRequest(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={rejectRequest}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSubmit]}>
                  Rechazar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
