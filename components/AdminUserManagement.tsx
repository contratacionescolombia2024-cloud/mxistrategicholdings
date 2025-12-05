
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

interface AdminUserManagementProps {
  userId: string;
  userName: string;
  userEmail: string;
  onUpdate: () => void;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  mxi_balance: number;
  usdt_contributed: number;
  mxi_purchased_directly: number;
  mxi_from_unified_commissions: number;
  mxi_from_challenges: number;
  mxi_vesting_locked: number;
  active_referrals: number;
  is_active_contributor: boolean;
  is_blocked: boolean;
  referral_code: string;
  referred_by: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  referrer_code: string | null;
  yield_rate_per_minute: number;
  accumulated_yield: number;
  total_referrals: number;
  total_commissions: number;
  total_commission_amount: number;
}

interface Commission {
  id: string;
  amount: number;
  level: number;
  status: string;
  from_user_name: string;
  created_at: string;
}

interface Referral {
  id: string;
  referred_name: string;
  level: number;
  is_active: boolean;
  created_at: string;
}

export function AdminUserManagement({ userId, userName, userEmail, onUpdate }: AdminUserManagementProps) {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading user details for:', userId);

      // Load user details first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error loading user:', userError);
        throw userError;
      }

      console.log('User data loaded:', userData);

      // Load referrer information separately if referred_by exists
      let referrerData = null;
      if (userData.referred_by) {
        const { data: refData, error: refError } = await supabase
          .from('users')
          .select('id, name, email, referral_code')
          .eq('id', userData.referred_by)
          .single();

        if (!refError && refData) {
          referrerData = refData;
        }
      }

      // Load referrals count
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId);

      // Load commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('id, amount')
        .eq('user_id', userId);

      const totalCommissionAmount = commissionsData?.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0) || 0;

      setUserDetails({
        ...userData,
        referrer_name: referrerData?.name || null,
        referrer_email: referrerData?.email || null,
        referrer_code: referrerData?.referral_code || null,
        total_referrals: referralsData?.length || 0,
        total_commissions: commissionsData?.length || 0,
        total_commission_amount: totalCommissionAmount,
      });

      // Load detailed commissions
      const { data: detailedCommissions, error: commError } = await supabase
        .from('commissions')
        .select('id, amount, level, status, created_at, from_user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!commError && detailedCommissions) {
        // Load from_user names separately
        const commissionsWithNames = await Promise.all(
          detailedCommissions.map(async (c) => {
            const { data: fromUser } = await supabase
              .from('users')
              .select('name')
              .eq('id', c.from_user_id)
              .single();

            return {
              id: c.id,
              amount: parseFloat(c.amount.toString()),
              level: c.level,
              status: c.status,
              from_user_name: fromUser?.name || 'Unknown',
              created_at: c.created_at,
            };
          })
        );

        setCommissions(commissionsWithNames);
      }

      // Load detailed referrals
      const { data: detailedReferrals, error: refError } = await supabase
        .from('referrals')
        .select('id, level, created_at, referred_id')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!refError && detailedReferrals) {
        // Load referred user names separately
        const referralsWithNames = await Promise.all(
          detailedReferrals.map(async (r) => {
            const { data: referredUser } = await supabase
              .from('users')
              .select('name, is_active_contributor')
              .eq('id', r.referred_id)
              .single();

            return {
              id: r.id,
              referred_name: referredUser?.name || 'Unknown',
              level: r.level,
              is_active: referredUser?.is_active_contributor || false,
              created_at: r.created_at,
            };
          })
        );

        setReferrals(referralsWithNames);
      }

    } catch (error) {
      console.error('Error loading user details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del usuario. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: string, item?: any) => {
    console.log('Opening modal:', type);
    setModalType(type);
    setSelectedItem(item || null);
    setInputValue('');
    setInputValue2('');
    
    if (type === 'edit_commission' && item) {
      setInputValue(item.amount.toString());
      setInputValue2(item.status);
    } else if (type === 'update_referrer' && userDetails) {
      setInputValue(userDetails.referrer_code || '');
    }
    
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
    setInputValue('');
    setInputValue2('');
    setSelectedItem(null);
  };

  const handleBalanceOperation = async (operation: string) => {
    console.log('Starting balance operation:', operation);
    console.log('Input value:', inputValue);
    
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return;
    }

    setProcessing(true);
    try {
      // Get current authenticated user
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Error de autenticación');
      }
      
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('Current user ID:', currentUser.id);
      console.log('Target user ID:', userId);
      console.log('Amount:', amount);

      let rpcFunction = '';
      let params: any = {
        p_user_id: userId,
        p_admin_id: currentUser.id,
        p_amount: amount,
      };

      switch (operation) {
        case 'add_balance_no_commission':
          rpcFunction = 'admin_add_balance_general_no_commission';
          break;
        case 'add_balance_with_commission':
          rpcFunction = 'admin_add_balance_general_with_commission';
          break;
        case 'subtract_balance_general':
          rpcFunction = 'admin_subtract_balance_general';
          break;
        case 'add_vesting':
          rpcFunction = 'admin_add_balance_vesting';
          break;
        case 'subtract_vesting':
          rpcFunction = 'admin_subtract_balance_vesting';
          break;
        case 'add_tournament':
          rpcFunction = 'admin_add_balance_tournament';
          break;
        case 'subtract_tournament':
          rpcFunction = 'admin_subtract_balance_tournament';
          break;
        default:
          throw new Error('Operación inválida');
      }

      console.log('Calling RPC function:', rpcFunction);
      console.log('With params:', params);

      const { data, error } = await supabase.rpc(rpcFunction, params);

      console.log('RPC response data:', data);
      console.log('RPC response error:', error);

      if (error) {
        console.error('RPC error details:', error);
        throw error;
      }

      if (data && typeof data === 'object') {
        if (data.success) {
          Alert.alert('✅ Éxito', data.message || 'Operación completada exitosamente');
          closeModal();
          await loadUserDetails();
          onUpdate();
        } else {
          Alert.alert('❌ Error', data.error || 'Error en la operación');
        }
      } else {
        // If data is not an object, assume success
        Alert.alert('✅ Éxito', 'Operación completada exitosamente');
        closeModal();
        await loadUserDetails();
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error in balance operation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('❌ Error', error.message || 'Error en la operación. Por favor, intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateReferrer = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated');

      const { data, error } = await supabase.rpc('admin_update_user_referrer', {
        p_admin_id: user.id,
        p_user_id: userId,
        p_referrer_code: inputValue.trim() || null,
      });

      if (error) throw error;

      if (data?.success) {
        Alert.alert('✅ Éxito', data.message);
        closeModal();
        await loadUserDetails();
        onUpdate();
      } else {
        Alert.alert('❌ Error', data?.error || 'Error al actualizar referidor');
      }
    } catch (error: any) {
      console.error('Error updating referrer:', error);
      Alert.alert('❌ Error', error.message || 'Error al actualizar referidor');
    } finally {
      setProcessing(false);
    }
  };

  const handleLinkReferral = async () => {
    if (!inputValue || !inputValue2) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated');

      const { data, error } = await supabase.rpc('admin_link_referral_by_code', {
        p_admin_id: user.id,
        p_user_email: inputValue,
        p_referrer_code: inputValue2,
      });

      if (error) throw error;

      if (data?.success) {
        Alert.alert('✅ Éxito', data.message);
        closeModal();
        await loadUserDetails();
        onUpdate();
      } else {
        Alert.alert('❌ Error', data?.error || 'Error al vincular referido');
      }
    } catch (error: any) {
      console.error('Error linking referral:', error);
      Alert.alert('❌ Error', error.message || 'Error al vincular referido');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCommission = async (commissionId: string) => {
    Alert.alert(
      '🗑️ Eliminar Comisión',
      '¿Estás seguro de eliminar esta comisión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('commissions')
                .delete()
                .eq('id', commissionId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Comisión eliminada');
              await loadUserDetails();
              onUpdate();
            } catch (error) {
              console.error('Error deleting commission:', error);
              Alert.alert('❌ Error', 'Error al eliminar comisión');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteReferral = async (referralId: string) => {
    Alert.alert(
      '🗑️ Eliminar Referido',
      '¿Estás seguro de eliminar este referido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('referrals')
                .delete()
                .eq('id', referralId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Referido eliminado');
              await loadUserDetails();
              onUpdate();
            } catch (error) {
              console.error('Error deleting referral:', error);
              Alert.alert('❌ Error', 'Error al eliminar referido');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'add_balance_no_commission':
      case 'add_balance_with_commission':
      case 'subtract_balance_general':
      case 'add_vesting':
      case 'subtract_vesting':
      case 'add_tournament':
      case 'subtract_tournament':
        return (
          <View>
            <Text style={styles.modalTitle}>
              {modalType.includes('add') ? '➕ Añadir' : '➖ Restar'} Saldo
            </Text>
            <Text style={styles.modalSubtitle}>
              {modalType.includes('vesting') ? 'Vesting' : modalType.includes('tournament') ? 'Torneo' : 'Balance General'}
              {modalType === 'add_balance_with_commission' && ' (Con Comisión)'}
              {modalType === 'add_balance_no_commission' && ' (Sin Comisión)'}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cantidad de MXI</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[buttonStyles.primary, processing && buttonStyles.disabled]}
              onPress={() => handleBalanceOperation(modalType)}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={buttonStyles.primaryText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'update_referrer':
        return (
          <View>
            <Text style={styles.modalTitle}>🔗 Actualizar Referidor</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa el código del nuevo referidor o deja vacío para remover
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Código del Referidor</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="MXI123456 (vacío para remover)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
            </View>
            {userDetails?.referrer_code && (
              <View style={styles.currentReferrerInfo}>
                <Text style={styles.currentReferrerLabel}>Referidor Actual:</Text>
                <Text style={styles.currentReferrerValue}>{userDetails.referrer_name}</Text>
                <Text style={styles.currentReferrerCode}>{userDetails.referrer_code}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[buttonStyles.primary, processing && buttonStyles.disabled]}
              onPress={handleUpdateReferrer}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={buttonStyles.primaryText}>Actualizar</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'link_referral':
        return (
          <View>
            <Text style={styles.modalTitle}>🔗 Vincular Referido</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo del Usuario</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="email-address"
                placeholder="usuario@ejemplo.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Código del Referidor</Text>
              <TextInput
                style={styles.input}
                value={inputValue2}
                onChangeText={setInputValue2}
                placeholder="MXI123456"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={[buttonStyles.primary, processing && buttonStyles.disabled]}
              onPress={handleLinkReferral}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={buttonStyles.primaryText}>Vincular</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading && !userDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudieron cargar los detalles del usuario</Text>
        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: 16 }]}
          onPress={loadUserDetails}
        >
          <Text style={buttonStyles.primaryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>⚙️ Gestión Completa de Usuario</Text>

      {/* User Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View>
            <Text style={styles.overviewName}>{userDetails.name}</Text>
            <Text style={styles.overviewEmail}>{userDetails.email}</Text>
            <Text style={styles.overviewCode}>Código: {userDetails.referral_code}</Text>
          </View>
          <View style={styles.statusBadges}>
            {userDetails.is_blocked && (
              <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.error }]}>BLOQUEADO</Text>
              </View>
            )}
            {userDetails.is_active_contributor && (
              <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>ACTIVO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Referrer Information */}
        <View style={styles.referrerSection}>
          <View style={styles.referrerHeader}>
            <Text style={styles.referrerTitle}>👤 Información del Referidor</Text>
            <TouchableOpacity
              style={styles.editReferrerButton}
              onPress={() => openModal('update_referrer')}
            >
              <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {userDetails.referrer_name ? (
            <View style={styles.referrerInfo}>
              <View style={styles.referrerRow}>
                <Text style={styles.referrerLabel}>Nombre:</Text>
                <Text style={styles.referrerValue}>{userDetails.referrer_name}</Text>
              </View>
              <View style={styles.referrerRow}>
                <Text style={styles.referrerLabel}>Email:</Text>
                <Text style={styles.referrerValue}>{userDetails.referrer_email}</Text>
              </View>
              <View style={styles.referrerRow}>
                <Text style={styles.referrerLabel}>Código:</Text>
                <Text style={[styles.referrerValue, styles.referrerCode]}>{userDetails.referrer_code}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noReferrerInfo}>
              <IconSymbol ios_icon_name="person.slash" android_material_icon_name="person_off" size={24} color={colors.textSecondary} />
              <Text style={styles.noReferrerText}>Sin referidor asignado</Text>
            </View>
          )}
        </View>

        {/* Balance Summary */}
        <View style={styles.balanceSummary}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Balance Total</Text>
            <Text style={styles.balanceValue}>{parseFloat(userDetails.mxi_balance.toString()).toFixed(2)} MXI</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>USDT Contribuido</Text>
            <Text style={styles.balanceValue}>${parseFloat(userDetails.usdt_contributed.toString()).toFixed(2)}</Text>
          </View>
        </View>

        {/* Detailed Balances */}
        <View style={styles.detailedBalances}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 MXI Comprado</Text>
            <Text style={styles.detailValue}>{parseFloat(userDetails.mxi_purchased_directly.toString()).toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💸 MXI Comisiones</Text>
            <Text style={styles.detailValue}>{parseFloat(userDetails.mxi_from_unified_commissions.toString()).toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏆 MXI Retos</Text>
            <Text style={styles.detailValue}>{parseFloat(userDetails.mxi_from_challenges.toString()).toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🔒 MXI Vesting</Text>
            <Text style={styles.detailValue}>{parseFloat(userDetails.mxi_vesting_locked.toString()).toFixed(2)}</Text>
          </View>
        </View>

        {/* Referral Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="group" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{userDetails.total_referrals}</Text>
            <Text style={styles.statLabel}>Referidos</Text>
          </View>
          <View style={styles.statItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={20} color={colors.success} />
            <Text style={styles.statValue}>{userDetails.active_referrals}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statItem}>
            <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={20} color={colors.warning} />
            <Text style={styles.statValue}>{userDetails.total_commissions}</Text>
            <Text style={styles.statLabel}>Comisiones</Text>
          </View>
          <View style={styles.statItem}>
            <IconSymbol ios_icon_name="chart.line.uptrend.xyaxis" android_material_icon_name="trending_up" size={20} color={colors.accent} />
            <Text style={styles.statValue}>${userDetails.total_commission_amount.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>💰 Gestión de Saldos</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.success + '15' }]}
            onPress={() => openModal('add_balance_no_commission')}
          >
            <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add_circle" size={24} color={colors.success} />
            <Text style={styles.actionText}>Añadir{'\n'}Sin Comisión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary + '15' }]}
            onPress={() => openModal('add_balance_with_commission')}
          >
            <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add_circle" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Añadir{'\n'}Con Comisión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.error + '15' }]}
            onPress={() => openModal('subtract_balance_general')}
          >
            <IconSymbol ios_icon_name="minus.circle.fill" android_material_icon_name="remove_circle" size={24} color={colors.error} />
            <Text style={styles.actionText}>Restar{'\n'}Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.accent + '15' }]}
            onPress={() => openModal('add_vesting')}
          >
            <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Modificar{'\n'}Vesting</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Referrals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>👥 Referidos ({referrals.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal('link_referral')}
          >
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {referrals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay referidos</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {referrals.map((referral, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>{referral.referred_name}</Text>
                    <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: colors.primary }]}>Nivel {referral.level}</Text>
                    </View>
                  </View>
                  <View style={styles.listItemFooter}>
                    <Text style={styles.listItemDate}>
                      {new Date(referral.created_at).toLocaleDateString()}
                    </Text>
                    {referral.is_active && (
                      <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReferral(referral.id)}
                >
                  <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Commissions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>💸 Comisiones ({commissions.length})</Text>
        {commissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay comisiones</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {commissions.map((commission, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>${commission.amount.toFixed(2)} USDT</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: commission.status === 'available' ? colors.success + '20' : colors.textSecondary + '20' }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        { color: commission.status === 'available' ? colors.success : colors.textSecondary }
                      ]}>
                        {commission.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.listItemSubtitle}>De: {commission.from_user_name}</Text>
                  <View style={styles.listItemFooter}>
                    <Text style={styles.listItemDate}>
                      {new Date(commission.created_at).toLocaleDateString()}
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: colors.warning }]}>Nivel {commission.level}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCommission(commission.id)}
                >
                  <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overviewName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  overviewEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  overviewCode: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  statusBadges: {
    gap: 6,
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  referrerSection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referrerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referrerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  editReferrerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referrerInfo: {
    gap: 8,
  },
  referrerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referrerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  referrerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  referrerCode: {
    fontFamily: 'monospace',
    color: colors.primary,
  },
  noReferrerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  noReferrerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  balanceSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  detailedBalances: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.text,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 90,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
    gap: 6,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
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
  },
  currentReferrerInfo: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentReferrerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  currentReferrerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  currentReferrerCode: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'monospace',
  },
});
