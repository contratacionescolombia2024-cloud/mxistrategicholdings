
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const MXI_TO_USDT_RATE = 0.4;

type WithdrawalType = 'purchased' | 'commissions' | 'vesting' | 'tournaments';

export default function RetirosScreen() {
  const router = useRouter();
  const { user, getPoolStatus, getCurrentYield } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<WithdrawalType>('commissions');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [poolStatus, setPoolStatus] = useState<any>(null);
  const [currentYield, setCurrentYield] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user || user.yieldRatePerMinute === 0) {
      setCurrentYield(0);
      return;
    }

    const interval = setInterval(() => {
      const yield_amount = getCurrentYield();
      setCurrentYield(yield_amount);
    }, 1000);

    return () => clearInterval(interval);
  }, [user, getCurrentYield]);

  const loadData = async () => {
    try {
      setLoading(true);
      const status = await getPoolStatus();
      setPoolStatus(status);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const getBalanceForType = (type: WithdrawalType): number => {
    switch (type) {
      case 'purchased':
        return user.mxiPurchasedDirectly || 0;
      case 'commissions':
        return user.mxiCommissions || 0;
      case 'vesting':
        return (user.accumulatedYield || 0) + currentYield;
      case 'tournaments':
        return user.mxiTournaments || 0;
      default:
        return 0;
    }
  };

  const getTypeLabel = (type: WithdrawalType): string => {
    switch (type) {
      case 'purchased':
        return t('mxiPurchasedText');
      case 'commissions':
        return t('mxiCommissionsText');
      case 'vesting':
        return t('mxiVestingText');
      case 'tournaments':
        return t('mxiTournamentsText');
      default:
        return '';
    }
  };

  const getTypeDescription = (type: WithdrawalType): string => {
    switch (type) {
      case 'purchased':
        return t('mxiAcquiredThroughPurchases');
      case 'commissions':
        return t('mxiFromReferralCommissions');
      case 'vesting':
        return t('mxiGeneratedByYield');
      case 'tournaments':
        return t('mxiWonInTournamentsAndChallenges');
      default:
        return '';
    }
  };

  const isTypeAvailable = (type: WithdrawalType): boolean => {
    const balance = getBalanceForType(type);
    if (balance <= 0) return false;

    // Purchased and Vesting require MXI launch
    if ((type === 'purchased' || type === 'vesting') && !poolStatus?.is_mxi_launched) {
      return false;
    }

    // Vesting requires 10 active referrals (changed from 5)
    if (type === 'vesting' && user.activeReferrals < 10) {
      return false;
    }

    // Commissions and Tournaments require 5 active referrals + KYC
    if ((type === 'commissions' || type === 'tournaments') && 
        (user.activeReferrals < 5 || user.kycStatus !== 'approved')) {
      return false;
    }

    return true;
  };

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t('invalidAmount'), t('enterValidAmount'));
      return;
    }

    if (!walletAddress) {
      Alert.alert(t('missingInformation'), t('enterWalletAddress'));
      return;
    }

    const mxiAmount = parseFloat(amount);
    const availableBalance = getBalanceForType(selectedType);

    if (mxiAmount > availableBalance) {
      Alert.alert(
        t('insufficientBalance'),
        t('insufficientBalanceNeed', {
          needed: mxiAmount.toFixed(2),
          available: availableBalance.toFixed(2),
        })
      );
      return;
    }

    // Check if withdrawal is available for this type
    if (!isTypeAvailable(selectedType)) {
      if ((selectedType === 'purchased' || selectedType === 'vesting') && !poolStatus?.is_mxi_launched) {
        Alert.alert(
          t('withdrawalNotAvailable'),
          t('withdrawalsAvailableAfterLaunch', {
            label: getTypeLabel(selectedType),
            days: poolStatus?.days_until_launch || 0,
          })
        );
        return;
      }

      if (selectedType === 'vesting' && user.activeReferrals < 10) {
        Alert.alert(
          t('requirementNotMet'),
          t('vestingRequires10Referrals', { count: user.activeReferrals }),
          [{ text: t('understood') }]
        );
        return;
      }

      if ((selectedType === 'commissions' || selectedType === 'tournaments') && 
          (user.activeReferrals < 5 || user.kycStatus !== 'approved')) {
        Alert.alert(
          t('notEligible'),
          t('need5ActiveReferralsAndKYC')
        );
        return;
      }
    }

    const usdtAmount = mxiAmount * MXI_TO_USDT_RATE;

    Alert.alert(
      t('confirmWithdrawal'),
      t('confirmWithdrawalMessage', {
        mxi: mxiAmount.toFixed(2),
        label: getTypeLabel(selectedType),
        usdt: usdtAmount.toFixed(2),
      }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            setSubmitting(true);
            try {
              const { data, error } = await supabase
                .from('withdrawals')
                .insert({
                  user_id: user.id,
                  mxi_amount: mxiAmount,
                  usdt_amount: usdtAmount,
                  wallet_address: walletAddress,
                  withdrawal_type: selectedType,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (error) throw error;

              // Update user balance based on type
              const updates: any = {};
              switch (selectedType) {
                case 'purchased':
                  updates.mxi_purchased_directly = (user.mxiPurchasedDirectly || 0) - mxiAmount;
                  break;
                case 'commissions':
                  updates.mxi_commissions = (user.mxiCommissions || 0) - mxiAmount;
                  break;
                case 'vesting':
                  updates.accumulated_yield = 0;
                  updates.last_yield_claim = new Date().toISOString();
                  break;
                case 'tournaments':
                  updates.mxi_tournaments = (user.mxiTournaments || 0) - mxiAmount;
                  break;
              }

              const { error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

              if (updateError) throw updateError;

              Alert.alert(
                t('requestSent'),
                t('withdrawalRequestSent', {
                  mxi: mxiAmount.toFixed(2),
                  label: getTypeLabel(selectedType),
                  usdt: usdtAmount.toFixed(2),
                }),
                [
                  {
                    text: t('ok'),
                    onPress: () => {
                      setAmount('');
                      setWalletAddress('');
                      router.back();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('Error processing withdrawal:', error);
              Alert.alert(t('error'), t('errorProcessingWithdrawal'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const totalMXI = (user.mxiPurchasedDirectly || 0) + 
                   (user.mxiCommissions || 0) + 
                   (user.accumulatedYield || 0) + 
                   currentYield +
                   (user.mxiTournaments || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="chevron_left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('retiros')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingData')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, styles.balanceCard]}>
            <Text style={styles.balanceLabel}>{t('totalMXI')}</Text>
            <Text style={styles.balanceAmount}>{totalMXI.toFixed(2)} MXI</Text>
            <Text style={styles.balanceSubtext}>
              ≈ {(totalMXI * MXI_TO_USDT_RATE).toFixed(2)} USDT
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('withdrawalType')}</Text>
            
            {/* Purchased MXI */}
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'purchased' && styles.typeButtonSelected,
                !isTypeAvailable('purchased') && styles.typeButtonDisabled,
              ]}
              onPress={() => setSelectedType('purchased')}
              disabled={!isTypeAvailable('purchased')}
            >
              <View style={styles.typeHeader}>
                <IconSymbol
                  ios_icon_name="cart.fill"
                  android_material_icon_name="shopping_cart"
                  size={24}
                  color={isTypeAvailable('purchased') ? colors.primary : colors.textSecondary}
                />
                <View style={styles.typeInfo}>
                  <Text style={[
                    styles.typeTitle,
                    !isTypeAvailable('purchased') && styles.typeTextDisabled,
                  ]}>
                    {t('withdrawMXIPurchased')}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {t('mxiAcquiredThroughPurchases')}
                  </Text>
                </View>
              </View>
              <View style={styles.typeBalance}>
                <Text style={[
                  styles.typeBalanceAmount,
                  !isTypeAvailable('purchased') && styles.typeTextDisabled,
                ]}>
                  {(user.mxiPurchasedDirectly || 0).toFixed(2)} MXI
                </Text>
                {!poolStatus?.is_mxi_launched && (
                  <Text style={styles.typeStatus}>{t('lockedUntilLaunch')}</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Commissions MXI */}
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'commissions' && styles.typeButtonSelected,
                !isTypeAvailable('commissions') && styles.typeButtonDisabled,
              ]}
              onPress={() => setSelectedType('commissions')}
              disabled={!isTypeAvailable('commissions')}
            >
              <View style={styles.typeHeader}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={24}
                  color={isTypeAvailable('commissions') ? colors.success : colors.textSecondary}
                />
                <View style={styles.typeInfo}>
                  <Text style={[
                    styles.typeTitle,
                    !isTypeAvailable('commissions') && styles.typeTextDisabled,
                  ]}>
                    {t('withdrawMXICommissions')}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {t('mxiFromReferralCommissions')}
                  </Text>
                </View>
              </View>
              <View style={styles.typeBalance}>
                <Text style={[
                  styles.typeBalanceAmount,
                  !isTypeAvailable('commissions') && styles.typeTextDisabled,
                ]}>
                  {(user.mxiCommissions || 0).toFixed(2)} MXI
                </Text>
                {isTypeAvailable('commissions') && (
                  <Text style={[styles.typeStatus, { color: colors.success }]}>
                    {t('availableLabel')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Vesting MXI */}
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'vesting' && styles.typeButtonSelected,
                !isTypeAvailable('vesting') && styles.typeButtonDisabled,
              ]}
              onPress={() => setSelectedType('vesting')}
              disabled={!isTypeAvailable('vesting')}
            >
              <View style={styles.typeHeader}>
                <IconSymbol
                  ios_icon_name="chart.line.uptrend.xyaxis"
                  android_material_icon_name="trending_up"
                  size={24}
                  color={isTypeAvailable('vesting') ? colors.warning : colors.textSecondary}
                />
                <View style={styles.typeInfo}>
                  <Text style={[
                    styles.typeTitle,
                    !isTypeAvailable('vesting') && styles.typeTextDisabled,
                  ]}>
                    {t('withdrawMXIVesting')}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {t('mxiGeneratedByYield')}
                  </Text>
                </View>
              </View>
              <View style={styles.typeBalance}>
                <Text style={[
                  styles.typeBalanceAmount,
                  !isTypeAvailable('vesting') && styles.typeTextDisabled,
                ]}>
                  {((user.accumulatedYield || 0) + currentYield).toFixed(8)} MXI
                </Text>
                {!poolStatus?.is_mxi_launched ? (
                  <Text style={styles.typeStatus}>{t('lockedUntilLaunch')}</Text>
                ) : user.activeReferrals < 10 ? (
                  <Text style={styles.typeStatus}>
                    {t('activeReferralsForVestingWithdrawals', { count: user.activeReferrals })}
                  </Text>
                ) : (
                  <Text style={[styles.typeStatus, { color: colors.success }]}>
                    {t('realTime')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Tournaments MXI */}
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'tournaments' && styles.typeButtonSelected,
                !isTypeAvailable('tournaments') && styles.typeButtonDisabled,
              ]}
              onPress={() => setSelectedType('tournaments')}
              disabled={!isTypeAvailable('tournaments')}
            >
              <View style={styles.typeHeader}>
                <IconSymbol
                  ios_icon_name="trophy.fill"
                  android_material_icon_name="emoji_events"
                  size={24}
                  color={isTypeAvailable('tournaments') ? '#FFD700' : colors.textSecondary}
                />
                <View style={styles.typeInfo}>
                  <Text style={[
                    styles.typeTitle,
                    !isTypeAvailable('tournaments') && styles.typeTextDisabled,
                  ]}>
                    {t('withdrawMXITournaments')}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {t('mxiWonInTournamentsAndChallenges')}
                  </Text>
                </View>
              </View>
              <View style={styles.typeBalance}>
                <Text style={[
                  styles.typeBalanceAmount,
                  !isTypeAvailable('tournaments') && styles.typeTextDisabled,
                ]}>
                  {(user.mxiTournaments || 0).toFixed(2)} MXI
                </Text>
                {isTypeAvailable('tournaments') && (
                  <Text style={[styles.typeStatus, { color: colors.success }]}>
                    {t('availableLabel')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {isTypeAvailable(selectedType) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('withdrawalDetails')}</Text>
              <Text style={styles.sectionSubtitle}>{t('withdrawalsInUSDT')}</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('amountMXI')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('amountInMXI')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <TouchableOpacity
                    style={styles.maxButton}
                    onPress={() => setAmount(getBalanceForType(selectedType).toString())}
                  >
                    <Text style={styles.maxButtonText}>{t('maximum')}</Text>
                  </TouchableOpacity>
                </View>
                {amount && parseFloat(amount) > 0 && (
                  <Text style={styles.conversionText}>
                    {t('equivalentInUSDT')}: {(parseFloat(amount) * MXI_TO_USDT_RATE).toFixed(2)} USDT
                  </Text>
                )}
              </View>

              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>{t('rate')}</Text>
                <Text style={styles.rateValue}>1 MXI = {MXI_TO_USDT_RATE} USDT</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('walletAddressETH')}</Text>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder={t('enterYourETHWalletAddress')}
                  placeholderTextColor={colors.textSecondary}
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  autoCapitalize="none"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!amount || !walletAddress || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleWithdrawal}
                disabled={!amount || !walletAddress || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <React.Fragment>
                    <IconSymbol
                      ios_icon_name="arrow.down.circle.fill"
                      android_material_icon_name="arrow_circle_down"
                      size={20}
                      color="#000000"
                    />
                    <Text style={styles.submitButtonText}>{t('requestWithdrawal')}</Text>
                  </React.Fragment>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.card, styles.requirementsCard]}>
            <Text style={styles.requirementsTitle}>{t('withdrawalRequirements')}</Text>
            
            <View style={styles.requirementItem}>
              <IconSymbol
                ios_icon_name={user.activeReferrals >= 5 ? "checkmark.circle.fill" : "xmark.circle.fill"}
                android_material_icon_name={user.activeReferrals >= 5 ? "check_circle" : "cancel"}
                size={20}
                color={user.activeReferrals >= 5 ? colors.success : colors.error}
              />
              <Text style={styles.requirementText}>
                {t('activeReferralsForGeneralWithdrawals2', { count: user.activeReferrals })}
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <IconSymbol
                ios_icon_name={user.activeReferrals >= 10 ? "checkmark.circle.fill" : "xmark.circle.fill"}
                android_material_icon_name={user.activeReferrals >= 10 ? "check_circle" : "cancel"}
                size={20}
                color={user.activeReferrals >= 10 ? colors.success : colors.error}
              />
              <Text style={styles.requirementText}>
                {t('activeReferralsForVestingWithdrawals', { count: user.activeReferrals })}
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <IconSymbol
                ios_icon_name={poolStatus?.is_mxi_launched ? "checkmark.circle.fill" : "xmark.circle.fill"}
                android_material_icon_name={poolStatus?.is_mxi_launched ? "check_circle" : "cancel"}
                size={20}
                color={poolStatus?.is_mxi_launched ? colors.success : colors.error}
              />
              <Text style={styles.requirementText}>
                {t('mxiLaunchRequiredForPurchasedAndVesting')}
              </Text>
            </View>
          </View>

          <View style={[styles.card, styles.infoCard]}>
            <Text style={styles.infoTitle}>{t('importantInformation')}</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('withdrawalsInUSDTETHInfo')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('conversionInfo')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('mxiCommissionsAvailableImmediately')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('mxiTournamentsAvailableSameAsCommissions')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('mxiVestingRequires10Referrals')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('mxiPurchasedLockedUntilLaunch')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('realTimeUpdateInfo')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('processingTimeInfo')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• {t('verifyWalletAddressInfo')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.card, styles.historyCard]}
            onPress={() => router.push('/(tabs)/(home)/withdrawals')}
          >
            <IconSymbol
              ios_icon_name="clock.arrow.circlepath"
              android_material_icon_name="history"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.historyText}>{t('viewWithdrawalHistory2')}</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </ScrollView>
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
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: 'rgba(26, 31, 58, 0.3)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  typeButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  typeButtonDisabled: {
    opacity: 0.5,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  typeTextDisabled: {
    color: colors.textSecondary,
  },
  typeBalance: {
    alignItems: 'flex-end',
  },
  typeBalanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  typeStatus: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
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
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  maxButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  conversionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  rateBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  requirementsCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  infoCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
