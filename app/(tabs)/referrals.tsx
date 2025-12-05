
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Clipboard from 'expo-clipboard';

export default function ReferralsScreen() {
  const { user, getCurrentYield } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [currentYield, setCurrentYield] = useState(0);

  useEffect(() => {
    if (user && getCurrentYield) {
      const yield_value = getCurrentYield();
      setCurrentYield(yield_value);
    }
  }, [user, getCurrentYield]);

  const handleCopyCode = async () => {
    if (!user?.referralCode) return;
    await Clipboard.setStringAsync(user.referralCode);
    Alert.alert(t('copied'), t('referralCode') + ' ' + t('copied').toLowerCase());
  };

  const handleShare = async () => {
    if (!user?.referralCode) return;

    try {
      await Share.share({
        message: `${t('shareReferralCode')}: ${user.referralCode}\n\n${t('earnMXIMultipleWays')}!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get commission balance from user context - this is the unified source of truth
  const mxiFromCommissions = user?.mxiFromUnifiedCommissions || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('commissionsByReferrals')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Embajadores MXI Button */}
        <TouchableOpacity
          style={styles.ambassadorButton}
          onPress={() => router.push('/(tabs)/(home)/embajadores-mxi')}
        >
          <View style={styles.ambassadorButtonContent}>
            <View style={styles.ambassadorButtonLeft}>
              <Text style={styles.ambassadorButtonEmoji}>🏆</Text>
              <View>
                <Text style={styles.ambassadorButtonTitle}>Embajadores MXI</Text>
                <Text style={styles.ambassadorButtonSubtitle}>
                  Gana bonos adicionales por tus referidos
                </Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron_right" 
              size={24} 
              color={colors.primary} 
            />
          </View>
        </TouchableOpacity>

        {/* Referral Code Card */}
        <View style={[commonStyles.card, styles.codeCard]}>
          <View style={styles.codeHeader}>
            <IconSymbol 
              ios_icon_name="person.2.fill" 
              android_material_icon_name="people" 
              size={32} 
              color={colors.primary} 
            />
            <Text style={styles.codeTitle}>{t('yourReferralCode')}</Text>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{user?.referralCode || 'N/A'}</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
              <IconSymbol 
                ios_icon_name="doc.on.doc" 
                android_material_icon_name="content_copy" 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[buttonStyles.primary, styles.shareButton]} onPress={handleShare}>
            <IconSymbol 
              ios_icon_name="square.and.arrow.up" 
              android_material_icon_name="share" 
              size={20} 
              color="#000" 
            />
            <Text style={buttonStyles.primaryText}>{t('shareCode')}</Text>
          </TouchableOpacity>
        </View>

        {/* Commission Balance - Unified Source */}
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>💰 {t('commissionBalance')}</Text>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>{t('totalEarnedByReferrals')}</Text>
              <Text style={styles.balanceValue}>{mxiFromCommissions.toFixed(4)} MXI</Text>
            </View>
            <View style={styles.balanceProgressBar}>
              <View 
                style={[
                  styles.balanceProgressFill, 
                  { 
                    width: mxiFromCommissions > 0 ? '100%' : '0%',
                    backgroundColor: colors.primary
                  }
                ]} 
              />
            </View>
          </View>
          <Text style={styles.infoNote}>
            💡 {t('allCommissionsCreditedMXI')}
          </Text>
          <Text style={styles.infoNote}>
            📊 {t('totalEarnedByReferrals')}
          </Text>
        </View>

        {/* Referral Stats */}
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>👥 {t('yourReferrals')}</Text>
          <View style={styles.referralsList}>
            <View style={styles.referralItem}>
              <View style={styles.referralLevel}>
                <Text style={styles.referralLevelText}>{t('level')} 1</Text>
                <Text style={styles.referralRate}>3%</Text>
              </View>
              <Text style={styles.referralCount}>{user?.referrals.level1 || 0} {t('referralsText')}</Text>
            </View>
            <View style={styles.referralItem}>
              <View style={styles.referralLevel}>
                <Text style={styles.referralLevelText}>{t('level')} 2</Text>
                <Text style={styles.referralRate}>2%</Text>
              </View>
              <Text style={styles.referralCount}>{user?.referrals.level2 || 0} {t('referralsText')}</Text>
            </View>
            <View style={styles.referralItem}>
              <View style={styles.referralLevel}>
                <Text style={styles.referralLevelText}>{t('level')} 3</Text>
                <Text style={styles.referralRate}>1%</Text>
              </View>
              <Text style={styles.referralCount}>{user?.referrals.level3 || 0} {t('referralsText')}</Text>
            </View>
          </View>
          <View style={styles.activeReferrals}>
            <Text style={styles.activeLabel}>{t('activeReferralsLevel1')}:</Text>
            <Text style={styles.activeValue}>{user?.activeReferrals || 0}</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={[commonStyles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.infoTitle}>{t('howCommissionsWork')}</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>- {t('shareReferralCode')}</Text>
            <Text style={styles.infoItem}>- {t('earn5PercentLevel1')}</Text>
            <Text style={styles.infoItem}>- {t('earn2PercentLevel2')}</Text>
            <Text style={styles.infoItem}>- {t('earn1PercentLevel3')}</Text>
            <Text style={styles.infoItem}>- {t('allCommissionsCreditedMXI')}</Text>
            <Text style={styles.infoItem}>- {t('commissionsCalculatedOnMXI')}</Text>
            <Text style={styles.infoItem}>- {t('need5ActiveReferrals')}</Text>
          </View>
        </View>

        {/* Withdrawal Requirements */}
        <View style={[commonStyles.card, styles.requirementsCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol 
              ios_icon_name="checkmark.shield.fill" 
              android_material_icon_name="verified_user" 
              size={24} 
              color={colors.success} 
            />
            <Text style={styles.infoTitle}>{t('requirementsToWithdraw')}</Text>
          </View>
          <View style={styles.requirementsList}>
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
                ios_icon_name={mxiFromCommissions >= 50 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
                android_material_icon_name={mxiFromCommissions >= 50 ? 'check_circle' : 'cancel'} 
                size={20} 
                color={mxiFromCommissions >= 50 ? colors.success : colors.error} 
              />
              <Text style={styles.requirementText}>
                {t('minimumWithdrawalIs50MXI')} ({mxiFromCommissions.toFixed(2)} MXI)
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <IconSymbol 
                ios_icon_name={user?.kycStatus === 'approved' ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
                android_material_icon_name={user?.kycStatus === 'approved' ? 'check_circle' : 'cancel'} 
                size={20} 
                color={user?.kycStatus === 'approved' ? colors.success : colors.error} 
              />
              <Text style={styles.requirementText}>
                {t('kycApproved')}
              </Text>
            </View>
          </View>
          {user && user.activeReferrals >= 5 && mxiFromCommissions >= 50 && user.kycStatus === 'approved' && (
            <TouchableOpacity
              style={[buttonStyles.primary, styles.withdrawButton]}
              onPress={() => router.push('/(tabs)/(home)/retiros')}
            >
              <IconSymbol 
                ios_icon_name="arrow.up.circle.fill" 
                android_material_icon_name="arrow_circle_up" 
                size={20} 
                color="#000" 
              />
              <Text style={buttonStyles.primaryText}>{t('viewWithdrawalHistory')}</Text>
            </TouchableOpacity>
          )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  codeCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  codeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  codeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  balanceProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  balanceProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  referralsList: {
    gap: 12,
    marginBottom: 16,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  referralLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralLevelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  referralRate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  referralCount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  activeReferrals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
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
  requirementsCard: {
    backgroundColor: colors.success + '10',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  requirementsList: {
    gap: 12,
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ambassadorButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ambassadorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ambassadorButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ambassadorButtonEmoji: {
    fontSize: 32,
  },
  ambassadorButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  ambassadorButtonSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
