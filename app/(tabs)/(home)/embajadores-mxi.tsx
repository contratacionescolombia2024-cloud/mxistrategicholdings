
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

// Ambassador level definitions
const AMBASSADOR_LEVELS = [
  { level: 1, name: 'Bronce', requirement: 300, bonus: 10, emoji: '🥉' },
  { level: 2, name: 'Plata', requirement: 1000, bonus: 30, emoji: '🥈' },
  { level: 3, name: 'Oro', requirement: 2500, bonus: 100, emoji: '🥇' },
  { level: 4, name: 'Diamante', requirement: 10000, bonus: 600, emoji: '💎' },
  { level: 5, name: 'Élite Global', requirement: 25000, bonus: 2000, emoji: '🟪' },
  { level: 6, name: 'Embajador Legendario MXI', requirement: 50000, bonus: 5000, emoji: '🟦' },
];

interface AmbassadorData {
  total_valid_purchases: number;
  current_level: number;
  level_1_bonus_withdrawn: boolean;
  level_2_bonus_withdrawn: boolean;
  level_3_bonus_withdrawn: boolean;
  level_4_bonus_withdrawn: boolean;
  level_5_bonus_withdrawn: boolean;
  level_6_bonus_withdrawn: boolean;
  total_bonus_withdrawn: number;
}

