
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
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminUserManagement } from '@/components/AdminUserManagement';
import { AdminMetricsDashboard } from '@/components/AdminMetricsDashboard';

interface UserData {
  id: string;
  name: string;
  email: string;
  id_number: string;
  address: string;
  mxi_balance: number;
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
  mxi_purchased_directly: number;
  mxi_from_unified_commissions: number;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
}

export default function UserManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      Alert.alert(t('error'), t('failedToLoadSettings'));
    } finally {
      setLoading(false);
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
    console.log('User pressed:', userData.name, userData.id);
    setSelectedUser(userData);
    setDetailsModalVisible(true);
  };

  const handleBlockUser = async (userId: string, reason?: string) => {
    if (!user) return;

    Alert.alert(
      t('blockUser'),
      t('blockUserConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('block'),
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const { data, error } = await supabase.rpc('block_user_account', {
                p_user_id: userId,
                p_admin_id: user.id,
                p_reason: reason || t('blockedByAdmin')
              });

              if (error) throw error;

              if (data?.success) {
                Alert.alert(t('success'), t('userBlockedSuccess'));
                await loadUsers();
                setDetailsModalVisible(false);
              } else {
                Alert.alert(t('error'), data?.error || t('errorBlockingUser'));
              }
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert(t('error'), t('errorBlockingUser'));
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async (userId: string) => {
    if (!user) return;

    Alert.alert(
      t('unblockUser'),
      t('unblockUserConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('unblock'),
          onPress: async () => {
            try {
              setProcessing(true);
              const { data, error } = await supabase.rpc('unblock_user_account', {
                p_user_id: userId,
                p_admin_id: user.id
              });

              if (error) throw error;

              if (data?.success) {
                Alert.alert(t('success'), t('userUnblockedSuccess'));
                await loadUsers();
                setDetailsModalVisible(false);
              } else {
                Alert.alert(t('error'), data?.error || t('errorUnblockingUser'));
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert(t('error'), t('errorUnblockingUser'));
            } finally {
              setProcessing(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingUsers')}</Text>
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
          <Text style={styles.title}>{t('userManagement')}</Text>
          <Text style={styles.subtitle}>{filteredUsers.length} {t('users')}</Text>
        </View>
        <TouchableOpacity
          style={styles.metricsButton}
          onPress={() => setShowMetrics(!showMetrics)}
        >
          <IconSymbol 
            ios_icon_name={showMetrics ? "list.bullet" : "chart.bar.fill"} 
            android_material_icon_name={showMetrics ? "list" : "bar_chart"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {showMetrics ? (
        <AdminMetricsDashboard />
      ) : (
        <>
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
                placeholder={t('searchPlaceholder')}
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
                  {t('all')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, filterStatus === 'active' && styles.filterButtonActive]}
                onPress={() => setFilterStatus('active')}
              >
                <Text style={[styles.filterButtonText, filterStatus === 'active' && styles.filterButtonTextActive]}>
                  {t('actives')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, filterStatus === 'inactive' && styles.filterButtonActive]}
                onPress={() => setFilterStatus('inactive')}
              >
                <Text style={[styles.filterButtonText, filterStatus === 'inactive' && styles.filterButtonTextActive]}>
                  {t('inactive')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, filterStatus === 'blocked' && styles.filterButtonActive]}
                onPress={() => setFilterStatus('blocked')}
              >
                <Text style={[styles.filterButtonText, filterStatus === 'blocked' && styles.filterButtonTextActive]}>
                  {t('blocked')}
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
                <Text style={styles.emptyText}>{t('noUsersFound')}</Text>
                <Text style={styles.emptySubtext}>{t('adjustSearchFilters')}</Text>
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
                  activeOpacity={0.7}
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
                        <Text style={styles.userCode}>{t('referralCode')}: {userData.referral_code}</Text>
                      </View>
                    </View>
                    <View style={styles.userBadges}>
                      {userData.is_blocked && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.error }]}>{t('blocked').toUpperCase()}</Text>
                        </View>
                      )}
                      {!userData.is_blocked && userData.is_active_contributor && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.success }]}>{t('active')}</Text>
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
                      <Text style={styles.userStatValue}>{parseFloat(userData.mxi_balance.toString()).toFixed(2)} MXI</Text>
                    </View>
                    <View style={styles.userStat}>
                      <IconSymbol 
                        ios_icon_name="dollarsign.circle" 
                        android_material_icon_name="attach_money" 
                        size={16} 
                        color={colors.success} 
                      />
                      <Text style={styles.userStatValue}>${parseFloat(userData.usdt_contributed.toString()).toFixed(2)}</Text>
                    </View>
                    <View style={styles.userStat}>
                      <IconSymbol 
                        ios_icon_name="person.2" 
                        android_material_icon_name="group" 
                        size={16} 
                        color={colors.warning} 
                      />
                      <Text style={styles.userStatValue}>{userData.active_referrals} {t('refs')}</Text>
                    </View>
                  </View>

                  <View style={styles.userFooter}>
                    <Text style={styles.userJoinDate}>{t('joined')} {formatDate(userData.joined_date)}</Text>
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
        </>
      )}

      {/* User Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={false}
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
            <Text style={styles.modalTitle}>{t('userDetails')}</Text>
            <View style={{ width: 32 }} />
          </View>

          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <AdminUserManagement
                userId={selectedUser.id}
                userName={selectedUser.name}
                userEmail={selectedUser.email}
                onUpdate={loadUsers}
              />

              {/* Block/Unblock Actions */}
              <View style={styles.dangerZone}>
                <Text style={styles.dangerZoneTitle}>{t('dangerZone')}</Text>
                {selectedUser.is_blocked ? (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { backgroundColor: colors.success }]}
                    onPress={() => handleUnblockUser(selectedUser.id)}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={buttonStyles.primaryText}>{t('unblockUser')}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { backgroundColor: colors.error }]}
                    onPress={() => handleBlockUser(selectedUser.id)}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={buttonStyles.primaryText}>{t('blockUser')}</Text>
                    )}
                  </TouchableOpacity>
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
  metricsButton: {
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
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingBottom: 100,
  },
  dangerZone: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 12,
  },
});
