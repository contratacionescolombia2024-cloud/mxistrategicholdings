
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { YieldDisplay } from '@/components/YieldDisplay';
import { LaunchCountdown } from '@/components/LaunchCountdown';
import { TotalMXIBalanceChart } from '@/components/TotalMXIBalanceChart';
import { LanguageSelector } from '@/components/LanguageSelector';
import VersionDisplay from '@/components/VersionDisplay';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  languageSelectorContainer: {
    marginLeft: 'auto',
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  phasesCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentPhaseInfo: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  currentPhaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentPhasePrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#6366F1',
  },
  phasesList: {
    gap: 10,
    marginBottom: 16,
  },
  phaseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  phasePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  phaseProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  phaseProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  phaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseValue: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  overallProgress: {
    marginBottom: 16,
  },
  overallProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  progressSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalMxiDeliveredCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  totalMxiDeliveredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  totalMxiDeliveredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalMxiDeliveredValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  totalMxiDeliveredSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  poolCloseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  poolCloseText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  ambassadorButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8,
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

// Helper function to extract first name and first last name
const getShortName = (fullName: string): string => {
  if (!fullName) return '';
  
  // Split the name by spaces
  const nameParts = fullName.trim().split(/\s+/);
  
  // If there's only one part, return it
  if (nameParts.length === 1) {
    return nameParts[0];
  }
  
  // If there are two parts, return both (first name + last name)
  if (nameParts.length === 2) {
    return `${nameParts[0]} ${nameParts[1]}`;
  }
  
  // If there are more than two parts, return first and last
  // This handles cases like "Camilo Andress Lopez" -> "Camilo Lopez"
  return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
};

