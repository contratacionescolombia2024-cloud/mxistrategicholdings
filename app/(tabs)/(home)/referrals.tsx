
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';

export default function ReferralsScreen() {
  const { user, getCurrentYield, refreshUser } = useAuth();
  const { lastUpdate } = useRealtime();
  const router = useRouter();
  const [currentYield, setCurrentYield] = useState(0);
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const lastUpdateRef = useRef<Date | null>(null);

  // Reload data when real-time update occurs
  useEffect(() => {
    if (lastUpdate && lastUpdate !== lastUpdateRef.current) {
      console.log('Real-time update detected, refreshing user data');
      lastUpdateRef.current = lastUpdate;
      refreshUser();
    }
  }, [lastUpdate, refreshUser]);

  useEffect(() => {
    if (user && getCurrentYield) {
      const yield_value = getCurrentYield();
      setCurrentYield(yield_value);
    }
  }, [user, getCurrentYield]);

  const handleCopyCode = async () => {
    if (!user?.referralCode) return;
    await Clipboard.setStringAsync(user.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShare = async () => {
    if (!user?.referralCode) return;

    try {
      await Share.share({
        message: `Join MXI Pool with my referral code: ${user.referralCode}\n\nEarn MXI tokens and get rewards!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleWithdrawToBalance = async () => {
    if (!user) return;

    const amount = parseFloat(withdrawAmount);
    const mxiFromCommissions = user.mxiFromUnifiedCommissions || 0;
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Monto Inválido', 'Por favor ingresa un monto válido');
      return;
    }

    // Check minimum withdrawal
    if (amount < 50) {
      Alert.alert('Monto Mínimo', 'El retiro mínimo es de 50 MXI');
      return;
    }

    // Check available balance
    if (amount > mxiFromCommissions) {
      Alert.alert('Saldo Insuficiente', `Solo tienes ${mxiFromCommissions.toFixed(2)} MXI disponibles de comisiones`);
      return;
    }

    // Check active referrals requirement
    if (user.activeReferrals < 5) {
      Alert.alert(
        'Requisitos No Cumplidos',
        `Necesitas 5 referidos activos que hayan comprado el mínimo de MXI.\n\nActualmente tienes: ${user.activeReferrals} referidos activos`
      );
      return;
    }

    // Confirm withdrawal
    Alert.alert(
      'Confirmar Retiro a Balance MXI',
      `¿Deseas transferir ${amount.toFixed(2)} MXI de comisiones a tu balance principal?\n\nEsto te permitirá usar estos MXI para compras y otras funciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await supabase.rpc('withdraw_commission_to_mxi_balance', {
                p_user_id: user.id,
                p_amount: amount
              });

              if (error) {
                console.error('Withdrawal error:', error);
                Alert.alert('Error', error.message || 'No se pudo completar el retiro');
                return;
              }

              if (!data || !data.success) {
                Alert.alert('Error', data?.error || 'No se pudo completar el retiro');
                return;
              }

              Alert.alert(
                'Retiro Exitoso',
                `Se han transferido ${amount.toFixed(2)} MXI a tu balance principal`
              );
              
              setWithdrawAmount('');
              setShowWithdrawModal(false);
              
              // Refresh user data
              await refreshUser();
            } catch (error: any) {
              console.error('Exception during withdrawal:', error);
              Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Get commission balance from user context
  const mxiFromCommissions = user?.mxiFromUnifiedCommissions || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <TouchableOpacity onPress={() => refreshUser()} style={styles.refreshButton}>
          <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
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
            <Text style={styles.codeTitle}>Your Referral Code</Text>
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
              color="#fff" 
            />
            <Text style={buttonStyles.primaryText}>Share Code</Text>
          </TouchableOpacity>
        </View>

        {/* Commission Stats - All in MXI */}
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Commission Balance (MXI)</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statValue}>{mxiFromCommissions.toFixed(4)} MXI</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {mxiFromCommissions.toFixed(4)} MXI
              </Text>
            </View>
          </View>
          <Text style={styles.infoNote}>
            💡 All commissions are handled internally in MXI
          </Text>

          {/* Withdraw to Balance Button */}
          {mxiFromCommissions >= 50 && (
            <View style={styles.withdrawSection}>
              <View style={styles.withdrawHeader}>
                <IconSymbol 
                  ios_icon_name="arrow.down.circle.fill" 
                  android_material_icon_name="arrow_circle_down" 
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.withdrawTitle}>Retirar a Balance MXI</Text>
              </View>
              <Text style={styles.withdrawDescription}>
                Transfiere tus comisiones a tu balance principal de MXI para usarlas en compras y otras funciones.
              </Text>
              
              {!showWithdrawModal ? (
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.withdrawButton]}
                  onPress={() => setShowWithdrawModal(true)}
                >
                  <IconSymbol 
                    ios_icon_name="arrow.down.circle" 
                    android_material_icon_name="arrow_circle_down" 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={buttonStyles.primaryText}>Retirar a Balance</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.withdrawForm}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Monto a Retirar (MXI)</Text>
                    <TextInput
                      style={styles.input}
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                      keyboardType="decimal-pad"
                      placeholder="Mínimo 50 MXI"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.inputHint}>
                      Disponible: {mxiFromCommissions.toFixed(2)} MXI
                    </Text>
                  </View>
                  
                  <View style={styles.withdrawActions}>
                    <TouchableOpacity
                      style={[buttonStyles.secondary, styles.actionButton]}
                      onPress={() => {
                        setShowWithdrawModal(false);
                        setWithdrawAmount('');
                      }}
                      disabled={loading}
                    >
                      <Text style={buttonStyles.secondaryText}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[buttonStyles.primary, styles.actionButton]}
                      onPress={handleWithdrawToBalance}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={buttonStyles.primaryText}>Confirmar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>Requisitos:</Text>
                <View style={styles.requirementItem}>
                  <IconSymbol 
                    ios_icon_name={user && user.activeReferrals >= 5 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
                    android_material_icon_name={user && user.activeReferrals >= 5 ? 'check_circle' : 'cancel'} 
                    size={16} 
                    color={user && user.activeReferrals >= 5 ? colors.success : colors.error} 
                  />
                  <Text style={styles.requirementText}>
                    5 referidos activos ({user?.activeReferrals || 0}/5)
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <IconSymbol 
                    ios_icon_name={mxiFromCommissions >= 50 ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
                    android_material_icon_name={mxiFromCommissions >= 50 ? 'check_circle' : 'cancel'} 
                    size={16} 
                    color={mxiFromCommissions >= 50 ? colors.success : colors.error} 
                  />
                  <Text style={styles.requirementText}>
                    Mínimo 50 MXI
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Referral Stats */}
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          <View style={styles.referralsList}>
            <View style={styles.referralItem}>
              <View style={styles.referralLevel}>
                <Text style={styles.referralLevelText}>Level 1</Text>
                <Text style={styles.referralRate}>5%</Text>
              </View>
              <Text style={styles.referralCount}>{user?.referrals.level1 || 0} referrals</Text>
            </View>
            <View style={styles.referralItem}>
              <View style={styles.referralLevel}>
                <Text style={styles.referralLevelText}>Level 2</Text>
                <Text style={styles.referralRate}>2%</Text>
              </View>
              <Text style={styles.referralCount}>{user?.referrals.level2 || 0} referrals</Text>
            </View>
            <View style={styles.referralItem}>
              <View style={styles.referralLevel}>
                <Text style={styles.referralLevelText}>Level 3</Text>
                <Text style={styles.referralRate}>1%</Text>
              </View>
              <Text style={styles.referralCount}>{user?.referrals.level3 || 0} referrals</Text>
            </View>
          </View>
          <View style={styles.activeReferrals}>
            <Text style={styles.activeLabel}>Referidos Activos (Nivel 1):</Text>
            <Text style={styles.activeValue}>{user?.activeReferrals || 0}</Text>
          </View>
          <Text style={styles.activeReferralsNote}>
            * Referidos activos son aquellos que han realizado al menos una compra de 50 USDT o más
          </Text>
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
            <Text style={styles.infoTitle}>How Referrals Work</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>- Share your referral code with friends</Text>
            <Text style={styles.infoItem}>- Earn 5% in MXI from Level 1 referrals</Text>
            <Text style={styles.infoItem}>- Earn 2% in MXI from Level 2 referrals</Text>
            <Text style={styles.infoItem}>- Earn 1% in MXI from Level 3 referrals</Text>
            <Text style={styles.infoItem}>- All commissions are credited directly in MXI</Text>
            <Text style={styles.infoItem}>- Need 5 active Level 1 referrals to withdraw</Text>
            <Text style={styles.infoItem}>- Active referrals must have purchased at least 50 USDT</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
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
    marginBottom: 8,
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
  activeReferralsNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
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
  withdrawSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  withdrawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  withdrawTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  withdrawDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  withdrawForm: {
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  withdrawActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  requirementsBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: colors.textSecondary,
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
