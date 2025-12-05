
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface ChallengeHistory {
  id: string;
  challenge_type: string;
  challenge_id: string;
  result: 'win' | 'loss' | 'tie' | 'forfeit';
  amount_won: number;
  amount_lost: number;
  score: number;
  rank: number | null;
  total_participants: number | null;
  created_at: string;
  expires_at: string;
}

export default function ChallengeHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ChallengeHistory[]>([]);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [mxiFromChallenges, setMxiFromChallenges] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);

  useEffect(() => {
    loadHistory();
    loadMxiFromChallenges();
  }, [filter]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('challenge_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('result', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setHistory(data || []);

      // Calculate total winnings
      const total = data?.reduce((sum, record) => sum + (record.amount_won || 0), 0) || 0;
      setTotalWinnings(total);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMxiFromChallenges = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('mxi_from_challenges')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading MXI from challenges:', error);
        return;
      }

      setMxiFromChallenges(parseFloat(data.mxi_from_challenges?.toString() || '0'));
    } catch (error) {
      console.error('Exception loading MXI from challenges:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
    loadMxiFromChallenges();
  };

  const handleWithdrawToBalance = async () => {
    if (!user) return;

    const amount = parseFloat(withdrawAmount);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('invalidAmountEnterValidText'), t('pleaseEnterValidAmount'));
      return;
    }

    // Check minimum withdrawal
    if (amount < 50) {
      Alert.alert(t('minimumWithdrawal'), t('minimumWithdrawalIs50Text'));
      return;
    }

    // Check available balance
    if (amount > mxiFromChallenges) {
      Alert.alert(
        t('insufficientBalance'), 
        t('insufficientBalanceOnlyHaveText', { available: mxiFromChallenges.toFixed(2) })
      );
      return;
    }

    // Check active referrals requirement
    if (user.activeReferrals < 5) {
      Alert.alert(
        t('requirementsNotMet'),
        t('requirementsNotMetNeed5ReferralsText', { count: user.activeReferrals })
      );
      return;
    }

    // Confirm withdrawal
    Alert.alert(
      t('confirmWithdrawalToMXIBalanceText'),
      t('doYouWantToTransferFromWinningsText', { amount: amount.toFixed(2) }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirmText'),
          onPress: async () => {
            setWithdrawLoading(true);
            try {
              const { data, error } = await supabase.rpc('withdraw_challenge_to_mxi_balance', {
                p_user_id: user.id,
                p_amount: amount
              });

              if (error) {
                console.error('Withdrawal error:', error);
                Alert.alert(t('error'), error.message || t('couldNotCompleteWithdrawal'));
                return;
              }

              if (!data || !data.success) {
                Alert.alert(t('error'), data?.error || t('couldNotCompleteWithdrawal'));
                return;
              }

              Alert.alert(
                t('withdrawalSuccessful'),
                t('withdrawalSuccessfulTransferredText', { amount: amount.toFixed(2) })
              );
              
              setWithdrawAmount('');
              setShowWithdrawModal(false);
              await loadMxiFromChallenges();
            } catch (error: any) {
              console.error('Exception during withdrawal:', error);
              Alert.alert(t('error'), error.message || t('unexpectedError'));
            } finally {
              setWithdrawLoading(false);
            }
          }
        }
      ]
    );
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'lottery':
        return { ios: 'ticket.fill', android: 'confirmation_number' };
      default:
        return { ios: 'gamecontroller.fill', android: 'sports_esports' };
    }
  };

  const getChallengeLabel = (type: string) => {
    switch (type) {
      case 'lottery': return t('bonusParticipation');
      default: return type;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return colors.success;
      case 'loss': return colors.error;
      case 'tie': return colors.warning;
      case 'forfeit': return colors.textSecondary;
      default: return colors.text;
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return { ios: 'trophy.fill', android: 'emoji_events' };
      case 'loss':
        return { ios: 'xmark.circle.fill', android: 'cancel' };
      case 'tie':
        return { ios: 'equal.circle.fill', android: 'drag_handle' };
      case 'forfeit':
        return { ios: 'flag.fill', android: 'flag' };
      default:
        return { ios: 'circle.fill', android: 'circle' };
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return t('winsText');
      case 'loss': return t('lossesText');
      case 'tie': return t('tie');
      case 'forfeit': return t('forfeit');
      default: return result;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('challengeHistoryText')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            {t('allText')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'win' && styles.filterButtonActive]}
          onPress={() => setFilter('win')}
        >
          <Text style={[styles.filterButtonText, filter === 'win' && styles.filterButtonTextActive]}>
            {t('winsText')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'loss' && styles.filterButtonActive]}
          onPress={() => setFilter('loss')}
        >
          <Text style={[styles.filterButtonText, filter === 'loss' && styles.filterButtonTextActive]}>
            {t('lossesText')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Winnings Summary Card */}
        <View style={[commonStyles.card, styles.summaryCard]}>
          <View style={styles.summaryHeader}>
            <IconSymbol 
              ios_icon_name="trophy.fill" 
              android_material_icon_name="emoji_events" 
              size={32} 
              color={colors.primary} 
            />
            <Text style={styles.summaryTitle}>{t('tournamentWinningsText')}</Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>{t('totalWonText')}</Text>
              <Text style={styles.summaryStatValue}>{totalWinnings.toFixed(2)} MXI</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>{t('availableText2')}</Text>
              <Text style={[styles.summaryStatValue, { color: colors.success }]}>
                {mxiFromChallenges.toFixed(2)} MXI
              </Text>
            </View>
          </View>

          {/* Withdraw to Balance Button */}
          {mxiFromChallenges >= 50 && (
            <View style={styles.withdrawSection}>
              <View style={styles.withdrawHeader}>
                <IconSymbol 
                  ios_icon_name="arrow.down.circle.fill" 
                  android_material_icon_name="arrow_circle_down" 
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.withdrawTitle}>{t('withdrawToMXIBalanceText')}</Text>
              </View>
              <Text style={styles.withdrawDescription}>
                {t('transferWinningsToMainBalanceText')}
              </Text>
              
              {!showWithdrawModal ? (
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.withdrawButton]}
                  onPress={() => setShowWithdrawModal(true)}
                >
                  <IconSymbol 
                    ios_icon_name="arrow.down.circle" 
                    android_material_icon_name="arrow_circle_down" 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={buttonStyles.primaryText}>{t('withdrawToBalance')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.withdrawForm}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('amountToWithdrawMXIText')}</Text>
                    <TextInput
                      style={styles.input}
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                      keyboardType="decimal-pad"
                      placeholder={t('minimum50MXIRequiredText')}
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.inputHint}>
                      {t('availableText2')}: {mxiFromChallenges.toFixed(2)} MXI
                    </Text>
                  </View>
                  
                  <View style={styles.withdrawActions}>
                    <TouchableOpacity
                      style={[buttonStyles.secondary, styles.actionButton]}
                      onPress={() => {
                        setShowWithdrawModal(false);
                        setWithdrawAmount('');
                      }}
                      disabled={withdrawLoading}
                    >
                      <Text style={buttonStyles.secondaryText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[buttonStyles.primary, styles.actionButton]}
                      onPress={handleWithdrawToBalance}
                      disabled={withdrawLoading}
                    >
                      {withdrawLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={buttonStyles.primaryText}>{t('confirmText')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>{t('requirementsTitleText')}</Text>
                <View style={styles.requirementItem}>
                  <IconSymbol 
                    ios_icon_name={user && user.activeReferrals >= 5 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
                    android_material_icon_name={user && user.activeReferrals >= 5 ? 'check_circle' : 'cancel'} 
                    size={16} 
                    color={user && user.activeReferrals >= 5 ? colors.success : colors.error} 
                  />
                  <Text style={styles.requirementText}>
                    5 {t('activeReferralsText')} ({user?.activeReferrals || 0}/5)
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <IconSymbol 
                    ios_icon_name={mxiFromChallenges >= 50 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
                    android_material_icon_name={mxiFromChallenges >= 50 ? 'check_circle' : 'cancel'} 
                    size={16} 
                    color={mxiFromChallenges >= 50 ? colors.success : colors.error} 
                  />
                  <Text style={styles.requirementText}>
                    {t('minimumText')} 50 MXI
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="tray.fill" android_material_icon_name="inbox" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('noHistoryYetText')}</Text>
            <Text style={styles.emptyText}>
              {t('challengeHistoryWillAppearText')}
            </Text>
          </View>
        ) : (
          history.map((record) => {
            const challengeIcon = getChallengeIcon(record.challenge_type);
            const resultIcon = getResultIcon(record.result);
            const daysUntilExpiry = getDaysUntilExpiry(record.expires_at);

            return (
              <View key={record.id} style={[commonStyles.card, styles.historyCard]}>
                <View style={styles.historyHeader}>
                  <View style={styles.challengeInfo}>
                    <IconSymbol
                      ios_icon_name={challengeIcon.ios}
                      android_material_icon_name={challengeIcon.android}
                      size={24}
                      color={colors.primary}
                    />
                    <View>
                      <Text style={styles.challengeType}>{getChallengeLabel(record.challenge_type)}</Text>
                      <Text style={styles.challengeDate}>{formatDate(record.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[styles.resultBadge, { backgroundColor: getResultColor(record.result) + '20' }]}>
                    <IconSymbol
                      ios_icon_name={resultIcon.ios}
                      android_material_icon_name={resultIcon.android}
                      size={16}
                      color={getResultColor(record.result)}
                    />
                    <Text style={[styles.resultText, { color: getResultColor(record.result) }]}>
                      {getResultText(record.result).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyDetails}>
                  {record.score !== null && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('scoreText')}:</Text>
                      <Text style={styles.detailValue}>{record.score}</Text>
                    </View>
                  )}
                  {record.rank !== null && record.total_participants !== null && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('rankText')}:</Text>
                      <Text style={styles.detailValue}>
                        {record.rank} {t('of')} {record.total_participants}
                      </Text>
                    </View>
                  )}
                  {record.amount_won > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('wonText')}:</Text>
                      <Text style={[styles.detailValue, { color: colors.success }]}>
                        +{record.amount_won.toFixed(2)} MXI
                      </Text>
                    </View>
                  )}
                  {record.amount_lost > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('lostText')}:</Text>
                      <Text style={[styles.detailValue, { color: colors.error }]}>
                        -{record.amount_lost.toFixed(2)} MXI
                      </Text>
                    </View>
                  )}
                  {daysUntilExpiry > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('expiresInText')}:</Text>
                      <Text style={styles.detailValue}>{daysUntilExpiry} {t('daysRemainingText')}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeType: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  challengeDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryCard: {
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  withdrawSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  withdrawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  withdrawTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  withdrawDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  withdrawForm: {
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  withdrawActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  requirementsBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
