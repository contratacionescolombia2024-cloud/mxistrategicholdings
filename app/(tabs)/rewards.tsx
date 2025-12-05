
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
import { useLanguage } from '@/contexts/LanguageContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RewardStats {
  totalMxiEarned: number;
  fromCommissions: number;
  fromVesting: number;
  fromBonus: number;
  activeReferrals: number;
  totalReferrals: number;
}

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RewardStats | null>(null);

  useEffect(() => {
    if (user) {
      loadRewardStats();
    }
  }, [user]);

  const loadRewardStats = async () => {
    try {
      setLoading(true);

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Get commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount')
        .eq('user_id', user?.id);

      if (commissionsError) throw commissionsError;

      const totalCommissions = commissionsData?.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0) || 0;

      // Get referrals count
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user?.id);

      if (referralsError) throw referralsError;

      setStats({
        totalMxiEarned: parseFloat(userData.mxi_balance || '0'),
        fromCommissions: parseFloat(userData.mxi_from_unified_commissions || '0'),
        fromVesting: parseFloat(userData.accumulated_yield || '0'),
        fromBonus: 0, // TODO: Add bonus winnings tracking
        activeReferrals: userData.active_referrals || 0,
        totalReferrals: referralsData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading reward stats:', error);
      Alert.alert(t('error'), t('loadingRewards'));
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingRewards')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎁 {t('rewards')}</Text>
        <Text style={styles.headerSubtitle}>{t('earnMXIMultipleWays')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total Rewards Summary */}
        <View style={[commonStyles.card, styles.summaryCard]}>
          <View style={styles.summaryHeader}>
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={32} 
              color={colors.primary} 
            />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>{t('totalMXIEarned')}</Text>
              <Text style={styles.summaryValue}>{formatNumber(stats?.totalMxiEarned || 0)} MXI</Text>
            </View>
          </View>

          <View style={styles.summaryBreakdown}>
            <View style={styles.breakdownItem}>
              <IconSymbol 
                ios_icon_name="person.3.fill" 
                android_material_icon_name="people" 
                size={16} 
                color={colors.warning} 
              />
              <Text style={styles.breakdownLabel}>{t('commissions')}</Text>
              <Text style={styles.breakdownValue}>{formatNumber(stats?.fromCommissions || 0)}</Text>
            </View>

            <View style={styles.breakdownItem}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule" 
                size={16} 
                color={colors.success} 
              />
              <Text style={styles.breakdownLabel}>{t('vesting')}</Text>
              <Text style={styles.breakdownValue}>{formatNumber(stats?.fromVesting || 0)}</Text>
            </View>

            <View style={styles.breakdownItem}>
              <IconSymbol 
                ios_icon_name="ticket.fill" 
                android_material_icon_name="confirmation_number" 
                size={16} 
                color={colors.accent} 
              />
              <Text style={styles.breakdownLabel}>{t('bonus')}</Text>
              <Text style={styles.breakdownValue}>{formatNumber(stats?.fromBonus || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Reward Programs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('rewardPrograms')}</Text>
          
          {/* Bonus de Participación */}
          <TouchableOpacity
            style={styles.rewardCard}
            onPress={() => router.push('/(tabs)/(home)/lottery')}
          >
            <View style={[styles.rewardIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol 
                ios_icon_name="ticket.fill" 
                android_material_icon_name="confirmation_number" 
                size={32} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{t('participationBonus')}</Text>
              <Text style={styles.rewardDescription}>{t('participateInWeeklyDrawings')}</Text>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardBadgeText}>🔥 {t('active')}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron_right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {/* Vesting */}
          <TouchableOpacity
            style={styles.rewardCard}
            onPress={() => router.push('/(tabs)/(home)/vesting')}
          >
            <View style={[styles.rewardIcon, { backgroundColor: colors.success + '20' }]}>
              <IconSymbol 
                ios_icon_name="chart.line.uptrend.xyaxis" 
                android_material_icon_name="trending_up" 
                size={32} 
                color={colors.success} 
              />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{t('vestingAndYield')}</Text>
              <Text style={styles.rewardDescription}>{t('generatePassiveIncome')}</Text>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardBadgeText}>⚡ {t('live')}</Text>
              </View>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron_right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {/* Referrals */}
          <TouchableOpacity
            style={styles.rewardCard}
            onPress={() => router.push('/(tabs)/referrals')}
          >
            <View style={[styles.rewardIcon, { backgroundColor: colors.warning + '20' }]}>
              <IconSymbol 
                ios_icon_name="person.2.fill" 
                android_material_icon_name="group" 
                size={32} 
                color={colors.warning} 
              />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{t('referralSystem')}</Text>
              <Text style={styles.rewardDescription}>{t('earnCommissionsFrom3Levels')}</Text>
              <View style={styles.referralStats}>
                <Text style={styles.referralStatsText}>
                  {stats?.activeReferrals || 0} {t('actives')} / {stats?.totalReferrals || 0} {t('total')}
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
        </View>

        {/* Coming Soon */}
        <View style={[commonStyles.card, styles.comingSoonCard]}>
          <IconSymbol 
            ios_icon_name="gift.fill" 
            android_material_icon_name="card_giftcard" 
            size={48} 
            color={colors.accent} 
          />
          <Text style={styles.comingSoonTitle}>{t('moreRewardsComingSoon')}</Text>
          <Text style={styles.comingSoonText}>
            {t('workingOnNewRewards')}
          </Text>
          <View style={styles.comingSoonList}>
            <Text style={styles.comingSoonItem}>- {t('tournamentsAndCompetitions')}</Text>
            <Text style={styles.comingSoonItem}>- {t('achievementBonuses')}</Text>
            <Text style={styles.comingSoonItem}>- {t('loyaltyRewards')}</Text>
            <Text style={styles.comingSoonItem}>- {t('specialEvents')}</Text>
          </View>
        </View>

        {/* Benefits Info */}
        <View style={[commonStyles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.infoTitle}>{t('benefitsOfRewards')}</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoListItem}>
              <Text style={styles.infoBullet}>-</Text>
              <Text style={styles.infoItem}>{t('earnAdditionalMXI')}</Text>
            </View>
            <View style={styles.infoListItem}>
              <Text style={styles.infoBullet}>-</Text>
              <Text style={styles.infoItem}>{t('participateInExclusiveDrawings')}</Text>
            </View>
            <View style={styles.infoListItem}>
              <Text style={styles.infoBullet}>-</Text>
              <Text style={styles.infoItem}>{t('generateAutomaticPassiveIncome')}</Text>
            </View>
            <View style={styles.infoListItem}>
              <Text style={styles.infoBullet}>-</Text>
              <Text style={styles.infoItem}>{t('bonusesForActiveReferrals')}</Text>
            </View>
            <View style={styles.infoListItem}>
              <Text style={styles.infoBullet}>-</Text>
              <Text style={styles.infoItem}>{t('rewardsForContinuedParticipation')}</Text>
            </View>
          </View>
        </View>

        {/* How to Maximize Rewards */}
        <View style={[commonStyles.card, styles.tipsCard]}>
          <View style={styles.tipsHeader}>
            <IconSymbol 
              ios_icon_name="lightbulb.fill" 
              android_material_icon_name="lightbulb" 
              size={24} 
              color={colors.warning} 
            />
            <Text style={styles.tipsTitle}>{t('maximizeYourRewards')}</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>1</Text>
              </View>
              <Text style={styles.tipText}>{t('keepAtLeast5ActiveReferrals')}</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>2</Text>
              </View>
              <Text style={styles.tipText}>{t('participateRegularlyInBonus')}</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>3</Text>
              </View>
              <Text style={styles.tipText}>{t('activateVestingForPassiveIncome')}</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>4</Text>
              </View>
              <Text style={styles.tipText}>{t('shareYourReferralCode')}</Text>
            </View>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary + '30',
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  rewardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  referralStats: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  referralStatsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  comingSoonCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.accent + '10',
    borderWidth: 1,
    borderColor: colors.accent + '30',
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  comingSoonList: {
    alignSelf: 'stretch',
    paddingHorizontal: 40,
    gap: 8,
  },
  comingSoonItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoList: {
    gap: 12,
  },
  infoListItem: {
    flexDirection: 'row',
    gap: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  infoItem: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
