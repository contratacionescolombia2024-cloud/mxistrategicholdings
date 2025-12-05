
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';

interface Payment {
  id: string;
  tx_hash: string;
  usdt: number;
  mxi: number;
  estado: string;
  pay_currency: string;
  created_at: string;
}

const NETWORK_INFO: Record<string, { name: string; color: string; icon: string }> = {
  usdterc20: { name: 'Ethereum (ERC20)', color: '#627EEA', icon: 'Ξ' },
  usdtbep20: { name: 'BNB Chain (BEP20)', color: '#F3BA2F', icon: 'B' },
  usdtmatic: { name: 'Polygon (Matic)', color: '#8247E5', icon: 'P' },
};

export default function HistorialPagosUSDTScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await fetch(
        `https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/get-user-payments/payments/${user?.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const copyTxHash = async (txHash: string) => {
    try {
      await Clipboard.setStringAsync(txHash);
      Alert.alert('✅ Copiado', 'Hash de transacción copiado al portapapeles');
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return colors.success;
      case 'pending':
      case 'pocas_confirmaciones':
        return colors.warning;
      case 'tx_not_found':
      case 'monto_insuficiente':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return 'Confirmado';
      case 'pending':
        return 'Pendiente';
      case 'pocas_confirmaciones':
        return 'Pocas Confirmaciones';
      case 'tx_not_found':
        return 'No Encontrada';
      case 'monto_insuficiente':
        return 'Monto Insuficiente';
      case 'ya_procesado':
        return 'Ya Procesado';
      default:
        return estado;
    }
  };

  const getNetworkInfo = (payCurrency: string) => {
    return NETWORK_INFO[payCurrency] || { name: 'Desconocida', color: colors.textSecondary, icon: '?' };
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
          <Text style={styles.headerTitle}>Historial de Pagos</Text>
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
        <Text style={styles.headerTitle}>Historial de Pagos</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="doc.text"
            android_material_icon_name="description"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            No tienes pagos registrados aún.{'\n'}
            Realiza tu primer pago en USDT para comenzar.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/(home)/pagar-usdt')}
          >
            <Text style={styles.emptyButtonText}>Pagar en USDT</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
          {payments.map((payment, index) => {
            const networkInfo = getNetworkInfo(payment.pay_currency);
            
            return (
              <View key={index} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentAmounts}>
                    <Text style={styles.usdtAmount}>
                      {payment.usdt.toFixed(2)} USDT
                    </Text>
                    <Text style={styles.mxiAmount}>
                      → {payment.mxi.toFixed(2)} MXI
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payment.estado) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(payment.estado)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Red:</Text>
                  <View style={styles.networkBadge}>
                    <View style={[styles.networkDot, { backgroundColor: networkInfo.color }]}>
                      <Text style={styles.networkDotText}>{networkInfo.icon}</Text>
                    </View>
                    <Text style={[styles.paymentValue, { color: networkInfo.color }]}>
                      {networkInfo.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Fecha:</Text>
                  <Text style={styles.paymentValue}>
                    {new Date(payment.created_at).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.txHashContainer}>
                  <Text style={styles.txHashLabel}>Transaction Hash:</Text>
                  <View style={styles.txHashRow}>
                    <Text style={styles.txHashText} numberOfLines={1} ellipsizeMode="middle">
                      {payment.tx_hash}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyTxHash(payment.tx_hash)}
                    >
                      <IconSymbol
                        ios_icon_name="doc.on.doc.fill"
                        android_material_icon_name="content_copy"
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  paymentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentAmounts: {
    flex: 1,
  },
  usdtAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  mxiAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  txHashContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  txHashLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  txHashRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txHashText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
});
