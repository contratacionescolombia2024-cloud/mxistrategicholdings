
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

interface AmbassadorWithdrawal {
  id: string;
  user_id: string;
  level_achieved: number;
  bonus_amount: number;
  usdt_address: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

const LEVEL_NAMES = ['', 'Bronce', 'Plata', 'Oro', 'Diamante', 'Élite Global', 'Embajador Legendario'];

export default function AmbassadorWithdrawalsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<AmbassadorWithdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AmbassadorWithdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        Alert.alert('Acceso Denegado', 'No tienes permisos de administrador');
        router.replace('/(tabs)/(home)');
        return;
      }

      await loadWithdrawals();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.replace('/(tabs)/(home)');
    }
  };

  const loadWithdrawals = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ambassador_bonus_withdrawals')
        .select(`
          *,
          users!inner(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading withdrawals:', error);
        Alert.alert('Error', 'No se pudieron cargar las solicitudes de retiro');
        return;
      }

      const formattedData = data.map((w: any) => ({
        ...w,
        user_name: w.users.name,
        user_email: w.users.email,
      }));

      setWithdrawals(formattedData);
    } catch (error: any) {
      console.error('Exception loading withdrawals:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWithdrawals();
  };

  const handleApprove = async (withdrawal: AmbassadorWithdrawal) => {
    Alert.alert(
      'Aprobar Retiro',
      `¿Aprobar retiro de ${withdrawal.bonus_amount} USDT para ${withdrawal.user_name}?\n\nDirección TRC20: ${withdrawal.usdt_address}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            setProcessing(true);
            try {
              // Update withdrawal status
              const { error: updateError } = await supabase
                .from('ambassador_bonus_withdrawals')
                .update({
                  status: 'completed',
                  reviewed_by: user?.id,
                  reviewed_at: new Date().toISOString(),
                  admin_notes: adminNotes || 'Aprobado',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', withdrawal.id);

              if (updateError) {
                console.error('Error updating withdrawal:', updateError);
                Alert.alert('Error', 'No se pudo aprobar el retiro');
                return;
              }

              // Mark bonuses as withdrawn in ambassador_levels
              const levelKey = `level_${withdrawal.level_achieved}_bonus_withdrawn`;
              const updateData: any = {
                updated_at: new Date().toISOString(),
              };

              // Mark all levels up to the achieved level as withdrawn
              for (let i = 1; i <= withdrawal.level_achieved; i++) {
                updateData[`level_${i}_bonus_withdrawn`] = true;
              }

              // Update total bonus withdrawn
              updateData.total_bonus_withdrawn = withdrawal.bonus_amount;

              const { error: levelError } = await supabase
                .from('ambassador_levels')
                .update(updateData)
                .eq('user_id', withdrawal.user_id);

              if (levelError) {
                console.error('Error updating ambassador level:', levelError);
              }

              Alert.alert('Éxito', 'Retiro aprobado exitosamente');
              setSelectedWithdrawal(null);
              setAdminNotes('');
              await loadWithdrawals();
            } catch (error: any) {
              console.error('Exception approving withdrawal:', error);
              Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (withdrawal: AmbassadorWithdrawal) => {
    if (!adminNotes || adminNotes.trim().length === 0) {
      Alert.alert('Notas Requeridas', 'Por favor ingresa una razón para el rechazo');
      return;
    }

    Alert.alert(
      'Rechazar Retiro',
      `¿Rechazar retiro de ${withdrawal.bonus_amount} USDT para ${withdrawal.user_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const { error } = await supabase
                .from('ambassador_bonus_withdrawals')
                .update({
                  status: 'rejected',
                  reviewed_by: user?.id,
                  reviewed_at: new Date().toISOString(),
                  admin_notes: adminNotes,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', withdrawal.id);

              if (error) {
                console.error('Error rejecting withdrawal:', error);
                Alert.alert('Error', 'No se pudo rechazar el retiro');
                return;
              }

              Alert.alert('Éxito', 'Retiro rechazado');
              setSelectedWithdrawal(null);
              setAdminNotes('');
              await loadWithdrawals();
            } catch (error: any) {
              console.error('Exception rejecting withdrawal:', error);
              Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.accent;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completado';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retiros de Embajadores</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {withdrawals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="tray" 
              android_material_icon_name="inbox" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No hay solicitudes de retiro</Text>
          </View>
        ) : (
          withdrawals.map((withdrawal) => (
            <View key={withdrawal.id} style={[commonStyles.card, styles.withdrawalCard]}>
              <View style={styles.withdrawalHeader}>
                <View style={styles.withdrawalUser}>
                  <Text style={styles.userName}>{withdrawal.user_name}</Text>
                  <Text style={styles.userEmail}>{withdrawal.user_email}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(withdrawal.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(withdrawal.status) }]}>
                    {getStatusText(withdrawal.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.withdrawalDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nivel Alcanzado:</Text>
                  <Text style={styles.detailValue}>
                    {LEVEL_NAMES[withdrawal.level_achieved] || `Nivel ${withdrawal.level_achieved}`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bono:</Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>
                    {withdrawal.bonus_amount} USDT
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dirección TRC20:</Text>
                  <Text style={[styles.detailValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                    {withdrawal.usdt_address}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(withdrawal.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {withdrawal.admin_notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notas del Admin:</Text>
                  <Text style={styles.notesText}>{withdrawal.admin_notes}</Text>
                </View>
              )}

              {withdrawal.status === 'pending' && (
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.reviewButton]}
                  onPress={() => {
                    setSelectedWithdrawal(withdrawal);
                    setAdminNotes('');
                  }}
                >
                  <Text style={buttonStyles.primaryText}>Revisar</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Extra padding at bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Review Modal */}
      {selectedWithdrawal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revisar Retiro</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedWithdrawal(null);
                  setAdminNotes('');
                }}
                disabled={processing}
              >
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Usuario:</Text>
                <Text style={styles.modalValue}>{selectedWithdrawal.user_name}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Email:</Text>
                <Text style={styles.modalValue}>{selectedWithdrawal.user_email}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Nivel:</Text>
                <Text style={styles.modalValue}>
                  {LEVEL_NAMES[selectedWithdrawal.level_achieved]}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Bono:</Text>
                <Text style={[styles.modalValue, { color: colors.success }]}>
                  {selectedWithdrawal.bonus_amount} USDT
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Dirección TRC20:</Text>
                <Text style={[styles.modalValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                  {selectedWithdrawal.usdt_address}
                </Text>
              </View>

              <View style={styles.notesInputContainer}>
                <Text style={styles.notesInputLabel}>Notas del Admin (opcional):</Text>
                <TextInput
                  style={styles.notesInput}
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  placeholder="Ingresa notas sobre esta solicitud..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  editable={!processing}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[buttonStyles.secondary, styles.modalActionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleReject(selectedWithdrawal)}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <IconSymbol 
                        ios_icon_name="xmark.circle" 
                        android_material_icon_name="cancel" 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={[buttonStyles.secondaryText, { color: '#fff' }]}>Rechazar</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[buttonStyles.primary, styles.modalActionButton]}
                  onPress={() => handleApprove(selectedWithdrawal)}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <IconSymbol 
                        ios_icon_name="checkmark.circle" 
                        android_material_icon_name="check_circle" 
                        size={20} 
                        color="#000" 
                      />
                      <Text style={buttonStyles.primaryText}>Aprobar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  withdrawalCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  withdrawalUser: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  withdrawalDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  notesContainer: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  reviewButton: {
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    gap: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  notesInputContainer: {
    marginTop: 8,
  },
  notesInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
  },
});
