
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function ManualPaymentCredit() {
  const { session } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchPayment = async () => {
    if (!orderId.trim()) {
      Alert.alert('Error', 'Por favor ingresa un Order ID');
      return;
    }

    setSearchLoading(true);
    setPaymentDetails(null);

    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          users (
            id,
            email,
            name,
            mxi_balance,
            usdt_contributed
          )
        `)
        .eq('order_id', orderId.trim())
        .single();

      if (paymentError || !payment) {
        Alert.alert('Error', 'Pago no encontrado');
        return;
      }

      setPaymentDetails(payment);
    } catch (error: any) {
      console.error('Error searching payment:', error);
      Alert.alert('Error', error.message || 'Error al buscar el pago');
    } finally {
      setSearchLoading(false);
    }
  };

  const verifyAndCreditPayment = async () => {
    if (!paymentDetails || !session) return;

    Alert.alert(
      'Confirmar Verificación y Acreditación',
      `¿Estás seguro de que deseas verificar y acreditar este pago?\n\n` +
      `Usuario: ${paymentDetails.users.email}\n` +
      `Monto: ${paymentDetails.mxi_amount} MXI\n\n` +
      `Esta acción verificará el estado del pago con NOWPayments y lo acreditará si está confirmado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Verificar y Acreditar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('🔍 Admin verifying payment:', orderId.trim());

              const response = await fetch(
                'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/manual-verify-payment',
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    order_id: orderId.trim(),
                  }),
                }
              );

              const data = await response.json();
              console.log('✅ Verification response:', data);

              if (data.success) {
                if (data.credited) {
                  Alert.alert(
                    '✅ Pago Acreditado',
                    `El pago ha sido verificado y acreditado exitosamente.\n\n` +
                    `${data.payment.mxi_amount} MXI han sido agregados a la cuenta del usuario.\n\n` +
                    `Nuevo balance: ${data.payment.new_balance} MXI`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setOrderId('');
                          setPaymentDetails(null);
                        },
                      },
                    ]
                  );
                } else if (data.already_credited) {
                  Alert.alert(
                    'ℹ️ Ya Acreditado',
                    'Este pago ya ha sido acreditado anteriormente.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setOrderId('');
                          setPaymentDetails(null);
                        },
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    'ℹ️ Estado Actualizado',
                    `Estado del pago: ${data.payment.status}\n\n` +
                    `El pago aún no ha sido confirmado por NOWPayments. No se puede acreditar en este momento.`,
                    [{ text: 'OK' }]
                  );
                }
              } else {
                Alert.alert('Error', data.error || 'Error al verificar el pago');
              }
            } catch (error: any) {
              console.error('❌ Error verifying payment:', error);
              Alert.alert('Error', error.message || 'Error al verificar el pago');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finished':
        return '#4CAF50';
      case 'waiting':
      case 'pending':
        return '#FF9800';
      case 'failed':
      case 'expired':
        return '#F44336';
      default:
        return colors.text;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verificación y Acreditación Manual</Text>
        <Text style={styles.subtitle}>
          Usa esta herramienta para verificar y acreditar manualmente pagos que no fueron procesados automáticamente.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <IconSymbol
          ios_icon_name="info.circle.fill"
          android_material_icon_name="info"
          size={24}
          color={colors.primary}
        />
        <Text style={styles.infoText}>
          Esta herramienta verifica el estado del pago con NOWPayments y lo acredita automáticamente si está confirmado.
        </Text>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.label}>Order ID</Text>
        <TextInput
          style={styles.input}
          value={orderId}
          onChangeText={setOrderId}
          placeholder="MXI-1764082913255-cop99k"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.button, searchLoading && styles.buttonDisabled]}
          onPress={searchPayment}
          disabled={searchLoading}
        >
          {searchLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color="#000000"
              />
              <Text style={styles.buttonText}>Buscar Pago</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {paymentDetails && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detalles del Pago</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>{paymentDetails.order_id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment ID:</Text>
            <Text style={styles.detailValue}>{paymentDetails.payment_id || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(paymentDetails.status) }]}>
              {paymentDetails.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado de Pago:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(paymentDetails.payment_status) }]}>
              {paymentDetails.payment_status?.toUpperCase() || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monto USD:</Text>
            <Text style={styles.detailValue}>${paymentDetails.price_amount}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monto MXI:</Text>
            <Text style={styles.detailValue}>{paymentDetails.mxi_amount} MXI</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Precio por MXI:</Text>
            <Text style={styles.detailValue}>${paymentDetails.price_per_mxi}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fase:</Text>
            <Text style={styles.detailValue}>{paymentDetails.phase}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Creado:</Text>
            <Text style={styles.detailValue}>
              {new Date(paymentDetails.created_at).toLocaleString()}
            </Text>
          </View>

          {paymentDetails.confirmed_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confirmado:</Text>
              <Text style={styles.detailValue}>
                {new Date(paymentDetails.confirmed_at).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Información del Usuario</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{paymentDetails.users.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nombre:</Text>
            <Text style={styles.detailValue}>{paymentDetails.users.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Balance MXI Actual:</Text>
            <Text style={styles.detailValue}>{paymentDetails.users.mxi_balance} MXI</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>USDT Contribuido:</Text>
            <Text style={styles.detailValue}>${paymentDetails.users.usdt_contributed}</Text>
          </View>

          <View style={styles.divider} />

          {paymentDetails.status === 'confirmed' || paymentDetails.status === 'finished' ? (
            <View style={styles.warningBox}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color="#4CAF50"
              />
              <Text style={styles.successText}>
                ✅ Este pago ya ha sido acreditado. No se puede acreditar nuevamente.
              </Text>
            </View>
          ) : !paymentDetails.payment_id ? (
            <View style={styles.warningBox}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={24}
                color="#FF9800"
              />
              <Text style={styles.warningText}>
                ⚠️ Este pago no tiene un Payment ID. No se puede verificar con NOWPayments.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.actionInfoBox}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.actionInfoText}>
                  Al verificar este pago:{'\n'}
                  • Se consultará el estado con NOWPayments{'\n'}
                  • Si está confirmado, se agregarán {paymentDetails.mxi_amount} MXI al usuario{'\n'}
                  • Se actualizarán las métricas globales{'\n'}
                  • El estado del pago cambiará a "confirmed"{'\n'}
                  • Esta acción no se puede deshacer
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.creditButton, loading && styles.buttonDisabled]}
                onPress={verifyAndCreditPayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.buttonText}>Verificar y Acreditar Pago</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        <Text style={styles.instructionText}>
          1. Ingresa el Order ID del pago que deseas verificar{'\n'}
          2. Haz clic en "Buscar Pago" para ver los detalles{'\n'}
          3. Verifica que la información sea correcta{'\n'}
          4. Haz clic en "Verificar y Acreditar Pago" para procesar{'\n'}
          {'\n'}
          <Text style={styles.warningText}>
            ⚠️ Advertencia: Esta herramienta verifica automáticamente con NOWPayments antes de acreditar.
            Solo acreditará si el pago está confirmado en NOWPayments.
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  searchSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  actionInfoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  actionInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FF9800' + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FF9800',
    lineHeight: 20,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#4CAF50',
    lineHeight: 20,
  },
  creditButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  instructionsSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
