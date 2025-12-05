
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import NowPaymentsModal from '@/components/NowPaymentsModal';

export default function DepositScreen() {
  const router = useRouter();
  const { user, getPhaseInfo } = useAuth();
  const { t } = useLanguage();
  
  const [currentPrice, setCurrentPrice] = useState(0.40);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [phaseInfo, setPhaseInfo] = useState<any>(null);
  const [showNowPaymentsModal, setShowNowPaymentsModal] = useState(false);

  useEffect(() => {
    loadPhaseInfo();
  }, []);

  const loadPhaseInfo = async () => {
    try {
      const info = await getPhaseInfo();
      if (info) {
        setCurrentPrice(info.currentPriceUsdt);
        setCurrentPhase(info.currentPhase);
        setPhaseInfo(info);
      }
    } catch (error: any) {
      console.error('Error loading phase info:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('deposit')}</Text>
          <Text style={styles.headerSubtitle}>{t('buyMXIWithMultipleOptions')}</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/(tabs)/(home)/transaction-history')}
        >
          <IconSymbol
            ios_icon_name="clock.arrow.circlepath"
            android_material_icon_name="history"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={[commonStyles.card, styles.balanceCard]}>
          <View style={styles.balanceHeader}>
            <IconSymbol 
              ios_icon_name="dollarsign.circle.fill" 
              android_material_icon_name="account_balance_wallet" 
              size={48} 
              color={colors.primary} 
            />
            <Text style={styles.balanceLabel}>{t('currentBalance')}</Text>
          </View>
          <Text style={styles.balanceValue}>{user?.mxiBalance.toFixed(2) || '0.00'} MXI</Text>
          <Text style={styles.balanceSubtext}>${user?.usdtContributed.toFixed(2) || '0.00'} {t('usdtContributed')}</Text>
        </View>

        {/* Phase Information Card */}
        <View style={styles.phaseCard}>
          <Text style={styles.phaseTitle}>{t('currentPresalePhase')}</Text>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('activePhase')}:</Text>
            <Text style={styles.phaseValue}>{t('phaseOf', { current: currentPhase, total: 3 })}</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('currentPrice')}:</Text>
            <Text style={styles.phaseValue}>{currentPrice.toFixed(2)} USDT {t('perMXI')}</Text>
          </View>
          <View style={styles.phaseDivider} />
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('phase')} 1:</Text>
            <Text style={styles.phaseValue}>0.40 USDT</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('phase')} 2:</Text>
            <Text style={styles.phaseValue}>0.70 USDT</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('phase')} 3:</Text>
            <Text style={styles.phaseValue}>1.00 USDT</Text>
          </View>
          {phaseInfo && (
            <React.Fragment>
              <View style={styles.phaseDivider} />
              <View style={styles.phaseRow}>
                <Text style={styles.phaseLabel}>{t('tokensSold')}:</Text>
                <Text style={styles.phaseValue}>
                  {phaseInfo.totalTokensSold.toLocaleString()} MXI
                </Text>
              </View>
              {currentPhase < 3 && (
                <View style={styles.phaseRow}>
                  <Text style={styles.phaseLabel}>{t('untilNextPhase')}:</Text>
                  <Text style={styles.phaseValue}>
                    {phaseInfo.tokensUntilNextPhase.toLocaleString()} MXI
                  </Text>
                </View>
              )}
            </React.Fragment>
          )}
        </View>

        {/* Payment Options Section */}
        <View style={styles.paymentOptionsSection}>
          <Text style={styles.sectionTitle}>{t('paymentOptions')}</Text>
          <Text style={styles.sectionSubtitle}>{t('chooseYourPreferredPaymentMethod')}</Text>

          {/* Option 1: Multi-Crypto Payment (NowPayments) */}
          <TouchableOpacity
            style={styles.paymentOptionCard}
            onPress={() => setShowNowPaymentsModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.paymentOptionGradient}>
              <View style={styles.paymentOptionHeader}>
                <View style={styles.paymentIconContainer}>
                  <IconSymbol
                    ios_icon_name="creditcard.fill"
                    android_material_icon_name="payment"
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>{t('multiCryptoPayment')}</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    {t('availableCryptocurrencies')}
                  </Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.paymentFeatures}>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureText}>{t('bitcoinEthereumUSDTUSDC')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureText}>{t('multipleNetworks')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureText}>{t('automaticConfirmation')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: Direct USDT Payment */}
          <TouchableOpacity
            style={styles.paymentOptionCard}
            onPress={() => router.push('/(tabs)/(home)/pagar-usdt')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentOptionGradient, styles.paymentOptionGradientAlt]}>
              <View style={styles.paymentOptionHeader}>
                <View style={[styles.paymentIconContainer, styles.paymentIconContainerAlt]}>
                  <IconSymbol
                    ios_icon_name="dollarsign.circle.fill"
                    android_material_icon_name="attach_money"
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>{t('directUSDTPayment')}</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    {t('manualUSDTTransfer')}
                  </Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.paymentFeatures}>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureText}>{t('usdtOnMultipleNetworks')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureText}>{t('manualVerificationAvailable')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureText}>{t('dedicatedSupport')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Manual Verification Button */}
        <TouchableOpacity
          style={styles.manualVerificationCard}
          onPress={() => router.push('/(tabs)/(home)/manual-verification')}
          activeOpacity={0.8}
        >
          <View style={styles.manualVerificationContent}>
            <View style={styles.manualVerificationIconContainer}>
              <IconSymbol
                ios_icon_name="person.fill.checkmark"
                android_material_icon_name="admin_panel_settings"
                size={40}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.manualVerificationTextContainer}>
              <Text style={styles.manualVerificationTitle}>
                {t('manualPaymentVerification')}
              </Text>
              <Text style={styles.manualVerificationSubtitle}>
                {t('requestManualVerificationOfPayments')}
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={28}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.manualVerificationFeatures}>
            <View style={styles.manualVerificationFeatureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.manualVerificationFeatureText}>
                {t('completePaymentHistory')}
              </Text>
            </View>
            <View style={styles.manualVerificationFeatureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.manualVerificationFeatureText}>
                {t('verificationByAdministrator')}
              </Text>
            </View>
            <View style={styles.manualVerificationFeatureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.manualVerificationFeatureText}>
                {t('responseInLessThan2Hours')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Transaction History Link */}
        <TouchableOpacity
          style={styles.historyLinkCard}
          onPress={() => router.push('/(tabs)/(home)/transaction-history')}
        >
          <View style={styles.historyLinkContent}>
            <IconSymbol
              ios_icon_name="clock.arrow.circlepath"
              android_material_icon_name="history"
              size={32}
              color={colors.primary}
            />
            <View style={styles.historyLinkText}>
              <Text style={styles.historyLinkTitle}>{t('transactionHistory')}</Text>
              <Text style={styles.historyLinkSubtitle}>
                {t('viewVerifyAndManageYourPayments')}
              </Text>
            </View>
          </View>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron_right"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Supported Currencies Preview */}
        <View style={styles.currenciesPreviewCard}>
          <Text style={styles.previewTitle}>{t('supportedCryptocurrencies')}</Text>
          <Text style={styles.previewSubtitle}>
            {t('payWithAnyOfTheseCoinsAndMore')}
          </Text>
          <View style={styles.currencyGrid}>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>₿</Text>
              <Text style={styles.currencyChipText}>{t('bitcoin')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>Ξ</Text>
              <Text style={styles.currencyChipText}>{t('ethereum')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>₮</Text>
              <Text style={styles.currencyChipText}>{t('usdt')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>$</Text>
              <Text style={styles.currencyChipText}>{t('usdc')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>B</Text>
              <Text style={styles.currencyChipText}>{t('bnb')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>◎</Text>
              <Text style={styles.currencyChipText}>{t('solana')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>Ł</Text>
              <Text style={styles.currencyChipText}>{t('litecoin')}</Text>
            </View>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipIcon}>+</Text>
              <Text style={styles.currencyChipText}>{t('more50Plus')}</Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>{t('howItWorks')}</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('chooseYourPaymentMethod')}</Text>
                <Text style={styles.stepDescription}>
                  {t('selectBetweenMultiCryptoOrDirectUSDT')}
                </Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('enterTheAmount')}</Text>
                <Text style={styles.stepDescription}>
                  {t('specifyHowMuchUSDTYouWantToInvest')}
                </Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('makeThePayment')}</Text>
                <Text style={styles.stepDescription}>
                  {t('sendTheExactAmountToTheProvidedAddress')}
                </Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('receiveYourMXI')}</Text>
                <Text style={styles.stepDescription}>
                  {t('tokensWillBeCreditedAutomatically')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{t('advantagesOfOurPaymentSystem')}</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="bolt.fill"
                android_material_icon_name="flash_on"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>
                {t('automaticConfirmationInMinutes')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="shield.checkmark.fill"
                android_material_icon_name="verified_user"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>
                {t('secureAndVerifiedOnBlockchain')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="globe"
                android_material_icon_name="public"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>
                {t('multiplePaymentOptionsAvailable')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>
                {t('available247WithoutIntermediaries')}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>{t('paymentMethods')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>{t('cryptocurrencies')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>{t('available247')}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* NowPayments Modal */}
      <NowPaymentsModal
        visible={showNowPaymentsModal}
        onClose={() => setShowNowPaymentsModal(false)}
        userId={user?.id || ''}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  balanceCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  phaseCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  phaseLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  phaseValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  phaseDivider: {
    height: 1,
    backgroundColor: colors.primary + '30',
    marginVertical: 12,
  },
  paymentOptionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  paymentOptionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  paymentOptionGradient: {
    backgroundColor: '#667eea',
    padding: 20,
  },
  paymentOptionGradientAlt: {
    backgroundColor: '#10b981',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentIconContainerAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paymentOptionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  paymentFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualVerificationCard: {
    backgroundColor: '#FF9800',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#FFB74D',
  },
  manualVerificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  manualVerificationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  manualVerificationTextContainer: {
    flex: 1,
  },
  manualVerificationTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  manualVerificationSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
  },
  manualVerificationFeatures: {
    gap: 8,
  },
  manualVerificationFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualVerificationFeatureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  historyLinkContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyLinkText: {
    flex: 1,
  },
  historyLinkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  historyLinkSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  currenciesPreviewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyChipIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  currencyChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  howItWorksCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});
