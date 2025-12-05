
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  updated_at: string;
}

interface MetricsSetting {
  id: string;
  field: string;
  value: number;
  label: string;
  editable: boolean;
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [metricsSettings, setMetricsSettings] = useState<MetricsSetting[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricsSetting | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load admin settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('admin_settings')
        .select('*')
        .order('setting_key');

      if (settingsError) throw settingsError;
      setSettings(settingsData || []);

      // Load metrics settings
      const { data: metricsData, error: metricsError } = await supabase
        .from('metrics')
        .select('*')
        .single();

      if (metricsError) throw metricsError;

      if (metricsData) {
        setMetricsSettings([
          {
            id: metricsData.id,
            field: 'current_price_usdt',
            value: parseFloat(metricsData.current_price_usdt?.toString() || '0'),
            label: 'Current MXI Price (USDT)',
            editable: true,
          },
          {
            id: metricsData.id,
            field: 'current_phase',
            value: metricsData.current_phase || 1,
            label: 'Current Phase',
            editable: true,
          },
          {
            id: metricsData.id,
            field: 'total_tokens_sold',
            value: parseFloat(metricsData.total_tokens_sold?.toString() || '0'),
            label: 'Total Tokens Sold',
            editable: true,
          },
          {
            id: metricsData.id,
            field: 'total_members',
            value: metricsData.total_members || 0,
            label: 'Total Pool Members',
            editable: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  const handleEditSetting = (setting: Setting) => {
    setSelectedSetting(setting);
    setSelectedMetric(null);
    const value = setting.setting_value?.value ?? setting.setting_value;
    setEditValue(value.toString());
    setEditModalVisible(true);
  };

  const handleEditMetric = (metric: MetricsSetting) => {
    setSelectedMetric(metric);
    setSelectedSetting(null);
    setEditValue(metric.value.toString());
    setEditModalVisible(true);
  };

  const handleSaveSetting = async () => {
    if (!editValue) {
      Alert.alert('Error', 'Please enter a valid value');
      return;
    }

    try {
      setSaving(true);

      if (selectedSetting) {
        // Save admin setting
        const numValue = parseFloat(editValue);
        if (isNaN(numValue)) {
          Alert.alert('Error', 'Please enter a valid number');
          return;
        }

        let parsedValue: any;
        if (selectedSetting.setting_key === 'mxi_price') {
          parsedValue = { value: numValue, currency: 'USDT' };
        } else if (selectedSetting.setting_key === 'min_purchase' || selectedSetting.setting_key === 'max_purchase') {
          parsedValue = { value: numValue, currency: 'USDT' };
        } else {
          parsedValue = { value: numValue };
        }

        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        const { error } = await supabase
          .from('admin_settings')
          .update({
            setting_value: parsedValue,
            updated_by: adminData?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedSetting.id);

        if (error) throw error;
      } else if (selectedMetric) {
        // Save metrics setting
        const numValue = parseFloat(editValue);
        if (isNaN(numValue)) {
          Alert.alert('Error', 'Please enter a valid number');
          return;
        }

        const updateData: any = {};
        updateData[selectedMetric.field] = numValue;
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('metrics')
          .update(updateData)
          .eq('id', selectedMetric.id);

        if (error) throw error;
      }

      Alert.alert('Success', 'Setting updated successfully');
      setEditModalVisible(false);
      loadSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      Alert.alert('Error', 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const getSettingDisplayValue = (setting: Setting) => {
    const value = setting.setting_value?.value ?? setting.setting_value;
    const currency = setting.setting_value?.currency;

    if (setting.setting_key === 'mxi_price') {
      return `$${value} ${currency || 'USDT'}`;
    } else if (setting.setting_key === 'mining_rate_per_minute') {
      return `${value} MXI/min`;
    } else if (setting.setting_key.includes('purchase')) {
      return `$${value} ${currency || 'USDT'}`;
    } else if (setting.setting_key.includes('percentage')) {
      return `${value}%`;
    } else if (setting.setting_key.includes('days')) {
      return `${value} days`;
    } else {
      return value.toString();
    }
  };

  const getSettingIcon = (key: string) => {
    if (key === 'mxi_price' || key === 'current_price_usdt') return 'dollarsign.circle.fill';
    if (key === 'mining_rate_per_minute') return 'chart.line.uptrend.xyaxis';
    if (key.includes('purchase')) return 'cart.fill';
    if (key.includes('withdrawal')) return 'arrow.down.circle.fill';
    if (key.includes('referral')) return 'person.3.fill';
    if (key.includes('pool') || key.includes('members')) return 'person.2.fill';
    if (key.includes('phase')) return 'number.circle.fill';
    if (key.includes('tokens')) return 'bitcoinsign.circle.fill';
    return 'gear';
  };

  const getSettingColor = (key: string) => {
    if (key === 'mxi_price' || key === 'current_price_usdt') return colors.success;
    if (key === 'mining_rate_per_minute') return colors.primary;
    if (key.includes('withdrawal')) return colors.warning;
    if (key.includes('phase')) return colors.primary;
    return colors.textSecondary;
  };

  const isEditableSetting = (key: string) => {
    return [
      'mxi_price',
      'mining_rate_per_minute',
      'min_purchase',
      'max_purchase',
      'withdrawal_release_percentage',
      'withdrawal_release_days',
      'min_active_referrals',
    ].includes(key);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
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
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>System Settings</Text>
          <Text style={styles.subtitle}>Configure platform parameters</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Metrics Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Metrics</Text>
          <Text style={styles.sectionDescription}>
            Core platform metrics and phase information
          </Text>

          {metricsSettings.map((metric) => (
            <TouchableOpacity
              key={metric.field}
              style={[commonStyles.card, styles.settingCard]}
              onPress={() => metric.editable && handleEditMetric(metric)}
              disabled={!metric.editable}
            >
              <View style={styles.settingContent}>
                <View style={[styles.iconContainer, { backgroundColor: getSettingColor(metric.field) + '20' }]}>
                  <IconSymbol
                    name={getSettingIcon(metric.field)}
                    size={24}
                    color={getSettingColor(metric.field)}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{metric.label}</Text>
                  <Text style={styles.settingValue}>
                    {metric.field === 'current_price_usdt' ? `$${metric.value.toFixed(2)} USDT` : metric.value.toLocaleString()}
                  </Text>
                  <Text style={styles.settingKey}>{metric.field}</Text>
                </View>
                {metric.editable && (
                  <IconSymbol name="pencil.circle.fill" size={24} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Core Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Settings</Text>
          <Text style={styles.sectionDescription}>
            Critical platform configuration parameters
          </Text>

          {settings
            .filter(s => ['mxi_price', 'mining_rate_per_minute'].includes(s.setting_key))
            .map((setting) => (
              <TouchableOpacity
                key={setting.id}
                style={[commonStyles.card, styles.settingCard]}
                onPress={() => isEditableSetting(setting.setting_key) && handleEditSetting(setting)}
                disabled={!isEditableSetting(setting.setting_key)}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.iconContainer, { backgroundColor: getSettingColor(setting.setting_key) + '20' }]}>
                    <IconSymbol
                      name={getSettingIcon(setting.setting_key)}
                      size={24}
                      color={getSettingColor(setting.setting_key)}
                    />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{setting.description}</Text>
                    <Text style={styles.settingValue}>{getSettingDisplayValue(setting)}</Text>
                    <Text style={styles.settingKey}>{setting.setting_key}</Text>
                  </View>
                  {isEditableSetting(setting.setting_key) && (
                    <IconSymbol name="pencil.circle.fill" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>

        {/* Transaction Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Limits</Text>
          <Text style={styles.sectionDescription}>
            Purchase and withdrawal constraints
          </Text>

          {settings
            .filter(s => ['min_purchase', 'max_purchase'].includes(s.setting_key))
            .map((setting) => (
              <TouchableOpacity
                key={setting.id}
                style={[commonStyles.card, styles.settingCard]}
                onPress={() => isEditableSetting(setting.setting_key) && handleEditSetting(setting)}
                disabled={!isEditableSetting(setting.setting_key)}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.iconContainer, { backgroundColor: getSettingColor(setting.setting_key) + '20' }]}>
                    <IconSymbol
                      name={getSettingIcon(setting.setting_key)}
                      size={24}
                      color={getSettingColor(setting.setting_key)}
                    />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{setting.description}</Text>
                    <Text style={styles.settingValue}>{getSettingDisplayValue(setting)}</Text>
                    <Text style={styles.settingKey}>{setting.setting_key}</Text>
                  </View>
                  {isEditableSetting(setting.setting_key) && (
                    <IconSymbol name="pencil.circle.fill" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>

        {/* Withdrawal Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Settings</Text>
          <Text style={styles.sectionDescription}>
            MXI withdrawal release configuration
          </Text>

          {settings
            .filter(s => ['withdrawal_release_percentage', 'withdrawal_release_days', 'min_active_referrals'].includes(s.setting_key))
            .map((setting) => (
              <TouchableOpacity
                key={setting.id}
                style={[commonStyles.card, styles.settingCard]}
                onPress={() => isEditableSetting(setting.setting_key) && handleEditSetting(setting)}
                disabled={!isEditableSetting(setting.setting_key)}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.iconContainer, { backgroundColor: getSettingColor(setting.setting_key) + '20' }]}>
                    <IconSymbol
                      name={getSettingIcon(setting.setting_key)}
                      size={24}
                      color={getSettingColor(setting.setting_key)}
                    />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{setting.description}</Text>
                    <Text style={styles.settingValue}>{getSettingDisplayValue(setting)}</Text>
                    <Text style={styles.settingKey}>{setting.setting_key}</Text>
                  </View>
                  {isEditableSetting(setting.setting_key) && (
                    <IconSymbol name="pencil.circle.fill" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Setting</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {(selectedSetting || selectedMetric) && (
              <>
                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>
                    {selectedSetting ? selectedSetting.description : selectedMetric?.label}
                  </Text>
                  <Text style={styles.modalKey}>
                    {selectedSetting ? selectedSetting.setting_key : selectedMetric?.field}
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>New Value</Text>
                    <TextInput
                      style={styles.input}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="decimal-pad"
                      placeholder="Enter new value"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.inputHint}>
                      Current: {selectedSetting ? getSettingDisplayValue(selectedSetting) : selectedMetric?.value}
                    </Text>
                  </View>

                  <View style={styles.warningBox}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
                    <Text style={styles.warningText}>
                      Changing this setting will affect all users immediately. Please verify the value before saving.
                    </Text>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[buttonStyles.secondary, styles.modalButton]}
                    onPress={() => setEditModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={buttonStyles.secondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[buttonStyles.primary, styles.modalButton]}
                    onPress={handleSaveSetting}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={buttonStyles.primaryText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  settingCard: {
    marginBottom: 12,
    padding: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  settingKey: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modalKey: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  modalButton: {
    flex: 1,
  },
});
