
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as Clipboard2 from 'expo-clipboard';
import { supabase } from '@/lib/supabase';

const RECIPIENT_ADDRESS = '0x68F0d7c607617DA0b1a0dC7b72885E11ddFec623';
const MIN_USDT = 30;
const MAX_USDT = 500000;
const MXI_RATE = 2.5;

const NETWORKS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    label: 'ERC20',
    color: '#627EEA',
    icon: 'Ξ',
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    label: 'BEP20',
    color: '#F3BA2F',
    icon: 'B',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    label: 'Matic',
    color: '#8247E5',
    icon: 'P',
  }
];

export default function PagarUSDTScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { t } = useLanguage();
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [requestingManualVerification, setRequestingManualVerification] = useState(false);

  const copyAddress = async () => {
    try {
      await Clipboard2.setStringAsync(RECIPIENT_ADDRESS);
      Alert.alert(t('copied2'), t('addressCopiedToClipboard'));
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleVerifyPayment = async () => {
    console.log('🔍 [VERIFICAR] Iniciando verificación de pago...');
    console.log('🔍 [VERIFICAR] TxHash:', txHash);
    console.log('🔍 [VERIFICAR] Red seleccionada:', selectedNetwork);
    console.log('🔍 [VERIFICAR] Usuario ID:', user?.id);

    if (!txHash.trim()) {
      console.error('❌ [VERIFICAR] Error: Hash vacío');
      Alert.alert(t('error'), t('pleaseEnterTransactionHash'));
      return;
    }

    if (!txHash.startsWith('0x') || txHash.length !== 66) {
      console.error('❌ [VERIFICAR] Error: Hash inválido - longitud:', txHash.length);
      Alert.alert(
        t('invalidHash'),
        t('hashMustStartWith0x', { count: txHash.length })
      );
      return;
    }

    const selectedNetworkData = NETWORKS.find(n => n.id === selectedNetwork);
    console.log('🔍 [VERIFICAR] Datos de red:', selectedNetworkData);

    Alert.alert(
      t('confirmNetworkTitle'),
      t('areYouSureTransaction', { network: selectedNetworkData?.name, label: selectedNetworkData?.label }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
          onPress: () => console.log('🔍 [VERIFICAR] Verificación cancelada por el usuario')
        },
        {
          text: t('yesVerifyButton'),
          onPress: () => performVerification()
        }
      ]
    );
  };

  const performVerification = async () => {
    const requestId = Date.now().toString().substring(-6);
    console.log(`\n🚀 [${requestId}] ========== INICIANDO VERIFICACIÓN ==========`);
    console.log(`🚀 [${requestId}] Timestamp:`, new Date().toISOString());
    console.log(`🚀 [${requestId}] TxHash:`, txHash);
    console.log(`🚀 [${requestId}] Red:`, selectedNetwork);
    console.log(`🚀 [${requestId}] Usuario:`, user?.id);
    console.log(`🚀 [${requestId}] Token de sesión:`, session?.access_token ? 'Presente' : 'Ausente');

    setLoading(true);
    setVerificationStatus(t('verifying'));

    try {
      // 🔒 STEP 1: Check for duplicate hash
      console.log(`🔍 [${requestId}] Verificando hash duplicado...`);
      const { data: existingPayments, error: duplicateError } = await supabase
        .from('payments')
        .select('id, order_id, user_id, estado, mxi')
        .eq('tx_hash', txHash.trim())
        .limit(1);

      if (duplicateError) {
        console.error(`❌ [${requestId}] Error verificando duplicados:`, duplicateError);
        throw new Error(t('databaseErrorText', { message: duplicateError.message }));
      }

      if (existingPayments && existingPayments.length > 0) {
        const existingPayment = existingPayments[0];
        console.error(`❌ [${requestId}] Hash duplicado encontrado:`, existingPayment);
        
        Alert.alert(
          t('hashDuplicateTitle'),
          t('hashAlreadyRegisteredText', { order: existingPayment.order_id, status: existingPayment.estado }),
          [{ text: t('ok') }]
        );
        setLoading(false);
        setVerificationStatus('');
        return;
      }

      console.log(`✅ [${requestId}] Hash no duplicado, continuando...`);

      // STEP 2: Verify transaction on blockchain
      setVerificationStatus(t('verifying'));

      const url = 'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/verificar-tx';
      const payload = {
        txHash: txHash.trim(),
        userId: user?.id,
        network: selectedNetwork,
      };

      console.log(`📤 [${requestId}] URL:`, url);
      console.log(`📤 [${requestId}] Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(`📥 [${requestId}] Status HTTP:`, response.status);
      console.log(`📥 [${requestId}] Status Text:`, response.statusText);

      const responseText = await response.text();
      console.log(`📥 [${requestId}] Response (raw):`, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log(`📥 [${requestId}] Response (parsed):`, JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error(`❌ [${requestId}] Error parseando JSON:`, parseError);
        throw new Error(t('unknownErrorText'));
      }

      if (data.ok) {
        console.log(`✅ [${requestId}] ========== VERIFICACIÓN EXITOSA ==========`);
        console.log(`✅ [${requestId}] USDT:`, data.usdt);
        console.log(`✅ [${requestId}] MXI:`, data.mxi);
        console.log(`✅ [${requestId}] Red:`, data.network);

        Alert.alert(
          t('paymentConfirmedTitle'),
          t('paymentConfirmedText', { amount: data.mxi.toFixed(2), network: data.network, usdt: data.usdt.toFixed(2) }),
          [
            {
              text: t('viewBalance'),
              onPress: () => router.push('/(tabs)/(home)/saldo-mxi'),
            },
            {
              text: t('ok'),
              onPress: () => {
                setTxHash('');
                router.back();
              },
            },
          ]
        );
      } else {
        console.error(`❌ [${requestId}] ========== VERIFICACIÓN FALLIDA ==========`);
        console.error(`❌ [${requestId}] Error code:`, data.error);
        console.error(`❌ [${requestId}] Error message:`, data.message);

        let errorMessage = '';
        let errorTitle = t('verificationError');
        const selectedNetworkData = NETWORKS.find(n => n.id === selectedNetwork);
        
        switch (data.error) {
          case 'tx_not_found':
            errorTitle = t('transactionNotFound');
            errorMessage = t('transactionNotFoundText', { network: selectedNetworkData?.name });
            break;
          case 'pocas_confirmaciones':
            errorTitle = t('waitingConfirmations');
            errorMessage = t('waitingConfirmationsText', { 
              message: data.message || '', 
              confirmations: data.confirmations || 0, 
              required: data.required || 3 
            });
            break;
          case 'monto_insuficiente':
            errorTitle = t('insufficientAmountTitle');
            errorMessage = t('insufficientAmountText', { 
              min: MIN_USDT,
              message: data.message || '', 
              usdt: data.usdt || 0, 
              minimum: data.minimum || MIN_USDT 
            });
            break;
          case 'ya_procesado':
            errorTitle = t('alreadyProcessed');
            errorMessage = t('alreadyProcessedText');
            break;
          case 'no_transfer_found':
            errorTitle = t('invalidTransfer');
            errorMessage = t('invalidTransferText', { address: RECIPIENT_ADDRESS, network: selectedNetworkData?.name });
            break;
          case 'tx_failed':
            errorTitle = t('transactionFailed');
            errorMessage = t('transactionFailedText');
            break;
          case 'invalid_network':
            errorTitle = t('invalidNetworkTitle');
            errorMessage = data.message || t('invalidNetworkText');
            break;
          case 'rpc_not_configured':
            errorTitle = t('configurationError');
            errorMessage = t('configurationErrorText', { message: data.message });
            break;
          case 'wrong_network':
            errorTitle = t('incorrectNetwork');
            errorMessage = data.message || t('incorrectNetworkText');
            break;
          case 'no_auth':
          case 'invalid_session':
          case 'unauthorized':
            errorTitle = t('authenticationError');
            errorMessage = t('authenticationErrorText');
            break;
          case 'missing_fields':
            errorTitle = t('incompleteData');
            errorMessage = t('incompleteDataText');
            break;
          case 'database_error':
          case 'update_failed':
          case 'user_not_found':
            errorTitle = t('databaseError');
            errorMessage = t('databaseErrorText', { message: data.message || '' });
            break;
          case 'rpc_connection_failed':
            errorTitle = t('rpcConnectionError');
            errorMessage = t('rpcConnectionErrorText', { message: data.message || '' });
            break;
          case 'internal_error':
            errorTitle = t('internalError');
            errorMessage = t('internalErrorText', { message: data.message || '' });
            break;
          default:
            errorTitle = t('unknownError');
            errorMessage = data.message || t('unknownErrorText');
        }

        console.error(`❌ [${requestId}] Mostrando error al usuario:`, errorTitle);
        Alert.alert(errorTitle, errorMessage);
      }
    } catch (error: any) {
      console.error(`❌ [${requestId}] ========== ERROR DE CONEXIÓN ==========`);
      console.error(`❌ [${requestId}] Error:`, error);
      console.error(`❌ [${requestId}] Error message:`, error.message);
      console.error(`❌ [${requestId}] Error stack:`, error.stack);

      Alert.alert(
        t('connectionError'),
        t('connectionErrorText', { message: error.message })
      );
    } finally {
      setLoading(false);
      setVerificationStatus('');
      console.log(`🏁 [${requestId}] ========== VERIFICACIÓN FINALIZADA ==========\n`);
    }
  };

  // 🆕 NEW: Request Manual Verification with Transaction Hash
  const handleRequestManualVerification = async () => {
    console.log('📝 [MANUAL] Iniciando solicitud de verificación manual...');
    console.log('📝 [MANUAL] TxHash:', txHash);
    console.log('📝 [MANUAL] Red seleccionada:', selectedNetwork);
    console.log('📝 [MANUAL] Usuario ID:', user?.id);

    if (!txHash.trim()) {
      console.error('❌ [MANUAL] Error: Hash vacío');
      Alert.alert(t('error'), t('pleaseEnterTransactionHash'));
      return;
    }

    if (!txHash.startsWith('0x') || txHash.length !== 66) {
      console.error('❌ [MANUAL] Error: Hash inválido - longitud:', txHash.length);
      Alert.alert(
        t('invalidHash'),
        t('hashMustStartWith0x', { count: txHash.length })
      );
      return;
    }

    const selectedNetworkData = NETWORKS.find(n => n.id === selectedNetwork);

    Alert.alert(
      t('requestManualVerificationTitle'),
      t('doYouWantToSendManualRequest', { 
        network: selectedNetworkData?.name, 
        label: selectedNetworkData?.label,
        hash: `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`
      }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('sendRequest'),
          onPress: () => performManualVerificationRequest(),
        },
      ]
    );
  };

  const performManualVerificationRequest = async () => {
    const requestId = Date.now().toString().substring(-6);
    console.log(`\n📝 [${requestId}] ========== INICIANDO SOLICITUD MANUAL ==========`);
    console.log(`📝 [${requestId}] Timestamp:`, new Date().toISOString());
    console.log(`📝 [${requestId}] TxHash:`, txHash);
    console.log(`📝 [${requestId}] Red:`, selectedNetwork);
    console.log(`📝 [${requestId}] Usuario:`, user?.id);

    setRequestingManualVerification(true);

    try {
      // Check for duplicate hash first
      console.log(`🔍 [${requestId}] Verificando hash duplicado...`);
      const { data: existingPayments, error: duplicateError } = await supabase
        .from('payments')
        .select('id, order_id, user_id, estado, mxi')
        .eq('tx_hash', txHash.trim())
        .limit(1);

      if (duplicateError) {
        console.error(`❌ [${requestId}] Error verificando duplicados:`, duplicateError);
        throw new Error(t('databaseErrorText', { message: duplicateError.message }));
      }

      if (existingPayments && existingPayments.length > 0) {
        const existingPayment = existingPayments[0];
        console.error(`❌ [${requestId}] Hash duplicado encontrado:`, existingPayment);
        
        Alert.alert(
          t('hashDuplicateTitle'),
          t('hashAlreadyRegisteredText', { order: existingPayment.order_id, status: existingPayment.estado }),
          [{ text: t('ok') }]
        );
        setRequestingManualVerification(false);
        return;
      }

      console.log(`✅ [${requestId}] Hash no duplicado, creando solicitud...`);

      // Create a payment record with the transaction hash
      const orderId = `MXI-MANUAL-${Date.now()}`;
      const selectedNetworkData = NETWORKS.find(n => n.id === selectedNetwork);

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user?.id,
          order_id: orderId,
          tx_hash: txHash.trim(),
          price_amount: 0, // Will be filled by admin
          price_currency: 'usd',
          pay_currency: selectedNetworkData?.label.toLowerCase() || 'eth',
          mxi_amount: 0, // Will be calculated by admin
          price_per_mxi: 0.40, // Current phase price
          phase: 1, // Current phase
          status: 'pending',
          estado: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        console.error(`❌ [${requestId}] Error creando pago:`, paymentError);
        throw paymentError;
      }

      console.log(`✅ [${requestId}] Pago creado:`, paymentData);

      // Create manual verification request
      const { data: verificationData, error: verificationError } = await supabase
        .from('manual_verification_requests')
        .insert({
          payment_id: paymentData.id,
          user_id: user?.id,
          order_id: orderId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (verificationError) {
        console.error(`❌ [${requestId}] Error creando solicitud:`, verificationError);
        throw verificationError;
      }

      console.log(`✅ [${requestId}] Solicitud creada:`, verificationData);
      console.log(`✅ [${requestId}] ========== SOLICITUD MANUAL EXITOSA ==========`);

      Alert.alert(
        t('requestSentSuccessfullyTitle'),
        t('manualVerificationRequestSentText', {
          order: orderId,
          network: selectedNetworkData?.name,
          hash: `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`
        }),
        [
          {
            text: t('viewTransactions'),
            onPress: () => router.push('/(tabs)/(home)/payment-history'),
          },
          {
            text: t('ok'),
            onPress: () => {
              setTxHash('');
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(`❌ [${requestId}] ========== ERROR EN SOLICITUD MANUAL ==========`);
      console.error(`❌ [${requestId}] Error:`, error);
      console.error(`❌ [${requestId}] Error message:`, error.message);

      Alert.alert(
        t('errorSendingRequestTitle'),
        t('couldNotSendVerificationRequestText', { error: error.message, code: error.code || 'N/A' }),
        [{ text: t('ok') }]
      );
    } finally {
      setRequestingManualVerification(false);
      console.log(`🏁 [${requestId}] ========== SOLICITUD MANUAL FINALIZADA ==========\n`);
    }
  };

  const selectedNetworkData = NETWORKS.find(n => n.id === selectedNetwork);

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
        <Text style={styles.headerTitle}>{t('payInUSDT')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.networkCard, { borderColor: selectedNetworkData?.color }]}>
          <Text style={styles.networkTitle}>{t('selectPaymentNetwork')}</Text>
          <Text style={styles.networkSubtitle}>
            {t('eachNetworkValidatesIndependently')}
          </Text>
          <View style={styles.networkButtons}>
            {NETWORKS.map((network, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.networkButton,
                  selectedNetwork === network.id && {
                    backgroundColor: network.color + '30',
                    borderColor: network.color,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => {
                  console.log('🌐 [RED] Cambiando red a:', network.id);
                  setSelectedNetwork(network.id);
                }}
              >
                <View style={[styles.networkIcon, { backgroundColor: network.color }]}>
                  <Text style={styles.networkIconText}>{network.icon}</Text>
                </View>
                <View style={styles.networkInfo}>
                  <Text style={styles.networkName}>{network.name}</Text>
                  <Text style={styles.networkLabel}>{network.label}</Text>
                  <Text style={styles.networkDescription}>
                    {t('networkDescription', { network: network.name })}
                  </Text>
                </View>
                {selectedNetwork === network.id && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={24}
                    color={network.color}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.validationCard, { backgroundColor: selectedNetworkData?.color + '15', borderColor: selectedNetworkData?.color }]}>
          <View style={styles.validationHeader}>
            <IconSymbol
              ios_icon_name="shield.checkmark.fill"
              android_material_icon_name="verified_user"
              size={32}
              color={selectedNetworkData?.color}
            />
            <View style={styles.validationInfo}>
              <Text style={[styles.validationTitle, { color: selectedNetworkData?.color }]}>
                {t('validationIn', { network: selectedNetworkData?.name })}
              </Text>
              <Text style={styles.validationText}>
                {t('paymentsOnlyValidatedOnNetwork', { network: selectedNetworkData?.name })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.infoTitle}>{t('paymentInstructions')}</Text>
          </View>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                {t('selectNetworkYouWillUse', { label: selectedNetworkData?.label })}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                {t('sendUSDTFromAnyWallet')}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                {t('minimumAmountLabel', { min: MIN_USDT })}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                {t('copyTransactionHash')}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>5</Text>
              <Text style={styles.stepText}>
                {t('pasteHashAndVerify')}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>6</Text>
              <Text style={styles.stepText}>
                {t('youWillReceiveMXI', { rate: MXI_RATE })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>
            {t('recipientAddress', { label: selectedNetworkData?.label })}
          </Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
              {RECIPIENT_ADDRESS}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyAddress}
            >
              <IconSymbol
                ios_icon_name="doc.on.doc.fill"
                android_material_icon_name="content_copy"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.addressWarningBox, { backgroundColor: selectedNetworkData?.color + '20' }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color={selectedNetworkData?.color}
            />
            <Text style={[styles.addressWarning, { color: selectedNetworkData?.color }]}>
              {t('onlySendUSDTOnNetwork', { network: selectedNetworkData?.name, label: selectedNetworkData?.label })}
            </Text>
          </View>
        </View>

        <View style={styles.calculatorCard}>
          <Text style={styles.calculatorTitle}>{t('mxiCalculator')}</Text>
          <View style={styles.calculatorRow}>
            <Text style={styles.calculatorLabel}>20 USDT</Text>
            <Text style={styles.calculatorArrow}>→</Text>
            <Text style={styles.calculatorValue}>{(20 * MXI_RATE).toFixed(2)} MXI</Text>
          </View>
          <View style={styles.calculatorRow}>
            <Text style={styles.calculatorLabel}>50 USDT</Text>
            <Text style={styles.calculatorArrow}>→</Text>
            <Text style={styles.calculatorValue}>{(50 * MXI_RATE).toFixed(2)} MXI</Text>
          </View>
          <View style={styles.calculatorRow}>
            <Text style={styles.calculatorLabel}>100 USDT</Text>
            <Text style={styles.calculatorArrow}>→</Text>
            <Text style={styles.calculatorValue}>{(100 * MXI_RATE).toFixed(2)} MXI</Text>
          </View>
          <View style={styles.calculatorRow}>
            <Text style={styles.calculatorLabel}>500 USDT</Text>
            <Text style={styles.calculatorArrow}>→</Text>
            <Text style={styles.calculatorValue}>{(500 * MXI_RATE).toFixed(2)} MXI</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t('transactionHashTxHash')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor="#666666"
            value={txHash}
            onChangeText={(text) => {
              console.log('📝 [INPUT] Hash ingresado:', text);
              setTxHash(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading && !requestingManualVerification}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.inputHint}>
            {t('pasteYourTransactionHash', { network: selectedNetworkData?.name })}
          </Text>
          {txHash.length > 0 && (
            <Text style={[styles.inputHint, { marginTop: 4, color: txHash.length === 66 ? colors.success : colors.warning }]}>
              {txHash.length === 66 ? t('correctLength') : t('charactersCount', { count: txHash.length })}
            </Text>
          )}
        </View>

        {/* Automatic Verification Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            { backgroundColor: selectedNetworkData?.color || colors.primary },
            (loading || requestingManualVerification || !txHash.trim()) && styles.verifyButtonDisabled
          ]}
          onPress={handleVerifyPayment}
          disabled={loading || requestingManualVerification || !txHash.trim()}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              {verificationStatus ? (
                <Text style={styles.verifyButtonText}>{verificationStatus}</Text>
              ) : null}
            </View>
          ) : (
            <React.Fragment>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.verifyButtonText}>
                {t('verifyAutomatically')}
              </Text>
            </React.Fragment>
          )}
        </TouchableOpacity>

        {/* 🆕 NEW: Manual Verification Request Button */}
        <TouchableOpacity
          style={[
            styles.manualVerifyButton,
            (loading || requestingManualVerification || !txHash.trim()) && styles.manualVerifyButtonDisabled
          ]}
          onPress={handleRequestManualVerification}
          disabled={loading || requestingManualVerification || !txHash.trim()}
        >
          {requestingManualVerification ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.manualVerifyButtonText}>{t('sendingRequestText')}</Text>
            </View>
          ) : (
            <React.Fragment>
              <IconSymbol
                ios_icon_name="person.fill.checkmark"
                android_material_icon_name="admin_panel_settings"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.manualVerifyButtonText}>
                {t('requestManualVerificationButton')}
              </Text>
            </React.Fragment>
          )}
        </TouchableOpacity>

        <View style={styles.warningCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={24}
            color={colors.warning}
          />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>{t('importantValidationByNetwork')}</Text>
            <Text style={styles.warningText}>
              • {t('eachNetworkValidatesIndependentlyInfo')}
            </Text>
            <Text style={styles.warningText}>
              • {t('paymentsOnETHOnlyValidatedOnETH')}
            </Text>
            <Text style={styles.warningText}>
              • {t('paymentsOnBNBOnlyValidatedOnBNB')}
            </Text>
            <Text style={styles.warningText}>
              • {t('paymentsOnPolygonOnlyValidatedOnPolygon')}
            </Text>
            <Text style={styles.warningText}>
              • {t('ensureCorrectNetworkBeforeVerifying')}
            </Text>
            <Text style={styles.warningText}>
              • {t('transactionMustHave3Confirmations')}
            </Text>
            <Text style={styles.warningText}>
              • {t('cannotUseSameHashTwice')}
            </Text>
            <Text style={styles.warningText}>
              • {t('ifAutomaticFailsUseManual')}
            </Text>
          </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  networkCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  networkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  networkSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  networkButtons: {
    gap: 12,
  },
  networkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  networkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  networkLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  networkDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  validationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  validationInfo: {
    flex: 1,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  validationText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  addressCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  addressWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  addressWarning: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  calculatorCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calculatorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  calculatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  calculatorLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  calculatorArrow: {
    fontSize: 14,
    color: colors.primary,
    marginHorizontal: 12,
  },
  calculatorValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    textAlign: 'right',
  },
  inputCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  verifyButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    minHeight: 56,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualVerifyButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  manualVerifyButtonDisabled: {
    opacity: 0.5,
  },
  manualVerifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
});
