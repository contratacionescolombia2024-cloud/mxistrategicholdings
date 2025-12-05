
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function YieldDisplay() {
  const { user, getCurrentYield, claimYield } = useAuth();
  const { t } = useLanguage();
  const [currentYield, setCurrentYield] = useState(0);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user || user.yieldRatePerMinute === 0) {
      setCurrentYield(0);
      return;
    }

    // Update yield display every second
    const interval = setInterval(() => {
      const yield_amount = getCurrentYield();
      setCurrentYield(yield_amount);
    }, 1000);

    return () => clearInterval(interval);
  }, [user, getCurrentYield]);

  const handleClaimYield = async () => {
    if (currentYield < 0.000001) {
      Alert.alert(t('noYield'), t('needMoreYield'));
      return;
    }

    // Check eligibility before claiming - SAME AS WITHDRAWAL CONDITIONS
    if (!user.canWithdraw) {
      Alert.alert(
        t('requirementsNotMet'),
        t('claimRequirements', { count: user.activeReferrals }),
        [{ text: t('ok') }]
      );
      return;
    }

    if (user.kycStatus !== 'approved') {
      Alert.alert(
        t('kycRequired'),
        t('kycRequiredMessage'),
        [{ text: t('ok') }]
      );
      return;
    }

    setClaiming(true);
    const result = await claimYield();
    setClaiming(false);

    if (result.success) {
      Alert.alert(
        t('yieldClaimed'),
        t('yieldClaimedMessage', { amount: result.yieldEarned?.toFixed(8) }),
        [{ text: t('ok') }]
      );
      setCurrentYield(0);
    } else {
      Alert.alert(t('claimFailed'), result.error || t('claimFailed'));
    }
  };

  if (!user || !user.isActiveContributor || user.yieldRatePerMinute === 0) {
    return null;
  }

  const yieldPerSecond = user.yieldRatePerMinute / 60;
  const totalYield = user.accumulatedYield + currentYield;
  const mxiPurchased = user.mxiPurchasedDirectly || 0;

  // Check if button should be enabled - SAME AS WITHDRAWAL CONDITIONS
  const canClaim = user.canWithdraw && user.kycStatus === 'approved' && currentYield >= 0.000001;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>⛏️</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('vestingMXI')}</Text>
          <Text style={styles.subtitle}>
            {t('generatingPerSecond', { rate: yieldPerSecond.toFixed(8) })}
          </Text>
        </View>
      </View>

      <View style={styles.sourceInfo}>
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>{t('mxiPurchasedVestingBase')}</Text>
          <Text style={styles.sourceValue}>{mxiPurchased.toFixed(2)} MXI</Text>
        </View>
        <Text style={styles.sourceNote}>
          {t('onlyPurchasedMXIGeneratesVesting')}
        </Text>
      </View>

      <View style={styles.yieldSection}>
        <View style={styles.yieldRow}>
          <Text style={styles.yieldLabel}>{t('currentSession')}</Text>
          <Text style={styles.yieldValue}>{currentYield.toFixed(8)} MXI</Text>
        </View>
        <View style={styles.yieldRow}>
          <Text style={styles.yieldLabel}>{t('totalAccumulated')}</Text>
          <Text style={styles.yieldValueTotal}>{totalYield.toFixed(8)} MXI</Text>
        </View>
      </View>

      <View style={styles.rateSection}>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>{t('perSecond')}</Text>
          <Text style={styles.rateValue}>{yieldPerSecond.toFixed(8)}</Text>
        </View>
        <View style={styles.rateDivider} />
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>{t('perMinute')}</Text>
          <Text style={styles.rateValue}>{user.yieldRatePerMinute.toFixed(8)}</Text>
        </View>
        <View style={styles.rateDivider} />
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>{t('perHour')}</Text>
          <Text style={styles.rateValue}>{(user.yieldRatePerMinute * 60).toFixed(6)}</Text>
        </View>
      </View>

      <View style={styles.dailyRate}>
        <Text style={styles.dailyRateLabel}>{t('dailyYield')}</Text>
        <Text style={styles.dailyRateValue}>
          {(user.yieldRatePerMinute * 60 * 24).toFixed(4)} MXI
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.claimButton, !canClaim && styles.claimButtonDisabled]}
        onPress={handleClaimYield}
        disabled={!canClaim || claiming}
      >
        <IconSymbol 
          ios_icon_name="arrow.down.circle.fill" 
          android_material_icon_name="arrow_circle_down"
          size={20} 
          color={canClaim && !claiming ? '#fff' : colors.textSecondary} 
        />
        <Text style={[styles.claimButtonText, !canClaim && styles.claimButtonTextDisabled]}>
          {claiming ? t('claiming') : t('claimYield')}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          {t('yieldInfo')}
        </Text>
      </View>

      {!canClaim && (
        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>📋 {t('requirementsToWithdraw')}</Text>
          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user.activeReferrals >= 5 ? "checkmark.circle.fill" : "xmark.circle.fill"}
              android_material_icon_name={user.activeReferrals >= 5 ? "check_circle" : "cancel"}
              size={20} 
              color={user.activeReferrals >= 5 ? colors.success : colors.error} 
            />
            <Text style={styles.requirementText}>
              {t('activeReferralsForGeneralWithdrawals', { count: user.activeReferrals })}
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <IconSymbol 
              ios_icon_name={user.kycStatus === 'approved' ? "checkmark.circle.fill" : "xmark.circle.fill"}
              android_material_icon_name={user.kycStatus === 'approved' ? "check_circle" : "cancel"}
              size={20} 
              color={user.kycStatus === 'approved' ? colors.success : colors.error} 
            />
            <Text style={styles.requirementText}>
              {t('kycApproved')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  iconEmoji: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  sourceInfo: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  sourceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  sourceNote: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  yieldSection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  yieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  yieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  yieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    fontFamily: 'monospace',
  },
  yieldValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  rateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  rateLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
  },
  dailyRate: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  dailyRateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  dailyRateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  claimButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  claimButtonTextDisabled: {
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  requirementsBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
});
