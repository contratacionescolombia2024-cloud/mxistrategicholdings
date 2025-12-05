
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  wallet_address: string;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string;
  admin_notes: string | null;
}

export default function WithdrawalApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          users!inner(email, name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped = data?.map((w: any) => ({
        ...w,
        user_email: w.users.email,
        user_name: w.users.name,
      })) || [];

      setWithdrawals(mapped);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      Alert.alert('Error', 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    Alert.alert(
      'Approve Withdrawal',
      'Are you sure you want to approve this withdrawal request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setProcessing(true);

              const { data: adminData } = await supabase
                .from('admin_users')
                .select('id')
                .eq('user_id', user?.id)
                .single();

              const { error } = await supabase
                .from('withdrawals')
                .update({
                  status: 'processing',
                  reviewed_by: adminData?.id,
                  reviewed_at: new Date().toISOString(),
                  admin_notes: adminNotes || null,
                })
                .eq('id', withdrawalId);

              if (error) throw error;

              Alert.alert('Success', 'Withdrawal approved and set to processing');
              setSelectedWithdrawal(null);
              setAdminNotes('');
              loadWithdrawals();
            } catch (error) {
              console.error('Error approving withdrawal:', error);
              Alert.alert('Error', 'Failed to approve withdrawal');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (withdrawalId: string) => {
    Alert.alert(
      'Complete Withdrawal',
      'Mark this withdrawal as completed? This means the funds have been sent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setProcessing(true);

              const { error } = await supabase
                .from('withdrawals')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  admin_notes: adminNotes || null,
                })
                .eq('id', withdrawalId);

              if (error) throw error;

              Alert.alert('Success', 'Withdrawal marked as completed');
              setSelectedWithdrawal(null);
              setAdminNotes('');
              loadWithdrawals();
            } catch (error) {
              console.error('Error completing withdrawal:', error);
              Alert.alert('Error', 'Failed to complete withdrawal');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (withdrawalId: string) => {
    if (!adminNotes.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    Alert.alert(
      'Reject Withdrawal',
      'Are you sure you want to reject this withdrawal request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);

              const { data: adminData } = await supabase
                .from('admin_users')
                .select('id')
                .eq('user_id', user?.id)
                .single();

              const { error } = await supabase
                .from('withdrawals')
                .update({
                  status: 'failed',
                  reviewed_by: adminData?.id,
                  reviewed_at: new Date().toISOString(),
                  admin_notes: adminNotes,
                })
                .eq('id', withdrawalId);

              if (error) throw error;

              Alert.alert('Success', 'Withdrawal rejected');
              setSelectedWithdrawal(null);
              setAdminNotes('');
              loadWithdrawals();
            } catch (error) {
              console.error('Error rejecting withdrawal:', error);
              Alert.alert('Error', 'Failed to reject withdrawal');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Withdrawal Approvals</Text>
          <Text style={styles.subtitle}>{withdrawals.length} request(s)</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : withdrawals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="checkmark.seal" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No withdrawal requests to review</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {withdrawals.map((withdrawal) => (
            <TouchableOpacity
              key={withdrawal.id}
              style={[commonStyles.card, styles.withdrawalCard]}
              onPress={() => {
                setSelectedWithdrawal(withdrawal);
                setAdminNotes(withdrawal.admin_notes || '');
              }}
            >
              <View style={styles.withdrawalHeader}>
                <View style={styles.withdrawalInfo}>
                  <Text style={styles.withdrawalName}>{withdrawal.user_name}</Text>
                  <Text style={styles.withdrawalEmail}>{withdrawal.user_email}</Text>
                </View>
                <View style={[styles.statusBadge, styles[`status${withdrawal.status}`]]}>
                  <Text style={styles.statusText}>{withdrawal.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.withdrawalDetails}>
                <View style={styles.amountRow}>
                  <IconSymbol 
                    name={withdrawal.currency === 'MXI' ? 'bitcoinsign.circle' : 'dollarsign.circle'} 
                    size={24} 
                    color={colors.primary} 
                  />
                  <Text style={styles.amount}>
                    {withdrawal.amount.toFixed(2)} {withdrawal.currency}
                  </Text>
                </View>
                <Text style={styles.walletAddress} numberOfLines={1}>
                  To: {withdrawal.wallet_address}
                </Text>
              </View>
              <Text style={styles.withdrawalDate}>
                Requested: {new Date(withdrawal.created_at).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={selectedWithdrawal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Withdrawal Review</Text>
                <TouchableOpacity onPress={() => setSelectedWithdrawal(null)}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedWithdrawal && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>User</Text>
                    <Text style={styles.detailValue}>{selectedWithdrawal.user_name}</Text>
                    <Text style={styles.detailSubvalue}>{selectedWithdrawal.user_email}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>
                      {selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Wallet Address</Text>
                    <Text style={styles.detailValue}>{selectedWithdrawal.wallet_address}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>{selectedWithdrawal.status.toUpperCase()}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Requested At</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedWithdrawal.created_at).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Admin Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes or rejection reason..."
                      placeholderTextColor={colors.textSecondary}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.actionButtons}>
                    {selectedWithdrawal.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[buttonStyles.primary, styles.approveButton]}
                          onPress={() => handleApprove(selectedWithdrawal.id)}
                          disabled={processing}
                        >
                          {processing ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                              <Text style={styles.buttonText}>Approve</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[buttonStyles.primary, styles.rejectButton]}
                          onPress={() => handleReject(selectedWithdrawal.id)}
                          disabled={processing}
                        >
                          {processing ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <IconSymbol name="xmark.circle.fill" size={20} color="#fff" />
                              <Text style={styles.buttonText}>Reject</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}

                    {selectedWithdrawal.status === 'processing' && (
                      <TouchableOpacity
                        style={[buttonStyles.primary, styles.completeButton]}
                        onPress={() => handleComplete(selectedWithdrawal.id)}
                        disabled={processing}
                      >
                        {processing ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <IconSymbol name="checkmark.seal.fill" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Mark as Completed</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: '#fff',
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
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  withdrawalCard: {
    marginBottom: 16,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  withdrawalEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statuspending: {
    backgroundColor: colors.warning + '20',
  },
  statusprocessing: {
    backgroundColor: colors.primary + '20',
  },
  statuscompleted: {
    backgroundColor: colors.success + '20',
  },
  statusfailed: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  withdrawalDetails: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  walletAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  withdrawalDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  detailSubvalue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
