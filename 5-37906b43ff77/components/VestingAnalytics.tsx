
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

interface VestingMetric {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  metric_description: string;
}

interface VestingUserDetail {
  user_id: string;
  user_name: string;
  user_email: string;
  mxi_in_vesting: number;
  accumulated_yield: number;
  current_session_yield: number;
  total_yield: number;
  yield_rate_per_minute: number;
  yield_rate_per_hour: number;
  yield_rate_per_day: number;
  last_yield_update: string;
  active_referrals: number;
  can_unify: boolean;
  is_active_contributor: boolean;
}

interface VestingAnalyticsProps {
  isAdmin?: boolean;
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metricDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandButton: {
    padding: 8,
  },
  userDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});

export default function VestingAnalytics({ isAdmin = false }: VestingAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<VestingMetric[]>([]);
  const [users, setUsers] = useState<VestingUserDetail[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVestingData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(() => {
      loadVestingData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadVestingData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      console.log('Loading vesting analytics data...');

      // Fetch global vesting metrics from the view
      const { data: viewData, error: viewError } = await supabase
        .from('vesting_analytics')
        .select('*')
        .maybeSingle();

      if (viewError) {
        console.error('Error fetching vesting analytics:', viewError);
        throw viewError;
      }

      console.log('Vesting analytics data:', viewData);

      // Transform view data into metrics
      if (viewData) {
        const metricsData: VestingMetric[] = [
          {
            metric_name: 'Total Vesting Users',
            metric_value: viewData.total_vesting_users || 0,
            metric_unit: 'users',
            metric_description: 'Total number of users actively generating yield',
          },
          {
            metric_name: 'Total MXI in Vesting',
            metric_value: viewData.total_mxi_generating_yield || 0,
            metric_unit: 'MXI',
            metric_description: 'Total MXI tokens generating yield',
          },
          {
            metric_name: 'Total Accumulated Yield',
            metric_value: viewData.total_accumulated_yield || 0,
            metric_unit: 'MXI',
            metric_description: 'Total yield accumulated by all users',
          },
          {
            metric_name: 'Current Session Yield',
            metric_value: viewData.current_session_yield || 0,
            metric_unit: 'MXI',
            metric_description: 'Yield generated in current session',
          },
          {
            metric_name: 'Total Yield All Time',
            metric_value: viewData.total_yield_all_time || 0,
            metric_unit: 'MXI',
            metric_description: 'Total yield generated since launch',
          },
          {
            metric_name: 'Total Yield Rate (Per Minute)',
            metric_value: viewData.total_yield_rate_per_minute || 0,
            metric_unit: 'MXI/min',
            metric_description: 'Combined yield rate per minute for all users',
          },
          {
            metric_name: 'Total Yield Rate (Per Hour)',
            metric_value: viewData.total_yield_rate_per_hour || 0,
            metric_unit: 'MXI/hr',
            metric_description: 'Combined yield rate per hour for all users',
          },
          {
            metric_name: 'Total Yield Rate (Per Day)',
            metric_value: viewData.total_yield_rate_per_day || 0,
            metric_unit: 'MXI/day',
            metric_description: 'Combined yield rate per day for all users',
          },
          {
            metric_name: 'Average Yield Rate',
            metric_value: viewData.avg_yield_rate_per_minute || 0,
            metric_unit: 'MXI/min',
            metric_description: 'Average yield rate per user per minute',
          },
        ];

        setMetrics(metricsData);
      }

      // Fetch individual user details if admin
      if (isAdmin) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, mxi_purchased_directly, mxi_from_unified_commissions, accumulated_yield, yield_rate_per_minute, last_yield_update, active_referrals, is_active_contributor')
          .gt('yield_rate_per_minute', 0)
          .order('yield_rate_per_minute', { ascending: false });

        if (usersError) {
          console.error('Error fetching user details:', usersError);
          throw usersError;
        }

        console.log(`Loaded ${usersData?.length || 0} vesting users`);

        // Transform user data
        const usersDetails: VestingUserDetail[] = (usersData || []).map((user) => {
          const mxiInVesting = parseFloat(user.mxi_purchased_directly || '0') + parseFloat(user.mxi_from_unified_commissions || '0');
          const yieldRatePerMinute = parseFloat(user.yield_rate_per_minute || '0');
          const accumulatedYield = parseFloat(user.accumulated_yield || '0');
          
          // Calculate current session yield
          const lastUpdate = new Date(user.last_yield_update);
          const now = new Date();
          const minutesElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
          const currentSessionYield = yieldRatePerMinute * minutesElapsed;
          
          return {
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            mxi_in_vesting: mxiInVesting,
            accumulated_yield: accumulatedYield,
            current_session_yield: currentSessionYield,
            total_yield: accumulatedYield + currentSessionYield,
            yield_rate_per_minute: yieldRatePerMinute,
            yield_rate_per_hour: yieldRatePerMinute * 60,
            yield_rate_per_day: yieldRatePerMinute * 60 * 24,
            last_yield_update: user.last_yield_update,
            active_referrals: user.active_referrals || 0,
            can_unify: user.active_referrals >= 5,
            is_active_contributor: user.is_active_contributor || false,
          };
        });

        setUsers(usersDetails);
      }

      console.log('Vesting data loaded successfully');
    } catch (err: any) {
      console.error('Error loading vesting data:', err);
      setError(err.message || 'Failed to load vesting data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVestingData(true);
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  const getMetricIcon = (metricName: string): string => {
    if (metricName.includes('Users')) return 'people';
    if (metricName.includes('MXI')) return 'currency_bitcoin';
    if (metricName.includes('Yield')) return 'trending_up';
    if (metricName.includes('Rate')) return 'speed';
    return 'analytics';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando análisis de vesting...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="error"
          size={48}
          color={colors.error}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => loadVestingData()}
          style={{ marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>ACTUALIZANDO EN TIEMPO REAL</Text>
      </View>

      {/* Global Metrics */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          📊 Métricas Globales de Vesting
        </Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <IconSymbol
                  ios_icon_name="chart.bar.fill"
                  android_material_icon_name={getMetricIcon(metric.metric_name)}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.metricName}>{metric.metric_name}</Text>
              </View>
              <Text style={styles.metricValue}>
                {formatNumber(metric.metric_value, metric.metric_unit.includes('MXI') ? 4 : 0)}
              </Text>
              <Text style={styles.metricUnit}>{metric.metric_unit}</Text>
              <Text style={styles.metricDescription}>{metric.metric_description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* User Details (Admin Only) */}
      {isAdmin && users.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            👥 Detalles de Usuarios ({users.length})
          </Text>
          <View style={styles.usersList}>
            {users.map((user) => (
              <View key={user.user_id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userHeader}
                  onPress={() => toggleUserExpanded(user.user_id)}
                >
                  <View style={styles.userInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.userName}>{user.user_name}</Text>
                      {!user.is_active_contributor && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                          <Text style={[styles.statusText, { color: colors.warning }]}>
                            Inactivo
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail}>{user.user_email}</Text>
                  </View>
                  <View style={styles.expandButton}>
                    <IconSymbol
                      ios_icon_name={expandedUsers.has(user.user_id) ? 'chevron.up' : 'chevron.down'}
                      android_material_icon_name={expandedUsers.has(user.user_id) ? 'expand_less' : 'expand_more'}
                      size={24}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {expandedUsers.has(user.user_id) && (
                  <View style={styles.userDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>MXI en Vesting:</Text>
                      <Text style={styles.detailValue}>{formatNumber(user.mxi_in_vesting, 4)} MXI</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Yield Acumulado:</Text>
                      <Text style={styles.detailValue}>{formatNumber(user.accumulated_yield, 4)} MXI</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Yield Sesión Actual:</Text>
                      <Text style={styles.detailValue}>{formatNumber(user.current_session_yield, 4)} MXI</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Yield Total:</Text>
                      <Text style={styles.detailValue}>{formatNumber(user.total_yield, 4)} MXI</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tasa (por minuto):</Text>
                      <Text style={styles.detailValue}>{user.yield_rate_per_minute.toFixed(6)} MXI/min</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tasa (por hora):</Text>
                      <Text style={styles.detailValue}>{user.yield_rate_per_hour.toFixed(4)} MXI/hr</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tasa (por día):</Text>
                      <Text style={styles.detailValue}>{user.yield_rate_per_day.toFixed(2)} MXI/day</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Referidos Activos:</Text>
                      <Text style={styles.detailValue}>{user.active_referrals}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Puede Unificar:</Text>
                      <Text style={[styles.detailValue, { color: user.can_unify ? colors.success : colors.error }]}>
                        {user.can_unify ? 'Sí' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Estado Contribuidor:</Text>
                      <Text style={[styles.detailValue, { color: user.is_active_contributor ? colors.success : colors.warning }]}>
                        {user.is_active_contributor ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {isAdmin && users.length === 0 && (
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="person.crop.circle.badge.xmark"
            android_material_icon_name="person_off"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            No hay usuarios con vesting activo en este momento
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
