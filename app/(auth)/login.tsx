
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import Footer from '@/components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { showAlert, showConfirm } from '@/utils/confirmDialog';

const REMEMBER_EMAIL_KEY = '@mxi_remember_email';
const REMEMBER_PASSWORD_KEY = '@mxi_remember_password';

export default function LoginScreen() {
  const router = useRouter();
  const { login, resendVerificationEmail, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
      const savedPassword = await AsyncStorage.getItem(REMEMBER_PASSWORD_KEY);
      
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberPassword(true);
      }
      
      if (savedPassword) {
        setPassword(savedPassword);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberPassword) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email);
        await AsyncStorage.setItem(REMEMBER_PASSWORD_KEY, password);
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
        await AsyncStorage.removeItem(REMEMBER_PASSWORD_KEY);
      }
    } catch (error) {
      console.log('Error saving credentials:', error);
    }
  };

  const handleLogin = async () => {
    console.log('=== LOGIN ATTEMPT START ===');
    console.log('Email:', email);
    
    if (!email || !password) {
      showAlert(t('error'), t('fillAllFields'), undefined, 'error');
      return;
    }

    setLoading(true);
    console.log('Calling login function...');
    const result = await login(email, password);
    console.log('Login result:', result);
    setLoading(false);

    if (result.success) {
      console.log('Login successful, saving credentials and navigating to home');
      await saveCredentials();
      router.replace('/(tabs)/(home)/');
    } else {
      console.log('Login failed with error:', result.error);
      
      // Check if error is related to email verification
      const errorMessage = result.error?.toLowerCase() || '';
      if (errorMessage.includes('verif') || errorMessage.includes('email')) {
        setNeedsVerification(true);
        showConfirm({
          title: t('emailVerificationRequired'),
          message: t('pleaseVerifyEmail'),
          confirmText: t('resendEmail'),
          cancelText: t('cancel'),
          type: 'warning',
          onConfirm: handleResendVerification,
          onCancel: () => {},
        });
      } else if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
        showAlert(
          t('loginError'),
          t('invalidCredentials'),
          undefined,
          'error'
        );
      } else {
        showAlert(t('error'), result.error || t('errorLoggingIn'), undefined, 'error');
      }
    }
    
    console.log('=== LOGIN ATTEMPT END ===');
  };

  const handleResendVerification = async () => {
    console.log('Resending verification email...');
    setLoading(true);
    const result = await resendVerificationEmail();
    setLoading(false);

    if (result.success) {
      showAlert(t('success'), t('emailVerificationSent'), undefined, 'success');
    } else {
      showAlert(t('error'), result.error || t('errorResendingEmail'), undefined, 'error');
    }
  };

  const handleForgotPassword = () => {
    showConfirm({
      title: t('recoverPasswordTitle'),
      message: t('recoverPasswordMessage'),
      confirmText: t('contactSupport'),
      cancelText: t('cancel'),
      type: 'info',
      onConfirm: () => {
        showAlert(t('support'), `${t('sendEmailTo')} ${t('supportEmail')}`, undefined, 'info');
      },
      onCancel: () => {},
    });
  };

  // Show loading overlay if auth is initializing
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Selector - Fixed position at top right */}
      <View style={styles.languageSelectorContainer}>
        <LanguageSelector />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/04a4d9ac-4539-41d2-bafd-67dd75925bde.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{t('mxiStrategicPresale')}</Text>
          <Text style={styles.subtitle}>{t('secureYourPosition')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('emailLabel')}</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('enterYourEmail')}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('passwordLabel')}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[commonStyles.input, styles.passwordInput]}
                placeholder={t('enterYourPassword')}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <IconSymbol
                  ios_icon_name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  android_material_icon_name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Password Checkbox */}
          <View style={styles.rememberContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberPassword(!rememberPassword)}
              disabled={loading}
            >
              <View style={[styles.checkbox, rememberPassword && styles.checkboxChecked]}>
                {rememberPassword && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={16}
                    color="#fff"
                  />
                )}
              </View>
              <Text style={styles.rememberText}>{t('rememberPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {needsVerification && (
            <View style={styles.verificationBox}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle.fill" 
                android_material_icon_name="warning"
                size={20} 
                color={colors.warning} 
              />
              <Text style={styles.verificationText}>
                {t('pleaseVerifyEmailBeforeLogin')}
              </Text>
              <TouchableOpacity onPress={handleResendVerification} disabled={loading}>
                <Text style={styles.resendLink}>{t('resendEmailButton')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[buttonStyles.primary, styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={buttonStyles.primaryText}>{t('loginButton')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[buttonStyles.outline, styles.registerButton]}
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
          >
            <Text style={buttonStyles.outlineText}>{t('createAccount')}</Text>
          </TouchableOpacity>

          {/* Link to view terms */}
          <TouchableOpacity
            style={styles.termsLinkContainer}
            onPress={() => setShowTermsModal(true)}
          >
            <Text style={styles.termsLinkText}>{t('viewTerms')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('presaleClosesOn')}
          </Text>
        </View>

        {/* Footer */}
        <Footer />
      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📜 {t('termsAndConditions')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.termsContent}>
              {`TÉRMINOS Y CONDICIONES DE USO

MXI STRATEGIC PRESALE – APP VERSION

MAXCOIN (MXI) is a registered trademark of MXI Strategic Holdings Ltd., Cayman Islands.
App operated by MXI Technologies Inc. (Panamá).
Last update: 15/01/2026 – Version 1.0

1. Aceptación

Al crear una cuenta o utilizar la aplicación MXI Strategic Presale (la "App"), usted acepta estos Términos y Condiciones.
Si no está de acuerdo con ellos, no debe usar la App.

2. Sobre MXI

MXI Strategic Holdings Ltd. (Cayman) es la entidad propietaria del token MXI, la marca y la propiedad intelectual.

MXI Technologies Inc. (Panamá) es la empresa operadora de la App y responsable de su funcionamiento.

3. Función de la App

La App permite:

- Registrar usuarios
- Comprar tokens MXI con USDT (vía Binance)
- Acceder a un sistema de referidos
- Ver saldos, rendimientos y movimientos
- Solicitar retiros de comisiones y/o MXI según las reglas vigentes

4. Elegibilidad

Para usar la App, usted debe:

- Ser mayor de 18 años
- Tener capacidad legal para contratar
- Suministrar datos verídicos
- No vivir en países donde las criptomonedas estén prohibidas

5. Registro y Cuenta

- Solo se permite una cuenta por persona
- Es obligatorio completar KYC para habilitar retiros
- La información registrada debe coincidir con documentos oficiales
- Los números de identificación no pueden repetirse

6. Compra de Tokens MXI

- Mínimo de compra: 50 USDT
- Máximo por usuario: 100.000 USDT
- Pago exclusivamente en USDT a través de Binance
- El número de tokens recibidos depende de la fase de la preventa

7. Sistema de Referidos

Estructura de comisiones:

- Nivel 1: 5%
- Nivel 2: 2%
- Nivel 3: 1%

Requisitos para retirar comisiones:

- 5 referidos activos
- 10 días desde registro
- KYC aprobado
- Cada referido debe haber hecho al menos una compra

8. Rendimientos y Vesting

- Rendimiento: 0,005% por hora
- Comisiones unificadas también generan rendimiento
- Rendimientos no aumentan el vesting
- Se requieren 10 referidos activos para unificar el vesting al saldo principal

9. Retiros

9.1 Retiros de comisiones (USDT)

Requisitos:

- 5 referidos activos
- 10 días de membresía
- KYC aprobado
- Wallet USDT válida

9.2 Retiros de MXI

Requisitos:

- 5 referidos activos
- KYC aprobado

Liberación por fases si el monto excede 50000 usdt:

- 10% inicial
- +10% cada 7 días

10. KYC Obligatorio

Se solicitará:

- Documento oficial válido
- Fotografías
- Selfie (prueba de vida)
- Información verificable

11. Riesgos

Invertir en criptomonedas implica riesgos:

- Volatilidad extrema
- Pérdida total o parcial del capital
- Cambios regulatorios
- Riesgos tecnológicos y de ciberseguridad

MXI Strategic no garantiza ganancias ni retornos fijos.

12. Conductas Prohibidas

No se permite:

- Crear múltiples cuentas
- Proveer datos falsos
- Manipular referidos
- Usar la App para actividades ilícitas
- Procesar lavado de dinero

13. Limitación de Responsabilidad

La App se ofrece "tal cual".
Ni MXI Strategic Holdings Ltd. ni MXI Technologies Inc. son responsables por:

- Pérdidas económicas
- Errores de terceros o blockchain
- Daños indirectos o incidentales
- Uso indebido de la App

14. Aceptación Final

Al registrarse, usted declara que:

- Leyó y entiende estos Términos
- Acepta los riesgos
- Proporciona información veraz
- Cumple con las leyes de su país

15. POLÍTICA DE USO DEL TOKEN MXI

El token MXI es un activo digital en etapa de prelanzamiento, sin valor comercial, sin cotización pública y sin reconocimiento como moneda de curso legal en Colombia, España, México ni en ninguna otra jurisdicción. Su uso dentro de la plataforma es exclusivamente funcional, destinado a recompensas internas, participación en actividades gamificadas y acceso a beneficios del ecosistema MXI.

MXI no representa inversiones, derechos de propiedad, rentabilidad garantizada, participación accionaria, instrumentos financieros, valores negociables ni productos similares. Los usuarios aceptan que el uso del token es experimental, sujeto a cambios y dependiente de procesos de validación técnica y regulatoria.

Cualquier futuro valor, convertibilidad o listado del token dependerá de condiciones externas a la compañía, procesos regulatorios y decisiones de mercado que no pueden garantizarse. La plataforma no asegura beneficios económicos, apreciación ni rendimiento alguno asociado al MXI.

16. ANEXO LEGAL – JUEGOS Y RECOMPENSAS MXI

Las dinámicas disponibles dentro de la plataforma (incluyendo retos, minijuegos como tap, clicker, "AirBall", desafíos de habilidad y la modalidad "Bonus MXI") se basan exclusivamente en la destreza, rapidez, precisión o participación activa del usuario, y no dependen del azar para determinar resultados.

Ninguna actividad ofrecida debe interpretarse como:

- juego de azar,
- apuesta,
- sorteo con fines lucrativos,
- rifas reguladas,
- loterías estatales o privadas,
- ni mecanismos equivalentes regulados en Colombia, España o México.

El acceso a estas dinámicas puede requerir un pago simbólico en MXI, pero dicho pago no constituye una apuesta, ya que el token no posee valor económico real y se utiliza únicamente como mecanismo interno de participación.

La modalidad "Bonus MXI", incluyendo asignación aleatoria de premios, se realiza fuera de la plataforma principal, mediante procesos independientes, transparentes y verificables, cuyo fin es distribuir recompensas promocionales en MXI sin que ello constituya un juego de azar regulado.

Los usuarios aceptan que las recompensas otorgadas son promocionales, digitales y sin valor comercial, y que la participación en cualquier dinámica no garantiza ganancias económicas reales.

---

**IMPORTANTE**: Estos términos y condiciones son legalmente vinculantes. Si no está de acuerdo con alguna parte, no debe utilizar la Aplicación. Se recomienda consultar con un asesor legal o financiero antes de realizar inversiones en criptomonedas.

**Fecha de vigencia**: 15 de Enero de 2026
**Versión**: 1.0`}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.closeButton]}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={buttonStyles.primaryText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontSize: 14,
    color: colors.text,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  verificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  verificationText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerButton: {
    marginBottom: 16,
  },
  termsLinkContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  termsLinkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 32,
    marginBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  termsContent: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 22,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButton: {
    marginBottom: 0,
  },
});
