
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import PaymentStatusPoller from '@/components/PaymentStatusPoller';
import { showAlert, showConfirm } from '@/utils/confirmDialog';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Purchase limits
const MIN_PURCHASE_USD = 30;
const MAX_PURCHASE_USD = 500000;

interface Currency {
  code: string;
  name: string;
  network: string;
  icon: string;
  color: string;
  category: 'stablecoin' | 'major' | 'altcoin';
}

// Comprehensive list of supported currencies from NOWPayments
const ALL_CURRENCIES: Currency[] = [
  // Stablecoins
  { code: 'usdttrc20', name: 'USDT', network: 'TRC20 (Tron)', icon: '₮', color: '#26A17B', category: 'stablecoin' },
  { code: 'usdterc20', name: 'USDT', network: 'ERC20 (Ethereum)', icon: '₮', color: '#627EEA', category: 'stablecoin' },
  { code: 'usdtbsc', name: 'USDT', network: 'BEP20 (BSC)', icon: '₮', color: '#F3BA2F', category: 'stablecoin' },
  { code: 'usdtmatic', name: 'USDT', network: 'Polygon', icon: '₮', color: '#8247E5', category: 'stablecoin' },
  { code: 'usdtsol', name: 'USDT', network: 'Solana', icon: '₮', color: '#14F195', category: 'stablecoin' },
  { code: 'usdcmatic', name: 'USDC', network: 'Polygon', icon: '$', color: '#2775CA', category: 'stablecoin' },
  { code: 'usdcsol', name: 'USDC', network: 'Solana', icon: '$', color: '#2775CA', category: 'stablecoin' },
  { code: 'usdcerc20', name: 'USDC', network: 'ERC20 (Ethereum)', icon: '$', color: '#2775CA', category: 'stablecoin' },
  { code: 'usdcbsc', name: 'USDC', network: 'BEP20 (BSC)', icon: '$', color: '#2775CA', category: 'stablecoin' },
  { code: 'dai', name: 'DAI', network: 'Ethereum', icon: '◈', color: '#F5AC37', category: 'stablecoin' },
  { code: 'busd', name: 'BUSD', network: 'BSC', icon: 'B$', color: '#F0B90B', category: 'stablecoin' },
  
  // Major Cryptocurrencies
  { code: 'btc', name: 'Bitcoin', network: 'BTC', icon: '₿', color: '#F7931A', category: 'major' },
  { code: 'eth', name: 'Ethereum', network: 'ETH', icon: 'Ξ', color: '#627EEA', category: 'major' },
  { code: 'bnbbsc', name: 'BNB', network: 'BSC', icon: 'B', color: '#F3BA2F', category: 'major' },
  { code: 'sol', name: 'Solana', network: 'SOL', icon: '◎', color: '#14F195', category: 'major' },
  { code: 'matic', name: 'Polygon', network: 'MATIC', icon: 'P', color: '#8247E5', category: 'major' },
  { code: 'ltc', name: 'Litecoin', network: 'LTC', icon: 'Ł', color: '#345D9D', category: 'major' },
  { code: 'xrp', name: 'Ripple', network: 'XRP', icon: 'X', color: '#23292F', category: 'major' },
  { code: 'ada', name: 'Cardano', network: 'ADA', icon: '₳', color: '#0033AD', category: 'major' },
  { code: 'doge', name: 'Dogecoin', network: 'DOGE', icon: 'Ð', color: '#C2A633', category: 'major' },
  { code: 'trx', name: 'Tron', network: 'TRX', icon: 'T', color: '#EB0029', category: 'major' },
  
  // Popular Altcoins
  { code: 'avax', name: 'Avalanche', network: 'AVAX', icon: 'A', color: '#E84142', category: 'altcoin' },
  { code: 'dot', name: 'Polkadot', network: 'DOT', icon: '●', color: '#E6007A', category: 'altcoin' },
  { code: 'link', name: 'Chainlink', network: 'Ethereum', icon: 'L', color: '#2A5ADA', category: 'altcoin' },
  { code: 'uni', name: 'Uniswap', network: 'Ethereum', icon: 'U', color: '#FF007A', category: 'altcoin' },
  { code: 'atom', name: 'Cosmos', network: 'ATOM', icon: 'C', color: '#2E3148', category: 'altcoin' },
  { code: 'xlm', name: 'Stellar', network: 'XLM', icon: 'S', color: '#000000', category: 'altcoin' },
  { code: 'etc', name: 'Ethereum Classic', network: 'ETC', icon: 'E', color: '#328332', category: 'altcoin' },
  { code: 'bch', name: 'Bitcoin Cash', network: 'BCH', icon: 'B', color: '#8DC351', category: 'altcoin' },
  { code: 'xmr', name: 'Monero', network: 'XMR', icon: 'M', color: '#FF6600', category: 'altcoin' },
  { code: 'zec', name: 'Zcash', network: 'ZEC', icon: 'Z', color: '#ECB244', category: 'altcoin' },
  { code: 'dash', name: 'Dash', network: 'DASH', icon: 'D', color: '#008CE7', category: 'altcoin' },
  { code: 'algo', name: 'Algorand', network: 'ALGO', icon: 'A', color: '#000000', category: 'altcoin' },
  { code: 'vet', name: 'VeChain', network: 'VET', icon: 'V', color: '#15BDFF', category: 'altcoin' },
  { code: 'ftm', name: 'Fantom', network: 'FTM', icon: 'F', color: '#1969FF', category: 'altcoin' },
  { code: 'near', name: 'NEAR Protocol', network: 'NEAR', icon: 'N', color: '#000000', category: 'altcoin' },
  { code: 'apt', name: 'Aptos', network: 'APT', icon: 'A', color: '#000000', category: 'altcoin' },
  { code: 'arb', name: 'Arbitrum', network: 'ARB', icon: 'A', color: '#28A0F0', category: 'altcoin' },
  { code: 'op', name: 'Optimism', network: 'OP', icon: 'O', color: '#FF0420', category: 'altcoin' },
];

