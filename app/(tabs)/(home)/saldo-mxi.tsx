
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SaldoMXIScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [saldoMxi, setSaldoMxi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSaldo();
  }, []);

  const loadSaldo = async () => {
    try {
      const response = await fetch(
        `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/get-user-saldo/user/${user?.id}/saldo`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.saldo_mxi !== undefined) {
        setSaldoMxi(data.saldo_mxi);
      }
    } catch (error) {
      console.error('Error loading saldo:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSaldo();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
          <Text style={styles.headerTitle}>Saldo MXI</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Text style={styles.headerTitle}>Saldo MXI</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="account_balance_wallet"
              size={64}
              color={colors.primary}
            />
            <Text style={styles.balanceLabel}>Saldo Actual</Text>
          </View>
          <Text style={styles.balanceValue}>
            {saldoMxi.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} MXI
          </Text>
          <Text style={styles.balanceSubtext}>
            Saldo interno simulado
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.infoTitle}>Acerca de tu Saldo MXI</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Este es tu saldo interno de MXI obtenido mediante pagos en USDT ERC20
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Tasa de conversión: 1 USDT = 2.5 MXI
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Los pagos se verifican automáticamente en la blockchain de Ethereum
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Se requieren al menos 3 confirmaciones para acreditar el saldo
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Acciones Rápidas</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(home)/pagar-usdt')}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add_circle"
              size={32}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Agregar Saldo</Text>
              <Text style={styles.actionSubtitle}>Pagar con USDT ERC20</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(home)/historial-pagos-usdt')}
          >
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="history"
              size={32}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Historial de Pagos</Text>
              <Text style={styles.actionSubtitle}>Ver transacciones</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBullet: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
