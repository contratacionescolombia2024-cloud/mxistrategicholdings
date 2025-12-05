
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#333333',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  payButtonTextDisabled: {
    color: '#666666',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  phaseInfoCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  phaseLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  phaseValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  phaseDivider: {
    height: 1,
    backgroundColor: colors.primary + '30',
    marginVertical: 8,
  },
  errorModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#F44336',
    maxHeight: '80%',
  },
  errorModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorModalSection: {
    marginBottom: 16,
  },
  errorModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  errorModalText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  errorModalDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  errorModalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  errorModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  errorModalCopyButton: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  errorModalCopyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  configErrorCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  configErrorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  configErrorText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  configErrorBullet: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginLeft: 16,
  },
  configErrorHighlight: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  testButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});

interface ErrorDetails {
  timestamp: string;
  errorMessage: string;
  errorCode?: string;
  statusCode?: number;
  requestUrl?: string;
  requestBody?: any;
  responseBody?: any;
  authToken?: string;
  userId?: string;
  stackTrace?: string;
  requestId?: string;
}

export default function ContratacionesScreen() {
  const router = useRouter();
  const { user, getPhaseInfo } = useAuth();
  const { t } = useLanguage();
  const [currentPrice, setCurrentPrice] = useState(0.40);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [amount, setAmount] = useState('');
  const [mxiAmount, setMxiAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [phaseInfo, setPhaseInfo] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfigError, setShowConfigError] = useState(false);
  const [testingEnv, setTestingEnv] = useState(false);
  const [envTestResult, setEnvTestResult] = useState<any>(null);

  useEffect(() => {
    loadPhaseInfo();
    loadRecentPayments();

    const channel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Payment update received:', payload);
          loadRecentPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [user]);

  useEffect(() => {
    if (amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        setMxiAmount(numAmount / currentPrice);
      } else {
        setMxiAmount(0);
      }
    } else {
      setMxiAmount(0);
    }
  }, [amount, currentPrice]);

  const loadPhaseInfo = async () => {
    try {
      const info = await getPhaseInfo();
      if (info) {
        setCurrentPrice(info.currentPriceUsdt);
        setCurrentPhase(info.currentPhase);
        setPhaseInfo(info);
      }
    } catch (error) {
      console.error('Error loading phase info:', error);
    }
  };

  const loadRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const testEnvironmentVariables = async () => {
    setTestingEnv(true);
    setEnvTestResult(null);
    setShowConfigError(false);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        Alert.alert(t('error'), t('mustLoginToTest'));
        setTestingEnv(false);
        return;
      }

      const response = await fetch(
        'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/test-env-vars',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      const result = await response.json();
      console.log('Environment test result:', result);
      setEnvTestResult(result);

      if (result.environment_variables?.NOWPAYMENTS_API_KEY === 'MISSING') {
        setShowConfigError(true);
      }
    } catch (error: any) {
      console.error('Error testing environment:', error);
      Alert.alert(t('error'), t('couldNotTestEnvironmentVariables', { message: error.message }));
    } finally {
      setTestingEnv(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!amount || parseFloat(amount) < 3) {
      Alert.alert(t('error'), t('minimumAmountIs3USDT'));
      return;
    }

    if (parseFloat(amount) > 500000) {
      Alert.alert(t('error'), t('maximumAmountIs500000USDT'));
      return;
    }

    setLoading(true);
    setErrorDetails(null);
    setShowConfigError(false);
    console.log('=== INICIANDO PROCESO DE PAGO ===');
    console.log(`Monto: ${amount} USDT`);

    try {
      console.log('Step 1: Obteniendo sesión de usuario...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log(`Error obteniendo sesión: ${sessionError.message}`);
        throw new Error(`${t('sessionError')}: ${sessionError.message}`);
      }

      if (!sessionData.session) {
        console.log('No hay sesión activa');
        Alert.alert(t('error'), t('mustLoginToContinue'));
        setLoading(false);
        return;
      }

      console.log(`Sesión obtenida. User ID: ${sessionData.session.user.id}`);

      const orderId = `${user?.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      console.log(`Order ID generado: ${orderId}`);

      const requestUrl = 'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent';
      const requestBody = {
        order_id: orderId,
        price_amount: parseFloat(amount),
        price_currency: 'usd',
        pay_currency: 'usdteth',
      };

      console.log('Step 2: Preparando solicitud...');
      console.log(`URL: ${requestUrl}`);
      console.log(`Body: ${JSON.stringify(requestBody)}`);

      console.log('Step 3: Enviando solicitud a Edge Function...');
      const startTime = Date.now();

      let response;
      try {
        response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError: any) {
        console.log(`Error en fetch: ${fetchError.message}`);
        
        const errorDetail: ErrorDetails = {
          timestamp: new Date().toISOString(),
          errorMessage: `${t('connectionError')}: ${fetchError.message}`,
          errorCode: 'FETCH_ERROR',
          requestUrl,
          requestBody,
          authToken: sessionData.session.access_token.substring(0, 20) + '...',
          userId: sessionData.session.user.id,
          stackTrace: fetchError.stack,
        };

        setErrorDetails(errorDetail);
        setShowErrorModal(true);
        throw new Error(`${t('connectionError')}: ${fetchError.message}`);
      }

      const endTime = Date.now();
      console.log(`Respuesta recibida en ${endTime - startTime}ms`);
      console.log(`Status Code: ${response.status} ${response.statusText}`);

      console.log('Step 4: Leyendo respuesta...');
      let responseText;
      
      try {
        responseText = await response.text();
        console.log(`Response Text (primeros 500 chars): ${responseText.substring(0, 500)}`);
      } catch (textError: any) {
        console.log(`Error leyendo texto de respuesta: ${textError.message}`);
        
        const errorDetail: ErrorDetails = {
          timestamp: new Date().toISOString(),
          errorMessage: t('errorReadingServerResponse'),
          errorCode: 'RESPONSE_READ_ERROR',
          statusCode: response.status,
          requestUrl,
          requestBody,
          authToken: sessionData.session.access_token.substring(0, 20) + '...',
          userId: sessionData.session.user.id,
          stackTrace: textError.stack,
        };

        setErrorDetails(errorDetail);
        setShowErrorModal(true);
        throw new Error(t('errorReadingServerResponse'));
      }

      console.log('Step 5: Parseando JSON...');
      let result;
      
      try {
        result = JSON.parse(responseText);
        console.log(`JSON parseado exitosamente`);
        console.log(`Success: ${result.success}`);
        console.log(`Error: ${result.error || 'none'}`);
        console.log(`Code: ${result.code || 'none'}`);
      } catch (parseError: any) {
        console.log(`Error parseando JSON: ${parseError.message}`);
        
        const errorDetail: ErrorDetails = {
          timestamp: new Date().toISOString(),
          errorMessage: t('serverReturnedInvalidResponse'),
          errorCode: 'INVALID_JSON_RESPONSE',
          statusCode: response.status,
          requestUrl,
          requestBody,
          responseBody: responseText.substring(0, 1000),
          authToken: sessionData.session.access_token.substring(0, 20) + '...',
          userId: sessionData.session.user.id,
          stackTrace: parseError.stack,
        };

        setErrorDetails(errorDetail);
        setShowErrorModal(true);
        throw new Error(t('serverReturnedInvalidResponse'));
      }

      if (!response.ok || !result.success) {
        console.log('Step 6: Error en la respuesta');
        console.log(`Error code: ${result.code || 'UNKNOWN'}`);
        console.log(`Error message: ${result.error || 'Unknown error'}`);
        console.log(`Request ID: ${result.requestId || 'none'}`);
        
        if (result.code === 'MISSING_API_KEY' || result.code === 'MISSING_SUPABASE_CREDS') {
          setShowConfigError(true);
          throw new Error('CONFIGURATION_ERROR');
        }
        
        const errorDetail: ErrorDetails = {
          timestamp: new Date().toISOString(),
          errorMessage: result.error || result.message || t('unknownServerError'),
          errorCode: result.code || 'UNKNOWN',
          statusCode: response.status,
          requestUrl,
          requestBody,
          responseBody: result,
          authToken: sessionData.session.access_token.substring(0, 20) + '...',
          userId: sessionData.session.user.id,
          requestId: result.requestId,
        };

        setErrorDetails(errorDetail);
        setShowErrorModal(true);
        
        let userMessage = result.error || t('errorCreatingPayment');
        
        if (result.code === 'NOWPAYMENTS_API_ERROR') {
          userMessage = t('paymentProviderError', { message: result.details?.message || t('unknownError') });
        } else if (result.code === 'INVALID_SESSION') {
          userMessage = t('sessionExpiredLogout');
        } else if (result.code === 'METRICS_ERROR') {
          userMessage = t('errorGettingPhaseInfo');
        } else if (result.code === 'DATABASE_ERROR') {
          userMessage = t('errorSavingPayment');
        }
        
        throw new Error(userMessage);
      }

      console.log('Step 7: Pago creado exitosamente');
      console.log(`Order ID: ${result.intent?.order_id}`);
      console.log(`Invoice URL: ${result.intent?.invoice_url}`);
      console.log(`Payment ID: ${result.intent?.payment_id}`);

      if (result.intent?.invoice_url) {
        console.log('Step 8: Abriendo URL de pago...');
        
        try {
          const supported = await Linking.canOpenURL(result.intent.invoice_url);
          console.log(`URL soportada: ${supported}`);
          
          if (supported) {
            const browserResult = await WebBrowser.openBrowserAsync(result.intent.invoice_url, {
              dismissButtonStyle: 'close',
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            });
            console.log(`Browser result: ${browserResult.type}`);
          } else {
            console.log('URL no soportada, intentando con Linking.openURL');
            await Linking.openURL(result.intent.invoice_url);
          }
        } catch (browserError: any) {
          console.log(`Error abriendo navegador: ${browserError.message}`);
          Alert.alert(
            t('errorOpeningBrowser'),
            t('couldNotOpenBrowserAutomatically', { url: result.intent.invoice_url }),
            [
              { text: t('copyURL'), onPress: () => {
                console.log('URL to copy:', result.intent.invoice_url);
              }},
              { text: t('ok') }
            ]
          );
        }

        startPolling(result.intent.order_id);

        Alert.alert(
          t('paymentCreated'),
          t('paymentPageOpened'),
          [{ text: t('ok') }]
        );

        setAmount('');
        loadRecentPayments();
      } else {
        console.log('ERROR: No se recibió invoice_url en la respuesta');
        throw new Error(t('noPaymentURLReceived'));
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      console.log(`ERROR FINAL: ${error.message}`);
      
      if (error.message !== 'CONFIGURATION_ERROR') {
        if (!errorDetails) {
          const errorDetail: ErrorDetails = {
            timestamp: new Date().toISOString(),
            errorMessage: error.message || t('unknownError'),
            stackTrace: error.stack,
          };
          setErrorDetails(errorDetail);
          setShowErrorModal(true);
        }
        
        Alert.alert(t('error'), error.message || t('couldNotCreatePayment'));
      }
    } finally {
      setLoading(false);
      console.log('=== PROCESO DE PAGO FINALIZADO ===');
    }
  };

  const startPolling = (orderId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    console.log(`Iniciando polling para order_id: ${orderId}`);

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (error) throw error;

        if (data && (data.status === 'finished' || data.status === 'confirmed' || data.status === 'failed' || data.status === 'expired')) {
          console.log(`Pago finalizado con estado: ${data.status}`);
          clearInterval(interval);
          setPollingInterval(null);
          loadRecentPayments();

          if (data.status === 'finished' || data.status === 'confirmed') {
            Alert.alert(
              t('paymentCompleted'),
              t('youHaveReceived', { amount: parseFloat(data.mxi_amount).toFixed(2) }),
              [{ text: t('ok') }]
            );
          } else if (data.status === 'failed') {
            Alert.alert(
              t('paymentFailedTitle'),
              t('paymentCouldNotBeCompleted'),
              [{ text: t('ok') }]
            );
          } else if (data.status === 'expired') {
            Alert.alert(
              t('paymentExpired'),
              t('paymentTimeExpired'),
              [{ text: t('ok') }]
            );
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000);

    setPollingInterval(interval);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
      case 'confirmed':
        return '#4CAF50';
      case 'waiting':
      case 'pending':
        return colors.primary;
      case 'confirming':
        return '#2196F3';
      case 'failed':
      case 'expired':
      case 'cancelled':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished':
        return t('completed');
      case 'confirmed':
        return t('confirmed');
      case 'waiting':
        return t('waitingForPayment');
      case 'pending':
        return t('pending');
      case 'confirming':
        return t('confirming');
      case 'failed':
        return t('failed');
      case 'expired':
        return t('expired');
      case 'cancelled':
        return t('cancelled');
      default:
        return status;
    }
  };

  const copyErrorDetails = () => {
    if (errorDetails) {
      const errorText = JSON.stringify(errorDetails, null, 2);
      console.log('=== ERROR DETAILS ===');
      console.log(errorText);
      console.log('=== END ERROR DETAILS ===');
      Alert.alert(t('detailsCopied'), t('errorDetailsCopiedToConsole'));
    }
  };

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
        <Text style={styles.headerTitle}>{t('buyMXI')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showConfigError && (
          <View style={styles.configErrorCard}>
            <Text style={styles.configErrorTitle}>{t('serverConfigurationError')}</Text>
            <Text style={styles.configErrorText}>
              {t('paymentSystemNotConfigured')}
            </Text>
            <Text style={[styles.configErrorText, { marginTop: 12, fontWeight: '600' }]}>
              {t('problemDetected')}
            </Text>
            <Text style={styles.configErrorBullet}>
              • {t('nowPaymentsCredentialsNotConfigured')}
            </Text>
            <Text style={[styles.configErrorText, { marginTop: 12, fontWeight: '600' }]}>
              {t('solutionForAdministrator')}
            </Text>
            <Text style={styles.configErrorBullet}>
              {t('goToSupabaseDashboard')}
            </Text>
            <Text style={styles.configErrorBullet}>
              {t('navigateToProjectSettings')}
            </Text>
            <Text style={styles.configErrorBullet}>
              {t('addEnvironmentVariables')}
            </Text>
            <Text style={styles.configErrorHighlight}>
              NOWPAYMENTS_API_KEY{'\n'}
              NOWPAYMENTS_IPN_SECRET
            </Text>
            <Text style={styles.configErrorBullet}>
              {t('redeployEdgeFunctions')}
            </Text>
            <Text style={[styles.configErrorText, { marginTop: 12, fontStyle: 'italic' }]}>
              {t('contactAdministrator')}
            </Text>
          </View>
        )}

        {envTestResult && envTestResult.environment_variables?.NOWPAYMENTS_API_KEY !== 'MISSING' && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>{t('configurationCorrect')}</Text>
            <Text style={styles.successText}>
              {t('environmentVariablesConfigured')}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('diagnosticSystem')}</Text>
          <Text style={styles.infoText}>
            {t('ifExperiencingProblems')}
          </Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testEnvironmentVariables}
            disabled={testingEnv}
          >
            {testingEnv ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.testButtonText}>
                {t('testServerConfiguration')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>{t('importantPaymentInfo')}</Text>
          <Text style={styles.warningText}>
            • {t('paymentsProcessedInUSDT')}{'\n'}
            • {t('useCorrectNetwork')}{'\n'}
            • {t('paymentExpiresIn1Hour')}{'\n'}
            • {t('tokensAutomaticallyCredited')}
          </Text>
        </View>

        <View style={styles.phaseInfoCard}>
          <Text style={styles.phaseTitle}>{t('currentPresalePhaseTitle')}</Text>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('activePhaseLabel')}:</Text>
            <Text style={styles.phaseValue}>{t('phase')} {currentPhase} {t('of')} 3</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('currentPriceLabel')}:</Text>
            <Text style={styles.phaseValue}>{currentPrice.toFixed(2)} USDT {t('perMXI')}</Text>
          </View>
          <View style={styles.phaseDivider} />
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('phase')} 1:</Text>
            <Text style={styles.phaseValue}>0.40 USDT</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('phase')} 2:</Text>
            <Text style={styles.phaseValue}>0.70 USDT</Text>
          </View>
          <View style={styles.phaseRow}>
            <Text style={styles.phaseLabel}>{t('phase')} 3:</Text>
            <Text style={styles.phaseValue}>1.00 USDT</Text>
          </View>
          {phaseInfo && (
            <React.Fragment>
              <View style={styles.phaseDivider} />
              <View style={styles.phaseRow}>
                <Text style={styles.phaseLabel}>{t('tokensSoldLabel')}:</Text>
                <Text style={styles.phaseValue}>
                  {phaseInfo.totalTokensSold.toLocaleString()} MXI
                </Text>
              </View>
              {currentPhase < 3 && (
                <View style={styles.phaseRow}>
                  <Text style={styles.phaseLabel}>{t('untilNextPhaseLabel')}:</Text>
                  <Text style={styles.phaseValue}>
                    {phaseInfo.tokensUntilNextPhase.toLocaleString()} MXI
                  </Text>
                </View>
              )}
            </React.Fragment>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('makePayment')}</Text>
          
          <Text style={styles.inputLabel}>{t('amountInUSDT')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterAmount')}
            placeholderTextColor="#666666"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
          />

          {mxiAmount > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>{t('youWillReceive')}:</Text>
              <Text style={styles.calculationValue}>{mxiAmount.toFixed(2)} MXI</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.payButton,
              (loading || !amount || parseFloat(amount) < 3) && styles.payButtonDisabled,
            ]}
            onPress={handleCreatePayment}
            disabled={loading || !amount || parseFloat(amount) < 3}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text
                style={[
                  styles.payButtonText,
                  (loading || !amount || parseFloat(amount) < 3) && styles.payButtonTextDisabled,
                ]}
              >
                {t('payWithUSDTETH')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {recentPayments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('recentPayments')}</Text>
            {recentPayments.map((payment, index) => (
              <View key={index} style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{t('amount')}:</Text>
                  <Text style={styles.statusValue}>
                    {parseFloat(payment.price_amount).toFixed(2)} USDT
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>MXI:</Text>
                  <Text style={styles.statusValue}>
                    {parseFloat(payment.mxi_amount).toFixed(2)} MXI
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{t('price')}:</Text>
                  <Text style={styles.statusValue}>
                    {parseFloat(payment.price_per_mxi).toFixed(2)} USDT/MXI
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{t('phase')}:</Text>
                  <Text style={styles.statusValue}>
                    {t('phase')} {payment.phase}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{t('status')}:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payment.status) },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: '#FFFFFF' }]}>
                      {getStatusText(payment.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{t('date')}:</Text>
                  <Text style={styles.statusValue}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('poolBenefits')}</Text>
          <Text style={styles.infoText}>
            • {t('receiveMXITokens')}
          </Text>
          <Text style={styles.infoText}>
            • {t('generateYield')}
          </Text>
          <Text style={styles.infoText}>
            • {t('earnCommissions')}
          </Text>
          <Text style={styles.infoText}>
            • {t('participateInLiquidityPool')}
          </Text>
          <Text style={styles.infoText}>
            • {t('earlyAccessToLaunch')}
          </Text>
          <Text style={styles.infoText}>
            • {t('preferentialPresalePrice')}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.errorModal}>
          <ScrollView style={{ width: '100%', maxWidth: 400 }} contentContainerStyle={{ padding: 20 }}>
            <View style={styles.errorModalContent}>
              <Text style={styles.errorModalTitle}>{t('errorModalTitle')}</Text>

              {errorDetails && (
                <React.Fragment>
                  <View style={styles.errorModalSection}>
                    <Text style={styles.errorModalLabel}>{t('errorMessage')}:</Text>
                    <Text style={styles.errorModalText}>{errorDetails.errorMessage}</Text>
                  </View>

                  {errorDetails.errorCode && (
                    <View style={styles.errorModalSection}>
                      <Text style={styles.errorModalLabel}>{t('errorCode')}:</Text>
                      <Text style={styles.errorModalText}>{errorDetails.errorCode}</Text>
                    </View>
                  )}

                  {errorDetails.requestId && (
                    <View style={styles.errorModalSection}>
                      <Text style={styles.errorModalLabel}>{t('requestID')}:</Text>
                      <Text style={styles.errorModalText}>{errorDetails.requestId}</Text>
                    </View>
                  )}

                  {errorDetails.statusCode && (
                    <View style={styles.errorModalSection}>
                      <Text style={styles.errorModalLabel}>{t('httpStatusCode')}:</Text>
                      <Text style={styles.errorModalText}>{errorDetails.statusCode}</Text>
                    </View>
                  )}

                  <View style={styles.errorModalSection}>
                    <Text style={styles.errorModalLabel}>{t('timestamp')}:</Text>
                    <Text style={styles.errorModalText}>{errorDetails.timestamp}</Text>
                  </View>

                  <View style={styles.errorModalDivider} />

                  <TouchableOpacity
                    style={styles.errorModalCopyButton}
                    onPress={copyErrorDetails}
                  >
                    <Text style={styles.errorModalCopyButtonText}>
                      {t('copyDetailsToConsole')}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              )}

              <TouchableOpacity
                style={styles.errorModalButton}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.errorModalButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
