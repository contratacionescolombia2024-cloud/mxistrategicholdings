
import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  usdt_contributed: number;
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
  email_verified: boolean;
}

interface ReferralMetrics {
  total_referrals: number;
  active_referrals: number;
  total_commission_mxi: number;
  level_1_count: number;
  level_2_count: number;
  level_3_count: number;
  average_mxi_per_referral: number;
}

interface FilterOptions {
  status: 'all' | 'active' | 'inactive' | 'blocked' | 'verified';
  minMxi: string;
  maxMxi: string;
  minReferrals: string;
  maxReferrals: string;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
}

export default function UserManagementAdvancedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [linkReferralModalVisible, setLinkReferralModalVisible] = useState(false);
  
  // Real-time subscription
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    minMxi: '',
    maxMxi: '',
    minReferrals: '',
    maxReferrals: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  });

  // Edit state
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Link referral state
  const [referralEmail, setReferralEmail] = useState('');
  const [referrerCode, setReferrerCode] = useState('');

  // Referral metrics
  const [referralMetrics, setReferralMetrics] = useState<ReferralMetrics | null>(null);

  useEffect(() => {
    loadUsers();
    setupRealtimeSubscription();

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('Real-time update:', payload);
          loadUsers();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);
  };

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
      Alert.alert('Error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, []);

  const applyFilters = () => {
    let filtered = [...users];

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(u => u.is_active_contributor && !u.is_blocked);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(u => !u.is_active_contributor && !u.is_blocked);
    } else if (filters.status === 'blocked') {
      filtered = filtered.filter(u => u.is_blocked);
    } else if (filters.status === 'verified') {
      filtered = filtered.filter(u => u.email_verified);
    }

    // MXI balance filter
    if (filters.minMxi) {
      const min = parseFloat(filters.minMxi);
      filtered = filtered.filter(u => getTotalMxiBalance(u) >= min);
    }
    if (filters.maxMxi) {
      const max = parseFloat(filters.maxMxi);
      filtered = filtered.filter(u => getTotalMxiBalance(u) <= max);
    }

    // Referrals filter
    if (filters.minReferrals) {
      const min = parseInt(filters.minReferrals);
      filtered = filtered.filter(u => u.active_referrals >= min);
    }
    if (filters.maxReferrals) {
      const max = parseInt(filters.maxReferrals);
      filtered = filtered.filter(u => u.active_referrals <= max);
    }

    // Date filter
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      filtered = filtered.filter(u => new Date(u.joined_date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      filtered = filtered.filter(u => new Date(u.joined_date) <= to);
    }

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id_number.toLowerCase().includes(query) ||
        u.referral_code.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      minMxi: '',
      maxMxi: '',
      minReferrals: '',
      maxReferrals: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
    });
  };

  const getTotalMxiBalance = (userData: UserData) => {
    return (
      userData.mxi_purchased_directly +
      userData.mxi_from_unified_commissions +
      userData.mxi_from_challenges +
      userData.mxi_vesting_locked
    );
  };

  const loadReferralMetrics = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_referral_metrics', {
        p_user_id: userId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setReferralMetrics(data[0]);
      }
    } catch (error) {
      console.error('Error loading referral metrics:', error);
    }
  };

  const handleUserPress = async (userData: UserData) => {
    setSelectedUser(userData);
    setDetailsModalVisible(true);
    await loadReferralMetrics(userData.id);
  };

  const openEditModal = (field: string, currentValue: any) => {
    setEditField(field);
    setEditValue(currentValue?.toString() || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !user) return;

    setProcessing(true);
    try {
      let updateValue: any = editValue;

      // Parse value based on field type
      if (['mxi_purchased_directly', 'mxi_from_unified_commissions', 'mxi_from_challenges', 'mxi_vesting_locked', 'usdt_contributed', 'yield_rate_per_minute', 'accumulated_yield'].includes(editField)) {
        updateValue = parseFloat(editValue);
      } else if (['active_referrals'].includes(editField)) {
        updateValue = parseInt(editValue);
      } else if (['is_active_contributor', 'can_withdraw', 'email_verified'].includes(editField)) {
        updateValue = editValue === 'true';
      }

      const { error } = await supabase
        .from('users')
        .update({ [editField]: updateValue })
        .eq('id', selectedUser.id);

      if (error) throw error;

      Alert.alert('✅ Éxito', 'Campo actualizado correctamente');
      setEditModalVisible(false);
      await loadUsers();
      
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) setSelectedUser(updatedUser);
    } catch (error) {
      console.error('Error updating field:', error);
      Alert.alert('❌ Error', 'Error al actualizar campo');
    } finally {
      setProcessing(false);
    }
  };

  const handleLinkReferral = async () => {
    if (!referralEmail || !referrerCode) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('No authenticated');

      const { data, error } = await supabase.rpc('admin_link_referral_to_email', {
        p_admin_id: adminUser.id,
        p_referred_email: referralEmail,
        p_referrer_code: referrerCode,
      });

      if (error) throw error;

      if (data?.success) {
        Alert.alert('✅ Éxito', 'Referido vinculado exitosamente');
        setLinkReferralModalVisible(false);
        setReferralEmail('');
        setReferrerCode('');
        await loadUsers();
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

  const handleBlockUser = async (userId: string) => {
    Alert.alert(
      '🚫 Bloquear Usuario',
      '¿Estás seguro que deseas bloquear este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const { error } = await supabase
                .from('users')
                .update({
                  is_blocked: true,
                  blocked_at: new Date().toISOString(),
                  blocked_reason: 'Bloqueado por administrador',
                  blocked_by: user?.id,
                })
                .eq('id', userId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Usuario bloqueado exitosamente');
              await loadUsers();
              setDetailsModalVisible(false);
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('❌ Error', 'Error al bloquear usuario');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async (userId: string) => {
    Alert.alert(
      '✅ Desbloquear Usuario',
      '¿Estás seguro que deseas desbloquear este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              setProcessing(true);
              const { error } = await supabase
                .from('users')
                .update({
                  is_blocked: false,
                  blocked_at: null,
                  blocked_reason: null,
                  blocked_by: null,
                })
                .eq('id', userId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Usuario desbloqueado exitosamente');
              await loadUsers();
              
              const updatedUser = users.find(u => u.id === userId);
              if (updatedUser) setSelectedUser(updatedUser);
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('❌ Error', 'Error al desbloquear usuario');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: 'Nombre',
      email: 'Correo',
      id_number: 'Número de ID',
      address: 'Dirección',
      mxi_purchased_directly: 'MXI Comprados',
      mxi_from_unified_commissions: 'MXI por Comisiones',
      mxi_from_challenges: 'MXI por Retos',
      mxi_vesting_locked: 'MXI Vesting',
      usdt_contributed: 'USDT Contribuido',
      active_referrals: 'Referidos Activos',
      yield_rate_per_minute: 'Tasa de Rendimiento',
      accumulated_yield: 'Rendimiento Acumulado',
      is_active_contributor: 'Contribuidor Activo',
      can_withdraw: 'Puede Retirar',
      email_verified: 'Email Verificado',
    };
    return labels[field] || field;
  };

  if (loading && users.length === 0) {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="arrow_back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>👥 Gestión Avanzada</Text>
          <Text style={styles.subtitle}>
            {filteredUsers.length} de {users.length} usuarios
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.linkReferralButton}
          onPress={() => setLinkReferralModalVisible(true)}
        >
          <IconSymbol 
            ios_icon_name="link.circle.fill" 
            android_material_icon_name="link" 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
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
            value={filters.searchQuery}
            onChangeText={(text) => setFilters({ ...filters, searchQuery: text })}
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setFilters({ ...filters, searchQuery: '' })}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="cancel" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, filters.status === 'all' && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, status: 'all' })}
            >
              <Text style={[styles.filterChipText, filters.status === 'all' && styles.filterChipTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.status === 'active' && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, status: 'active' })}
            >
              <Text style={[styles.filterChipText, filters.status === 'active' && styles.filterChipTextActive]}>
                Activos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.status === 'inactive' && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, status: 'inactive' })}
            >
              <Text style={[styles.filterChipText, filters.status === 'inactive' && styles.filterChipTextActive]}>
                Inactivos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.status === 'verified' && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, status: 'verified' })}
            >
              <Text style={[styles.filterChipText, filters.status === 'verified' && styles.filterChipTextActive]}>
                Verificados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.status === 'blocked' && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, status: 'blocked' })}
            >
              <Text style={[styles.filterChipText, filters.status === 'blocked' && styles.filterChipTextActive]}>
                🚫 Bloqueados
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity 
            style={styles.advancedFilterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <IconSymbol 
              ios_icon_name="slider.horizontal.3" 
              android_material_icon_name="tune" 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="person.slash" 
              android_material_icon_name="person_off" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            <Text style={styles.emptySubtext}>Intenta ajustar tus filtros</Text>
            <TouchableOpacity style={buttonStyles.secondary} onPress={clearFilters}>
              <Text style={buttonStyles.secondaryText}>Limpiar Filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Usuario</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Balance MXI</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Refs</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estado</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.5 }]}></Text>
            </View>

            {/* Table Rows */}
            {filteredUsers.map((userData, index) => (
              <TouchableOpacity
                key={userData.id}
                style={[
                  styles.tableRow,
                  userData.is_blocked && styles.blockedRow,
                  index % 2 === 0 && styles.tableRowEven,
                ]}
                onPress={() => handleUserPress(userData)}
              >
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <View style={styles.userInfoCell}>
                    <View style={[
                      styles.userAvatarSmall,
                      userData.is_blocked && styles.blockedAvatar
                    ]}>
                      <IconSymbol 
                        ios_icon_name={userData.is_blocked ? "person.slash" : "person.fill"} 
                        android_material_icon_name={userData.is_blocked ? "person_off" : "person"}
                        size={16} 
                        color={userData.is_blocked ? colors.error : colors.primary} 
                      />
                    </View>
                    <View style={styles.userTextCell}>
                      <Text style={styles.tableCellText} numberOfLines={1}>{userData.name}</Text>
                      <Text style={styles.tableCellSubtext} numberOfLines={1}>{userData.email}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <Text style={styles.tableCellText}>{formatNumber(getTotalMxiBalance(userData))}</Text>
                  <Text style={styles.tableCellSubtext}>
                    ${formatNumber(userData.usdt_contributed)}
                  </Text>
                </View>

                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text style={styles.tableCellText}>{userData.active_referrals}</Text>
                </View>

                <View style={[styles.tableCell, { flex: 1 }]}>
                  {userData.is_blocked ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.error }]}>BLOQ</Text>
                    </View>
                  ) : userData.is_active_contributor ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.success }]}>ACT</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>INAC</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.tableCell, { flex: 0.5 }]}>
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron_right" 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
              {/* User Header */}
              <View style={[commonStyles.card, styles.userHeaderCard]}>
                <View style={styles.userHeaderInfo}>
                  <Text style={styles.userHeaderName}>{selectedUser.name}</Text>
                  <Text style={styles.userHeaderEmail}>{selectedUser.email}</Text>
                  <Text style={styles.userHeaderCode}>Código: {selectedUser.referral_code}</Text>
                </View>
                {selectedUser.is_blocked && (
                  <View style={styles.blockedBadge}>
                    <IconSymbol 
                      ios_icon_name="exclamationmark.triangle.fill" 
                      android_material_icon_name="warning" 
                      size={20} 
                      color={colors.error} 
                    />
                    <Text style={styles.blockedBadgeText}>BLOQUEADO</Text>
                  </View>
                )}
              </View>

              {/* Real-time Balance */}
              <View style={commonStyles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>💎 Balance en Tiempo Real</Text>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>EN VIVO</Text>
                  </View>
                </View>

                <View style={styles.balanceGrid}>
                  <TouchableOpacity 
                    style={styles.balanceCard}
                    onPress={() => openEditModal('mxi_purchased_directly', selectedUser.mxi_purchased_directly)}
                  >
                    <IconSymbol 
                      ios_icon_name="cart.fill" 
                      android_material_icon_name="shopping_cart" 
                      size={24} 
                      color={colors.primary} 
                    />
                    <Text style={styles.balanceValue}>{formatNumber(selectedUser.mxi_purchased_directly)}</Text>
                    <Text style={styles.balanceLabel}>MXI Comprados</Text>
                    <IconSymbol 
                      ios_icon_name="pencil.circle" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.balanceCard}
                    onPress={() => openEditModal('mxi_from_unified_commissions', selectedUser.mxi_from_unified_commissions)}
                  >
                    <IconSymbol 
                      ios_icon_name="person.3.fill" 
                      android_material_icon_name="group" 
                      size={24} 
                      color={colors.success} 
                    />
                    <Text style={styles.balanceValue}>{formatNumber(selectedUser.mxi_from_unified_commissions)}</Text>
                    <Text style={styles.balanceLabel}>MXI Comisiones</Text>
                    <IconSymbol 
                      ios_icon_name="pencil.circle" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.balanceCard}
                    onPress={() => openEditModal('mxi_from_challenges', selectedUser.mxi_from_challenges)}
                  >
                    <IconSymbol 
                      ios_icon_name="trophy.fill" 
                      android_material_icon_name="emoji_events" 
                      size={24} 
                      color={colors.warning} 
                    />
                    <Text style={styles.balanceValue}>{formatNumber(selectedUser.mxi_from_challenges)}</Text>
                    <Text style={styles.balanceLabel}>MXI Retos</Text>
                    <IconSymbol 
                      ios_icon_name="pencil.circle" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.balanceCard}
                    onPress={() => openEditModal('mxi_vesting_locked', selectedUser.mxi_vesting_locked)}
                  >
                    <IconSymbol 
                      ios_icon_name="lock.fill" 
                      android_material_icon_name="lock" 
                      size={24} 
                      color={colors.accent} 
                    />
                    <Text style={styles.balanceValue}>{formatNumber(selectedUser.mxi_vesting_locked)}</Text>
                    <Text style={styles.balanceLabel}>MXI Vesting</Text>
                    <IconSymbol 
                      ios_icon_name="pencil.circle" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.totalBalanceRow}>
                  <Text style={styles.totalBalanceLabel}>Balance Total:</Text>
                  <Text style={styles.totalBalanceValue}>{formatNumber(getTotalMxiBalance(selectedUser))} MXI</Text>
                </View>
              </View>

              {/* Referral Metrics */}
              {referralMetrics && (
                <View style={commonStyles.card}>
                  <Text style={styles.sectionTitle}>📊 Métricas de Referidos</Text>
                  
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Total Referidos</Text>
                      <Text style={styles.metricValue}>{referralMetrics.total_referrals}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Activos</Text>
                      <Text style={styles.metricValue}>{referralMetrics.active_referrals}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Nivel 1</Text>
                      <Text style={styles.metricValue}>{referralMetrics.level_1_count}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Nivel 2</Text>
                      <Text style={styles.metricValue}>{referralMetrics.level_2_count}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Nivel 3</Text>
                      <Text style={styles.metricValue}>{referralMetrics.level_3_count}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Promedio MXI</Text>
                      <Text style={styles.metricValue}>{formatNumber(referralMetrics.average_mxi_per_referral)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Editable Fields */}
              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>✏️ Campos Editables</Text>
                
                <TouchableOpacity 
                  style={styles.editableRow}
                  onPress={() => openEditModal('name', selectedUser.name)}
                >
                  <Text style={styles.editableLabel}>Nombre</Text>
                  <View style={styles.editableValue}>
                    <Text style={styles.editableText}>{selectedUser.name}</Text>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.primary} 
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.editableRow}
                  onPress={() => openEditModal('email', selectedUser.email)}
                >
                  <Text style={styles.editableLabel}>Correo</Text>
                  <View style={styles.editableValue}>
                    <Text style={styles.editableText}>{selectedUser.email}</Text>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.primary} 
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.editableRow}
                  onPress={() => openEditModal('id_number', selectedUser.id_number)}
                >
                  <Text style={styles.editableLabel}>Número de ID</Text>
                  <View style={styles.editableValue}>
                    <Text style={styles.editableText}>{selectedUser.id_number}</Text>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.primary} 
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.editableRow}
                  onPress={() => openEditModal('address', selectedUser.address)}
                >
                  <Text style={styles.editableLabel}>Dirección</Text>
                  <View style={styles.editableValue}>
                    <Text style={styles.editableText} numberOfLines={1}>{selectedUser.address}</Text>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.primary} 
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.editableRow}
                  onPress={() => openEditModal('usdt_contributed', selectedUser.usdt_contributed)}
                >
                  <Text style={styles.editableLabel}>USDT Contribuido</Text>
                  <View style={styles.editableValue}>
                    <Text style={styles.editableText}>${formatNumber(selectedUser.usdt_contributed)}</Text>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.primary} 
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.editableRow}
                  onPress={() => openEditModal('active_referrals', selectedUser.active_referrals)}
                >
                  <Text style={styles.editableLabel}>Referidos Activos</Text>
                  <View style={styles.editableValue}>
                    <Text style={styles.editableText}>{selectedUser.active_referrals}</Text>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={16} 
                      color={colors.primary} 
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={commonStyles.card}>
                <Text style={styles.sectionTitle}>⚙️ Acciones</Text>
                
                {selectedUser.is_blocked ? (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { backgroundColor: colors.success }]}
                    onPress={() => handleUnblockUser(selectedUser.id)}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <IconSymbol 
                          ios_icon_name="checkmark.circle.fill" 
                          android_material_icon_name="check_circle" 
                          size={20} 
                          color="#000" 
                        />
                        <Text style={buttonStyles.primaryText}>Desbloquear Usuario</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { backgroundColor: colors.error, marginBottom: 12 }]}
                    onPress={() => handleBlockUser(selectedUser.id)}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <IconSymbol 
                          ios_icon_name="xmark.circle.fill" 
                          android_material_icon_name="block" 
                          size={20} 
                          color="#fff" 
                        />
                        <Text style={[buttonStyles.primaryText, { color: '#fff' }]}>Bloquear Usuario</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Advanced Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtros Avanzados</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Balance MXI</Text>
                <View style={styles.filterInputRow}>
                  <View style={styles.filterInputContainer}>
                    <Text style={styles.filterInputLabel}>Mínimo</Text>
                    <TextInput
                      style={styles.filterInput}
                      value={filters.minMxi}
                      onChangeText={(text) => setFilters({ ...filters, minMxi: text })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.filterInputContainer}>
                    <Text style={styles.filterInputLabel}>Máximo</Text>
                    <TextInput
                      style={styles.filterInput}
                      value={filters.maxMxi}
                      onChangeText={(text) => setFilters({ ...filters, maxMxi: text })}
                      keyboardType="decimal-pad"
                      placeholder="∞"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Referidos</Text>
                <View style={styles.filterInputRow}>
                  <View style={styles.filterInputContainer}>
                    <Text style={styles.filterInputLabel}>Mínimo</Text>
                    <TextInput
                      style={styles.filterInput}
                      value={filters.minReferrals}
                      onChangeText={(text) => setFilters({ ...filters, minReferrals: text })}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.filterInputContainer}>
                    <Text style={styles.filterInputLabel}>Máximo</Text>
                    <TextInput
                      style={styles.filterInput}
                      value={filters.maxReferrals}
                      onChangeText={(text) => setFilters({ ...filters, maxReferrals: text })}
                      keyboardType="number-pad"
                      placeholder="∞"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={[buttonStyles.secondary, { flex: 1 }]}
                  onPress={() => {
                    clearFilters();
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={buttonStyles.secondaryText}>Limpiar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={buttonStyles.primaryText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Field Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Editar {getFieldLabel(editField)}</Text>
            
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Ingresa ${getFieldLabel(editField).toLowerCase()}`}
              placeholderTextColor={colors.textSecondary}
              keyboardType={
                ['mxi_purchased_directly', 'mxi_from_unified_commissions', 'mxi_from_challenges', 'mxi_vesting_locked', 'usdt_contributed', 'yield_rate_per_minute', 'accumulated_yield'].includes(editField)
                  ? 'decimal-pad'
                  : ['active_referrals'].includes(editField)
                  ? 'number-pad'
                  : 'default'
              }
            />

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[buttonStyles.secondary, { flex: 1 }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={buttonStyles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleSaveEdit}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={buttonStyles.primaryText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Link Referral Modal */}
      <Modal
        visible={linkReferralModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLinkReferralModalVisible(false)}
      >
        <View style={styles.linkModalOverlay}>
          <View style={styles.linkModalContent}>
            <View style={styles.linkModalHeader}>
              <Text style={styles.linkModalTitle}>🔗 Vincular Referido</Text>
              <TouchableOpacity onPress={() => setLinkReferralModalVisible(false)}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.linkInputContainer}>
              <Text style={styles.linkInputLabel}>Correo del Referido</Text>
              <TextInput
                style={styles.linkInput}
                value={referralEmail}
                onChangeText={setReferralEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.linkInputContainer}>
              <Text style={styles.linkInputLabel}>Código del Referidor</Text>
              <TextInput
                style={styles.linkInput}
                value={referrerCode}
                onChangeText={setReferrerCode}
                placeholder="MXI123456"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={buttonStyles.primary}
              onPress={handleLinkReferral}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <IconSymbol 
                    ios_icon_name="link.circle.fill" 
                    android_material_icon_name="link" 
                    size={20} 
                    color="#000" 
                  />
                  <Text style={buttonStyles.primaryText}>Vincular Referido</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  linkReferralButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#000',
  },
  advancedFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: colors.background,
  },
  blockedRow: {
    opacity: 0.6,
    backgroundColor: colors.error + '10',
  },
  tableCell: {
    justifyContent: 'center',
  },
  userInfoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedAvatar: {
    backgroundColor: colors.error + '20',
  },
  userTextCell: {
    flex: 1,
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tableCellSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
  userHeaderCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userHeaderInfo: {
    alignItems: 'center',
  },
  userHeaderName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userHeaderEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userHeaderCode: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  blockedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  balanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  totalBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  editableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editableLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 2,
    justifyContent: 'flex-end',
  },
  editableText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterInputContainer: {
    flex: 1,
  },
  filterInputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  editInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  editModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  linkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  linkModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  linkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  linkModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  linkInputContainer: {
    marginBottom: 20,
  },
  linkInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  linkInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
});
