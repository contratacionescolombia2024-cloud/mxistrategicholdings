
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function WithdrawMXIScreen() {
  const router = useRouter();
  const { user, withdrawMXI, checkMXIWithdrawalEligibility, getPoolStatus, getAvailableMXI } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [canWithdrawMXI, setCanWithdrawMXI] = useState(false);
  const [poolStatus, setPoolStatus] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [availableMXI, setAvailableMXI] = useState(0);

  useEffect(() => {
    loadEligibility();
  }, []);

  const loadEligibility = async () => {
    setCheckingEligibility(true);
    const eligible = await checkMXIWithdrawalEligibility();
    const status = await getPoolStatus();
    const available = await getAvailableMXI();
    setCanWithdrawMXI(eligible);
    setPoolStatus(status);
    setAvailableMXI(available);
    setCheckingEligibility(false);
  };

  const handleWithdraw = async () => {
    if (!user) return;

    // Check if coin is launched
    if (!poolStatus?.is_mxi_launched) {
      Alert.alert(
        'Retiro No Disponible',
        `El saldo de vesting no se puede retirar hasta que se lance la moneda oficialmente.\n\nTiempo restante: ${poolStatus?.days_until_launch || 0} días`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > availableMXI) {
      Alert.alert('Error', `You can only withdraw up to ${availableMXI.toFixed(2)} MXI at this time`);
      return;
    }

    if (!walletAddress || walletAddress.length < 10) {
      Alert.alert('Error', 'Please enter a valid MXI wallet address');
      return;
    }

    Alert.alert(
      'Confirm MXI Withdrawal',
      `You are about to withdraw ${amount.toFixed(2)} MXI to:\n\n${walletAddress}\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            const result = await withdrawMXI(amount, walletAddress);
            setLoading(false);

            if (result.success) {
              Alert.alert(
                'Success',
                'MXI withdrawal request submitted! Your tokens will be processed within 24-48 hours.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setWalletAddress('');
                      setWithdrawAmount('');
                      router.back();
                    },
                  },
                ]
              );
            } else {
              Alert.alert('Error', result.error || 'Failed to process withdrawal');
            }
          },
        },
      ]
    );
  };

  const handleKYCNavigation = () => {
    router.push('/(tabs)/(home)/kyc-verification');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const activeReferralsProgress = Math.min((user.activeReferrals / 5) * 100, 100);
  const referralsNeeded = Math.max(0, 5 - user.activeReferrals);
  const releaseProgress = user.mxiBalance > 0 ? (availableMXI / user.mxiBalance) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Withdraw MXI</Text>
          <Text style={styles.subtitle}>Phased release withdrawal system</Text>
        </View>

        <View style={[commonStyles.card, styles.balanceCard]}>
          <Text style={styles.balanceLabel}>Total MXI Balance</Text>
          <View style={styles.balanceRow}>
            <IconSymbol name="bitcoinsign.circle.fill" size={40} color={colors.primary} />
            <Text style={styles.balanceAmount}>{user.mxiBalance.toFixed(2)}</Text>
            <Text style={styles.balanceCurrency}>MXI</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.availableRow}>
            <View>
              <Text style={styles.availableLabel}>Available for Withdrawal</Text>
              <Text style={styles.availableAmount}>{availableMXI.toFixed(2)} MXI</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{releaseProgress.toFixed(0)}%</Text>
            </View>
          </View>
          {user.nextReleaseDate && (
            <Text style={styles.nextReleaseText}>
              Next release: {new Date(user.nextReleaseDate).toLocaleDateString()} ({user.releasePercentage}%)
            </Text>
          )}
        </View>

        <View style={[commonStyles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>Phased Release System</Text>
          </View>
          <Text style={styles.infoText}>
            To prevent market overselling and price drops, MXI withdrawals are released in phases:
            {'\n\n'}
            - <Text style={styles.boldText}>10% initial release</Text> on launch date
            {'\n'}
            - <Text style={styles.boldText}>10% every 7 days</Text> thereafter
            {'\n'}
            - Protects token value and ensures stability
            {'\n'}
            - All MXI will be fully available over time
          </Text>
        </View>

        <View
          style={[
            commonStyles.card,
            styles.eligibilityCard,
            canWithdrawMXI ? styles.eligibleCard : styles.notEligibleCard,
          ]}
        >
          <View style={styles.eligibilityHeader}>
            <IconSymbol
              name={canWithdrawMXI ? 'checkmark.seal.fill' : 'lock.fill'}
              size={32}
              color={canWithdrawMXI ? colors.success : colors.warning}
            />
            <View style={styles.eligibilityHeaderText}>
              <Text style={styles.eligibilityTitle}>
                {canWithdrawMXI ? 'Withdrawal Available!' : 'Withdrawal Requirements'}
              </Text>
              <Text style={styles.eligibilitySubtitle}>
                {canWithdrawMXI
                  ? 'You can now withdraw your available MXI'
                  : 'Complete requirements to unlock withdrawals'}
              </Text>
            </View>
          </View>

          {checkingEligibility ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <View style={styles.requirementHeader}>
                  <IconSymbol
                    name={user.activeReferrals >= 5 ? 'checkmark.circle.fill' : 'circle'}
                    size={24}
                    color={user.activeReferrals >= 5 ? colors.success : colors.textSecondary}
                  />
                  <Text style={styles.requirementText}>
                    {user.activeReferrals}/5 Active Referrals
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${activeReferralsProgress}%`,
                        backgroundColor:
                          user.activeReferrals >= 5 ? colors.success : colors.warning,
                      },
                    ]}
                  />
                </View>
                {referralsNeeded > 0 && (
                  <Text style={styles.requirementNote}>
                    You need {referralsNeeded} more active referral{referralsNeeded > 1 ? 's' : ''}
                  </Text>
                )}
              </View>

              <View style={styles.requirementItem}>
                <View style={styles.requirementHeader}>
                  <IconSymbol
                    name={
                      user.kycStatus === 'approved' ? 'checkmark.circle.fill' : 
                      user.kycStatus === 'pending' ? 'clock.fill' :
                      user.kycStatus === 'rejected' ? 'xmark.circle.fill' : 'circle'
                    }
                    size={24}
                    color={
                      user.kycStatus === 'approved' ? colors.success : 
                      user.kycStatus === 'pending' ? colors.warning :
                      user.kycStatus === 'rejected' ? colors.error : colors.textSecondary
                    }
                  />
                  <Text style={styles.requirementText}>KYC Verification</Text>
                </View>
                <Text style={styles.requirementDate}>
                  Status: {user.kycStatus === 'not_submitted' ? 'Not Submitted' : 
                           user.kycStatus === 'pending' ? 'Under Review' :
                           user.kycStatus === 'approved' ? 'Approved' : 'Rejected'}
                </Text>
                {user.kycStatus !== 'approved' && (
                  <TouchableOpacity
                    style={styles.kycButton}
                    onPress={handleKYCNavigation}
                  >
                    <Text style={styles.kycButtonText}>
                      {user.kycStatus === 'not_submitted' ? 'Start KYC Verification' :
                       user.kycStatus === 'pending' ? 'View KYC Status' :
                       'Resubmit KYC'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.requirementItem}>
                <View style={styles.requirementHeader}>
                  <IconSymbol
                    name={
                      poolStatus?.is_mxi_launched ? 'checkmark.circle.fill' : 'clock.fill'
                    }
                    size={24}
                    color={poolStatus?.is_mxi_launched ? colors.success : colors.textSecondary}
                  />
                  <Text style={styles.requirementText}>Lanzamiento de Moneda</Text>
                </View>
                {poolStatus && (
                  <>
                    <Text style={styles.requirementDate}>
                      {new Date(poolStatus.mxi_launch_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      })}
                    </Text>
                    {!poolStatus.is_mxi_launched && (
                      <>
                        <Text style={styles.requirementNote}>
                          {poolStatus.days_until_launch} días restantes
                        </Text>
                        <View style={[styles.kycButton, { backgroundColor: colors.warning }]}>
                          <Text style={[styles.kycButtonText, { fontSize: 12 }]}>
                            ⚠️ El saldo de vesting no se puede retirar hasta el lanzamiento
                          </Text>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {canWithdrawMXI && availableMXI > 0 && poolStatus?.is_mxi_launched && (
          <View style={[commonStyles.card, styles.withdrawForm]}>
            <Text style={styles.formTitle}>Withdrawal Details</Text>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.label}>Amount (MXI)</Text>
              <TextInput
                style={commonStyles.input}
                placeholder={`Max: ${availableMXI.toFixed(2)}`}
                placeholderTextColor={colors.textSecondary}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setWithdrawAmount(availableMXI.toString())}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.label}>MXI Wallet Address</Text>
              <TextInput
                style={[commonStyles.input, styles.addressInput]}
                placeholder="Enter your MXI wallet address"
                placeholderTextColor={colors.textSecondary}
                value={walletAddress}
                onChangeText={setWalletAddress}
                autoCapitalize="none"
                multiline
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
                <>
                  <IconSymbol name="arrow.down.circle.fill" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Withdraw MXI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={[commonStyles.card, styles.warningCard]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Información Importante:</Text>
            <Text style={styles.warningText}>
              - Los retiros de MXI requieren 5 referidos activos{'\n'}
              - La verificación KYC es obligatoria{'\n'}
              - Solo se puede retirar el MXI disponible{'\n'}
              - El saldo restante se libera cada 7 días{'\n'}
              - El saldo de vesting NO se puede retirar hasta el lanzamiento oficial{'\n'}
              - Una vez lanzada la moneda, podrás retirar tu saldo de vesting{'\n'}
              - Tiempo de procesamiento: 24-48 horas{'\n'}
              - Verifica cuidadosamente la dirección de la billetera{'\n'}
              - Las transacciones no se pueden revertir
            </Text>
          </View>
        </View>

        {!canWithdrawMXI && referralsNeeded > 0 && (
          <TouchableOpacity
            style={[commonStyles.card, styles.promotionCard]}
            onPress={() => router.push('/(tabs)/(home)/referrals')}
          >
            <View style={styles.promotionContent}>
              <IconSymbol name="person.3.fill" size={32} color={colors.primary} />
              <View style={styles.promotionText}>
                <Text style={styles.promotionTitle}>Invite Friends to Unlock</Text>
                <Text style={styles.promotionSubtitle}>
                  Share your referral code to reach 5 active referrals
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  balanceCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
  },
  balanceCurrency: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  availableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  availableLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  availableAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  nextReleaseText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  infoCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  eligibilityCard: {
    marginBottom: 16,
  },
  eligibleCard: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  notEligibleCard: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  eligibilityHeaderText: {
    flex: 1,
  },
  eligibilityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  eligibilitySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  requirementsList: {
    gap: 20,
  },
  requirementItem: {
    gap: 12,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  requirementDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 36,
  },
  requirementNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 36,
    fontStyle: 'italic',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 36,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  kycButton: {
    marginLeft: 36,
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  kycButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawForm: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 12,
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
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: 16,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  promotionCard: {
    backgroundColor: colors.highlight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  promotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  promotionText: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
