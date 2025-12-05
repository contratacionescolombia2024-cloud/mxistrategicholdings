
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
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type DocumentType = 'passport' | 'national_id' | 'drivers_license';

export default function KYCVerificationScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  
  const [fullName, setFullName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('national_id');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFrontUri, setDocumentFrontUri] = useState<string | null>(null);
  const [documentBackUri, setDocumentBackUri] = useState<string | null>(null);
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string | null>(null);
  const [documentBackUrl, setDocumentBackUrl] = useState<string | null>(null);

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] === KYC VERIFICATION SCREEN MOUNTED ===`);
    loadKYCData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Requesting media library permissions...`);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log(`[${timestamp}] Permission status:`, status);
      
      if (status !== 'granted') {
        Alert.alert(
          t('error'),
          t('pleaseUploadFrontDocument')
        );
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Error requesting permissions:`, error);
    }
  };

  const loadKYCData = async () => {
    if (!user) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] No user found, skipping KYC data load`);
      return;
    }
    
    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === LOADING KYC DATA ===`);
      console.log(`[${timestamp}] User ID:`, user.id);
      
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`[${timestamp}] Error loading KYC data:`, error);
        console.error(`[${timestamp}] Error details:`, JSON.stringify(error, null, 2));
      }

      if (data) {
        console.log(`[${timestamp}] KYC data loaded successfully:`, data);
        setKycData(data);
        setFullName(data.full_name || '');
        setDocumentType(data.document_type || 'national_id');
        setDocumentNumber(data.document_number || '');
        setDocumentFrontUrl(data.document_front_url);
        setDocumentBackUrl(data.document_back_url);
      } else {
        console.log(`[${timestamp}] No existing KYC data found for user`);
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Exception loading KYC data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (side: 'front' | 'back') => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === PICKING IMAGE FOR ${side.toUpperCase()} ===`);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log(`[${timestamp}] Image picker result:`, result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log(`[${timestamp}] Image selected for ${side}:`, asset.uri);
        console.log(`[${timestamp}] Image size:`, asset.width, 'x', asset.height);
        
        if (side === 'front') {
          setDocumentFrontUri(asset.uri);
        } else {
          setDocumentBackUri(asset.uri);
        }
        
        // Upload immediately after selection
        await uploadImage(asset.uri, side);
      } else {
        console.log(`[${timestamp}] Image picker canceled`);
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Error picking image:`, error);
      Alert.alert(t('error'), t('errorUploadingDocument'));
    }
  };

  const uploadImage = async (uri: string, side: 'front' | 'back') => {
    if (!user) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] No user found for upload`);
      Alert.alert(t('error'), t('authenticationErrorText'));
      return;
    }

    const setUploading = side === 'front' ? setUploadingFront : setUploadingBack;
    setUploading(true);

    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === UPLOADING ${side.toUpperCase()} IMAGE ===`);
      console.log(`[${timestamp}] URI:`, uri);
      console.log(`[${timestamp}] User ID:`, user.id);
      
      // Get file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${side}_${Date.now()}.${fileExt}`;
      console.log(`[${timestamp}] Target filename:`, fileName);

      let fileData: any;
      let contentType = `image/${fileExt}`;

      if (Platform.OS === 'web') {
        // Web platform: use fetch and blob
        console.log(`[${timestamp}] Web platform: Fetching image as blob...`);
        const response = await fetch(uri);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        fileData = await response.blob();
        console.log(`[${timestamp}] Blob created successfully`);
        console.log(`[${timestamp}] Blob size:`, fileData.size, 'bytes');
        console.log(`[${timestamp}] Blob type:`, fileData.type);
      } else {
        // Native platform: use FileSystem to read as base64 and convert to ArrayBuffer
        console.log(`[${timestamp}] Native platform: Reading file with FileSystem...`);
        
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log(`[${timestamp}] File read as base64, length:`, base64.length);
        
        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileData = bytes.buffer;
        
        console.log(`[${timestamp}] ArrayBuffer created, size:`, fileData.byteLength, 'bytes');
      }

      // Upload to Supabase Storage
      console.log(`[${timestamp}] Uploading to Supabase storage bucket: kyc-documents`);
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, fileData, {
          contentType: contentType,
          upsert: true,
        });

      if (error) {
        console.error(`[${timestamp}] Storage upload error:`, error);
        console.error(`[${timestamp}] Error details:`, JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to upload to storage');
      }

      console.log(`[${timestamp}] Upload successful!`);
      console.log(`[${timestamp}] Upload data:`, data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      console.log(`[${timestamp}] Public URL generated:`, urlData.publicUrl);

      if (side === 'front') {
        setDocumentFrontUrl(urlData.publicUrl);
        console.log(`[${timestamp}] Front document URL set:`, urlData.publicUrl);
      } else {
        setDocumentBackUrl(urlData.publicUrl);
        console.log(`[${timestamp}] Back document URL set:`, urlData.publicUrl);
      }

      Alert.alert(
        t('successUploadDocument'), 
        side === 'front' ? t('frontDocumentUploaded') : t('backDocumentUploaded')
      );
    } catch (error: any) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] === UPLOAD ERROR FOR ${side.toUpperCase()} ===`);
      console.error(`[${timestamp}] Error:`, error);
      console.error(`[${timestamp}] Error message:`, error.message);
      console.error(`[${timestamp}] Error stack:`, error.stack);
      Alert.alert(t('uploadError'), error.message || t('errorUploadingDocument'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ========================================`);
    console.log(`[${timestamp}] === KYC SUBMIT BUTTON PRESSED ===`);
    console.log(`[${timestamp}] ========================================`);
    
    // Prevent double submission
    if (submitting) {
      console.log(`[${timestamp}] Already submitting, ignoring duplicate press`);
      return;
    }

    if (!user) {
      console.error(`[${timestamp}] ERROR: No user found`);
      Alert.alert(t('error'), t('authenticationErrorText'));
      return;
    }

    console.log(`[${timestamp}] User authenticated:`, user.id);
    console.log(`[${timestamp}] User email:`, user.email);

    // Validation
    console.log(`[${timestamp}] === STARTING VALIDATION ===`);
    console.log(`[${timestamp}] Full name:`, fullName);
    console.log(`[${timestamp}] Document type:`, documentType);
    console.log(`[${timestamp}] Document number:`, documentNumber);
    console.log(`[${timestamp}] Front URL:`, documentFrontUrl);
    console.log(`[${timestamp}] Back URL:`, documentBackUrl);
    
    if (!fullName.trim()) {
      console.log(`[${timestamp}] VALIDATION FAILED: Full name is empty`);
      Alert.alert(t('error'), t('pleaseEnterFullNameText'));
      return;
    }

    if (!documentNumber.trim()) {
      console.log(`[${timestamp}] VALIDATION FAILED: Document number is empty`);
      Alert.alert(t('error'), t('pleaseEnterDocumentNumber'));
      return;
    }

    if (!documentFrontUrl) {
      console.log(`[${timestamp}] VALIDATION FAILED: Front document not uploaded`);
      Alert.alert(t('error'), t('pleaseUploadFrontDocument'));
      return;
    }

    if (!documentBackUrl && documentType !== 'passport') {
      console.log(`[${timestamp}] VALIDATION FAILED: Back document not uploaded (required for non-passport)`);
      Alert.alert(t('error'), t('pleaseUploadBackDocument'));
      return;
    }

    console.log(`[${timestamp}] === VALIDATION PASSED ===`);

    // Set submitting state immediately
    setSubmitting(true);
    console.log(`[${timestamp}] Submitting state set to TRUE`);

    try {
      console.log(`[${timestamp}] === STARTING DATABASE INSERT ===`);

      // Create KYC record
      const kycRecord = {
        user_id: user.id,
        full_name: fullName.trim(),
        document_type: documentType,
        document_number: documentNumber.trim(),
        document_front_url: documentFrontUrl,
        document_back_url: documentBackUrl || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      };

      console.log(`[${timestamp}] KYC record to insert:`, JSON.stringify(kycRecord, null, 2));
      console.log(`[${timestamp}] Calling supabase.from('kyc_verifications').insert()...`);

      const { data: insertedData, error: insertError } = await supabase
        .from('kyc_verifications')
        .insert(kycRecord)
        .select()
        .single();

      console.log(`[${timestamp}] Insert operation completed`);

      if (insertError) {
        console.error(`[${timestamp}] === INSERT ERROR ===`);
        console.error(`[${timestamp}] Error code:`, insertError.code);
        console.error(`[${timestamp}] Error message:`, insertError.message);
        console.error(`[${timestamp}] Error details:`, JSON.stringify(insertError, null, 2));
        console.error(`[${timestamp}] Error hint:`, insertError.hint);
        throw new Error(insertError.message || t('errorSubmittingKYC'));
      }

      console.log(`[${timestamp}] === INSERT SUCCESS ===`);
      console.log(`[${timestamp}] Inserted data:`, JSON.stringify(insertedData, null, 2));

      // Update user's KYC status
      console.log(`[${timestamp}] === UPDATING USER KYC STATUS ===`);
      console.log(`[${timestamp}] Updating user ${user.id} kyc_status to 'pending'...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id);

      if (updateError) {
        console.error(`[${timestamp}] User update error:`, updateError);
        console.error(`[${timestamp}] Error details:`, JSON.stringify(updateError, null, 2));
        // Don't fail the whole operation if this fails
      } else {
        console.log(`[${timestamp}] User KYC status updated successfully`);
      }

      // Update local user state
      console.log(`[${timestamp}] Updating local user context...`);
      await updateUser({ kycStatus: 'pending' });
      console.log(`[${timestamp}] Local user context updated`);

      console.log(`[${timestamp}] === KYC SUBMIT COMPLETE ===`);

      // Show success message
      Alert.alert(
        t('kycSubmittedSuccessfully'),
        t('kycUnderReview'),
        [
          {
            text: t('ok'),
            onPress: () => {
              console.log(`[${timestamp}] User acknowledged success, navigating back`);
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ========================================`);
      console.error(`[${timestamp}] === KYC SUBMIT ERROR ===`);
      console.error(`[${timestamp}] ========================================`);
      console.error(`[${timestamp}] Error:`, error);
      console.error(`[${timestamp}] Error message:`, error.message);
      console.error(`[${timestamp}] Error stack:`, error.stack);
      console.error(`[${timestamp}] Error name:`, error.name);
      
      Alert.alert(
        t('submissionError'),
        error.message || t('errorSubmittingKYC')
      );
    } finally {
      setSubmitting(false);
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Submitting state set to FALSE`);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingUserData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
      case 'under_review':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark.seal.fill';
      case 'pending':
      case 'under_review':
        return 'clock.fill';
      case 'rejected':
        return 'xmark.circle.fill';
      default:
        return 'doc.text.fill';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return t('notSubmitted');
      case 'pending':
        return t('pending');
      case 'approved':
        return t('approved');
      case 'rejected':
        return t('rejected');
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('kycVerification')}</Text>
          <Text style={styles.subtitle}>{t('completeYourKYCVerification')}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('loadingKYCData')}</Text>
          </View>
        ) : (
          <>
            <View style={[commonStyles.card, styles.statusCard]}>
              <View style={styles.statusHeader}>
                <IconSymbol
                  ios_icon_name={getStatusIcon(user.kycStatus)}
                  android_material_icon_name={getStatusIcon(user.kycStatus)}
                  size={32}
                  color={getStatusColor(user.kycStatus)}
                />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>{t('verificationStatus')}</Text>
                  <Text style={[styles.statusValue, { color: getStatusColor(user.kycStatus) }]}>
                    {getStatusText(user.kycStatus)}
                  </Text>
                </View>
              </View>

              {user.kycStatus === 'approved' && user.kycVerifiedAt && (
                <Text style={styles.statusDate}>
                  {t('verifiedOn')} {new Date(user.kycVerifiedAt).toLocaleDateString()}
                </Text>
              )}

              {user.kycStatus === 'pending' && (
                <View style={styles.pendingNotice}>
                  <IconSymbol ios_icon_name="info.circle" android_material_icon_name="info" size={18} color={colors.warning} />
                  <Text style={styles.pendingText}>
                    {t('yourKYCIsBeingReviewed')}
                  </Text>
                </View>
              )}

              {user.kycStatus === 'rejected' && kycData?.rejection_reason && (
                <View style={styles.rejectionNotice}>
                  <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={18} color={colors.error} />
                  <Text style={styles.rejectionText}>
                    {t('rejectionReason')}: {kycData.rejection_reason}
                  </Text>
                  <Text style={styles.rejectionHint}>
                    {t('pleaseCorrectIssues')}
                  </Text>
                </View>
              )}
            </View>

            {(user.kycStatus === 'not_submitted' || user.kycStatus === 'rejected') && (
              <>
                <View style={[commonStyles.card, styles.infoCard]}>
                  <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>{t('whyKYCRequired')}</Text>
                    <Text style={styles.infoText}>
                      - {t('kycMandatoryForWithdrawals')}{'\n'}
                      - {t('helpPreventFraud')}{'\n'}
                      - {t('ensureCompliance')}{'\n'}
                      - {t('protectYourAccount')}{'\n'}
                      - {t('oneTimeVerification')}
                    </Text>
                  </View>
                </View>

                <View style={[commonStyles.card, styles.formCard]}>
                  <Text style={styles.formTitle}>{t('personalInformation')}</Text>

                  <View style={styles.inputContainer}>
                    <Text style={commonStyles.label}>{t('fullLegalName')}</Text>
                    <TextInput
                      style={commonStyles.input}
                      placeholder={t('enterFullNameAsOnID')}
                      placeholderTextColor={colors.textSecondary}
                      value={fullName}
                      onChangeText={(text) => {
                        const timestamp = new Date().toISOString();
                        console.log(`[${timestamp}] Full name changed:`, text);
                        setFullName(text);
                      }}
                      autoCapitalize="words"
                      editable={!submitting}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={commonStyles.label}>{t('documentType')}</Text>
                    <View style={styles.documentTypeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.documentTypeButton,
                          documentType === 'national_id' && styles.documentTypeButtonActive,
                        ]}
                        onPress={() => {
                          const timestamp = new Date().toISOString();
                          console.log(`[${timestamp}] Document type changed to: national_id`);
                          setDocumentType('national_id');
                        }}
                        disabled={submitting}
                      >
                        <IconSymbol
                          ios_icon_name="person.text.rectangle"
                          android_material_icon_name="badge"
                          size={20}
                          color={documentType === 'national_id' ? '#fff' : colors.text}
                        />
                        <Text
                          style={[
                            styles.documentTypeText,
                            documentType === 'national_id' && styles.documentTypeTextActive,
                          ]}
                        >
                          {t('nationalID')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.documentTypeButton,
                          documentType === 'passport' && styles.documentTypeButtonActive,
                        ]}
                        onPress={() => {
                          const timestamp = new Date().toISOString();
                          console.log(`[${timestamp}] Document type changed to: passport`);
                          setDocumentType('passport');
                        }}
                        disabled={submitting}
                      >
                        <IconSymbol
                          ios_icon_name="book.closed"
                          android_material_icon_name="menu_book"
                          size={20}
                          color={documentType === 'passport' ? '#fff' : colors.text}
                        />
                        <Text
                          style={[
                            styles.documentTypeText,
                            documentType === 'passport' && styles.documentTypeTextActive,
                          ]}
                        >
                          {t('passport')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.documentTypeButton,
                          documentType === 'drivers_license' && styles.documentTypeButtonActive,
                        ]}
                        onPress={() => {
                          const timestamp = new Date().toISOString();
                          console.log(`[${timestamp}] Document type changed to: drivers_license`);
                          setDocumentType('drivers_license');
                        }}
                        disabled={submitting}
                      >
                        <IconSymbol
                          ios_icon_name="car"
                          android_material_icon_name="directions_car"
                          size={20}
                          color={documentType === 'drivers_license' ? '#fff' : colors.text}
                        />
                        <Text
                          style={[
                            styles.documentTypeText,
                            documentType === 'drivers_license' && styles.documentTypeTextActive,
                          ]}
                        >
                          {t('driversLicense')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={commonStyles.label}>{t('documentNumber')}</Text>
                    <TextInput
                      style={commonStyles.input}
                      placeholder={t('enterYourDocumentNumber')}
                      placeholderTextColor={colors.textSecondary}
                      value={documentNumber}
                      onChangeText={(text) => {
                        const timestamp = new Date().toISOString();
                        console.log(`[${timestamp}] Document number changed:`, text);
                        setDocumentNumber(text);
                      }}
                      autoCapitalize="characters"
                      editable={!submitting}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={commonStyles.label}>{t('frontDocument')}</Text>
                    <Text style={styles.uploadHint}>
                      {t('uploadClearPhotoOfFront')}
                    </Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => pickImage('front')}
                      disabled={uploadingFront || submitting}
                    >
                      {uploadingFront ? (
                        <View style={styles.uploadContent}>
                          <ActivityIndicator color={colors.primary} />
                          <Text style={styles.uploadText}>{t('uploading')}</Text>
                        </View>
                      ) : documentFrontUri || documentFrontUrl ? (
                        <View style={styles.uploadedContainer}>
                          <Image
                            source={{ uri: documentFrontUri || documentFrontUrl || '' }}
                            style={styles.uploadedImage}
                          />
                          <View style={styles.uploadedOverlay}>
                            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={32} color={colors.success} />
                            <Text style={styles.uploadedText}>{t('tapToChange')}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadContent}>
                          <IconSymbol ios_icon_name="photo" android_material_icon_name="photo" size={32} color={colors.primary} />
                          <Text style={styles.uploadText}>{t('tapToUploadFront')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {documentType !== 'passport' && (
                    <View style={styles.inputContainer}>
                      <Text style={commonStyles.label}>{t('backDocument')}</Text>
                      <Text style={styles.uploadHint}>
                        {t('uploadClearPhotoOfBack')}
                      </Text>
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => pickImage('back')}
                        disabled={uploadingBack || submitting}
                      >
                        {uploadingBack ? (
                          <View style={styles.uploadContent}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={styles.uploadText}>{t('uploading')}</Text>
                          </View>
                        ) : documentBackUri || documentBackUrl ? (
                          <View style={styles.uploadedContainer}>
                            <Image
                              source={{ uri: documentBackUri || documentBackUrl || '' }}
                              style={styles.uploadedImage}
                            />
                            <View style={styles.uploadedOverlay}>
                              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={32} color={colors.success} />
                              <Text style={styles.uploadedText}>{t('tapToChange')}</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.uploadContent}>
                            <IconSymbol ios_icon_name="photo" android_material_icon_name="photo" size={32} color={colors.primary} />
                            <Text style={styles.uploadText}>{t('tapToUploadBack')}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      buttonStyles.primary, 
                      styles.submitButton,
                      (submitting || uploadingFront || uploadingBack) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting || uploadingFront || uploadingBack}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.buttonText}>{t('submitting')}</Text>
                      </>
                    ) : (
                      <>
                        <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={20} color="#fff" />
                        <Text style={styles.buttonText}>{t('submitKYCVerification')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={[commonStyles.card, styles.securityCard]}>
                  <IconSymbol ios_icon_name="lock.shield.fill" android_material_icon_name="security" size={24} color={colors.success} />
                  <View style={styles.securityContent}>
                    <Text style={styles.securityTitle}>{t('yourDataIsSecure')}</Text>
                    <Text style={styles.securityText}>
                      {t('dataEncryptedAndSecure')}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {user.kycStatus === 'approved' && (
              <View style={[commonStyles.card, styles.successCard]}>
                <IconSymbol ios_icon_name="checkmark.seal.fill" android_material_icon_name="verified" size={48} color={colors.success} />
                <Text style={styles.successTitle}>{t('kycVerified')}</Text>
                <Text style={styles.successText}>
                  {t('identityVerifiedSuccessfully')}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  pendingText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rejectionNotice: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  rejectionText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 18,
  },
  rejectionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  documentTypeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  documentTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  documentTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  documentTypeTextActive: {
    color: '#fff',
  },
  uploadHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  uploadButton: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  uploadedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadedText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  successCard: {
    alignItems: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
