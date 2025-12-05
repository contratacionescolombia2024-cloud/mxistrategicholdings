
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AdminUserManagement } from '@/components/AdminUserManagement';

interface UserData {
  id: string;
  name: string;
  email: string;
  id_number: string;
  address: string;
  mxi_purchased_directly: number;
  mxi_from_unified_commissions: number;
  mxi_from_challenges: number;
  mxi_vesting_locked: number;
  is_active_contributor: boolean;
  active_referrals: number;
  joined_date: string;
  referral_code: string;
  referred_by: string | null;
  can_withdraw: boolean;
  last_withdrawal_date: string | null;
  yield_rate_per_minute: number;
  accumulated_yield: number;
  last_yield_update: string;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  usdt_contributed: number;
}

interface ReferralData {
  id: string;
  name: string;
  email: string;
  mxi_purchased_directly: number;
  mxi_from_unified_commissions: number;
  is_active_contributor: boolean;
  joined_date: string;
}

export default function UserManagementEnhancedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterStatus, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('joined_date', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReferrals = async (userId: string) => {
    try {
      setLoadingReferrals(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, mxi_purchased_directly, mxi_from_unified_commissions, is_active_contributor, joined_date')
        .eq('referred_by', userId)
        .order('joined_date', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
      Alert.alert('Error', 'Failed to load referrals');
    } finally {
      setLoadingReferrals(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (filterStatus === 'active') {
      filtered = filtered.filter(u => u.is_active_contributor && !u.is_blocked);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(u => !u.is_active_contributor && !u.is_blocked);
    } else if (filterStatus === 'blocked') {
      filtered = filtered.filter(u => u.is_blocked);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id_number.toLowerCase().includes(query) ||
        u.referral_code.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleUserPress = async (userData: UserData) => {
    setSelectedUser(userData);
    setDetailsModalVisible(true);
    await loadUserReferrals(userData.id);
  };

  const handleBlockUser = async (userId: string) => {
    if (!user) return;

    Alert.alert(
      '🚫 Bloquear Usuario',
      '¿Estás seguro que deseas bloquear este usuario? No podrá acceder a su cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({
                  is_blocked: true,
                  blocked_at: new Date().toISOString(),
                  blocked_reason: 'Bloqueado por administrador',
                  blocked_by: user.id
                })
                .eq('id', userId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Usuario bloqueado exitosamente');
              await loadUsers();
              setDetailsModalVisible(false);
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('❌ Error', 'Error al bloquear usuario');
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async (userId: string) => {
    if (!user) return;

    Alert.alert(
      '✅ Desbloquear Usuario',
      '¿Estás seguro que deseas desbloquear este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({
                  is_blocked: false,
                  blocked_at: null,
                  blocked_reason: null,
                  blocked_by: null
                })
                .eq('id', userId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Usuario desbloqueado exitosamente');
              await loadUsers();
              setDetailsModalVisible(false);
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('❌ Error', 'Error al desbloquear usuario');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const calculateTotalMxiBalance = (userData: UserData) => {
    return (
      userData.mxi_purchased_directly +
      userData.mxi_from_unified_commissions +
      userData.mxi_from_challenges +
      userData.mxi_vesting_locked
    );
  };

  const calculateAveragePerReferral = (userData: UserData) => {
    if (userData.active_referrals === 0) return 0;
    return userData.mxi_from_unified_commissions / userData.active_referrals;
  };

  const calculateCommissionGenerated = (referral: ReferralData) => {
    // 5% commission on direct purchases (Level 1)
    return referral.mxi_purchased_directly * 0.05;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="arrow_back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>👥 Gestión de Usuarios</Text>
          <Text style={styles.subtitle}>{filteredUsers.length} usuarios</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <IconSymbol 
            ios_icon_name="magnifyingglass" 
            android_material_icon_name="search" 
            size={20} 
            color={colors.textSecondary} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email, ID o código..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="cancel" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('active')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'active' && styles.filterButtonTextActive]}>
              Activos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'inactive' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('inactive')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'inactive' && styles.filterButtonTextActive]}>
              Inactivos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'blocked' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('blocked')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'blocked' && styles.filterButtonTextActive]}>
              🚫 Bloqueados
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="person.slash" 
              android_material_icon_name="person_off" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            <Text style={styles.emptySubtext}>Intenta ajustar tu búsqueda o filtros</Text>
          </View>
        ) : (
          filteredUsers.map((userData) => (
            <TouchableOpacity
              key={userData.id}
              style={[
                commonStyles.card, 
                styles.userCard,
                userData.is_blocked && styles.blockedUserCard
              ]}
              onPress={() => handleUserPress(userData)}
            >
              <View style={styles.userCardHeader}>
                <View style={styles.userInfo}>
                  <View style={[
                    styles.userAvatar,
                    userData.is_blocked && styles.blockedUserAvatar
                  ]}>
                    <IconSymbol 
                      ios_icon_name={userData.is_blocked ? "person.slash" : userData.is_active_contributor ? "person.fill" : "person"} 
                      android_material_icon_name={userData.is_blocked ? "person_off" : userData.is_active_contributor ? "person" : "person_outline"}
                      size={24} 
                      color={userData.is_blocked ? colors.error : userData.is_active_contributor ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{userData.name}</Text>
                    <Text style={styles.userEmail}>{userData.email}</Text>
                    <Text style={styles.userCode}>Código: {userData.referral_code}</Text>
                  </View>
                </View>
                <View style={styles.userBadges}>
                  {userData.is_blocked && (
                    <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.error }]}>BLOQUEADO</Text>
                    </View>
                  )}
                  {!userData.is_blocked && userData.is_active_contributor && (
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.success }]}>Activo</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <IconSymbol 
                    ios_icon_name="bitcoinsign.circle" 
                    android_material_icon_name="currency_bitcoin" 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text style={styles.userStatValue}>{formatNumber(calculateTotalMxiBalance(userData))} MXI</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol 
                    ios_icon_name="person.3.fill" 
                    android_material_icon_name="group" 
                    size={16} 
                    color={colors.success} 
                  />
                  <Text style={styles.userStatValue}>{formatNumber(userData.mxi_from_unified_commissions)} MXI</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol 
                    ios_icon_name="person.2" 
                    android_material_icon_name="people" 
                    size={16} 
                    color={colors.warning} 
                  />
                  <Text style={styles.userStatValue}>{userData.active_referrals} refs</Text>
                </View>
              </View>

              <View style={styles.userFooter}>
                <Text style={styles.userJoinDate}>Unido {formatDate(userData.joined_date)}</Text>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="chevron_right" 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="cancel" 
                size={32} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalles del Usuario</Text>
            <View style={{ width: 32 }} />
          </View>

          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={[commonStyles.card, styles.userInfoCard]}>
                <Text style={styles.userInfoName}>{selectedUser.name}</Text>
                <Text style={styles.userInfoEmail}>{selectedUser.email}</Text>
                <Text style={styles.userInfoCode}>Código: {selectedUser.referral_code}</Text>
              </View>

              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>Información Básica</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID:</Text>
                  <Text style={styles.infoValue}>{selectedUser.id_number}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dirección:</Text>
                  <Text style={styles.infoValue}>{selectedUser.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado:</Text>
                  <Text style={[styles.infoValue, { color: selectedUser.is_active_contributor ? colors.success : colors.textSecondary }]}>
                    {selectedUser.is_active_contributor ? 'ACTIVO' : 'INACTIVO'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>USDT Contribuido:</Text>
                  <Text style={styles.infoValue}>${formatNumber(selectedUser.usdt_contributed)}</Text>
                </View>
              </View>

              {/* MXI Balance Breakdown */}
              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>💎 Balance MXI Total</Text>
                <View style={styles.totalBalanceRow}>
                  <Text style={styles.totalBalanceLabel}>Balance Total:</Text>
                  <Text style={styles.totalBalanceValue}>{formatNumber(calculateTotalMxiBalance(selectedUser))} MXI</Text>
                </View>
                
                <View style={styles.balanceDivider} />
                
                <View style={styles.infoRow}>
                  <View style={styles.infoRowIcon}>
                    <IconSymbol 
                      ios_icon_name="cart.fill" 
                      android_material_icon_name="shopping_cart" 
                      size={18} 
                      color={colors.primary} 
                    />
                    <Text style={styles.infoLabel}>MXI Comprados:</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatNumber(selectedUser.mxi_purchased_directly)} MXI</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoRowIcon}>
                    <IconSymbol 
                      ios_icon_name="person.3.fill" 
                      android_material_icon_name="group" 
                      size={18} 
                      color={colors.success} 
                    />
                    <Text style={styles.infoLabel}>MXI por Referidos:</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.success }]}>
                    {formatNumber(selectedUser.mxi_from_unified_commissions)} MXI
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoRowIcon}>
                    <IconSymbol 
                      ios_icon_name="trophy.fill" 
                      android_material_icon_name="emoji_events" 
                      size={18} 
                      color={colors.warning} 
                    />
                    <Text style={styles.infoLabel}>MXI por Retos:</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatNumber(selectedUser.mxi_from_challenges)} MXI</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoRowIcon}>
                    <IconSymbol 
                      ios_icon_name="lock.fill" 
                      android_material_icon_name="lock" 
                      size={18} 
                      color={colors.accent} 
                    />
                    <Text style={styles.infoLabel}>MXI Vesting:</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatNumber(selectedUser.mxi_vesting_locked)} MXI</Text>
                </View>
              </View>

              {/* Referral Metrics */}
              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>📊 Métricas de Referidos</Text>
                
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <IconSymbol 
                      ios_icon_name="person.2.fill" 
                      android_material_icon_name="people" 
                      size={32} 
                      color={colors.primary} 
                    />
                    <Text style={styles.metricValue}>{selectedUser.active_referrals}</Text>
                    <Text style={styles.metricLabel}>Referidos Activos</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <IconSymbol 
                      ios_icon_name="dollarsign.circle.fill" 
                      android_material_icon_name="attach_money" 
                      size={32} 
                      color={colors.success} 
                    />
                    <Text style={styles.metricValue}>{formatNumber(selectedUser.mxi_from_unified_commissions)}</Text>
                    <Text style={styles.metricLabel}>MXI por Comisiones</Text>
                  </View>
                </View>
                
                <View style={styles.averageCard}>
                  <View style={styles.averageHeader}>
                    <IconSymbol 
                      ios_icon_name="chart.bar.fill" 
                      android_material_icon_name="bar_chart" 
                      size={24} 
                      color={colors.accent} 
                    />
                    <Text style={styles.averageTitle}>Promedio por Referido</Text>
                  </View>
                  <Text style={styles.averageValue}>
                    {formatNumber(calculateAveragePerReferral(selectedUser))} MXI
                  </Text>
                  <Text style={styles.averageSubtext}>
                    {selectedUser.active_referrals > 0 
                      ? `Basado en ${selectedUser.active_referrals} referido${selectedUser.active_referrals > 1 ? 's' : ''}`
                      : 'Sin referidos activos'}
                  </Text>
                </View>
              </View>

              {/* Referrals List */}
              {referrals.length > 0 && (
                <View style={commonStyles.card}>
                  <Text style={styles.sectionTitle}>👥 Lista de Referidos ({referrals.length})</Text>
                  {loadingReferrals ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.referralsList}>
                      {referrals.map((referral) => (
                        <View key={referral.id} style={styles.referralItem}>
                          <View style={styles.referralHeader}>
                            <View style={styles.referralInfo}>
                              <Text style={styles.referralName}>{referral.name}</Text>
                              <Text style={styles.referralEmail}>{referral.email}</Text>
                            </View>
                            {referral.is_active_contributor && (
                              <View style={styles.activeReferralBadge}>
                                <Text style={styles.activeReferralBadgeText}>ACTIVO</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.referralStats}>
                            <View style={styles.referralStat}>
                              <Text style={styles.referralStatLabel}>MXI Comprados:</Text>
                              <Text style={styles.referralStatValue}>{formatNumber(referral.mxi_purchased_directly)}</Text>
                            </View>
                            <View style={styles.referralStat}>
                              <Text style={styles.referralStatLabel}>Comisión Generada:</Text>
                              <Text style={[styles.referralStatValue, { color: colors.success }]}>
                                {formatNumber(calculateCommissionGenerated(referral))} MXI
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.referralDate}>Unido: {formatDate(referral.joined_date)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Vesting Information */}
              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>⚡ Información de Vesting</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tasa por Minuto:</Text>
                  <Text style={styles.infoValue}>{selectedUser.yield_rate_per_minute.toFixed(8)} MXI</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rendimiento Acumulado:</Text>
                  <Text style={styles.infoValue}>{formatNumber(selectedUser.accumulated_yield)} MXI</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Última Actualización:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedUser.last_yield_update)}</Text>
                </View>
              </View>

              {/* Admin Management Component */}
              <View style={commonStyles.card}>
                <AdminUserManagement
                  userId={selectedUser.id}
                  userName={selectedUser.name}
                  userEmail={selectedUser.email}
                  onUpdate={loadUsers}
                />
              </View>

              {/* Block/Unblock Actions */}
              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>Acciones de Cuenta</Text>
                {selectedUser.is_blocked ? (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { backgroundColor: colors.success }]}
                    onPress={() => handleUnblockUser(selectedUser.id)}
                  >
                    <IconSymbol 
                      ios_icon_name="checkmark.circle.fill" 
                      android_material_icon_name="check_circle" 
                      size={20} 
                      color="#000" 
                    />
                    <Text style={buttonStyles.primaryText}>Desbloquear Usuario</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { backgroundColor: colors.error }]}
                    onPress={() => handleBlockUser(selectedUser.id)}
                  >
                    <IconSymbol 
                      ios_icon_name="xmark.circle.fill" 
                      android_material_icon_name="block" 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={[buttonStyles.primaryText, { color: '#fff' }]}>Bloquear Usuario</Text>
                  </TouchableOpacity>
                )}
                {selectedUser.is_blocked && selectedUser.blocked_reason && (
                  <View style={styles.blockReasonCard}>
                    <Text style={styles.blockReasonLabel}>Razón del Bloqueo:</Text>
                    <Text style={styles.blockReasonText}>{selectedUser.blocked_reason}</Text>
                    <Text style={styles.blockReasonDate}>Bloqueado: {formatDate(selectedUser.blocked_at || '')}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  userCard: {
    marginBottom: 12,
    padding: 16,
  },
  blockedUserCard: {
    borderWidth: 2,
    borderColor: colors.error,
    opacity: 0.7,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedUserAvatar: {
    backgroundColor: colors.error + '20',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userCode: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  userBadges: {
    gap: 4,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userStatValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  userJoinDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userInfoCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userInfoName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userInfoCode: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  totalBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalBalanceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalBalanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  averageCard: {
    backgroundColor: colors.accent + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  averageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  averageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  averageValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  averageSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  referralEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeReferralBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeReferralBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  referralStats: {
    gap: 6,
    marginBottom: 8,
  },
  referralStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  referralStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  referralDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  blockReasonCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  blockReasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 4,
  },
  blockReasonText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  blockReasonDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
