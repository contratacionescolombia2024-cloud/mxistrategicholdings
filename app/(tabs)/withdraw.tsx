
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

type WithdrawalType = 'purchased' | 'commissions' | 'vesting' | 'tournaments';

interface BalanceBreakdown {
  mxiPurchased: number;
  mxiCommissions: number;
  mxiTournaments: number;
  mxiVesting: number;
  commissionsUSDT: number;
}

export default function WithdrawScreen() {
  const router = useRouter();
  const { user, checkWithdrawalEligibility, checkMXIWithdrawalEligibility } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('commissions');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [canWithdrawCommission, setCanWithdrawCommission] = useState(false);
  const [canWithdrawMXI, setCanWithdrawMXI] = useState(false);
  const [balanceBreakdown, setBalanceBreakdown] = useState<BalanceBreakdown>({
    mxiPurchased: 0,
    mxiCommissions: 0,
    mxiTournaments: 0,
    mxiVesting: 0,
    commissionsUSDT: 0,
  });
  const [poolStatus, setPoolStatus] = useState<any>(null);
  const [currentVesting, setCurrentVesting] = useState(0);

  // Real-time vesting counter (only from purchased MXI)
  useEffect(() => {
    if (!user) return;

    const MONTHLY_YIELD_PERCENTAGE = 0.03;
    const SECONDS_IN_MONTH = 2592000;
    
    // ONLY purchased MXI generates vesting
    const mxiPurchased = balanceBreakdown.mxiPurchased || 0;
    
    if (mxiPurchased === 0) {
      setCurrentVesting(0);
      return;
    }

    const maxMonthlyYield = mxiPurchased * MONTHLY_YIELD_PERCENTAGE;
    const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;

    const interval = setInterval(() => {
      const now = Date.now();
      const lastUpdate = new Date(user.lastYieldUpdate);
      const secondsElapsed = (now - lastUpdate.getTime()) / 1000;
      const sessionYield = yieldPerSecond * secondsElapsed;
      const totalYield = user.accumulatedYield + sessionYield;
      const cappedTotalYield = Math.min(totalYield, maxMonthlyYield);
      setCurrentVesting(cappedTotalYield);
      
      // Update balance breakdown with real-time vesting
      setBalanceBreakdown(prev => ({
        ...prev,
        mxiVesting: cappedTotalYield,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [user, balanceBreakdown.mxiPurchased]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const commissionEligible = await checkWithdrawalEligibility();
      setCanWithdrawCommission(commissionEligible);

      const mxiEligible = await checkMXIWithdrawalEligibility();
      setCanWithdrawMXI(mxiEligible);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('mxi_purchased_directly, mxi_from_unified_commissions, mxi_from_challenges, mxi_vesting_locked, active_referrals')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error loading user data:', userError);
      }

      // Load USDT commissions from commissions table
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('user_id', user.id);

      let commissionsUSDT = 0;
      if (!commissionsError && commissionsData) {
        commissionsUSDT = commissionsData
          .filter(c => c.status === 'available')
          .reduce((sum, c) => sum + parseFloat(c.amount), 0);
      }

      const { data: poolData, error: poolError } = await supabase
        .from('metrics')
        .select('mxi_launch_date')
        .single();

      if (poolError) {
        console.error('Error loading pool data:', poolError);
      }

      const mxiLaunchDate = poolData?.mxi_launch_date ? new Date(poolData.mxi_launch_date) : null;
      const isLaunched = mxiLaunchDate ? new Date() > mxiLaunchDate : false;

      setPoolStatus({ isLaunched, mxiLaunchDate });

      setBalanceBreakdown({
        mxiPurchased: parseFloat(userData?.mxi_purchased_directly || '0'),
        mxiCommissions: parseFloat(userData?.mxi_from_unified_commissions || '0'),
        mxiTournaments: parseFloat(userData?.mxi_from_challenges || '0'),
        mxiVesting: parseFloat(userData?.mxi_vesting_locked || '0'),
        commissionsUSDT: commissionsUSDT,
      });

      console.log('Balance breakdown loaded:', {
        mxiPurchased: userData?.mxi_purchased_directly,
        mxiCommissions: userData?.mxi_from_unified_commissions,
        mxiTournaments: userData?.mxi_from_challenges,
        mxiVesting: userData?.mxi_vesting_locked,
        commissionsUSDT: commissionsUSDT,
        activeReferrals: userData?.active_referrals,
      });
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t('invalidAmount'), t('pleaseEnterValidAmount'));
      return;
    }

    if (!walletAddress.trim()) {
      Alert.alert(t('missingInformation'), t('pleaseEnterYourWalletAddress'));
      return;
    }

    // All withdrawals are now in USDT(ETH), amount is entered in MXI
    let availableAmount = 0;
    let withdrawalLabel = '';
    let usdtEquivalent = 0;

    switch (withdrawalType) {
      case 'purchased':
        availableAmount = balanceBreakdown.mxiPurchased;
        withdrawalLabel = t('mxiPurchasedLabel');
        usdtEquivalent = amountNum * 0.4;
        break;
      case 'commissions':
        availableAmount = balanceBreakdown.mxiCommissions;
        withdrawalLabel = t('mxiCommissionsLabel');
        usdtEquivalent = amountNum * 0.4;
        break;
      case 'vesting':
        availableAmount = balanceBreakdown.mxiVesting;
        withdrawalLabel = t('mxiVestingLabel');
        usdtEquivalent = amountNum * 0.4;
        
        // Vesting requires at least 10 referrals with MXI purchases
        if ((user.activeReferrals || 0) < 10) {
          Alert.alert(
            t('requirementNotMet'),
            t('youNeedAtLeast10ActiveReferrals', { count: user.activeReferrals || 0 }),
            [{ text: t('ok') }]
          );
          return;
        }
        break;
      case 'tournaments':
        availableAmount = balanceBreakdown.mxiTournaments;
        withdrawalLabel = t('mxiTournamentsLabel');
        usdtEquivalent = amountNum * 0.4;
        break;
    }

    if (amountNum > availableAmount) {
      Alert.alert(t('insufficientBalance'), t('youDoNotHaveEnoughAvailable', { type: withdrawalLabel }));
      return;
    }

    // Check if launch is required for this type
    if ((withdrawalType === 'purchased' || withdrawalType === 'vesting') && !poolStatus?.isLaunched) {
      const daysUntil = poolStatus?.mxiLaunchDate 
        ? Math.ceil((new Date(poolStatus.mxiLaunchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      
      Alert.alert(
        t('withdrawalNotAvailable'),
        t('withdrawalsWillBeAvailableAfterLaunch', { type: withdrawalLabel, days: daysUntil }),
        [{ text: t('ok') }]
      );
      return;
    }

    // Check general eligibility (5 referrals + KYC)
    if (!canWithdrawMXI) {
      Alert.alert(
        t('notEligible'),
        t('youNeedAtLeast5ActiveReferrals')
      );
      return;
    }

    // Show confirmation with USDT equivalent
    Alert.alert(
      t('confirmWithdrawal'),
      t('youAreAboutToWithdraw', { 
        amount: amountNum.toFixed(2), 
        type: withdrawalLabel, 
        usdt: usdtEquivalent.toFixed(2) 
      }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => processWithdrawal(amountNum, usdtEquivalent, withdrawalLabel) 
        }
      ]
    );
  };

  const processWithdrawal = async (mxiAmount: number, usdtAmount: number, label: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user!.id,
          amount: usdtAmount, // Store USDT amount
          currency: 'USDT',
          wallet_address: walletAddress,
          status: 'pending',
          admin_notes: `${t('withdraw')} ${label}: ${mxiAmount.toFixed(2)} MXI → ${usdtAmount.toFixed(2)} USDT (ETH)`,
        });

      if (error) {
        console.error('Withdrawal error:', error);
        Alert.alert(t('error'), t('couldNotProcessWithdrawal'));
        return;
      }

      Alert.alert(
        t('requestSent'),
        t('yourWithdrawalRequestHasBeenSent', { 
          amount: mxiAmount.toFixed(2), 
          type: label, 
          usdt: usdtAmount.toFixed(2) 
        }),
        [
          {
            text: t('ok'),
            onPress: () => {
              setAmount('');
              setWalletAddress('');
              loadData();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Process withdrawal exception:', error);
      Alert.alert(t('error'), t('errorProcessingWithdrawal'));
    } finally {
      setLoading(false);
    }
  };

  const getWithdrawalTypeInfo = () => {
    switch (withdrawalType) {
      case 'purchased':
        return {
          title: t('withdrawMXIPurchased'),
          icon: '🛒',
          color: '#00ff88',
          available: balanceBreakdown.mxiPurchased,
          currency: 'MXI',
          description: t('mxiAcquiredThroughUSDTPurchases'),
          locked: !poolStatus?.isLaunched,
        };
      case 'commissions':
        return {
          title: t('withdrawMXICommissions'),
          icon: '💵',
          color: '#A855F7',
          available: balanceBreakdown.mxiCommissions,
          currency: 'MXI',
          description: t('mxiFromReferralCommissions'),
          locked: false,
        };
      case 'vesting':
        return {
          title: t('withdrawMXIVesting'),
          icon: '🔒',
          color: '#6366F1',
          available: balanceBreakdown.mxiVesting,
          currency: 'MXI',
          description: t('mxiGeneratedByYield'),
          locked: !poolStatus?.isLaunched,
        };
      case 'tournaments':
        return {
          title: t('withdrawMXITournaments'),
          icon: '🏆',
          color: '#ffdd00',
          available: balanceBreakdown.mxiTournaments,
          currency: 'MXI',
          description: t('mxiWonInTournamentsAndChallenges'),
          locked: false,
        };
    }
  };

  const typeInfo = getWithdrawalTypeInfo();
  const amountNum = parseFloat(amount) || 0;
  const usdtEquivalent = amountNum * 0.4;

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total MXI available
  const totalMXIAvailable = balanceBreakdown.mxiPurchased + 
                            balanceBreakdown.mxiCommissions + 
                            balanceBreakdown.mxiTournaments + 
                            balanceBreakdown.mxiVesting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('withdraw')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* MXI Disponibles - Total Balance Overview */}
        <View style={[commonStyles.card, styles.balanceCard]}>
          <Text style={styles.sectionTitle}>💰 {t('mxiAvailable')}</Text>
          
          <View style={styles.totalBalanceDisplay}>
            <Text style={styles.totalBalanceLabel}>{t('totalMXI')}</Text>
            <Text style={styles.totalBalanceValue}>
              {totalMXIAvailable.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            </Text>
            <Text style={styles.totalBalanceSubtext}>
              {t('approximateUSDT', { amount: (totalMXIAvailable * 0.4).toFixed(2) })}
            </Text>
          </View>
          
          <View style={styles.balanceGrid}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceIcon}>🛒</Text>
              <Text style={styles.balanceLabel}>{t('mxiPurchasedLabel')}</Text>
              <Text style={styles.balanceValue}>{balanceBreakdown.mxiPurchased.toFixed(2)}</Text>
              {!poolStatus?.isLaunched && (
                <Text style={styles.balanceLocked}>{t('lockedUntilLaunch')}</Text>
              )}
            </View>

            <View style={styles.balanceItem}>
              <Text style={styles.balanceIcon}>💵</Text>
              <Text style={styles.balanceLabel}>{t('mxiCommissionsLabel')}</Text>
              <Text style={styles.balanceValue}>{balanceBreakdown.mxiCommissions.toFixed(2)}</Text>
              <Text style={styles.balanceAvailable}>{t('availableLabel')}</Text>
            </View>

            <View style={styles.balanceItem}>
              <Text style={styles.balanceIcon}>🔒</Text>
              <Text style={styles.balanceLabel}>{t('mxiVestingLabel')}</Text>
              <Text style={styles.balanceValue}>{balanceBreakdown.mxiVesting.toFixed(6)}</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('realTime')}</Text>
              </View>
              {!poolStatus?.isLaunched && (
                <Text style={styles.balanceLocked}>{t('lockedUntilLaunch')}</Text>
              )}
            </View>

            <View style={styles.balanceItem}>
              <Text style={styles.balanceIcon}>🏆</Text>
              <Text style={styles.balanceLabel}>{t('mxiTournamentsLabel')}</Text>
              <Text style={styles.balanceValue}>{balanceBreakdown.mxiTournaments.toFixed(2)}</Text>
              <Text style={styles.balanceAvailable}>{t('availableLabel')}</Text>
            </View>
          </View>
        </View>

        {/* Withdrawal Type Selector */}
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>{t('withdrawalType')}</Text>
          
          <View style={styles.typeGrid}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                withdrawalType === 'purchased' && styles.typeCardActive,
                !poolStatus?.isLaunched && styles.typeCardDisabled,
              ]}
              onPress={() => setWithdrawalType('purchased')}
              disabled={!poolStatus?.isLaunched}
            >
              <Text style={styles.typeIcon}>🛒</Text>
              <Text style={styles.typeLabel}>{t('mxiPurchasedLabel')}</Text>
              {!poolStatus?.isLaunched && <Text style={styles.typeLocked}>🔒</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                withdrawalType === 'commissions' && styles.typeCardActive,
              ]}
              onPress={() => setWithdrawalType('commissions')}
            >
              <Text style={styles.typeIcon}>💵</Text>
              <Text style={styles.typeLabel}>{t('mxiCommissionsLabel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                withdrawalType === 'vesting' && styles.typeCardActive,
                !poolStatus?.isLaunched && styles.typeCardDisabled,
              ]}
              onPress={() => setWithdrawalType('vesting')}
              disabled={!poolStatus?.isLaunched}
            >
              <Text style={styles.typeIcon}>🔒</Text>
              <Text style={styles.typeLabel}>{t('mxiVestingLabel')}</Text>
              {!poolStatus?.isLaunched && <Text style={styles.typeLocked}>🔒</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                withdrawalType === 'tournaments' && styles.typeCardActive,
              ]}
              onPress={() => setWithdrawalType('tournaments')}
            >
              <Text style={styles.typeIcon}>🏆</Text>
              <Text style={styles.typeLabel}>{t('mxiTournamentsLabel')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Type Info */}
        <View style={[commonStyles.card, { borderLeftWidth: 4, borderLeftColor: typeInfo.color }]}>
          <View style={styles.typeInfoHeader}>
            <Text style={styles.typeInfoIcon}>{typeInfo.icon}</Text>
            <View style={styles.typeInfoText}>
              <Text style={styles.typeInfoTitle}>{typeInfo.title}</Text>
              <Text style={styles.typeInfoDescription}>{typeInfo.description}</Text>
            </View>
          </View>
          
          <View style={styles.typeInfoStats}>
            <View style={styles.typeInfoStat}>
              <Text style={styles.typeInfoStatLabel}>{t('available')}</Text>
              <Text style={[styles.typeInfoStatValue, { color: typeInfo.color }]}>
                {typeInfo.available.toFixed(typeInfo.currency === 'USDT' ? 2 : 6)} {typeInfo.currency}
              </Text>
            </View>
            
            {typeInfo.locked && (
              <View style={styles.lockedBadge}>
                <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={16} color={colors.warning} />
                <Text style={styles.lockedText}>{t('lockedUntilLaunch')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Withdrawal Form */}
        {!typeInfo.locked && (
          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>{t('withdrawalDetails')}</Text>
            <Text style={styles.withdrawalNote}>
              {t('withdrawalsInUSDTETH')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('amountMXI')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder={`${t('maximum')}: ${typeInfo.available.toFixed(6)}`}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setAmount(typeInfo.available.toString())}
              >
                <Text style={styles.maxButtonText}>{t('maximum').toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* USDT Equivalent Display */}
            {amountNum > 0 && (
              <View style={styles.conversionDisplay}>
                <View style={styles.conversionRow}>
                  <Text style={styles.conversionLabel}>{t('amountInMXI')}</Text>
                  <Text style={styles.conversionValue}>{amountNum.toFixed(2)} MXI</Text>
                </View>
                <View style={styles.conversionArrow}>
                  <IconSymbol ios_icon_name="arrow.down" android_material_icon_name="arrow_downward" size={20} color={colors.primary} />
                </View>
                <View style={styles.conversionRow}>
                  <Text style={styles.conversionLabel}>{t('equivalentInUSDT')}</Text>
                  <Text style={[styles.conversionValue, styles.conversionValueHighlight]}>
                    ≈ {usdtEquivalent.toFixed(2)} USDT
                  </Text>
                </View>
                <Text style={styles.conversionRate}>{t('rate')}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('walletAddressETH')}</Text>
              <TextInput
                style={styles.input}
                value={walletAddress}
                onChangeText={setWalletAddress}
                placeholder={t('enterYourETHWalletAddress')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.withdrawButton]}
              onPress={handleWithdraw}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <React.Fragment>
                  <IconSymbol ios_icon_name="arrow.down.circle.fill" android_material_icon_name="arrow_circle_down" size={20} color="#fff" />
                  <Text style={buttonStyles.primaryText}>{t('requestWithdrawal')}</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Requirements */}
        <View style={[commonStyles.card, styles.requirementsCard]}>
          <Text style={styles.sectionTitle}>{t('withdrawalRequirements')}</Text>
          
          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user?.kycStatus === 'approved' ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
              android_material_icon_name={user?.kycStatus === 'approved' ? 'check_circle' : 'cancel'} 
              size={20} 
              color={user?.kycStatus === 'approved' ? colors.success : colors.error} 
            />
            <Text style={styles.requirementText}>{t('kycApproved')}</Text>
          </View>

          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user && user.activeReferrals >= 5 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
              android_material_icon_name={user && user.activeReferrals >= 5 ? 'check_circle' : 'cancel'} 
              size={20} 
              color={user && user.activeReferrals >= 5 ? colors.success : colors.error} 
            />
            <Text style={styles.requirementText}>
              {t('activeReferralsForGeneralWithdrawals', { count: user?.activeReferrals || 0 })}
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user && user.activeReferrals >= 10 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
              android_material_icon_name={user && user.activeReferrals >= 10 ? 'check_circle' : 'cancel'} 
              size={20} 
              color={user && user.activeReferrals >= 10 ? colors.success : colors.warning} 
            />
            <Text style={styles.requirementText}>
              {t('activeReferralsForVestingWithdrawals', { count: user?.activeReferrals || 0 })}
            </Text>
          </View>

          {!poolStatus?.isLaunched && (
            <View style={styles.requirementItem}>
              <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color={colors.warning} />
              <Text style={styles.requirementText}>
                {t('mxiLaunchRequiredForPurchasedAndVesting')}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[commonStyles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>{t('importantInformation')}</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>{t('withdrawalsInUSDTETHInfo')}</Text>
            <Text style={styles.infoItem}>{t('conversionInfo')}</Text>
            <Text style={styles.infoItem}>{t('mxiCommissionsInfo')}</Text>
            <Text style={styles.infoItem}>{t('mxiTournamentsInfo')}</Text>
            <Text style={styles.infoItem}>{t('mxiVestingInfo')}</Text>
            <Text style={styles.infoItem}>{t('mxiPurchasedInfo')}</Text>
            <Text style={styles.infoItem}>{t('realTimeUpdateInfo')}</Text>
            <Text style={styles.infoItem}>{t('processingTime')}</Text>
            <Text style={styles.infoItem}>{t('verifyWalletAddress')}</Text>
          </View>
        </View>

        {/* History Button */}
        <TouchableOpacity
          style={[commonStyles.card, styles.historyButton]}
          onPress={() => router.push('/(tabs)/(home)/withdrawals')}
        >
          <IconSymbol ios_icon_name="clock.arrow.circlepath" android_material_icon_name="history" size={24} color={colors.primary} />
          <Text style={styles.historyButtonText}>{t('viewWithdrawalHistory')}</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  balanceCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  totalBalanceDisplay: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  totalBalanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalBalanceValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00ff88',
    marginBottom: 4,
  },
  totalBalanceSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  balanceItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  balanceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  balanceLocked: {
    fontSize: 10,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 4,
  },
  balanceAvailable: {
    fontSize: 10,
    color: colors.success,
    textAlign: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00ff88',
  },
  liveText: {
    fontSize: 8,
    color: '#00ff88',
    fontWeight: '700',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeCardDisabled: {
    opacity: 0.5,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  typeLocked: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
  typeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  typeInfoIcon: {
    fontSize: 40,
  },
  typeInfoText: {
    flex: 1,
  },
  typeInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  typeInfoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeInfoStats: {
    gap: 12,
  },
  typeInfoStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeInfoStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeInfoStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  lockedText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
  },
  withdrawalNote: {
    fontSize: 13,
    color: colors.warning,
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
  maxButton: {
    position: 'absolute',
    right: 12,
    top: 38,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  conversionDisplay: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  conversionValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  conversionValueHighlight: {
    fontSize: 20,
    color: colors.primary,
  },
  conversionArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  conversionRate: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  requirementsCard: {
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  historyButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
