
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

type WithdrawalType = 'commission' | 'mxi';

interface BalanceBreakdown {
  mxiPurchasedDirectly: number;
  mxiFromUnifiedCommissions: number;
  mxiFromChallenges: number;
  mxiVestingLocked: number;
  commissionsAvailable: number;
}

export default function WithdrawalScreen() {
  const router = useRouter();
  const { user, withdrawCommission, withdrawMXI, checkWithdrawalEligibility, checkMXIWithdrawalEligibility } = useAuth();
  const [loading, setLoading] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('commission');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [canWithdrawCommission, setCanWithdrawCommission] = useState(false);
  const [canWithdrawMXI, setCanWithdrawMXI] = useState(false);
  const [balanceBreakdown, setBalanceBreakdown] = useState<BalanceBreakdown>({
    mxiPurchasedDirectly: 0,
    mxiFromUnifiedCommissions: 0,
    mxiFromChallenges: 0,
    mxiVestingLocked: 0,
    commissionsAvailable: 0,
  });
  const [poolStatus, setPoolStatus] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    const commissionEligible = await checkWithdrawalEligibility();
    setCanWithdrawCommission(commissionEligible);

    const mxiEligible = await checkMXIWithdrawalEligibility();
    setCanWithdrawMXI(mxiEligible);

    const { data: userData } = await supabase
      .from('users')
      .select('mxi_purchased_directly, mxi_from_unified_commissions')
      .eq('id', user.id)
      .single();

    const { data: challengeData } = await supabase
      .from('challenge_history')
      .select('amount_won')
      .eq('user_id', user.id)
      .eq('result', 'win');

    const totalChallengeWinnings = challengeData?.reduce((sum, record) => sum + record.amount_won, 0) || 0;

    const { data: poolData } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'pool_close_date')
      .single();

    const poolCloseDate = poolData?.setting_value ? new Date(poolData.setting_value) : null;
    const isPoolClosed = poolCloseDate ? new Date() > poolCloseDate : false;

    setPoolStatus({ isPoolClosed });

    const mxiPurchased = userData?.mxi_purchased_directly || 0;
    const mxiFromCommissions = userData?.mxi_from_unified_commissions || 0;
    const mxiFromChallenges = totalChallengeWinnings;
    const mxiVesting = user.mxiBalance - mxiPurchased - mxiFromCommissions - mxiFromChallenges;

    setBalanceBreakdown({
      mxiPurchasedDirectly: mxiPurchased,
      mxiFromUnifiedCommissions: mxiFromCommissions,
      mxiFromChallenges: mxiFromChallenges,
      mxiVestingLocked: Math.max(0, mxiVesting),
      commissionsAvailable: user.commissions.available,
    });

    setLoading(false);
  };

  const handleWithdrawToWallet = async () => {
    if (!user) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!walletAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter your wallet address');
      return;
    }

    if (withdrawalType === 'commission') {
      if (amountNum > balanceBreakdown.commissionsAvailable) {
        Alert.alert('Insufficient Balance', 'You don&apos;t have enough available commissions');
        return;
      }

      if (!canWithdrawCommission) {
        Alert.alert(
          'Not Eligible',
          'You need at least 5 active referrals and approved KYC to withdraw commissions'
        );
        return;
      }

      setLoading(true);
      const result = await withdrawCommission(amountNum, walletAddress);
      setLoading(false);

      if (result.success) {
        Alert.alert('Success', 'Withdrawal request submitted successfully!');
        setAmount('');
        setWalletAddress('');
        loadData();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit withdrawal request');
      }
    } else {
      const availableMXI = balanceBreakdown.mxiFromUnifiedCommissions + balanceBreakdown.mxiFromChallenges;

      if (!poolStatus?.isPoolClosed) {
        Alert.alert(
          'Not Available',
          'MXI withdrawals will be available after the pool closes and MXI launches'
        );
        return;
      }

      if (amountNum > availableMXI) {
        Alert.alert('Insufficient Balance', 'You don&apos;t have enough withdrawable MXI');
        return;
      }

      if (!canWithdrawMXI) {
        Alert.alert(
          'Not Eligible',
          'You need at least 5 active referrals and approved KYC to withdraw MXI'
        );
        return;
      }

      setLoading(true);
      const result = await withdrawMXI(amountNum, walletAddress);
      setLoading(false);

      if (result.success) {
        Alert.alert('Success', 'MXI withdrawal request submitted successfully!');
        setAmount('');
        setWalletAddress('');
        loadData();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit withdrawal request');
      }
    }
  };

  const handleUnifyBalance = () => {
    router.push('/(tabs)/(home)/referrals');
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[commonStyles.card, styles.balanceCard]}>
          <Text style={styles.sectionTitle}>Balance Breakdown</Text>
          
          <View style={styles.balanceItem}>
            <View style={styles.balanceItemHeader}>
              <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="monetization_on" size={20} color={colors.primary} />
              <Text style={styles.balanceItemLabel}>MXI Purchased (USDT)</Text>
            </View>
            <Text style={styles.balanceItemValue}>{balanceBreakdown.mxiPurchasedDirectly.toFixed(2)} MXI</Text>
            <Text style={styles.balanceItemStatus}>Locked until launch</Text>
          </View>

          <View style={styles.balanceItem}>
            <View style={styles.balanceItemHeader}>
              <IconSymbol ios_icon_name="arrow.triangle.merge" android_material_icon_name="merge_type" size={20} color={colors.success} />
              <Text style={styles.balanceItemLabel}>MXI from Commissions</Text>
            </View>
            <Text style={styles.balanceItemValue}>{balanceBreakdown.mxiFromUnifiedCommissions.toFixed(2)} MXI</Text>
            <Text style={[styles.balanceItemStatus, { color: colors.success }]}>
              {poolStatus?.isPoolClosed ? 'Withdrawable' : 'Locked until launch'}
            </Text>
          </View>

          <View style={styles.balanceItem}>
            <View style={styles.balanceItemHeader}>
              <IconSymbol ios_icon_name="trophy.fill" android_material_icon_name="emoji_events" size={20} color={colors.warning} />
              <Text style={styles.balanceItemLabel}>MXI from Challenges</Text>
            </View>
            <Text style={styles.balanceItemValue}>{balanceBreakdown.mxiFromChallenges.toFixed(2)} MXI</Text>
            <Text style={[styles.balanceItemStatus, { color: colors.success }]}>
              {poolStatus?.isPoolClosed ? 'Withdrawable' : 'Locked until launch'}
            </Text>
          </View>

          <View style={styles.balanceItem}>
            <View style={styles.balanceItemHeader}>
              <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={20} color={colors.textSecondary} />
              <Text style={styles.balanceItemLabel}>MXI Vesting (Yield)</Text>
            </View>
            <Text style={styles.balanceItemValue}>{balanceBreakdown.mxiVestingLocked.toFixed(2)} MXI</Text>
            <Text style={styles.balanceItemStatus}>Locked until launch</Text>
          </View>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceItem}>
            <View style={styles.balanceItemHeader}>
              <IconSymbol ios_icon_name="banknote.fill" android_material_icon_name="payments" size={20} color={colors.accent} />
              <Text style={styles.balanceItemLabel}>Commission Balance (USDT)</Text>
            </View>
            <Text style={styles.balanceItemValue}>${balanceBreakdown.commissionsAvailable.toFixed(2)}</Text>
            <Text style={[styles.balanceItemStatus, { color: colors.success }]}>Withdrawable</Text>
          </View>
        </View>

        <View style={[commonStyles.card, styles.requirementsCard]}>
          <Text style={styles.sectionTitle}>Withdrawal Requirements</Text>
          
          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user?.kycStatus === 'approved' ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
              android_material_icon_name={user?.kycStatus === 'approved' ? 'check_circle' : 'cancel'} 
              size={20} 
              color={user?.kycStatus === 'approved' ? colors.success : colors.error} 
            />
            <Text style={styles.requirementText}>KYC Approved</Text>
          </View>

          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user && user.activeReferrals >= 5 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
              android_material_icon_name={user && user.activeReferrals >= 5 ? 'check_circle' : 'cancel'} 
              size={20} 
              color={user && user.activeReferrals >= 5 ? colors.success : colors.error} 
            />
            <Text style={styles.requirementText}>5 Active Referrals ({user?.activeReferrals || 0}/5)</Text>
          </View>

          {!poolStatus?.isPoolClosed && (
            <View style={styles.requirementItem}>
              <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color={colors.warning} />
              <Text style={styles.requirementText}>Pool must close for MXI withdrawals</Text>
            </View>
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Withdrawal Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, withdrawalType === 'commission' && styles.typeButtonActive]}
              onPress={() => setWithdrawalType('commission')}
            >
              <IconSymbol 
                ios_icon_name="banknote.fill" 
                android_material_icon_name="payments" 
                size={24} 
                color={withdrawalType === 'commission' ? '#fff' : colors.text} 
              />
              <Text style={[styles.typeButtonText, withdrawalType === 'commission' && styles.typeButtonTextActive]}>
                Commission (USDT)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, withdrawalType === 'mxi' && styles.typeButtonActive]}
              onPress={() => setWithdrawalType('mxi')}
            >
              <IconSymbol 
                ios_icon_name="dollarsign.circle.fill" 
                android_material_icon_name="monetization_on" 
                size={24} 
                color={withdrawalType === 'mxi' ? '#fff' : colors.text} 
              />
              <Text style={[styles.typeButtonText, withdrawalType === 'mxi' && styles.typeButtonTextActive]}>
                MXI Tokens
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Withdrawal Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder={`Enter amount in ${withdrawalType === 'commission' ? 'USDT' : 'MXI'}`}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.inputHint}>
              Available: {withdrawalType === 'commission' 
                ? `$${balanceBreakdown.commissionsAvailable.toFixed(2)}` 
                : `${(balanceBreakdown.mxiFromUnifiedCommissions + balanceBreakdown.mxiFromChallenges).toFixed(2)} MXI`}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Wallet Address (TRC20)</Text>
            <TextInput
              style={styles.input}
              value={walletAddress}
              onChangeText={setWalletAddress}
              placeholder="Enter your TRC20 wallet address"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.withdrawButton]}
            onPress={handleWithdrawToWallet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <React.Fragment>
                <IconSymbol ios_icon_name="arrow.down.circle.fill" android_material_icon_name="arrow_circle_down" size={20} color="#fff" />
                <Text style={buttonStyles.primaryText}>Request Withdrawal</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>

        <View style={[commonStyles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>Important Information</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>- Commission withdrawals require 5 active referrals and approved KYC</Text>
            <Text style={styles.infoItem}>- MXI from USDT purchases is locked until launch</Text>
            <Text style={styles.infoItem}>- MXI from commissions and challenges can be withdrawn after launch</Text>
            <Text style={styles.infoItem}>- Vesting yield MXI is locked until launch</Text>
            <Text style={styles.infoItem}>- All withdrawals are processed within 24-48 hours</Text>
          </View>
        </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  balanceItem: {
    marginBottom: 16,
    paddingBottom: 16,
  },
  balanceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  balanceItemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  balanceItemStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
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
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#fff',
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
    marginTop: 6,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
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
});
