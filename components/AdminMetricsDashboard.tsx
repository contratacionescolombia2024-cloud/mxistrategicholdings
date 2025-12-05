
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

interface AppMetrics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalMxiDistributed: number;
  totalUsdtContributed: number;
  totalReferrals: number;
  totalCommissions: number;
  totalCommissionAmount: number;
  averageMxiPerUser: number;
  averageUsdtPerUser: number;
  currentPhase: number;
  currentPrice: number;
  phase1Sold: number;
  phase2Sold: number;
  phase3Sold: number;
  totalTokensSold: number;
  phase1StartDate: Date;
  phase1EndDate: Date;
  phase2StartDate: Date;
  phase2EndDate: Date;
  phase3StartDate: Date;
  phase3EndDate: Date;
  presaleEndDate: Date;
  presaleStartDate: Date;
  // Vesting metrics
  totalVestingLocked: number;
  totalVestingReleased: number;
  totalVestingPending: number;
  vestingParticipants: number;
  averageVestingPerUser: number;
  totalYieldGenerated: number;
  activeYieldGenerators: number;
}

export function AdminMetricsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<AppMetrics | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const calculatePhaseInfo = (presaleStartDate: Date, presaleEndDate: Date) => {
    const startDate = new Date(presaleStartDate);
    const endDate = new Date(presaleEndDate);
    
    // Calculate total duration in milliseconds
    const totalDuration = endDate.getTime() - startDate.getTime();
    const phaseDuration = totalDuration / 3;
    
    // Calculate phase dates
    const phase1Start = startDate;
    const phase1End = new Date(startDate.getTime() + phaseDuration);
    const phase2Start = phase1End;
    const phase2End = new Date(phase2Start.getTime() + phaseDuration);
    const phase3Start = phase2End;
    const phase3End = endDate;
    
    // Determine current phase based on current time
    const now = new Date();
    let currentPhase = 1;
    let currentPrice = 0.40;
    
    if (now >= phase3Start) {
      currentPhase = 3;
      currentPrice = 1.00;
    } else if (now >= phase2Start) {
      currentPhase = 2;
      currentPrice = 0.70;
    } else {
      currentPhase = 1;
      currentPrice = 0.40;
    }
    
    return {
      currentPhase,
      currentPrice,
      phase1StartDate: phase1Start,
      phase1EndDate: phase1End,
      phase2StartDate: phase2Start,
      phase2EndDate: phase2End,
      phase3StartDate: phase3Start,
      phase3EndDate: phase3End,
    };
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Get user statistics with actual MXI purchased
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, mxi_purchased_directly, mxi_balance, mxi_vesting_locked, usdt_contributed, is_active_contributor, is_blocked, accumulated_yield, yield_rate_per_minute');

      if (usersError) throw usersError;

      const totalUsers = usersData?.length || 0;
      const activeUsers = usersData?.filter(u => u.is_active_contributor && !u.is_blocked).length || 0;
      const blockedUsers = usersData?.filter(u => u.is_blocked).length || 0;

      // Calculate actual MXI sold (from direct purchases) - THIS IS THE REAL VALUE
      const totalMxiSold = usersData?.reduce((sum, u) => sum + parseFloat(u.mxi_purchased_directly?.toString() || '0'), 0) || 0;
      const totalMxiDistributed = usersData?.reduce((sum, u) => sum + parseFloat(u.mxi_balance?.toString() || '0'), 0) || 0;
      const totalUsdtContributed = usersData?.reduce((sum, u) => sum + parseFloat(u.usdt_contributed?.toString() || '0'), 0) || 0;

      // Vesting metrics
      const totalVestingLocked = usersData?.reduce((sum, u) => sum + parseFloat(u.mxi_vesting_locked?.toString() || '0'), 0) || 0;
      const vestingParticipants = usersData?.filter(u => parseFloat(u.mxi_vesting_locked?.toString() || '0') > 0).length || 0;
      const averageVestingPerUser = vestingParticipants > 0 ? totalVestingLocked / vestingParticipants : 0;
      
      // Yield metrics
      const totalYieldGenerated = usersData?.reduce((sum, u) => sum + parseFloat(u.accumulated_yield?.toString() || '0'), 0) || 0;
      const activeYieldGenerators = usersData?.filter(u => parseFloat(u.yield_rate_per_minute?.toString() || '0') > 0).length || 0;

      // Get vesting schedule data
      const { data: vestingData } = await supabase
        .from('mxi_withdrawal_schedule')
        .select('amount, status');

      const totalVestingReleased = vestingData?.filter(v => v.status === 'released').reduce((sum, v) => sum + parseFloat(v.amount?.toString() || '0'), 0) || 0;
      const totalVestingPending = vestingData?.filter(v => v.status === 'pending').reduce((sum, v) => sum + parseFloat(v.amount?.toString() || '0'), 0) || 0;

      const averageMxiPerUser = totalUsers > 0 ? totalMxiDistributed / totalUsers : 0;
      const averageUsdtPerUser = totalUsers > 0 ? totalUsdtContributed / totalUsers : 0;

      // Get referral statistics
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('id');

      const totalReferrals = referralsData?.length || 0;

      // Get commission statistics
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('id, amount');

      const totalCommissions = commissionsData?.length || 0;
      const totalCommissionAmount = commissionsData?.reduce((sum, c) => sum + parseFloat(c.amount?.toString() || '0'), 0) || 0;

      // Get metrics data for dates
      const { data: metricsData, error: metricsError } = await supabase
        .from('metrics')
        .select('pool_close_date')
        .single();

      if (metricsError) throw metricsError;

      // FIXED: Use the actual presale start date (today) and end date from database
      const presaleStartDate = new Date(); // Start NOW
      const presaleEndDate = new Date(metricsData?.pool_close_date || '2026-02-15T12:00:00Z');
      const phaseInfo = calculatePhaseInfo(presaleStartDate, presaleEndDate);

      // Calculate phase distribution based on current phase and actual MXI sold
      let phase1Sold = 0;
      let phase2Sold = 0;
      let phase3Sold = 0;

      // Distribute MXI sold across phases based on current phase
      if (phaseInfo.currentPhase === 1) {
        phase1Sold = totalMxiSold;
      } else if (phaseInfo.currentPhase === 2) {
        // Assume phase 1 is complete (8.33M) and rest is in phase 2
        phase1Sold = Math.min(totalMxiSold, 8333333);
        phase2Sold = Math.max(0, totalMxiSold - 8333333);
      } else {
        // Phase 3
        phase1Sold = 8333333;
        phase2Sold = 8333333;
        phase3Sold = Math.max(0, totalMxiSold - 16666666);
      }

      setMetrics({
        totalUsers,
        activeUsers,
        blockedUsers,
        totalMxiDistributed,
        totalUsdtContributed,
        totalReferrals,
        totalCommissions,
        totalCommissionAmount,
        averageMxiPerUser,
        averageUsdtPerUser,
        currentPhase: phaseInfo.currentPhase,
        currentPrice: phaseInfo.currentPrice,
        phase1Sold,
        phase2Sold,
        phase3Sold,
        totalTokensSold: totalMxiSold, // Use actual MXI sold from users
        phase1StartDate: phaseInfo.phase1StartDate,
        phase1EndDate: phaseInfo.phase1EndDate,
        phase2StartDate: phaseInfo.phase2StartDate,
        phase2EndDate: phaseInfo.phase2EndDate,
        phase3StartDate: phaseInfo.phase3StartDate,
        phase3EndDate: phaseInfo.phase3EndDate,
        presaleEndDate,
        presaleStartDate,
        totalVestingLocked,
        totalVestingReleased,
        totalVestingPending,
        vestingParticipants,
        averageVestingPerUser,
        totalYieldGenerated,
        activeYieldGenerators,
      });

    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !metrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando métricas...</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudieron cargar las métricas</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={styles.title}>📊 Métricas de la Aplicación</Text>

      {/* User Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Usuarios</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="groups" size={32} color={colors.primary} />
            <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
            <Text style={styles.metricLabel}>Total Usuarios</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.success + '15' }]}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={32} color={colors.success} />
            <Text style={styles.metricValue}>{metrics.activeUsers}</Text>
            <Text style={styles.metricLabel}>Usuarios Activos</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.error + '15' }]}>
            <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="block" size={32} color={colors.error} />
            <Text style={styles.metricValue}>{metrics.blockedUsers}</Text>
            <Text style={styles.metricLabel}>Usuarios Bloqueados</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.warning + '15' }]}>
            <IconSymbol ios_icon_name="percent" android_material_icon_name="percent" size={32} color={colors.warning} />
            <Text style={styles.metricValue}>
              {metrics.totalUsers > 0 ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1) : 0}%
            </Text>
            <Text style={styles.metricLabel}>Tasa de Activación</Text>
          </View>
        </View>
      </View>

      {/* Financial Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Finanzas</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.accent + '15' }]}>
            <IconSymbol ios_icon_name="bitcoinsign.circle.fill" android_material_icon_name="currency_bitcoin" size={32} color={colors.accent} />
            <Text style={styles.metricValue}>{metrics.totalMxiDistributed.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>MXI Distribuido</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.success + '15' }]}>
            <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={32} color={colors.success} />
            <Text style={styles.metricValue}>${metrics.totalUsdtContributed.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>USDT Contribuido</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar_chart" size={32} color={colors.primary} />
            <Text style={styles.metricValue}>{metrics.averageMxiPerUser.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>MXI Promedio/Usuario</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.warning + '15' }]}>
            <IconSymbol ios_icon_name="chart.line.uptrend.xyaxis" android_material_icon_name="trending_up" size={32} color={colors.warning} />
            <Text style={styles.metricValue}>${metrics.averageUsdtPerUser.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>USDT Promedio/Usuario</Text>
          </View>
        </View>
      </View>

      {/* Referral Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Referidos y Comisiones</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol ios_icon_name="link.circle.fill" android_material_icon_name="link" size={32} color={colors.primary} />
            <Text style={styles.metricValue}>{metrics.totalReferrals}</Text>
            <Text style={styles.metricLabel}>Total Referidos</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.success + '15' }]}>
            <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={32} color={colors.success} />
            <Text style={styles.metricValue}>{metrics.totalCommissions}</Text>
            <Text style={styles.metricLabel}>Total Comisiones</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.warning + '15' }]}>
            <IconSymbol ios_icon_name="banknote.fill" android_material_icon_name="payments" size={32} color={colors.warning} />
            <Text style={styles.metricValue}>${metrics.totalCommissionAmount.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Monto Comisiones</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.accent + '15' }]}>
            <IconSymbol ios_icon_name="chart.pie.fill" android_material_icon_name="pie_chart" size={32} color={colors.accent} />
            <Text style={styles.metricValue}>
              {metrics.totalUsers > 0 ? (metrics.totalReferrals / metrics.totalUsers).toFixed(2) : 0}
            </Text>
            <Text style={styles.metricLabel}>Referidos/Usuario</Text>
          </View>
        </View>
      </View>

      {/* Vesting Metrics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Métricas de Vesting</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={32} color={colors.primary} />
            <Text style={styles.metricValue}>{metrics.totalVestingLocked.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>MXI Bloqueado</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.success + '15' }]}>
            <IconSymbol ios_icon_name="lock.open.fill" android_material_icon_name="lock_open" size={32} color={colors.success} />
            <Text style={styles.metricValue}>{metrics.totalVestingReleased.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>MXI Liberado</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.warning + '15' }]}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={32} color={colors.warning} />
            <Text style={styles.metricValue}>{metrics.totalVestingPending.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>MXI Pendiente</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.accent + '15' }]}>
            <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="people" size={32} color={colors.accent} />
            <Text style={styles.metricValue}>{metrics.vestingParticipants}</Text>
            <Text style={styles.metricLabel}>Participantes Vesting</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar_chart" size={32} color={colors.primary} />
            <Text style={styles.metricValue}>{metrics.averageVestingPerUser.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Promedio Vesting/Usuario</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.success + '15' }]}>
            <IconSymbol ios_icon_name="leaf.fill" android_material_icon_name="eco" size={32} color={colors.success} />
            <Text style={styles.metricValue}>{metrics.totalYieldGenerated.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Yield Total Generado</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.warning + '15' }]}>
            <IconSymbol ios_icon_name="bolt.fill" android_material_icon_name="flash_on" size={32} color={colors.warning} />
            <Text style={styles.metricValue}>{metrics.activeYieldGenerators}</Text>
            <Text style={styles.metricLabel}>Generadores Activos</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.accent + '15' }]}>
            <IconSymbol ios_icon_name="percent" android_material_icon_name="percent" size={32} color={colors.accent} />
            <Text style={styles.metricValue}>
              {metrics.totalVestingLocked > 0 ? ((metrics.totalVestingReleased / (metrics.totalVestingLocked + metrics.totalVestingReleased)) * 100).toFixed(1) : 0}%
            </Text>
            <Text style={styles.metricLabel}>% Liberado</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Presale Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Estadísticas de Preventa (Datos Reales)</Text>
        
        {/* Main Presale Card */}
        <View style={styles.presaleMainCard}>
          <View style={styles.presaleHeader}>
            <View>
              <Text style={styles.presaleTitle}>Fase Actual: {metrics.currentPhase}</Text>
              <Text style={styles.presaleSubtitle}>Precio: ${metrics.currentPrice.toFixed(2)} USDT</Text>
            </View>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>FASE {metrics.currentPhase}</Text>
            </View>
          </View>
          
          <View style={styles.presaleStats}>
            <View style={styles.presaleStatRow}>
              <Text style={styles.presaleStatLabel}>MXI Vendidos (Real)</Text>
              <Text style={styles.presaleStatValue}>{metrics.totalTokensSold.toLocaleString()} MXI</Text>
            </View>
            <View style={styles.presaleStatRow}>
              <Text style={styles.presaleStatLabel}>Meta Total Preventa</Text>
              <Text style={styles.presaleStatValue}>25,000,000 MXI</Text>
            </View>
            <View style={styles.presaleStatRow}>
              <Text style={styles.presaleStatLabel}>Progreso General</Text>
              <Text style={styles.presaleStatValue}>
                {((metrics.totalTokensSold / 25000000) * 100).toFixed(4)}%
              </Text>
            </View>
            <View style={styles.presaleStatRow}>
              <Text style={styles.presaleStatLabel}>Valor Recaudado</Text>
              <Text style={styles.presaleStatValue}>${metrics.totalUsdtContributed.toFixed(2)} USDT</Text>
            </View>
            <View style={styles.presaleStatRow}>
              <Text style={styles.presaleStatLabel}>Inicio Preventa</Text>
              <Text style={styles.presaleStatValue}>{formatDateTime(metrics.presaleStartDate)}</Text>
            </View>
            <View style={styles.presaleStatRow}>
              <Text style={styles.presaleStatLabel}>Finalización Preventa</Text>
              <Text style={styles.presaleStatValue}>{formatDateTime(metrics.presaleEndDate)}</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((metrics.totalTokensSold / 25000000) * 100, 100)}%`,
                  backgroundColor: colors.primary 
                }
              ]} 
            />
          </View>
        </View>

        {/* Phase Details Cards */}
        <Text style={styles.phasesSubtitle}>📅 Detalles por Fase</Text>
        <View style={styles.phasesDetailGrid}>
          {/* Phase 1 */}
          <View style={[styles.phaseDetailCard, { 
            backgroundColor: metrics.currentPhase === 1 ? colors.success + '25' : colors.card,
            borderColor: metrics.currentPhase === 1 ? colors.success : colors.border,
            borderWidth: 2,
          }]}>
            <View style={styles.phaseDetailHeader}>
              <Text style={styles.phaseDetailTitle}>Fase 1</Text>
              {metrics.currentPhase === 1 && (
                <View style={[styles.phaseActiveBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.phaseActiveBadgeText}>ACTIVA</Text>
                </View>
              )}
            </View>
            <Text style={styles.phaseDetailPrice}>$0.40 USDT</Text>
            <View style={styles.phaseDetailDates}>
              <Text style={styles.phaseDetailDateLabel}>Inicio:</Text>
              <Text style={styles.phaseDetailDateValue}>{formatDate(metrics.phase1StartDate)}</Text>
            </View>
            <View style={styles.phaseDetailDates}>
              <Text style={styles.phaseDetailDateLabel}>Fin:</Text>
              <Text style={styles.phaseDetailDateValue}>{formatDate(metrics.phase1EndDate)}</Text>
            </View>
            <View style={styles.phaseDetailStats}>
              <Text style={styles.phaseDetailStatsLabel}>Vendidos:</Text>
              <Text style={styles.phaseDetailStatsValue}>{metrics.phase1Sold.toLocaleString()} MXI</Text>
            </View>
            <View style={styles.phaseDetailStats}>
              <Text style={styles.phaseDetailStatsLabel}>Meta:</Text>
              <Text style={styles.phaseDetailStatsValue}>8,333,333 MXI</Text>
            </View>
            <View style={styles.phaseProgressBar}>
              <View 
                style={[
                  styles.phaseProgressFill, 
                  { 
                    width: `${Math.min((metrics.phase1Sold / 8333333) * 100, 100)}%`,
                    backgroundColor: colors.success 
                  }
                ]} 
              />
            </View>
            <Text style={styles.phaseProgressText}>
              {((metrics.phase1Sold / 8333333) * 100).toFixed(4)}%
            </Text>
          </View>

          {/* Phase 2 */}
          <View style={[styles.phaseDetailCard, { 
            backgroundColor: metrics.currentPhase === 2 ? colors.warning + '25' : colors.card,
            borderColor: metrics.currentPhase === 2 ? colors.warning : colors.border,
            borderWidth: 2,
          }]}>
            <View style={styles.phaseDetailHeader}>
              <Text style={styles.phaseDetailTitle}>Fase 2</Text>
              {metrics.currentPhase === 2 && (
                <View style={[styles.phaseActiveBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.phaseActiveBadgeText}>ACTIVA</Text>
                </View>
              )}
            </View>
            <Text style={styles.phaseDetailPrice}>$0.70 USDT</Text>
            <View style={styles.phaseDetailDates}>
              <Text style={styles.phaseDetailDateLabel}>Inicio:</Text>
              <Text style={styles.phaseDetailDateValue}>{formatDate(metrics.phase2StartDate)}</Text>
            </View>
            <View style={styles.phaseDetailDates}>
              <Text style={styles.phaseDetailDateLabel}>Fin:</Text>
              <Text style={styles.phaseDetailDateValue}>{formatDate(metrics.phase2EndDate)}</Text>
            </View>
            <View style={styles.phaseDetailStats}>
              <Text style={styles.phaseDetailStatsLabel}>Vendidos:</Text>
              <Text style={styles.phaseDetailStatsValue}>{metrics.phase2Sold.toLocaleString()} MXI</Text>
            </View>
            <View style={styles.phaseDetailStats}>
              <Text style={styles.phaseDetailStatsLabel}>Meta:</Text>
              <Text style={styles.phaseDetailStatsValue}>8,333,333 MXI</Text>
            </View>
            <View style={styles.phaseProgressBar}>
              <View 
                style={[
                  styles.phaseProgressFill, 
                  { 
                    width: `${Math.min((metrics.phase2Sold / 8333333) * 100, 100)}%`,
                    backgroundColor: colors.warning 
                  }
                ]} 
              />
            </View>
            <Text style={styles.phaseProgressText}>
              {((metrics.phase2Sold / 8333333) * 100).toFixed(4)}%
            </Text>
          </View>

          {/* Phase 3 */}
          <View style={[styles.phaseDetailCard, { 
            backgroundColor: metrics.currentPhase === 3 ? colors.error + '25' : colors.card,
            borderColor: metrics.currentPhase === 3 ? colors.error : colors.border,
            borderWidth: 2,
          }]}>
            <View style={styles.phaseDetailHeader}>
              <Text style={styles.phaseDetailTitle}>Fase 3</Text>
              {metrics.currentPhase === 3 && (
                <View style={[styles.phaseActiveBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.phaseActiveBadgeText}>ACTIVA</Text>
                </View>
              )}
            </View>
            <Text style={styles.phaseDetailPrice}>$1.00 USDT</Text>
            <View style={styles.phaseDetailDates}>
              <Text style={styles.phaseDetailDateLabel}>Inicio:</Text>
              <Text style={styles.phaseDetailDateValue}>{formatDate(metrics.phase3StartDate)}</Text>
            </View>
            <View style={styles.phaseDetailDates}>
              <Text style={styles.phaseDetailDateLabel}>Fin:</Text>
              <Text style={styles.phaseDetailDateValue}>{formatDate(metrics.phase3EndDate)}</Text>
            </View>
            <View style={styles.phaseDetailStats}>
              <Text style={styles.phaseDetailStatsLabel}>Vendidos:</Text>
              <Text style={styles.phaseDetailStatsValue}>{metrics.phase3Sold.toLocaleString()} MXI</Text>
            </View>
            <View style={styles.phaseDetailStats}>
              <Text style={styles.phaseDetailStatsLabel}>Meta:</Text>
              <Text style={styles.phaseDetailStatsValue}>8,333,334 MXI</Text>
            </View>
            <View style={styles.phaseProgressBar}>
              <View 
                style={[
                  styles.phaseProgressFill, 
                  { 
                    width: `${Math.min((metrics.phase3Sold / 8333334) * 100, 100)}%`,
                    backgroundColor: colors.error 
                  }
                ]} 
              />
            </View>
            <Text style={styles.phaseProgressText}>
              {((metrics.phase3Sold / 8333334) * 100).toFixed(4)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📈 Resumen General</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Valor Total Recaudado:</Text>
          <Text style={styles.summaryValue}>${metrics.totalUsdtContributed.toFixed(2)} USDT</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tokens Vendidos (Real):</Text>
          <Text style={styles.summaryValue}>{metrics.totalTokensSold.toLocaleString()} MXI</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Progreso Preventa:</Text>
          <Text style={styles.summaryValue}>
            {((metrics.totalTokensSold / 25000000) * 100).toFixed(4)}%
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Comisiones Pagadas:</Text>
          <Text style={styles.summaryValue}>${metrics.totalCommissionAmount.toFixed(2)} USDT</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fase Actual:</Text>
          <Text style={styles.summaryValue}>Fase {metrics.currentPhase} (${metrics.currentPrice.toFixed(2)} USDT)</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>MXI en Vesting:</Text>
          <Text style={styles.summaryValue}>{metrics.totalVestingLocked.toFixed(2)} MXI</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Yield Generado:</Text>
          <Text style={styles.summaryValue}>{metrics.totalYieldGenerated.toFixed(2)} MXI</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 120,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  presaleMainCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  presaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  presaleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  presaleSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  phaseBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  phaseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  presaleStats: {
    gap: 12,
    marginBottom: 16,
  },
  presaleStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presaleStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  presaleStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  phasesSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  phasesDetailGrid: {
    gap: 12,
  },
  phaseDetailCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  phaseDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  phaseActiveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  phaseDetailPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  phaseDetailDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  phaseDetailDateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  phaseDetailDateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  phaseDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  phaseDetailStatsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  phaseDetailStatsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  phaseProgressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  phaseProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  phaseProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