interface NowPaymentsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function NowPaymentsModal({ visible, onClose, userId }: NowPaymentsModalProps) {
  const [step, setStep] = useState<'amount' | 'currency' | 'payment'>('amount');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState(0.4);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'stablecoin' | 'major' | 'altcoin'>('all');

  useEffect(() => {
    if (visible) {
      loadCurrentPrice();
      resetModal();
    }
  }, [visible]);

  useEffect(() => {
    if (paymentIntent?.expires_at) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiresAt = new Date(paymentIntent.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          showAlert(
            '⏰ Pago Expirado',
            'El tiempo para completar el pago ha expirado. Por favor crea un nuevo pago.',
            handleClose,
            'warning'
          );
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentIntent]);

  const resetModal = () => {
    setStep('amount');
    setUsdtAmount('');
    setSelectedCurrency(null);
    setPaymentIntent(null);
    setTimeRemaining(null);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const loadCurrentPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'current_price_usdt')
        .single();

      if (!error && data) {
        setCurrentPrice(data.setting_value.value || 0.4);
      }
    } catch (error) {
      console.error('Error loading price:', error);
    }
  };

  const calculateMXI = (usdt: string): number => {
    const amount = parseFloat(usdt);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount / currentPrice;
  };

  const getFilteredCurrencies = (): Currency[] => {
    let filtered = ALL_CURRENCIES;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.network.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const validateAmount = (amount: string): { valid: boolean; error?: string } => {
    const value = parseFloat(amount);
    
    if (isNaN(value) || value <= 0) {
      return { valid: false, error: 'Por favor ingresa un monto válido' };
    }
    
    if (value < MIN_PURCHASE_USD) {
      return { 
        valid: false, 
        error: `El monto mínimo de compra es ${MIN_PURCHASE_USD} USD` 
      };
    }
    
    if (value > MAX_PURCHASE_USD) {
      return { 
        valid: false, 
        error: `El monto máximo por transacción es ${MAX_PURCHASE_USD.toLocaleString()} USD` 
      };
    }
    
    return { valid: true };
  };

  const handleCreatePayment = async () => {
    if (!selectedCurrency || !usdtAmount) {
      showAlert('Error', 'Por favor completa todos los campos', undefined, 'error');
      return;
    }

    const validation = validateAmount(usdtAmount);
    if (!validation.valid) {
      showAlert('Error', validation.error || 'Monto inválido', undefined, 'error');
      return;
    }

    const amount = parseFloat(usdtAmount);

    setLoading(true);

    try {
      const orderId = `MXI-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const mxiAmount = calculateMXI(usdtAmount);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No hay sesión activa');
      }

      console.log('Creating payment intent:', {
        order_id: orderId,
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: selectedCurrency.code,
      });

      // Create transaction history record first
      const { data: txHistory, error: txError } = await supabase
        .from('transaction_history')
        .insert({
          user_id: userId,
          transaction_type: 'nowpayments_order',
          order_id: orderId,
          mxi_amount: mxiAmount,
          usdt_amount: amount,
          status: 'pending',
          metadata: {
            pay_currency: selectedCurrency.code,
            pay_currency_name: selectedCurrency.name,
            network: selectedCurrency.network,
            price_per_mxi: currentPrice,
          },
        })
        .select()
        .single();

      if (txError) {
        console.error('Error creating transaction history:', txError);
        throw new Error('No se pudo crear el registro de transacción');
      }

      console.log('Transaction history created:', txHistory.id);

      const response = await fetch(
        'https://aeyfnjuatbtcauiumbhn.supabase.co/functions/v1/create-payment-intent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            price_amount: amount,
            price_currency: 'usd',
            pay_currency: selectedCurrency.code,
          }),
        }
      );

      const result = await response.json();
      console.log('Payment intent response:', result);

      if (!response.ok || !result.success) {
        // Update transaction history with error
        await supabase
          .from('transaction_history')
          .update({
            status: 'failed',
            error_message: result.error || 'Error al crear el pago',
            error_details: result,
            updated_at: new Date().toISOString(),
          })
          .eq('id', txHistory.id);

        throw new Error(result.error || 'Error al crear el pago');
      }

      // Update transaction history with payment details
      await supabase
        .from('transaction_history')
        .update({
          payment_id: result.intent.payment_id,
          payment_url: result.intent.invoice_url,
          status: 'waiting',
          metadata: {
            ...txHistory.metadata,
            pay_address: result.intent.pay_address,
            pay_amount: result.intent.pay_amount,
            expires_at: result.intent.expires_at,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', txHistory.id);

      setPaymentIntent(result.intent);
      setStep('payment');
    } catch (error: any) {
      console.error('Error creating payment:', error);
      showAlert(
        'Error',
        error.message || 'No se pudo crear el pago. Por favor intenta nuevamente.',
        undefined,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showAlert('✅ Copiado', `${label} copiado al portapapeles`, undefined, 'success');
    } catch (error) {
      console.error('Error copying:', error);
      showAlert('Error', 'No se pudo copiar al portapapeles', undefined, 'error');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenPaymentPage = async () => {
    if (!paymentIntent?.invoice_url) {
      showAlert('Error', 'No hay URL de pago disponible', undefined, 'error');
      return;
    }

    try {
      console.log('🌐 [PAYMENT] Opening payment URL:', paymentIntent.invoice_url);
      
      // Try multiple methods to open the URL
      if (Platform.OS === 'web') {
        // For web, open in new tab
        window.open(paymentIntent.invoice_url, '_blank');
        console.log('✅ [PAYMENT] Opened in new tab (web)');
      } else {
        // For mobile, try WebBrowser first
        try {
          const result = await WebBrowser.openBrowserAsync(paymentIntent.invoice_url, {
            dismissButtonStyle: 'close',
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: colors.primary,
            toolbarColor: colors.background,
          });
          console.log('✅ [PAYMENT] WebBrowser result:', result);
        } catch (webBrowserError: any) {
          console.error('❌ [PAYMENT] WebBrowser failed:', webBrowserError);
          
          // Fallback to Linking
          const canOpen = await Linking.canOpenURL(paymentIntent.invoice_url);
          if (canOpen) {
            await Linking.openURL(paymentIntent.invoice_url);
            console.log('✅ [PAYMENT] Opened with Linking');
          } else {
            throw new Error('No se puede abrir la URL');
          }
        }
      }
      
      // Show success message
      showAlert(
        '✅ Página de Pago Abierta',
        'La página de pago se ha abierto en tu navegador. Completa el pago y regresa aquí para verificar el estado.',
        undefined,
        'success'
      );
    } catch (error: any) {
      console.error('❌ [PAYMENT] Error opening browser:', error);
      
      // Show detailed error with copy option
      showConfirm({
        title: '⚠️ No se pudo abrir el navegador',
        message: `Puedes copiar la URL y abrirla manualmente en tu navegador:\n\n${paymentIntent.invoice_url}`,
        confirmText: 'Copiar URL',
        cancelText: 'Cancelar',
        type: 'warning',
        onConfirm: () => copyToClipboard(paymentIntent.invoice_url, 'URL de pago'),
        onCancel: () => {},
      });
    }
  };

  const handlePaymentConfirmed = () => {
    showConfirm({
      title: '✅ Pago Confirmado',
      message: 'Tu pago ha sido confirmado y los MXI han sido acreditados a tu cuenta.',
      confirmText: 'Ver Saldo',
      cancelText: 'OK',
      type: 'success',
      onConfirm: () => {
        handleClose();
        // Navigate to balance screen
      },
      onCancel: handleClose,
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderAmountStep = () => {
    const validation = validateAmount(usdtAmount);
    
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>💰 Ingresa el Monto</Text>
        <Text style={styles.stepSubtitle}>
          Monto mínimo: {MIN_PURCHASE_USD} USD • Máximo: {MAX_PURCHASE_USD.toLocaleString()} USD por transacción
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Monto en USDT</Text>
          <TextInput
            style={styles.input}
            placeholder={`Ej: ${MIN_PURCHASE_USD}`}
            placeholderTextColor="#666666"
            keyboardType="numeric"
            value={usdtAmount}
            onChangeText={setUsdtAmount}
          />
          {usdtAmount && !validation.valid && (
            <View style={styles.errorBox}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={16}
                color={colors.error}
              />
              <Text style={styles.errorText}>{validation.error}</Text>
            </View>
          )}
          {usdtAmount && validation.valid && (
            <View style={styles.calculationBox}>
              <Text style={styles.calculationLabel}>Recibirás:</Text>
              <Text style={styles.calculationValue}>
                {calculateMXI(usdtAmount).toFixed(2)} MXI
              </Text>
              <Text style={styles.calculationSubtext}>
                Precio: {currentPrice} USDT por MXI
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickAmounts}>
          <Text style={styles.quickAmountsLabel}>Montos rápidos:</Text>
          <View style={styles.quickAmountsRow}>
            {['30', '50', '100', '500', '1000', '5000'].map((amount, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAmountButton}
                onPress={() => setUsdtAmount(amount)}
              >
                <Text style={styles.quickAmountText}>${amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.limitsCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <View style={styles.limitsContent}>
            <Text style={styles.limitsTitle}>Límites de Compra</Text>
            <Text style={styles.limitsText}>
              • Mínimo: {MIN_PURCHASE_USD} USD por transacción{'\n'}
              • Máximo: {MAX_PURCHASE_USD.toLocaleString()} USD por transacción
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !validation.valid && styles.buttonDisabled,
          ]}
          onPress={() => setStep('currency')}
          disabled={!validation.valid}
        >
          <Text style={styles.primaryButtonText}>Continuar</Text>
          <IconSymbol
            ios_icon_name="arrow.right"
            android_material_icon_name="arrow_forward"
            size={20}
            color="#000000"
          />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderCurrencyStep = () => {
    const filteredCurrencies = getFilteredCurrencies();

    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.currencyHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('amount')}
          >
            <IconSymbol
              ios_icon_name="arrow.left"
              android_material_icon_name="arrow_back"
              size={20}
              color={colors.text}
            />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.stepTitle}>🪙 Selecciona Criptomoneda</Text>
          <Text style={styles.stepSubtitle}>
            {ALL_CURRENCIES.length}+ criptomonedas disponibles
          </Text>

          <View style={styles.searchContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, código o red..."
              placeholderTextColor="#666666"
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

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.categoryButtonTextActive,
              ]}>
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'stablecoin' && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory('stablecoin')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'stablecoin' && styles.categoryButtonTextActive,
              ]}>
                💵 Stablecoins
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'major' && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory('major')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'major' && styles.categoryButtonTextActive,
              ]}>
                ⭐ Principales
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'altcoin' && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory('altcoin')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'altcoin' && styles.categoryButtonTextActive,
              ]}>
                🔷 Altcoins
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.resultsCount}>
            {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'resultado' : 'resultados'}
          </Text>
        </View>

        <ScrollView 
          style={styles.currencyList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.currencyListContent}
        >
          {filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((currency, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.currencyItem,
                  selectedCurrency?.code === currency.code && {
                    backgroundColor: currency.color + '20',
                    borderColor: currency.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedCurrency(currency)}
              >
                <View style={[styles.currencyIcon, { backgroundColor: currency.color }]}>
                  <Text style={styles.currencyIconText}>{currency.icon}</Text>
                </View>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyName}>{currency.name}</Text>
                  <Text style={styles.currencyNetwork}>{currency.network}</Text>
                  <Text style={styles.currencyCode}>{currency.code.toUpperCase()}</Text>
                </View>
                {selectedCurrency?.code === currency.code && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={24}
                    color={currency.color}
                  />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResults}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search_off"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.noResultsText}>
                No se encontraron resultados
              </Text>
              <Text style={styles.noResultsSubtext}>
                Intenta con otro término de búsqueda
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.currencyFooter}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !selectedCurrency && styles.buttonDisabled,
            ]}
            onPress={handleCreatePayment}
            disabled={!selectedCurrency || loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <React.Fragment>
                <Text style={styles.primaryButtonText}>Continuar al Pago</Text>
                <IconSymbol
                  ios_icon_name="arrow.right"
                  android_material_icon_name="arrow_forward"
                  size={20}
                  color="#000000"
                />
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPaymentStep = () => {
    if (!paymentIntent) return null;

    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>💳 Completa el Pago</Text>
        
        {/* Automatic Payment Status Poller */}
        <PaymentStatusPoller
          orderId={paymentIntent.order_id}
          onPaymentConfirmed={handlePaymentConfirmed}
        />

        {timeRemaining !== null && (
          <View style={[
            styles.timerBox,
            timeRemaining < 300 && { backgroundColor: '#FF6B35' + '20', borderColor: '#FF6B35' }
          ]}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={24}
              color={timeRemaining < 300 ? '#FF6B35' : colors.primary}
            />
            <Text style={[
              styles.timerText,
              timeRemaining < 300 && { color: '#FF6B35' }
            ]}>
              Tiempo restante: {formatTime(timeRemaining)}
            </Text>
          </View>
        )}

        <View style={styles.paymentInfoCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Monto a Pagar:</Text>
            <Text style={styles.paymentValue}>
              {paymentIntent.pay_amount} {paymentIntent.pay_currency.toUpperCase()}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Recibirás:</Text>
            <Text style={styles.paymentValue}>
              {paymentIntent.mxi_amount.toFixed(2)} MXI
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Red:</Text>
            <Text style={styles.paymentValue}>
              {selectedCurrency?.network}
            </Text>
          </View>
        </View>

        {paymentIntent.pay_address && (
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>Dirección de Pago:</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText} numberOfLines={2}>
                {paymentIntent.pay_address}
              </Text>
              <TouchableOpacity
                style={styles.copyIconButton}
                onPress={() => copyToClipboard(paymentIntent.pay_address, 'Dirección')}
              >
                <IconSymbol
                  ios_icon_name="doc.on.doc.fill"
                  android_material_icon_name="content_copy"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instrucciones:</Text>
          <Text style={styles.instructionText}>
            1. Envía exactamente {paymentIntent.pay_amount} {paymentIntent.pay_currency.toUpperCase()} a la dirección mostrada
          </Text>
          <Text style={styles.instructionText}>
            2. Usa la red {selectedCurrency?.network}
          </Text>
          <Text style={styles.instructionText}>
            3. Asegúrate de cubrir las comisiones de red
          </Text>
          <Text style={styles.instructionText}>
            4. El pago se confirmará automáticamente
          </Text>
          <Text style={styles.instructionText}>
            5. Recibirás una notificación cuando se acredite
          </Text>
          <Text style={styles.instructionText}>
            6. El sistema verifica el estado cada 30 segundos
          </Text>
        </View>

        {paymentIntent.invoice_url && (
          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={handleOpenPaymentPage}
          >
            <IconSymbol
              ios_icon_name="link"
              android_material_icon_name="link"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.invoiceButtonText}>Abrir Página de Pago</Text>
          </TouchableOpacity>
        )}

        <View style={styles.warningBox}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={20}
            color={colors.warning}
          />
          <Text style={styles.warningText}>
            ⚠️ Envía solo {paymentIntent.pay_currency.toUpperCase()} en la red {selectedCurrency?.network}. 
            Enviar otra moneda o usar otra red resultará en pérdida de fondos.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pago Multi-Crypto</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {step === 'amount' && renderAmountStep()}
        {step === 'currency' && renderCurrencyStep()}
        {step === 'payment' && renderPaymentStep()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeIcon: {
    padding: 4,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
  },
  currencyHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  currencyFooter: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  calculationBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    alignItems: 'center',
  },
  calculationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calculationValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  calculationSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickAmounts: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  limitsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  limitsContent: {
    flex: 1,
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  limitsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoryFilter: {
    marginBottom: 16,
    maxHeight: 50,
  },
  categoryButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryButtonTextActive: {
    color: '#000000',
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  currencyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currencyListContent: {
    paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currencyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  currencyName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  currencyNetwork: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentInfoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  addressCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
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
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
  },
  copyIconButton: {
    marginLeft: 8,
    padding: 4,
  },
  instructionsCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  invoiceButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  invoiceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