export default function EmbajadoresMXIScreen() {
  const { user, refreshUser } = useAuth();
  const { lastUpdate } = useRealtime();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
  const [usdtAddress, setUsdtAddress] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const lastUpdateRef = useRef<Date | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reload data when real-time update occurs
  useEffect(() => {
    if (lastUpdate && lastUpdate !== lastUpdateRef.current) {
      console.log('[Embajadores MXI] Real-time update detected, reloading ambassador data');
      lastUpdateRef.current = lastUpdate;
      loadAmbassadorData();
    }
  }, [lastUpdate]);

  useEffect(() => {
    console.log('[Embajadores MXI] Component mounted, user:', user?.id);
    
    // Set a timeout to prevent infinite loading (increased to 15 seconds)
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('[Embajadores MXI] Loading timeout reached, forcing loading to false');
      if (loading) {
        setLoading(false);
        Alert.alert(
          'Error de Carga',
          'La página tardó demasiado en cargar. Por favor, intenta de nuevo.',
          [
            {
              text: 'Reintentar',
              onPress: () => loadAmbassadorData(),
            },
            {
              text: 'Volver',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      }
    }, 15000); // 15 second timeout (increased from 10)

    loadAmbassadorData();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user]);

  const loadAmbassadorData = async (retryCount = 0) => {
    if (!user) {
      console.log('[Embajadores MXI] No user found, skipping load');
      setLoading(false);
      return;
    }

    try {
      console.log('[Embajadores MXI] Starting to load ambassador data for user:', user.id, 'retry:', retryCount);
      setLoading(true);

      // Call the function to update and get ambassador level with a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 12000)
      );
      
      const rpcPromise = supabase.rpc('update_ambassador_level', {
        p_user_id: user.id
      });

      const { data, error } = await Promise.race([
        rpcPromise,
        timeoutPromise
      ]) as any;

      console.log('[Embajadores MXI] RPC response:', { data, error });

      if (error) {
        console.error('[Embajadores MXI] Error loading ambassador data:', error);
        
        // Retry once if it's a timeout or network error
        if (retryCount < 1 && (error.message?.includes('timeout') || error.message?.includes('network'))) {
          console.log('[Embajadores MXI] Retrying due to timeout/network error...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return loadAmbassadorData(retryCount + 1);
        }
        
        Alert.alert('Error', 'No se pudo cargar la información de embajador: ' + error.message);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('[Embajadores MXI] Ambassador data loaded successfully:', data);
        setAmbassadorData(data as AmbassadorData);
        setLastDataUpdate(new Date());
      } else {
        console.warn('[Embajadores MXI] No data returned from RPC');
        Alert.alert('Error', 'No se recibieron datos del servidor');
      }
      
      // Also refresh user data to get updated active_referrals
      if (refreshUser) {
        console.log('[Embajadores MXI] Refreshing user data');
        await refreshUser();
      }
    } catch (error: any) {
      console.error('[Embajadores MXI] Exception loading ambassador data:', error);
      
      // Retry once on exception
      if (retryCount < 1) {
        console.log('[Embajadores MXI] Retrying due to exception...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return loadAmbassadorData(retryCount + 1);
      }
      
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
    } finally {
      console.log('[Embajadores MXI] Finished loading, setting loading to false');
      setLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }
  };

  const handleManualRefresh = async () => {
    console.log('[Embajadores MXI] Manual refresh triggered');
    setRefreshing(true);
    try {
      await loadAmbassadorData();
      Alert.alert('Actualizado', 'Los datos se han actualizado correctamente');
    } catch (error) {
      console.error('[Embajadores MXI] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateWithdrawableBonus = (): number => {
    if (!ambassadorData) return 0;

    let total = 0;
    const withdrawn = {
      level_1: ambassadorData.level_1_bonus_withdrawn,
      level_2: ambassadorData.level_2_bonus_withdrawn,
      level_3: ambassadorData.level_3_bonus_withdrawn,
      level_4: ambassadorData.level_4_bonus_withdrawn,
      level_5: ambassadorData.level_5_bonus_withdrawn,
      level_6: ambassadorData.level_6_bonus_withdrawn,
    };

    AMBASSADOR_LEVELS.forEach((level) => {
      if (ambassadorData.current_level >= level.level) {
        const key = `level_${level.level}` as keyof typeof withdrawn;
        if (!withdrawn[key]) {
          total += level.bonus;
        }
      }
    });

    return total;
  };

  const handleWithdrawBonus = async () => {
    if (!user || !ambassadorData) return;

    // Validate USDT address
    if (!usdtAddress || usdtAddress.trim().length === 0) {
      Alert.alert('Dirección Requerida', 'Por favor ingresa tu dirección USDT TRC20');
      return;
    }

    // Check if address looks like a valid TRC20 address (starts with T and is 34 characters)
    if (!usdtAddress.startsWith('T') || usdtAddress.length !== 34) {
      Alert.alert(
        'Dirección Inválida',
        'Por favor ingresa una dirección USDT TRC20 válida (debe comenzar con T y tener 34 caracteres)'
      );
      return;
    }

    const withdrawableBonus = calculateWithdrawableBonus();

    if (withdrawableBonus <= 0) {
      Alert.alert('Sin Bonos Disponibles', 'No tienes bonos disponibles para retirar');
      return;
    }

    // Confirm withdrawal
    Alert.alert(
      'Confirmar Retiro de Bono',
      `¿Deseas retirar ${withdrawableBonus} USDT de bonos de embajador?\n\nDirección TRC20: ${usdtAddress}\n\nUn administrador procesará tu retiro en 24-48 horas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setWithdrawing(true);
            try {
              const { data, error } = await supabase.rpc('request_ambassador_bonus_withdrawal', {
                p_user_id: user.id,
                p_usdt_address: usdtAddress.trim()
              });

              if (error) {
                console.error('[Embajadores MXI] Withdrawal error:', error);
                Alert.alert('Error', error.message || 'No se pudo procesar el retiro');
                return;
              }

              if (!data || !data.success) {
                Alert.alert('Error', data?.error || 'No se pudo procesar el retiro');
                return;
              }

              Alert.alert(
                'Solicitud Enviada',
                `¡Solicitud de retiro de ${withdrawableBonus} USDT enviada exitosamente!\n\nUn administrador procesará tu retiro en 24-48 horas.`
              );

              setShowWithdrawModal(false);
              setUsdtAddress('');
              await loadAmbassadorData();
            } catch (error: any) {
              console.error('[Embajadores MXI] Exception during withdrawal:', error);
              Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
            } finally {
              setWithdrawing(false);
            }
          }
        }
      ]
    );
  };

  const getCurrentLevelInfo = () => {
    if (!ambassadorData) return null;
    return AMBASSADOR_LEVELS.find(l => l.level === ambassadorData.current_level);
  };

  const getNextLevelInfo = () => {
    if (!ambassadorData) return null;
    return AMBASSADOR_LEVELS.find(l => l.level === ambassadorData.current_level + 1);
  };

  const canWithdraw = (): boolean => {
    if (!user || !ambassadorData) return false;

    // Check KYC
    if (user.kycStatus !== 'approved') return false;

    // Check personal purchase
    if (!user.mxiPurchasedDirectly || user.mxiPurchasedDirectly <= 0) return false;

    // Check if there are bonuses to withdraw
    return calculateWithdrawableBonus() > 0;
  };

  const getWithdrawBlockReason = (): string | null => {
    if (!user || !ambassadorData) return null;

    if (ambassadorData.current_level === 0) {
      return 'Debes alcanzar al menos el Nivel 1 (Bronce) para retirar bonos';
    }

    if (user.kycStatus !== 'approved') {
      return 'Debes completar tu verificación KYC para retirar bonos';
    }

    if (!user.mxiPurchasedDirectly || user.mxiPurchasedDirectly <= 0) {
      return 'Debes realizar al menos una compra personal para habilitar retiros';
    }

    if (calculateWithdrawableBonus() <= 0) {
      return 'No tienes bonos disponibles para retirar';
    }

    return null;
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Embajadores MXI</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no data
  if (!ambassadorData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Embajadores MXI</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle.fill" 
            android_material_icon_name="warning" 
            size={64} 
            color={colors.error} 
          />
          <Text style={styles.errorText}>No se pudo cargar la información</Text>
          <Text style={styles.errorSubtext}>Por favor, intenta de nuevo</Text>
          <TouchableOpacity style={[buttonStyles.primary, { marginTop: 20 }]} onPress={loadAmbassadorData}>
            <Text style={buttonStyles.primaryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentLevel = getCurrentLevelInfo();
  const nextLevel = getNextLevelInfo();
  const withdrawableBonus = calculateWithdrawableBonus();
  const progressToNext = nextLevel 
    ? (ambassadorData.total_valid_purchases / nextLevel.requirement) * 100 
    : 100;
  const withdrawBlockReason = getWithdrawBlockReason();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Embajadores MXI</Text>
          {lastDataUpdate && (
            <Text style={styles.lastUpdateText}>
              Actualizado: {lastDataUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Level Card */}
        <View style={[commonStyles.card, styles.levelCard]}>
          <Text style={styles.cardTitle}>Tu Nivel Actual</Text>
          {currentLevel ? (
            <>
              <View style={styles.levelBadge}>
                <Text style={styles.levelEmoji}>{currentLevel.emoji}</Text>
                <Text style={styles.levelName}>{currentLevel.name}</Text>
              </View>
              <Text style={styles.levelRequirement}>
                Requisito: {currentLevel.requirement.toLocaleString('es-ES')} USDT
              </Text>
            </>
          ) : (
            <View style={styles.noLevelContainer}>
              <Text style={styles.noLevelText}>Aún no has alcanzado ningún nivel</Text>
              <Text style={styles.noLevelSubtext}>
                Necesitas {AMBASSADOR_LEVELS[0].requirement} USDT en compras válidas de referidos de Nivel 1
              </Text>
            </View>
          )}
        </View>

        {/* Valid Purchases Card */}
        <View style={commonStyles.card}>
          <Text style={styles.cardTitle}>Compras Válidas Acumuladas</Text>
          <Text style={styles.purchasesAmount}>
            {ambassadorData.total_valid_purchases.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} USDT
          </Text>
          <Text style={styles.purchasesSubtext}>
            De referidos directos (Nivel 1)
          </Text>

          {/* Progress to Next Level */}
          {nextLevel && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progreso al Siguiente Nivel</Text>
                <Text style={styles.progressPercentage}>{Math.min(progressToNext, 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressText}>
                  {ambassadorData.total_valid_purchases.toLocaleString('es-ES')} USDT
                </Text>
                <Text style={styles.progressText}>
                  {nextLevel.requirement.toLocaleString('es-ES')} USDT
                </Text>
              </View>
              <View style={styles.nextLevelInfo}>
                <Text style={styles.nextLevelEmoji}>{nextLevel.emoji}</Text>
                <Text style={styles.nextLevelName}>{nextLevel.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Withdrawable Bonus Card - ALWAYS VISIBLE */}
        <View style={[commonStyles.card, styles.bonusCard]}>
          <Text style={styles.cardTitle}>Bono Retirable</Text>
          <Text style={styles.bonusAmount}>
            {withdrawableBonus.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} USDT
          </Text>
          <Text style={styles.bonusSubtext}>
            Bonos acumulativos disponibles
          </Text>

          {/* Show warning if cannot withdraw */}
          {withdrawBlockReason && (
            <View style={styles.warningBox}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle.fill" 
                android_material_icon_name="warning" 
                size={20} 
                color={colors.warning} 
              />
              <Text style={styles.warningText}>
                {withdrawBlockReason}
              </Text>
            </View>
          )}

          {/* Withdrawal Button - ALWAYS SHOW when there are bonuses */}
          {withdrawableBonus > 0 && (
            <>
              {!showWithdrawModal ? (
                <TouchableOpacity
                  style={[
                    buttonStyles.primary, 
                    styles.withdrawButton,
                    !canWithdraw() && styles.withdrawButtonDisabled
                  ]}
                  onPress={() => {
                    if (canWithdraw()) {
                      setShowWithdrawModal(true);
                    } else {
                      Alert.alert('Requisitos No Cumplidos', withdrawBlockReason || 'No puedes retirar en este momento');
                    }
                  }}
                >
                  <IconSymbol 
                    ios_icon_name="arrow.down.circle.fill" 
                    android_material_icon_name="arrow_circle_down" 
                    size={20} 
                    color={canWithdraw() ? "#000" : colors.textSecondary} 
                  />
                  <Text style={[
                    buttonStyles.primaryText,
                    !canWithdraw() && styles.withdrawButtonTextDisabled
                  ]}>
                    Solicitar Retiro de Bono
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.withdrawForm}>
                  <Text style={styles.withdrawFormTitle}>Dirección USDT TRC20</Text>
                  <TextInput
                    style={styles.input}
                    value={usdtAddress}
                    onChangeText={setUsdtAddress}
                    placeholder="Ingresa tu dirección TRC20"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHint}>
                    Solo se permiten retiros en USDT TRC20
                  </Text>

                  <View style={styles.withdrawActions}>
                    <TouchableOpacity
                      style={[buttonStyles.secondary, styles.actionButton]}
                      onPress={() => {
                        setShowWithdrawModal(false);
                        setUsdtAddress('');
                      }}
                      disabled={withdrawing}
                    >
                      <Text style={buttonStyles.secondaryText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[buttonStyles.primary, styles.actionButton]}
                      onPress={handleWithdrawBonus}
                      disabled={withdrawing}
                    >
                      {withdrawing ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text style={buttonStyles.primaryText}>Confirmar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* All Levels Card */}
        <View style={commonStyles.card}>
          <Text style={styles.cardTitle}>Todos los Niveles</Text>
          {AMBASSADOR_LEVELS.map((level) => {
            const isAchieved = ambassadorData.current_level >= level.level;
            const key = `level_${level.level}_bonus_withdrawn` as keyof AmbassadorData;
            const isWithdrawn = ambassadorData[key] as boolean;

            return (
              <View key={level.level} style={styles.levelItem}>
                <View style={styles.levelItemHeader}>
                  <View style={styles.levelItemLeft}>
                    <Text style={styles.levelItemEmoji}>{level.emoji}</Text>
                    <View style={styles.levelItemInfo}>
                      <Text style={[styles.levelItemName, !isAchieved && styles.levelItemNameInactive]}>
                        {level.name}
                      </Text>
                      <Text style={styles.levelItemRequirement}>
                        {level.requirement.toLocaleString('es-ES')} USDT
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Bonus and Status Row - Separate from header for better spacing */}
                <View style={styles.levelItemFooter}>
                  <Text style={[styles.levelItemBonus, !isAchieved && styles.levelItemBonusInactive]}>
                    +{level.bonus.toLocaleString('es-ES')} USDT
                  </Text>
                  {isAchieved && (
                    <View style={styles.levelItemStatus}>
                      <IconSymbol 
                        ios_icon_name={isWithdrawn ? "checkmark.circle.fill" : "circle"} 
                        android_material_icon_name={isWithdrawn ? "check_circle" : "radio_button_unchecked"} 
                        size={20} 
                        color={isWithdrawn ? colors.success : colors.primary} 
                      />
                      <Text style={[styles.levelItemStatusText, { color: isWithdrawn ? colors.success : colors.primary }]}>
                        {isWithdrawn ? 'Retirado' : 'Disponible'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Withdrawal Requirements Card */}
        <View style={[commonStyles.card, styles.requirementsCard]}>
          <Text style={styles.cardTitle}>Requisitos para Retirar</Text>
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <IconSymbol 
                ios_icon_name={ambassadorData.current_level > 0 ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                android_material_icon_name={ambassadorData.current_level > 0 ? "check_circle" : "cancel"} 
                size={20} 
                color={ambassadorData.current_level > 0 ? colors.success : colors.error} 
              />
              <Text style={styles.requirementText}>
                Tener el nivel alcanzado completamente
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <IconSymbol 
                ios_icon_name={user?.kycStatus === 'approved' ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                android_material_icon_name={user?.kycStatus === 'approved' ? "check_circle" : "cancel"} 
                size={20} 
                color={user?.kycStatus === 'approved' ? colors.success : colors.error} 
              />
              <Text style={styles.requirementText}>
                Debe tener KYC aprobado
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <IconSymbol 
                ios_icon_name={user?.mxiPurchasedDirectly && user.mxiPurchasedDirectly > 0 ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                android_material_icon_name={user?.mxiPurchasedDirectly && user.mxiPurchasedDirectly > 0 ? "check_circle" : "cancel"} 
                size={20} 
                color={user?.mxiPurchasedDirectly && user.mxiPurchasedDirectly > 0 ? colors.success : colors.error} 
              />
              <Text style={styles.requirementText}>
                Debe tener mínimo 1 compra personal
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.requirementText}>
                Método de retiro: USDT TRC20 solamente
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={[commonStyles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.infoTitle}>Información Importante</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Los bonos son adicionales al 5% de comisión por referidos
            </Text>
            <Text style={styles.infoItem}>
              • Todos los bonos son acumulativos
            </Text>
            <Text style={styles.infoItem}>
              • Solo cuentan compras de referidos directos (Nivel 1)
            </Text>
            <Text style={styles.infoItem}>
              • Monto mínimo por compra: 50 USDT
            </Text>
            <Text style={styles.infoItem}>
              • Solo compras en preventa pagadas en USDT
            </Text>
            <Text style={[styles.infoItem, { fontWeight: '700', color: colors.primary }]}>
              • Se incluyen: pagos automáticos, validaciones manuales aprobadas por el administrador, y pagos asignados por el administrador con comisión
            </Text>
            <Text style={styles.infoItem}>
              • El administrador procesará tu retiro en 24-48 horas
            </Text>
          </View>
        </View>

        {/* Extra padding at bottom */}
        <View style={{ height: 120 }} />
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
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  lastUpdateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  levelCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  levelBadge: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  levelName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  levelRequirement: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noLevelContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLevelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noLevelSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  purchasesAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  purchasesSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  nextLevelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  nextLevelEmoji: {
    fontSize: 24,
  },
  nextLevelName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  bonusCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  bonusAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 8,
  },
  bonusSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    flex: 1,
    fontWeight: '600',
  },
  withdrawButton: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  withdrawButtonTextDisabled: {
    color: colors.textSecondary,
  },
  withdrawForm: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  withdrawFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  withdrawActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  levelItem: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  levelItemEmoji: {
    fontSize: 32,
  },
  levelItemInfo: {
    flex: 1,
  },
  levelItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  levelItemNameInactive: {
    color: colors.textSecondary,
  },
  levelItemRequirement: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  levelItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  levelItemBonus: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  levelItemBonusInactive: {
    color: colors.textSecondary,
  },
  levelItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelItemStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  requirementsCard: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  requirementsList: {
    gap: 12,
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
});
