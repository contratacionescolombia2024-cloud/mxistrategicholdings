
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type TabType = 'que-es' | 'como-funciona' | 'por-que-comprar' | 'meta' | 'ecosistema' | 'seguridad-cuantica' | 'sostenibilidad' | 'vesting-diario' | 'en-la-practica' | 'tokenomica' | 'riesgos';

export default function EcosystemScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('que-es');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('ecosystem')}</Text>
        <Text style={styles.headerSubtitle}>{t('liquidityPool')}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabScrollContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
          style={styles.tabScrollView}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'que-es' && styles.activeTab]}
            onPress={() => setActiveTab('que-es')}
          >
            <Text style={[styles.tabText, activeTab === 'que-es' && styles.activeTabText]}>
              {t('whatIsMXI')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'como-funciona' && styles.activeTab]}
            onPress={() => setActiveTab('como-funciona')}
          >
            <Text style={[styles.tabText, activeTab === 'como-funciona' && styles.activeTabText]}>
              {t('howItWorksTab')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'por-que-comprar' && styles.activeTab]}
            onPress={() => setActiveTab('por-que-comprar')}
          >
            <Text style={[styles.tabText, activeTab === 'por-que-comprar' && styles.activeTabText]}>
              {t('whyBuy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'meta' && styles.activeTab]}
            onPress={() => setActiveTab('meta')}
          >
            <Text style={[styles.tabText, activeTab === 'meta' && styles.activeTabText]}>
              {t('meta')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'ecosistema' && styles.activeTab]}
            onPress={() => setActiveTab('ecosistema')}
          >
            <Text style={[styles.tabText, activeTab === 'ecosistema' && styles.activeTabText]}>
              {t('ecosystemTab')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'seguridad-cuantica' && styles.activeTab]}
            onPress={() => setActiveTab('seguridad-cuantica')}
          >
            <Text style={[styles.tabText, activeTab === 'seguridad-cuantica' && styles.activeTabText]}>
              {t('quantumSecurity')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'sostenibilidad' && styles.activeTab]}
            onPress={() => setActiveTab('sostenibilidad')}
          >
            <Text style={[styles.tabText, activeTab === 'sostenibilidad' && styles.activeTabText]}>
              {t('sustainability')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'vesting-diario' && styles.activeTab]}
            onPress={() => setActiveTab('vesting-diario')}
          >
            <Text style={[styles.tabText, activeTab === 'vesting-diario' && styles.activeTabText]}>
              {t('dailyVesting')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'en-la-practica' && styles.activeTab]}
            onPress={() => setActiveTab('en-la-practica')}
          >
            <Text style={[styles.tabText, activeTab === 'en-la-practica' && styles.activeTabText]}>
              {t('inPractice')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tokenomica' && styles.activeTab]}
            onPress={() => setActiveTab('tokenomica')}
          >
            <Text style={[styles.tabText, activeTab === 'tokenomica' && styles.activeTabText]}>
              {t('tokenomics')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'riesgos' && styles.activeTab]}
            onPress={() => setActiveTab('riesgos')}
          >
            <Text style={[styles.tabText, activeTab === 'riesgos' && styles.activeTabText]}>
              {t('risks')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={styles.contentScrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'que-es' && <QueEsMXITab />}
        {activeTab === 'como-funciona' && <ComoFuncionaTab />}
        {activeTab === 'por-que-comprar' && <PorQueComprarTab />}
        {activeTab === 'meta' && <MetaTab />}
        {activeTab === 'ecosistema' && <EcosistemaTab />}
        {activeTab === 'seguridad-cuantica' && <SeguridadCuanticaTab />}
        {activeTab === 'sostenibilidad' && <SostenibilidadTab />}
        {activeTab === 'vesting-diario' && <VestingDiarioTab />}
        {activeTab === 'en-la-practica' && <EnLaPracticaTab />}
        {activeTab === 'tokenomica' && <TokenomicaTab />}
        {activeTab === 'riesgos' && <RiesgosTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ¿Qué es MXI? Tab Content - UPDATED TO USE CORRECT TRANSLATION KEYS
function QueEsMXITab() {
  const { t } = useLanguage();
  
  return (
    <View>
      {/* Main Title */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('whatIsMXITitle')}</Text>
      </View>

      {/* Logo Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/bebe6626-b6ac-47d4-ad64-acdc0b562775.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Main Content Card - NEW CONTENT */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('whatIsMXIIntro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.bodyText}>
            {t('whatIsMXIEarlyStage')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.bodyText}>
            {t('whatIsMXIPresale')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whatIsMXINotJustToken')}
          </Text>
        </LinearGradient>
      </View>

      {/* How MXI Works Section - NEW CONTENT */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('howMXIWorksTitle')}</Text>
          
          <Text style={styles.bodyText}>
            {t('howMXIWorksIntro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('howMXIWorksStep1Title')}</Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep1Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('howMXIWorksStep2Title')}</Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep2Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('howMXIWorksStep3Title')}</Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep3Desc')}
          </Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep3Point1')}
          </Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep3Point2')}
          </Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep3Point3')}
          </Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep3Point4')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('howMXIWorksStep4Title')}</Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep4Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('howMXIWorksStep5Title')}</Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep5Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('howMXIWorksStep6Title')}</Text>
          <Text style={styles.bodyText}>
            {t('howMXIWorksStep6Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('howMXIWorksConclusion')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Cómo Funciona Tab Content
function ComoFuncionaTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('howItWorksTitle')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/76715c1f-8b5b-4e0a-8692-d6d7963a0d99.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('howItWorksIntro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('step1Title')}</Text>
          <Text style={styles.bodyText}>
            {t('step1Description')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('step2Title')}</Text>
          <Text style={styles.bodyText}>
            {t('step2Description')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('step3Title')}</Text>
          <Text style={styles.bodyText}>
            {t('step3Description')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('step4Title')}</Text>
          <Text style={styles.bodyText}>
            {t('step4Description')}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>{t('keyBenefits')}</Text>
        
        <View style={[commonStyles.card, styles.valueCard]}>
          <Text style={styles.valueEmoji}>⚡</Text>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>{t('instantTransactions')}</Text>
            <Text style={styles.valueDescription}>
              {t('instantTransactionsDesc')}
            </Text>
          </View>
        </View>

        <View style={[commonStyles.card, styles.valueCard]}>
          <Text style={styles.valueEmoji}>🔒</Text>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>{t('maximumSecurity')}</Text>
            <Text style={styles.valueDescription}>
              {t('maximumSecurityDesc')}
            </Text>
          </View>
        </View>

        <View style={[commonStyles.card, styles.valueCard]}>
          <Text style={styles.valueEmoji}>🌐</Text>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>{t('globalAccess')}</Text>
            <Text style={styles.valueDescription}>
              {t('globalAccessDesc')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Por Qué Comprar Tab Content - Image 0 (cd6409f5) - UPDATED CONTENT
function PorQueComprarTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('whyBuyTitle')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/cd6409f5-2e6e-426b-9399-35c34f154df7.png')}
          style={styles.whyBuyImage}
          resizeMode="contain"
        />
      </View>

      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('whyBuyIntro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason1')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason1Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason2')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason2Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason3')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason3Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason4')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason4Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason5')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason5Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason6')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason6Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyReason7')}
          </Text>
          <Text style={styles.bodyText}>
            {t('whyBuyReason7Desc')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('whyBuyConclusion')}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>{t('investmentAdvantages')}</Text>
        
        <View style={styles.featuresGrid}>
          <View style={[commonStyles.card, styles.featureCard]}>
            <Text style={styles.featureEmoji}>📈</Text>
            <Text style={styles.featureTitle}>{t('growthPotential')}</Text>
            <Text style={styles.featureDescription}>{t('growthPotentialDesc')}</Text>
          </View>

          <View style={[commonStyles.card, styles.featureCard]}>
            <Text style={styles.featureEmoji}>💎</Text>
            <Text style={styles.featureTitle}>{t('limitedSupply')}</Text>
            <Text style={styles.featureDescription}>{t('limitedSupplyDesc')}</Text>
          </View>

          <View style={[commonStyles.card, styles.featureCard]}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureTitle}>{t('realUtility')}</Text>
            <Text style={styles.featureDescription}>{t('realUtilityDesc')}</Text>
          </View>

          <View style={[commonStyles.card, styles.featureCard]}>
            <Text style={styles.featureEmoji}>🌍</Text>
            <Text style={styles.featureTitle}>{t('globalCommunity')}</Text>
            <Text style={styles.featureDescription}>{t('globalCommunityDesc')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Meta Tab Content - UPDATED WITH NEW CONTENT
function MetaTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('metaTitle')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/b359a5d1-671d-4f57-a54c-219337b62602.png')}
          style={styles.metaImage}
          resizeMode="contain"
        />
      </View>

      {/* Introduction */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('metaIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* Vision */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('metaVision')}
          </Text>
        </LinearGradient>
      </View>

      {/* Economic Model */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('metaModel')}
          </Text>
        </LinearGradient>
      </View>

      {/* Final Objective */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.emphasisText}>
            {t('metaObjective')}
          </Text>

          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('metaObjectivePoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('metaObjectivePoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('metaObjectivePoint3')}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Conclusion */}
      <View style={[commonStyles.card, styles.visionCard]}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.visionGradient}
        >
          <Text style={styles.visionEmoji}>🎯</Text>
          <Text style={styles.ctaTitle}>{t('metaConclusion')}</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Ecosistema Tab Content - UPDATED WITH NEW CONTENT
function EcosistemaTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('ecosystemTabTitle')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/76b95e25-0844-42d7-915d-4be1ebdeb915.png')}
          style={styles.ecosistemaImage}
          resizeMode="contain"
        />
      </View>

      {/* Introduction */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('ecosystemIntro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.bodyText}>
            {t('ecosystemApproach')}
          </Text>
        </LinearGradient>
      </View>

      {/* Components Title */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('ecosystemComponentsTitle')}</Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponentsSubtitle')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 1: Token MXI */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent1Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent1Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 2: MXI Wallet */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent2Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent2Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 3: DeFi Platform */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent3Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent3Desc')}
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('ecosystemComponent3Point1')}</Text>
            <Text style={styles.bulletPoint}>{t('ecosystemComponent3Point2')}</Text>
            <Text style={styles.bulletPoint}>{t('ecosystemComponent3Point3')}</Text>
            <Text style={styles.bulletPoint}>{t('ecosystemComponent3Point4')}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Component 4: Launchpad */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent4Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent4Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 5: MXI Pay & Card */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent5Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent5Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 6: Quantum Security */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent6Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent6Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 7: Marketplace */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent7Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent7Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 8: Governance */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent8Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent8Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Component 9: Academy */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>
            {t('ecosystemComponent9Title')}
          </Text>
          <Text style={styles.bodyText}>
            {t('ecosystemComponent9Desc')}
          </Text>
        </LinearGradient>
      </View>

      {/* Summary */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('ecosystemSummaryTitle')}</Text>
          <Text style={styles.emphasisText}>
            {t('ecosystemSummaryIntro')}
          </Text>

          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint1')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint2')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint3')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint4')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint5')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint6')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint7')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint8')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint9')}</Text>
            <Text style={styles.bulletPoint}>✔ {t('ecosystemSummaryPoint10')}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.emphasisText}>
            {t('ecosystemSummaryConclusion')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Seguridad Cuántica Tab Content - NOW WITH QUANTUM SECURITY CONTENT (swapped from En la Práctica)
function SeguridadCuanticaTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('quantumSecurity')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/67cb31d5-9f16-4fe6-a660-8507d6b8e4bb.png')}
          style={styles.seguridadCuanticaImage}
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('inPracticeIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* Technical Details */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('inPracticeTechnical')}
          </Text>
        </LinearGradient>
      </View>

      {/* Why It's Necessary */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('inPracticeNecessity')}
          </Text>
        </LinearGradient>
      </View>

      {/* Presale Implementation */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.emphasisText}>
            {t('inPracticePresale')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Sostenibilidad Tab Content - UPDATED WITH NEW CONTENT
function SostenibilidadTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('sustainability')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/73b7a6c0-a56f-4c91-8ab9-2ec0cd607287.png')}
          style={styles.sostenibilidadImage}
          resizeMode="contain"
        />
      </View>

      {/* Economic Model Section */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('sustainabilityIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* Decentralized Approach Section */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('sustainabilityDecentralized')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Vesting Diario Tab Content - UPDATED WITH NEW CONTENT
function VestingDiarioTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('dailyVesting')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/0bb04517-a07a-45a8-bb08-aaeb2292d065.png')}
          style={styles.vestingImage}
          resizeMode="contain"
        />
      </View>

      {/* Introduction */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('vestingDiarioIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* How It Works */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('vestingDiarioHowItWorks')}
          </Text>
        </LinearGradient>
      </View>

      {/* Benefits */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('vestingDiarioBenefits')}
          </Text>
        </LinearGradient>
      </View>

      {/* Transparency */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('vestingDiarioTransparency')}
          </Text>
        </LinearGradient>
      </View>

      {/* Summary */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('vestingDiarioSummaryTitle')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('vestingDiarioBenefit1')}</Text>
            <Text style={styles.bulletPoint}>{t('vestingDiarioBenefit2')}</Text>
            <Text style={styles.bulletPoint}>{t('vestingDiarioBenefit3')}</Text>
            <Text style={styles.bulletPoint}>{t('vestingDiarioBenefit4')}</Text>
            <Text style={styles.bulletPoint}>{t('vestingDiarioBenefit5')}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Conclusion */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.emphasisText}>
            {t('vestingDiarioConclusion')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// En la Práctica Tab Content - NOW WITH INVESTOR PROFILES CONTENT
function EnLaPracticaTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('inPractice')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/9c088d87-87e8-4a3f-9920-2242244ecea7.png')}
          style={styles.practicaImage}
          resizeMode="contain"
        />
      </View>

      {/* Introduction */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('investorProfilesIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* Investor Profile 1: Basic Investor */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={['#4A90E2' + '20', '#4A90E2' + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.investorTitle}>
            {t('basicInvestorTitle')}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('shortTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('basicInvestorShortTerm')}</Text>
          
          <Text style={styles.bodyText}>{t('basicInvestorTable')}</Text>
          
          <Text style={styles.bodyText}>{t('basicInvestorExample')}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('mediumTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('basicInvestorMediumTerm')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('basicInvestorMediumPoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('basicInvestorMediumPoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('basicInvestorMediumPoint3')}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('longTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('basicInvestorLongTerm')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('basicInvestorLongPoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('basicInvestorLongPoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('basicInvestorLongPoint3')}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Investor Profile 2: Participative Investor */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={['#50C878' + '20', '#50C878' + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.investorTitle}>
            {t('participativeInvestorTitle')}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('shortTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('participativeInvestorShortTerm')}</Text>
          
          <Text style={styles.emphasisText}>{t('referralBonusLabel')}</Text>
          <Text style={styles.bodyText}>{t('participativeInvestorBonus')}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('mediumTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('participativeInvestorMediumTerm')}</Text>
          
          <Text style={styles.bodyText}>{t('participativeInvestorExample')}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('longTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('participativeInvestorLongTerm')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('participativeInvestorLongPoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('participativeInvestorLongPoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('participativeInvestorLongPoint3')}</Text>
          </View>
          
          <Text style={styles.emphasisText}>{t('participativeInvestorConclusion')}</Text>
        </LinearGradient>
      </View>

      {/* Investor Profile 3: Strategic Investor */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={['#FF8C42' + '20', '#FF8C42' + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.investorTitle}>
            {t('strategicInvestorTitle')}
          </Text>
          
          <Text style={styles.bodyText}>{t('strategicInvestorIntro')}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('shortTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('strategicInvestorShortTerm')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('strategicInvestorChallengePoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorChallengePoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorChallengePoint3')}</Text>
          </View>
          
          <Text style={styles.bodyText}>{t('strategicInvestorExample')}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('mediumTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('strategicInvestorMediumTerm')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('strategicInvestorMediumPoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorMediumPoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorMediumPoint3')}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionSubtitle}>{t('longTermLabel')}</Text>
          <Text style={styles.bodyText}>{t('strategicInvestorLongTerm')}</Text>
          
          <Text style={styles.emphasisText}>{t('strategicInvestorBenefits')}</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>{t('strategicInvestorBenefitPoint1')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorBenefitPoint2')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorBenefitPoint3')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorBenefitPoint4')}</Text>
            <Text style={styles.bulletPoint}>{t('strategicInvestorBenefitPoint5')}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

// Tokenómica Tab Content - UPDATED WITH NEW CONTENT
function TokenomicaTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('tokenomics')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/c8e5b4e8-eeb5-4ea6-a207-c930085bb758.png')}
          style={styles.tokenomicaImage}
          resizeMode="contain"
        />
      </View>

      {/* Introduction */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('tokenomicsIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* Section 1: Hybrid Model Structure */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('tokenomicsSection1Title')}</Text>
          <Text style={styles.bodyText}>
            {t('tokenomicsSection1Intro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection1ATitle')}</Text>
          <Text style={styles.bodyText}>
            {t('tokenomicsSection1ADesc')}
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1APoint1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1APoint2')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1APoint3')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            {t('tokenomicsSection1ABenefit')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection1BTitle')}</Text>
          <Text style={styles.bodyText}>
            {t('tokenomicsSection1BDesc')}
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1BPoint1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1BPoint2')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            {t('tokenomicsSection1BModel')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection1CTitle')}</Text>
          <Text style={styles.bodyText}>
            {t('tokenomicsSection1CDesc')}
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1CPoint1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1CPoint2')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1CPoint3')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1CPoint4')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection1CPoint5')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            {t('tokenomicsSection1CUtility')}
          </Text>
        </LinearGradient>
      </View>

      {/* Section 2: Model Advantages with Projected Figures */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('tokenomicsSection2Title')}</Text>
          <Text style={styles.bodyText}>
            {t('tokenomicsSection2Intro')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection2TableTitle')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Phase1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Phase2')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Phase3')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Listing')}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection2ProjectionTitle')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Projection1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Projection2')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection2Projection3')}</Text>
          </View>

          <Text style={styles.emphasisText}>
            {t('tokenomicsSection2Conclusion')}
          </Text>
        </LinearGradient>
      </View>

      {/* Section 3: Why Superior to Other Cryptocurrencies */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('tokenomicsSection3Title')}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>🟠 {t('tokenomicsSection3BTCTitle')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>✔ {t('tokenomicsSection3BTCPro1')}</Text>
            <Text style={styles.bulletPoint}>✖ {t('tokenomicsSection3BTCCon1')}</Text>
            <Text style={styles.bulletPoint}>✖ {t('tokenomicsSection3BTCCon2')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            → {t('tokenomicsSection3BTCConclusion')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>🔵 {t('tokenomicsSection3ETHTitle')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>✔ {t('tokenomicsSection3ETHPro1')}</Text>
            <Text style={styles.bulletPoint}>✖ {t('tokenomicsSection3ETHCon1')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            → {t('tokenomicsSection3ETHConclusion')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>🟣 {t('tokenomicsSection3ADATitle')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>✔ {t('tokenomicsSection3ADAPro1')}</Text>
            <Text style={styles.bulletPoint}>✖ {t('tokenomicsSection3ADACon1')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            → {t('tokenomicsSection3ADAConclusion')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>🟡 {t('tokenomicsSection3SOLTitle')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>✔ {t('tokenomicsSection3SOLPro1')}</Text>
            <Text style={styles.bulletPoint}>✖ {t('tokenomicsSection3SOLCon1')}</Text>
          </View>
          <Text style={styles.emphasisText}>
            → {t('tokenomicsSection3SOLConclusion')}
          </Text>
        </LinearGradient>
      </View>

      {/* Section 4: Direct Benefits for Investors */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>{t('tokenomicsSection4Title')}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection4ShortTerm')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4ShortPoint1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4ShortPoint2')}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection4MediumTerm')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4MediumPoint1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4MediumPoint2')}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionSubtitle}>{t('tokenomicsSection4LongTerm')}</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4LongPoint1')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4LongPoint2')}</Text>
            <Text style={styles.bulletPoint}>• {t('tokenomicsSection4LongPoint3')}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Conclusion */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionTitle}>🔵 {t('tokenomicsConclusionTitle')}</Text>
          <Text style={styles.emphasisText}>
            {t('tokenomicsConclusionText')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Riesgos Tab Content - UPDATED WITH NEW CONTENT
function RiesgosTab() {
  const { t } = useLanguage();
  
  return (
    <View>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{t('risks')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/70145fd4-2c83-40c4-a306-9cb2f11f2f45.png')}
          style={styles.riesgosImage}
          resizeMode="contain"
        />
      </View>

      {/* Introduction */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.bodyText}>
            {t('risksIntro')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 1: Market Volatility */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>⚠️ {t('risk1Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk1Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 2: Technological Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>🔧 {t('risk2Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk2Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 3: Project Execution Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>🚧 {t('risk3Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk3Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 4: Regulatory Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>⚖️ {t('risk4Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk4Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 5: Liquidity Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>💧 {t('risk5Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk5Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 6: Ecosystem Adoption Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>📊 {t('risk6Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk6Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 7: Competitive Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>🏆 {t('risk7Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk7Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 8: Community Dependence Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.primary + '10', colors.accent + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>👥 {t('risk8Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk8Description')}
          </Text>
        </LinearGradient>
      </View>

      {/* Risk 9: Early Investment Risk */}
      <View style={[commonStyles.card, styles.contentCard]}>
        <LinearGradient
          colors={[colors.accent + '10', colors.primary + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentGradient}
        >
          <Text style={styles.sectionSubtitle}>⏰ {t('risk9Title')}</Text>
          <Text style={styles.bodyText}>
            {t('risk9Description')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabScrollContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tabScrollView: {
    maxHeight: 70,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 170,
    height: 48,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  contentScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  titleSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  logoImage: {
    width: width - 80,
    height: (width - 80) * 0.75,
    borderRadius: 20,
  },
  heroImage: {
    width: width - 80,
    height: (width - 80) * 1.2,
    borderRadius: 20,
  },
  whyBuyImage: {
    width: width - 80,
    height: (width - 80) * 1.0,
    borderRadius: 20,
  },
  metaImage: {
    width: width - 80,
    height: (width - 80) * 0.8,
    borderRadius: 20,
  },
  ecosistemaImage: {
    width: width - 80,
    height: (width - 80) * 0.65,
    borderRadius: 20,
  },
  seguridadCuanticaImage: {
    width: width - 80,
    height: (width - 80) * 0.75,
    borderRadius: 20,
  },
  sostenibilidadImage: {
    width: width - 80,
    height: (width - 80) * 0.6,
    borderRadius: 20,
  },
  vestingImage: {
    width: width - 80,
    height: (width - 80) * 1.3,
    borderRadius: 20,
  },
  practicaImage: {
    width: width - 80,
    height: (width - 80) * 0.55,
    borderRadius: 20,
  },
  tokenomicaImage: {
    width: width - 80,
    height: (width - 80) * 0.65,
    borderRadius: 20,
  },
  riesgosImage: {
    width: width - 80,
    height: (width - 80) * 0.6,
    borderRadius: 20,
  },
  contentCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  contentGradient: {
    padding: 24,
  },
  introText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: '700',
    color: colors.primary,
  },
  highlightText: {
    fontWeight: '600',
    color: colors.primary,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 16,
  },
  emphasisText: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 28,
    marginBottom: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  investorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
    opacity: 0.3,
  },
  bulletList: {
    marginVertical: 12,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletListLight: {
    marginVertical: 12,
    paddingLeft: 8,
  },
  bulletPointLight: {
    fontSize: 15,
    color: '#000',
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  featureEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  visionCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  visionGradient: {
    padding: 32,
    alignItems: 'center',
  },
  visionEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  visionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  visionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  valuesSection: {
    marginBottom: 24,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    padding: 16,
  },
  valueEmoji: {
    fontSize: 36,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ctaCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ctaGradient: {
    padding: 32,
    alignItems: 'center',
  },
  ctaEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  ctaSubtext: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
});