export default function HomeScreen() {
  const { user, loading, checkWithdrawalEligibility, getPhaseInfo } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [phaseInfo, setPhaseInfo] = useState<any>({
    currentPhase: 1,
    currentPriceUsdt: 0.40,
    phase1: { sold: 0, remaining: 8333333, allocation: 8333333 },
    phase2: { sold: 0, remaining: 8333333, allocation: 8333333 },
    phase3: { sold: 0, remaining: 8333334, allocation: 8333334 },
    totalSold: 0,
    totalRemaining: 25000000,
    overallProgress: 0,
    poolCloseDate: '2026-02-15T12:00:00Z',
  });
  const [totalMxiDelivered, setTotalMxiDelivered] = useState(0);

  // Animated value for header
  const scrollY = useRef(new Animated.Value(0)).current;

  // Calculate header height based on scroll position
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Force re-render when language changes
  useEffect(() => {
    console.log('Language changed to:', language);
  }, [language]);

  const loadData = async () => {
    try {
      await checkWithdrawalEligibility();
      const info = await getPhaseInfo();
      if (info) {
        setPhaseInfo(info);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('mxi_purchased_directly, mxi_from_unified_commissions, mxi_from_challenges, mxi_vesting_locked');

      if (!usersError && usersData) {
        const totalMxiAllSources = usersData.reduce((sum, user) => {
          const purchased = parseFloat(user.mxi_purchased_directly || '0');
          const commissions = parseFloat(user.mxi_from_unified_commissions || '0');
          const challenges = parseFloat(user.mxi_from_challenges || '0');
          const vesting = parseFloat(user.mxi_vesting_locked || '0');
          
          return sum + purchased + commissions + challenges + vesting;
        }, 0);
        
        console.log('📊 Total MXI delivered to all users (all sources):', totalMxiAllSources);
        setTotalMxiDelivered(totalMxiAllSources);

        const totalMxiPurchased = usersData.reduce((sum, user) => {
          const purchased = parseFloat(user.mxi_purchased_directly || '0');
          return sum + purchased;
        }, 0);

        console.log('📊 Total MXI purchased by all users:', totalMxiPurchased);

        const phase1Allocation = 8333333;
        const phase2Allocation = 8333333;
        const phase3Allocation = 8333334;
        const totalAllocation = 25000000;

        const phase1Price = 0.40;
        const phase2Price = 0.70;
        const phase3Price = 1.00;

        let remainingMxi = totalMxiPurchased;
        let phase1Sold = 0;
        let phase2Sold = 0;
        let phase3Sold = 0;
        let currentPhase = 1;
        let currentPrice = phase1Price;

        if (remainingMxi > 0) {
          phase1Sold = Math.min(remainingMxi, phase1Allocation);
          remainingMxi -= phase1Sold;
        }

        if (remainingMxi > 0) {
          phase2Sold = Math.min(remainingMxi, phase2Allocation);
          remainingMxi -= phase2Sold;
          currentPhase = 2;
          currentPrice = phase2Price;
        }

        if (remainingMxi > 0) {
          phase3Sold = Math.min(remainingMxi, phase3Allocation);
          remainingMxi -= phase3Sold;
          currentPhase = 3;
          currentPrice = phase3Price;
        }

        if (phase1Sold < phase1Allocation) {
          currentPhase = 1;
          currentPrice = phase1Price;
        }
        else if (phase2Sold < phase2Allocation) {
          currentPhase = 2;
          currentPrice = phase2Price;
        }
        else {
          currentPhase = 3;
          currentPrice = phase3Price;
        }

        const phase1Remaining = phase1Allocation - phase1Sold;
        const phase2Remaining = phase2Allocation - phase2Sold;
        const phase3Remaining = phase3Allocation - phase3Sold;

        const totalSold = phase1Sold + phase2Sold + phase3Sold;
        const overallProgress = (totalMxiAllSources / totalAllocation) * 100;

        console.log('📊 Phase breakdown:', {
          phase1Sold,
          phase2Sold,
          phase3Sold,
          totalSold,
          totalMxiAllSources,
          overallProgress: overallProgress.toFixed(2) + '%',
          currentPhase,
          currentPrice,
        });

        const { data: metricsData } = await supabase
          .from('metrics')
          .select('pool_close_date')
          .single();

        setPhaseInfo({
          currentPhase,
          currentPriceUsdt: currentPrice,
          phase1: { sold: phase1Sold, remaining: phase1Remaining, allocation: phase1Allocation },
          phase2: { sold: phase2Sold, remaining: phase2Remaining, allocation: phase2Allocation },
          phase3: { sold: phase3Sold, remaining: phase3Remaining, allocation: phase3Allocation },
          totalSold: totalMxiAllSources,
          totalRemaining: totalAllocation - totalMxiAllSources,
          overallProgress,
          poolCloseDate: metricsData?.pool_close_date || '2026-02-15T12:00:00Z',
        });
      } else {
        console.error('❌ Error loading users data:', usersError);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.text }}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const shortName = getShortName(user.name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Version Display - Top Right Corner */}
      <VersionDisplay position="top" />

      {/* Animated Header with Logo, User Name, and Language Selector */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            height: headerHeight,
            opacity: headerOpacity,
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/904cc327-48f3-4ea1-90a4-6fd4d39a1c11.jpeg')}
              style={styles.logo}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting} numberOfLines={2}>
              {t('hello')}, {shortName}
            </Text>
            <Text style={styles.userName}>{t('welcomeToMXI')}</Text>
          </View>
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector />
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Launch Countdown */}
        <LaunchCountdown />

        {/* NEW: Total MXI Balance Chart with Timeframe Options */}
        <TotalMXIBalanceChart />

        {/* Enhanced Phases and Progress Card */}
        {phaseInfo && phaseInfo.phase1 && phaseInfo.phase2 && phaseInfo.phase3 && (
          <View style={styles.phasesCard}>
            <Text style={styles.cardTitle}>{t('phasesAndProgress')}</Text>
            
            <View style={styles.currentPhaseInfo}>
              <Text style={styles.currentPhaseLabel}>
                {t('currentPhase')}: {phaseInfo.currentPhase || 1}
              </Text>
              <Text style={styles.currentPhasePrice}>
                ${(phaseInfo.currentPriceUsdt || 0.40).toFixed(2)} {t('perMXIText')}
              </Text>
            </View>

            <View style={styles.phasesList}>
              {/* Phase 1 */}
              <View style={styles.phaseItem}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseLabel}>{t('phase')} 1</Text>
                  <Text style={styles.phasePrice}>0.40 USDT</Text>
                </View>
                <View style={styles.phaseProgressBar}>
                  <View 
                    style={[
                      styles.phaseProgressFill, 
                      { 
                        width: `${Math.min(((phaseInfo.phase1.sold || 0) / (phaseInfo.phase1.allocation || 1)) * 100, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <View style={styles.phaseStats}>
                  <Text style={styles.phaseValue}>
                    {t('sold')}: {(phaseInfo.phase1.sold || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.phaseValue}>
                    {t('remaining')}: {(phaseInfo.phase1.remaining || 8333333).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>

              {/* Phase 2 */}
              <View style={styles.phaseItem}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseLabel}>{t('phase')} 2</Text>
                  <Text style={styles.phasePrice}>0.70 USDT</Text>
                </View>
                <View style={styles.phaseProgressBar}>
                  <View 
                    style={[
                      styles.phaseProgressFill, 
                      { 
                        width: `${Math.min(((phaseInfo.phase2.sold || 0) / (phaseInfo.phase2.allocation || 1)) * 100, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <View style={styles.phaseStats}>
                  <Text style={styles.phaseValue}>
                    {t('sold')}: {(phaseInfo.phase2.sold || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.phaseValue}>
                    {t('remaining')}: {(phaseInfo.phase2.remaining || 8333333).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>

              {/* Phase 3 */}
              <View style={styles.phaseItem}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseLabel}>{t('phase')} 3</Text>
                  <Text style={styles.phasePrice}>1.00 USDT</Text>
                </View>
                <View style={styles.phaseProgressBar}>
                  <View 
                    style={[
                      styles.phaseProgressFill, 
                      { 
                        width: `${Math.min(((phaseInfo.phase3.sold || 0) / (phaseInfo.phase3.allocation || 1)) * 100, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <View style={styles.phaseStats}>
                  <Text style={styles.phaseValue}>
                    {t('sold')}: {(phaseInfo.phase3.sold || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.phaseValue}>
                    {t('remaining')}: {(phaseInfo.phase3.remaining || 8333334).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Overall Progress with Professional Bar Graph */}
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressLabel}>{t('generalProgress')}</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.max(Math.min(phaseInfo.overallProgress || 0, 100), 0.5)}%` }
                  ]}
                >
                  {(phaseInfo.overallProgress || 0) > 0 && (
                    <Text style={styles.progressBarText}>
                      {(phaseInfo.overallProgress || 0).toFixed(2)}%
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressText}>
                  {(phaseInfo.totalSold || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })} MXI
                </Text>
                <Text style={styles.progressSubtext}>
                  {t('of')} 25,000,000 MXI
                </Text>
              </View>
            </View>

            {/* Total MXI Delivered to All Users */}
            <View style={styles.totalMxiDeliveredCard}>
              <View style={styles.totalMxiDeliveredHeader}>
                <IconSymbol 
                  ios_icon_name="chart.bar.fill" 
                  android_material_icon_name="bar_chart" 
                  size={24} 
                  color="#4CAF50" 
                />
                <Text style={styles.totalMxiDeliveredTitle}>
                  {t('totalMXIDelivered')}
                </Text>
              </View>
              <Text style={styles.totalMxiDeliveredValue}>
                {totalMxiDelivered.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.totalMxiDeliveredSubtext}>
                {t('mxiDeliveredToAllUsers')}
              </Text>
            </View>

            <View style={styles.poolCloseInfo}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule" 
                size={18} 
                color={colors.textSecondary} 
              />
              <Text style={styles.poolCloseText}>
                {t('poolClose')}: {new Date(phaseInfo.poolCloseDate || '2026-02-15T12:00:00Z').toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Yield Display */}
        <YieldDisplay />

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
                  Gana bonos por tus referidos
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

        {/* Footer */}
        <Footer />

        {/* Extra padding at bottom to avoid tab bar */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
