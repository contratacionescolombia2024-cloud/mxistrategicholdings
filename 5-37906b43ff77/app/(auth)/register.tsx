
import React, { useState } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/utils/confirmDialog';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleRegister = async () => {
    const { name, idNumber, address, email, password, confirmPassword, referralCode } = formData;

    if (!name || !idNumber || !address || !email || !password || !confirmPassword) {
      showAlert(t('error'), t('fillAllFields'), undefined, 'error');
      return;
    }

    if (!acceptedTerms) {
      showAlert(
        t('termsAndConditionsRequired'),
        t('youMustAcceptTerms'),
        undefined,
        'warning'
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert(t('error'), t('passwordsDontMatch'), undefined, 'error');
      return;
    }

    if (password.length < 6) {
      showAlert(t('error'), t('passwordTooShort'), undefined, 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(t('error'), t('invalidEmail'), undefined, 'error');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      idNumber,
      address,
      email,
      password,
      referralCode: referralCode || undefined,
    });

    if (result.success && result.userId) {
      // Save terms acceptance timestamp
      const { error: termsError } = await supabase
        .from('users')
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq('id', result.userId);

      if (termsError) {
        console.error('Error saving terms acceptance:', termsError);
      }
    }

    setLoading(false);

    if (result.success) {
      showAlert(
        t('success'),
        t('accountCreatedSuccessfully'),
        () => router.replace('/(auth)/login'),
        'success'
      );
    } else {
      showAlert(t('error'), result.error || t('failedToCreateAccount'), undefined, 'error');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonEmoji}>⬅️</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/04a4d9ac-4539-41d2-bafd-67dd75925bde.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{t('joinMXIStrategicPresale')}</Text>
          <Text style={styles.subtitle}>{t('secureYourPosition')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('fullName')} *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('enterYourFullName')}
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('idNumber')} *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('enterYourIDNumber')}
              placeholderTextColor={colors.textSecondary}
              value={formData.idNumber}
              onChangeText={(value) => updateField('idNumber', value)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('address')} *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('enterYourResidentialAddress')}
              placeholderTextColor={colors.textSecondary}
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('email')} *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('enterYourEmail')}
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('password')} *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[commonStyles.input, styles.passwordInput]}
                placeholder={t('minimumSixCharacters')}
                placeholderTextColor={colors.textSecondary}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <IconSymbol
                  ios_icon_name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  android_material_icon_name={showPassword ? 'visibility_off' : 'visibility'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('confirmPassword')} *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('reEnterPassword')}
              placeholderTextColor={colors.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>{t('referralCode')}</Text>
            <TextInput
              style={commonStyles.input}
              placeholder={t('enterReferralCode')}
              placeholderTextColor={colors.textSecondary}
              value={formData.referralCode}
              onChangeText={(value) => updateField('referralCode', value)}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.infoBox}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.infoText}>
              {t('onlyOneAccountPerPerson')}
            </Text>
          </View>

          {/* Terms and Conditions Acceptance */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && (
                  <Text style={styles.checkboxEmoji}>✓</Text>
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  {t('iHaveReadAndAccept')}{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    {t('termsAndConditions')}
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.registerButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('createAccount')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={styles.loginLinkText}>
              {t('alreadyHaveAccountLogin')} <Text style={styles.loginLinkBold}>{t('login')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
              <Text style={styles.modalCloseEmoji}>✖️</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.termsContent}>
              {t('termsContent')}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.acceptButton]}
              onPress={() => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={buttonStyles.primaryText}>✓ {t('acceptTermsButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[buttonStyles.secondary, styles.closeButton]}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={buttonStyles.secondaryText}>{t('close')}</Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    padding: 8,
  },
  backButtonEmoji: {
    fontSize: 24,
  },
  logoContainer: {
    marginBottom: 16,
    width: 100,
    height: 100,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  checkboxEmoji: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '600',
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
  modalCloseEmoji: {
    fontSize: 24,
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
    gap: 12,
  },
  acceptButton: {
    marginBottom: 0,
  },
  closeButton: {
    marginBottom: 0,
  },
});
