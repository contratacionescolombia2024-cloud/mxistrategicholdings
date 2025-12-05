
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VestingScreen() {
  const router = useRouter();
  const { user, getPoolStatus } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [vestingData, setVestingData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [poolStatus, setPoolStatus] = useState<any>(null);

  useEffect(() => {
    loadVestingData();
  }, []);

  const loadVestingData = async () => {
    try {
      setLoading(true);

      // Load user data
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;
      setUserData(userInfo);

      // Load vesting schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('mxi_withdrawal_schedule')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (scheduleError && scheduleError.code !== 'PGRST116') {
        throw scheduleError;
      }

      setVestingData(schedule);

      // Load pool status
      const status = await getPoolStatus();
      setPoolStatus(status);
    } catch (error) {
      console.error('Error loading vesting data:', error);
      Alert.alert(t('error'), t('couldNotLoadVestingInfo'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingVestingDataText')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalMXI = vestingData?.total_mxi || 0;
  const releasedMXI = vestingData?.released_mxi || 0;
  const pendingMXI = vestingData?.pending_mxi || 0;
  const releasePercentage = vestingData?.release_percentage || 10;
  const nextReleaseDate = vestingData?.next_release_date
    ? new Date(vestingData.next_release_date)
    : null;
  const releaseCount = vestingData?.release_count || 0;
  const isLaunched = poolStatus?.is_mxi_launched || false;
  const daysUntilLaunch = poolStatus?.days_until_launch || 0;
  const mxiPurchased = userData?.mxi_purchased_directly || 0;

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
        <Text style={styles.headerTitle}>{t('mxiVestingBalance')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.transparentCard, styles.sourceCard]}>
          <View style={styles.sourceHeader}>
            <IconSymbol
              ios_icon_name="cart.fill"
              android_material_icon_name="shopping_cart"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.sourceTitle}>{t('vestingSourceTitle')}</Text>
          </View>
          <Text style={styles.sourceText}>
            {t('vestingSourceDescriptionText')}
          </Text>
          <View style={styles.sourceValueBox}>
            <Text style={styles.sourceLabel}>{t('mxiPurchasedVestingBaseText')}</Text>
            <Text style={styles.sourceValue}>{mxiPurchased.toFixed(2)} MXI</Text>
          </View>
        </View>

        <View style={[styles.transparentCard, styles.mainCard]}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={48}
              color={colors.primary}
            />
          </View>
          <Text style={styles.mainTitle}>{t('mxiInVestingText')}</Text>
          <Text style={styles.mainAmount}>{totalMXI.toFixed(2)} MXI</Text>
          <Text style={styles.mainSubtitle}>
            {isLaunched 
              ? t('availableForWithdrawalText')
              : t('blockedUntilLaunchText') + ` (${daysUntilLaunch} ${t('daysRemainingText')})`}
          </Text>
        </View>

        {!isLaunched && (
          <View style={[styles.transparentCard, styles.warningCard]}>
            <View style={styles.warningHeader}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={32}
                color={colors.warning}
              />
              <Text style={styles.warningTitle}>{t('balanceBlockedTitle')}</Text>
            </View>
            <Text style={styles.warningText}>
              {t('balanceBlockedDescriptionText')}
            </Text>
            {daysUntilLaunch > 0 && (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>{t('timeUntilLaunchText')}</Text>
                <Text style={styles.countdownValue}>{daysUntilLaunch} {t('daysRemainingText')}</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.transparentCard, styles.statsCard]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.success}
              />
              <Text style={styles.statLabel}>{t('releasedText')}</Text>
              <Text style={styles.statValue}>{releasedMXI.toFixed(2)} MXI</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={24}
                color={colors.warning}
              />
              <Text style={styles.statLabel}>{t('pending')}</Text>
              <Text style={styles.statValue}>{pendingMXI.toFixed(2)} MXI</Text>
            </View>
          </View>
        </View>

        <View style={[styles.transparentCard, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.infoTitle}>{t('vestingInformationText')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('releasePercentageText')}</Text>
            <Text style={styles.infoValue}>{releasePercentage}% {t('everyTenDaysText')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('releasesCompletedText')}</Text>
            <Text style={styles.infoValue}>{releaseCount}</Text>
          </View>

          {nextReleaseDate && isLaunched && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('nextReleaseText')}</Text>
              <Text style={styles.infoValue}>
                {nextReleaseDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('withdrawalStatusText')}</Text>
            <Text style={[styles.infoValue, { color: isLaunched ? colors.success : colors.error }]}>
              {isLaunched ? t('enabledText') : t('blockedUntilLaunchShortText')}
            </Text>
          </View>
        </View>

        <View style={[styles.transparentCard, styles.descriptionCard]}>
          <Text style={styles.descriptionTitle}>{t('whatIsVestingText')}</Text>
          <Text style={styles.descriptionText}>
            {t('vestingDescriptionText')}
          </Text>
          <Text style={styles.descriptionText}>
            {isLaunched 
              ? t('vestingReleaseInfoText', { percentage: releasePercentage })
              : t('vestingReleaseInfoPreLaunchText', { percentage: releasePercentage })}
          </Text>
          <Text style={[styles.descriptionText, styles.importantNote]}>
            {t('vestingImportantNoteText')}
          </Text>
        </View>

        {isLaunched && (
          <TouchableOpacity
            style={[styles.transparentCard, styles.actionCard]}
            onPress={() => router.push('/(tabs)/(home)/withdraw-mxi')}
          >
            <View style={styles.actionContent}>
              <IconSymbol
                ios_icon_name="arrow.down.circle.fill"
                android_material_icon_name="arrow_circle_down"
                size={32}
                color={colors.success}
              />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{t('withdrawMXIText')}</Text>
                <Text style={styles.actionSubtitle}>
                  {t('withdrawVestingBalanceText')}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.textSecondary}
              />
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
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
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
  transparentCard: {
    backgroundColor: 'rgba(26, 31, 58, 0.3)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sourceCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sourceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  sourceText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '600',
  },
  sourceValueBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sourceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  mainCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  mainAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  countdownBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.warning,
  },
  statsCard: {
    padding: 0,
    backgroundColor: 'rgba(26, 31, 58, 0.25)',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoCard: {
    gap: 16,
    backgroundColor: 'rgba(26, 31, 58, 0.35)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  descriptionCard: {
    gap: 12,
    backgroundColor: 'rgba(26, 31, 58, 0.3)',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  importantNote: {
    color: colors.warning,
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  actionCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderWidth: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
