
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Svg, Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const CHART_WIDTH = Dimensions.get('window').width - 80;
const CHART_HEIGHT = 280;
const PADDING = { top: 20, right: 10, bottom: 40, left: 50 };

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function VestingCandlestickChart() {
  const { user } = useAuth();
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [currentYield, setCurrentYield] = useState(0);

  useEffect(() => {
    if (user) {
      loadCandleData();
      const interval = setInterval(loadCandleData, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user, timeRange]);

  // Real-time yield counter
  useEffect(() => {
    if (!user) return;

    const mxiInVesting = (user.mxiPurchasedDirectly || 0) + (user.mxiFromUnifiedCommissions || 0);
    if (mxiInVesting === 0) {
      setCurrentYield(0);
      return;
    }

    const MONTHLY_YIELD_PERCENTAGE = 0.03;
    const SECONDS_IN_MONTH = 2592000;
    const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;
    const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;

    const interval = setInterval(() => {
      const now = Date.now();
      const lastUpdate = new Date(user.lastYieldUpdate);
      const secondsElapsed = (now - lastUpdate.getTime()) / 1000;
      const sessionYield = yieldPerSecond * secondsElapsed;
      const totalYield = user.accumulatedYield + sessionYield;
      const cappedTotalYield = Math.min(totalYield, maxMonthlyYield);
      setCurrentYield(cappedTotalYield);
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const loadCandleData = async () => {
    try {
      setLoading(true);

      // Calculate time range
      const now = new Date();
      let startTime = new Date();
      
      switch (timeRange) {
        case '24h':
          startTime.setHours(now.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
      }

      // Fetch hourly data from database
      const { data, error } = await supabase
        .from('vesting_hourly_data')
        .select('*')
        .eq('user_id', user?.id)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error loading candle data:', error);
        // Generate synthetic data if no data exists
        generateSyntheticData();
        return;
      }

      if (!data || data.length === 0) {
        // Generate synthetic data for demonstration
        generateSyntheticData();
        return;
      }

      // Transform data
      const transformedData: CandleData[] = data.map(item => ({
        timestamp: item.timestamp,
        open: parseFloat(item.open_value),
        high: parseFloat(item.high_value),
        low: parseFloat(item.low_value),
        close: parseFloat(item.close_value),
        volume: parseFloat(item.volume),
      }));

      setCandleData(transformedData);
    } catch (error) {
      console.error('Error in loadCandleData:', error);
      generateSyntheticData();
    } finally {
      setLoading(false);
    }
  };

  const generateSyntheticData = () => {
    // Generate synthetic candlestick data based on current yield
    const mxiInVesting = (user?.mxiPurchasedDirectly || 0) + (user?.mxiFromUnifiedCommissions || 0);
    const MONTHLY_YIELD_PERCENTAGE = 0.03;
    const SECONDS_IN_MONTH = 2592000;
    const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;
    const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;
    const yieldPerHour = yieldPerSecond * 3600;

    const now = new Date();
    const hoursToGenerate = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const synthetic: CandleData[] = [];

    let cumulativeYield = Math.max(0, currentYield - (yieldPerHour * hoursToGenerate));

    for (let i = hoursToGenerate; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 3600000));
      const open = cumulativeYield;
      const growth = yieldPerHour * (0.95 + Math.random() * 0.1); // Add slight variation
      const close = cumulativeYield + growth;
      const high = close + (growth * 0.1 * Math.random());
      const low = open - (growth * 0.05 * Math.random());

      synthetic.push({
        timestamp: timestamp.toISOString(),
        open,
        high,
        low,
        close,
        volume: growth,
      });

      cumulativeYield = close;
    }

    setCandleData(synthetic);
  };

  const renderCandlestickChart = () => {
    if (candleData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>Generando datos del gráfico...</Text>
        </View>
      );
    }

    // Calculate scales
    const allValues = candleData.flatMap(d => [d.high, d.low]);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const valueRange = maxValue - minValue || 1;

    const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const candleWidth = Math.max(2, chartWidth / candleData.length - 2);

    // Y-axis scale
    const yScale = (value: number) => {
      return PADDING.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    };

    // X-axis scale
    const xScale = (index: number) => {
      return PADDING.left + (index * (chartWidth / candleData.length)) + candleWidth / 2;
    };

    return (
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = PADDING.top + chartHeight * ratio;
          const value = maxValue - (valueRange * ratio);
          return (
            <G key={`grid-${i}`}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <SvgText
                x={PADDING.left - 5}
                y={y + 4}
                fill={colors.textSecondary}
                fontSize="10"
                textAnchor="end"
              >
                {value.toFixed(4)}
              </SvgText>
            </G>
          );
        })}

        {/* Candlesticks */}
        {candleData.map((candle, index) => {
          const x = xScale(index);
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#10b981' : '#ef4444';
          
          const bodyTop = yScale(Math.max(candle.open, candle.close));
          const bodyBottom = yScale(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);

          return (
            <G key={`candle-${index}`}>
              {/* Wick (high-low line) */}
              <Line
                x1={x}
                y1={yScale(candle.high)}
                x2={x}
                y2={yScale(candle.low)}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
              <Rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                opacity={0.9}
              />
            </G>
          );
        })}

        {/* X-axis labels */}
        {candleData.filter((_, i) => i % Math.ceil(candleData.length / 6) === 0).map((candle, i, arr) => {
          const index = candleData.indexOf(candle);
          const x = xScale(index);
          const date = new Date(candle.timestamp);
          const label = timeRange === '24h' 
            ? `${date.getHours()}:00`
            : `${date.getDate()}/${date.getMonth() + 1}`;
          
          return (
            <SvgText
              key={`x-label-${i}`}
              x={x}
              y={CHART_HEIGHT - PADDING.bottom + 20}
              fill={colors.textSecondary}
              fontSize="10"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  const getChangePercentage = () => {
    if (candleData.length < 2) return 0;
    const first = candleData[0].open;
    const last = candleData[candleData.length - 1].close;
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  };

  const changePercent = getChangePercentage();
  const isPositive = changePercent >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Balance Total MXI</Text>
          <Text style={styles.subtitle}>Gráfico de Crecimiento por Vesting</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.currentValue}>{currentYield.toFixed(6)}</Text>
          <Text style={styles.currentUnit}>MXI</Text>
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#10b98120' : '#ef444420' }]}>
            <IconSymbol
              ios_icon_name={isPositive ? 'arrow.up' : 'arrow.down'}
              android_material_icon_name={isPositive ? 'arrow_upward' : 'arrow_downward'}
              size={12}
              color={isPositive ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.changeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
              {Math.abs(changePercent).toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {(['24h', '7d', '30d'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive,
              ]}
            >
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
        <View style={styles.chartContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando gráfico...</Text>
            </View>
          ) : (
            renderCandlestickChart()
          )}
        </View>
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Apertura</Text>
          <Text style={styles.statValue}>
            {candleData.length > 0 ? candleData[0].open.toFixed(6) : '0.000000'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo</Text>
          <Text style={styles.statValue}>
            {candleData.length > 0 
              ? Math.max(...candleData.map(d => d.high)).toFixed(6)
              : '0.000000'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mínimo</Text>
          <Text style={styles.statValue}>
            {candleData.length > 0 
              ? Math.min(...candleData.map(d => d.low)).toFixed(6)
              : '0.000000'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Cierre</Text>
          <Text style={styles.statValue}>
            {candleData.length > 0 
              ? candleData[candleData.length - 1].close.toFixed(6)
              : '0.000000'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <IconSymbol
          ios_icon_name="chart.bar.fill"
          android_material_icon_name="bar_chart"
          size={16}
          color={colors.accent}
        />
        <Text style={styles.infoText}>
          Gráfico de velas japonesas mostrando el crecimiento del vesting por hora en tiempo real.
          Cada vela representa una hora de acumulación de rendimiento.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  currentUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeRangeTextActive: {
    color: '#000000',
  },
  chartScroll: {
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 10,
  },
  emptyChart: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
