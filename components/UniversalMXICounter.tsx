
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

const MONTHLY_YIELD_PERCENTAGE = 0.03; // 3% monthly
const SECONDS_IN_MONTH = 2592000; // 30 days * 24 hours * 60 minutes * 60 seconds

interface UniversalMXICounterProps {
  isAdmin?: boolean;
}

export function UniversalMXICounter({ isAdmin = false }: UniversalMXICounterProps) {
  const { user } = useAuth();
  const [displayYield, setDisplayYield] = useState(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Update display every second for smooth animation
    const displayInterval = setInterval(() => {
      setDisplayYield(prev => {
        // ONLY purchased MXI generates vesting (commissions do NOT count)
        const mxiInVesting = user.mxiPurchasedDirectly || 0;
        
        if (mxiInVesting === 0) {
          return 0;
        }

        // Calculate yield per second based on 3% monthly
        const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;
        const yieldPerSecond = maxMonthlyYield / SECONDS_IN_MONTH;

        // Calculate time elapsed since last update
        const lastUpdate = new Date(user.lastYieldUpdate);
        const now = Date.now();
        const secondsElapsed = (now - lastUpdate.getTime()) / 1000;

        // Calculate current session yield
        const sessionYield = yieldPerSecond * secondsElapsed;

        // Cap at 3% monthly maximum
        const totalYield = user.accumulatedYield + sessionYield;
        const cappedTotalYield = Math.min(totalYield, maxMonthlyYield);

        return cappedTotalYield;
      });
    }, 1000); // Update every second

    return () => clearInterval(displayInterval);
  }, [user]);

  if (!user) {
    return null;
  }

  // Calculate vesting amounts - ONLY purchased MXI generates vesting
  const mxiPurchased = user.mxiPurchasedDirectly || 0;
  const mxiInVesting = mxiPurchased; // ONLY purchased MXI
  const maxMonthlyYield = mxiInVesting * MONTHLY_YIELD_PERCENTAGE;
  const yieldPerSecond = mxiInVesting > 0 ? maxMonthlyYield / SECONDS_IN_MONTH : 0;
  const hasBalance = mxiInVesting > 0;

  // Calculate progress towards monthly cap
  const progressPercentage = maxMonthlyYield > 0 ? (displayYield / maxMonthlyYield) * 100 : 0;

  // Calculate session yield (current accumulation since last update)
  const sessionYield = Math.max(0, displayYield - user.accumulatedYield);

  // Format small numbers with better readability
  const formatSmallNumber = (num: number) => {
    if (num === 0) return '0.00000000';
    
    // Convert to string with full precision
    const str = num.toFixed(10);
    
    // Find first non-zero digit after decimal
    const parts = str.split('.');
    if (parts.length === 2) {
      const decimals = parts[1];
      let firstNonZero = -1;
      for (let i = 0; i < decimals.length; i++) {
        if (decimals[i] !== '0') {
          firstNonZero = i;
          break;
        }
      }
      
      // Show at least 8 significant digits after first non-zero
      if (firstNonZero >= 0) {
        const significantDigits = 8;
        const endIndex = Math.min(firstNonZero + significantDigits, decimals.length);
        return parts[0] + '.' + decimals.substring(0, endIndex);
      }
    }
    
    return num.toFixed(8);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol 
            ios_icon_name="lock.fill" 
            android_material_icon_name="lock" 
            size={28} 
            color={colors.accent} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {isAdmin ? 'Vesting del Administrador' : '🔒 Vesting MXI (Minería Activa)'}
          </Text>
          <Text style={styles.subtitle}>Solo MXI comprados directamente</Text>
        </View>
      </View>

      {/* Warning Box */}
      <View style={styles.warningBox}>
        <IconSymbol 
          ios_icon_name="exclamationmark.triangle.fill" 
          android_material_icon_name="warning" 
          size={20} 
          color="#FFD700" 
        />
        <Text style={styles.warningText}>
          El vesting se calcula ÚNICAMENTE sobre los MXI comprados directamente. 
          Las comisiones NO generan vesting.
        </Text>
      </View>

      {/* MXI Purchased (Base for Vesting) */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>MXI Comprados (Base de Vesting)</Text>
            <Text style={styles.balanceValue}>{mxiPurchased.toFixed(2)} MXI</Text>
          </View>
        </View>
      </View>

      {/* Vesting Counter */}
      {hasBalance && (
        <View style={styles.vestingSection}>
          <View style={styles.vestingHeader}>
            <Text style={styles.vestingTitle}>Rendimiento Acumulado</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          </View>
          
          <View style={styles.vestingDisplay}>
            <Text style={styles.vestingValue}>{displayYield.toFixed(8)}</Text>
            <Text style={styles.vestingUnit}>MXI</Text>
          </View>

          <View style={styles.vestingBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Sesión Actual</Text>
              <Text style={styles.breakdownValue}>+{sessionYield.toFixed(8)} MXI</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Acumulado Previo</Text>
              <Text style={styles.breakdownValue}>{user.accumulatedYield.toFixed(8)} MXI</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso Mensual (3% máx.)</Text>
              <Text style={styles.progressPercentage}>{progressPercentage.toFixed(2)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${Math.min(progressPercentage, 100)}%` }]} />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressText}>{displayYield.toFixed(4)} MXI</Text>
              <Text style={styles.progressText}>{maxMonthlyYield.toFixed(4)} MXI</Text>
            </View>
          </View>

          {/* Rate Information - Improved formatting */}
          <View style={styles.rateSection}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Por Segundo</Text>
              <Text style={styles.rateValue}>{formatSmallNumber(yieldPerSecond)}</Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Por Minuto</Text>
              <Text style={styles.rateValue}>{formatSmallNumber(yieldPerSecond * 60)}</Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Por Hora</Text>
              <Text style={styles.rateValue}>{formatSmallNumber(yieldPerSecond * 3600)}</Text>
            </View>
          </View>
        </View>
      )}

      {!hasBalance && (
        <View style={styles.emptyState}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle" 
            android_material_icon_name="warning" 
            size={32} 
            color={colors.textSecondary} 
          />
          <Text style={styles.emptyText}>
            No hay MXI en vesting. Solo los MXI comprados directamente generan rendimiento de vesting.
          </Text>
        </View>
      )}

      {/* Info Note - UPDATED TEXT */}
      <View style={styles.infoBox}>
        <IconSymbol 
          ios_icon_name="info.circle.fill" 
          android_material_icon_name="info" 
          size={16} 
          color={colors.accent} 
        />
        <Text style={styles.infoText}>
          ℹ️ Tasa de minería: 0.005% por hora de tu MXI comprado. Solo el MXI comprado directamente genera rendimiento de vesting. Las comisiones NO generan vesting. Para reclamar tu MXI minado, necesitas 5 referidos activos, 10 días de membresía y aprobación KYC. Recordar que para vesting se deben tener 10 referidos activos y se desbloqueará una vez se lance el token y se liste en los exchanges.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.accent,
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
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#FFD700',
    lineHeight: 18,
    fontWeight: '600',
  },
  balanceSection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceRow: {
    flexDirection: 'row',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  vestingSection: {
    backgroundColor: `${colors.accent}15`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  vestingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vestingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '700',
  },
  vestingDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  vestingValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  vestingUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vestingBreakdown: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  rateSection: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  rateLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  rateValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
