
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';

interface LotteryRound {
  id: string;
  round_number: number;
  ticket_price: number;
  max_tickets: number;
  tickets_sold: number;
  total_pool: number;
  prize_amount: number;
  status: 'open' | 'locked' | 'drawn' | 'completed';
  winner_user_id: string | null;
  drawn_at: string | null;
  created_at: string;
}

interface UserTicket {
  id: string;
  ticket_number: number;
  quantity: number;
  total_cost: number;
  purchased_at: string;
}

interface AvailableBalances {
  mxiPurchasedDirectly: number;
  mxiFromUnifiedCommissions: number;
  mxiFromChallenges: number;
  total: number;
}

export default function BonusParticipacionScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [currentRound, setCurrentRound] = useState<LotteryRound | null>(null);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [ticketQuantity, setTicketQuantity] = useState('1');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentSourceModal, setShowPaymentSourceModal] = useState(false);
  const [availableBalances, setAvailableBalances] = useState<AvailableBalances>({
    mxiPurchasedDirectly: 0,
    mxiFromUnifiedCommissions: 0,
    mxiFromChallenges: 0,
    total: 0,
  });
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeScreen();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const initializeScreen = async () => {
    console.log('Initializing Bonus de Participación screen...');
    try {
      await loadAvailableBalances();
      await loadLotteryData();
      setupRealtimeSubscription();
    } catch (error) {
      console.error('Error initializing screen:', error);
      Alert.alert(t('error'), t('failedToLoadBonusData'));
    }
  };

  const loadAvailableBalances = async () => {
    if (!user) {
      console.log('No user found, skipping balance load');
      return;
    }

    try {
      console.log('Loading available balances for user:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('mxi_purchased_directly, mxi_from_unified_commissions, mxi_from_challenges')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading balances:', error);
        throw error;
      }

      const purchased = data?.mxi_purchased_directly || 0;
      const commissions = data?.mxi_from_unified_commissions || 0;
      const challenges = data?.mxi_from_challenges || 0;

      console.log('Loaded balances:', { purchased, commissions, challenges });

      setAvailableBalances({
        mxiPurchasedDirectly: purchased,
        mxiFromUnifiedCommissions: commissions,
        mxiFromChallenges: challenges,
        total: purchased + commissions + challenges,
      });
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const setupRealtimeSubscription = async () => {
    if (channelRef.current?.state === 'subscribed') {
      console.log('Already subscribed to bonus updates');
      return;
    }

    console.log('Setting up realtime subscription...');
    const channel = supabase.channel('lottery:updates', {
      config: { private: false }
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'INSERT' }, () => {
        console.log('Bonus de Participación round created');
        loadLotteryData();
      })
      .on('broadcast', { event: 'UPDATE' }, () => {
        console.log('Bonus de Participación round updated');
        loadLotteryData();
      })
      .subscribe();
  };

  const loadLotteryData = async () => {
    try {
      console.log('Loading bonus data...');
      setLoading(true);

      // Get current round
      const { data: roundData, error: roundError } = await supabase
        .from('lottery_rounds')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roundError && roundError.code !== 'PGRST116') {
        console.error('Error loading bonus round:', roundError);
        throw roundError;
      }

      if (roundData) {
        console.log('Found existing round:', roundData.id);
        setCurrentRound(roundData);

        // Get user's tickets for this round
        if (user) {
          const { data: ticketsData, error: ticketsError } = await supabase
            .from('lottery_tickets')
            .select('*')
            .eq('round_id', roundData.id)
            .eq('user_id', user.id)
            .order('ticket_number', { ascending: true });

          if (ticketsError) {
            console.error('Error loading user tickets:', ticketsError);
          } else {
            console.log('Loaded user tickets:', ticketsData?.length || 0);
            setUserTickets(ticketsData || []);
          }
        }
      } else {
        // No open round, try to create one
        console.log('No round found, creating new one...');
        const { data: newRoundId, error: createError } = await supabase
          .rpc('get_current_lottery_round');

        if (createError) {
          console.error('Error creating bonus round:', createError);
          throw createError;
        }

        if (newRoundId) {
          console.log('Created new round:', newRoundId);
          // Reload data to get the new round
          setTimeout(() => loadLotteryData(), 500);
          return;
        }
      }
    } catch (error) {
      console.error('Exception loading bonus data:', error);
      Alert.alert(t('error'), t('failedToLoadBonusData'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPurchaseModal = () => {
    if (!user || !currentRound) return;

    const quantity = parseInt(ticketQuantity);
    if (isNaN(quantity) || quantity < 1 || quantity > 20) {
      Alert.alert(t('error'), t('pleaseEnterValidQuantity'));
      return;
    }

    const totalCost = currentRound.ticket_price * quantity;
    
    if (availableBalances.total < totalCost) {
      Alert.alert(
        t('insufficientBalance'),
        t('insufficientBalanceNeedForTicketsText', { 
          needed: totalCost.toFixed(2), 
          quantity, 
          available: availableBalances.total.toFixed(2) 
        })
      );
      return;
    }

    setShowPurchaseModal(false);
    setShowPaymentSourceModal(true);
  };

  const handlePurchaseWithSource = async (source: 'purchased' | 'commissions' | 'challenges') => {
    if (!user || !currentRound) return;

    const quantity = parseInt(ticketQuantity);
    const totalCost = currentRound.ticket_price * quantity;

    // Validate source has enough balance
    let sourceBalance = 0;
    let sourceName = '';

    switch (source) {
      case 'purchased':
        sourceBalance = availableBalances.mxiPurchasedDirectly;
        sourceName = t('mxiPurchasedSourceText');
        break;
      case 'commissions':
        sourceBalance = availableBalances.mxiFromUnifiedCommissions;
        sourceName = t('mxiFromCommissionsSourceText');
        break;
      case 'challenges':
        sourceBalance = availableBalances.mxiFromChallenges;
        sourceName = t('mxiFromChallengesSourceText');
        break;
    }

    if (sourceBalance < totalCost) {
      Alert.alert(
        t('insufficientBalance'),
        t('insufficientBalanceInSourceText', { 
          source: sourceName, 
          available: sourceBalance.toFixed(2), 
          needed: totalCost.toFixed(2) 
        })
      );
      return;
    }

    try {
      setPurchasing(true);
      setShowPaymentSourceModal(false);

      console.log('Deducting balance from source:', source);
      // Deduct from the selected source
      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_challenge_balance', {
        p_user_id: user.id,
        p_amount: totalCost,
        p_source: source,
      });

      if (deductError || !deductResult) {
        console.error('Deduct error:', deductError);
        Alert.alert(t('error'), t('failedToDeductBalance'));
        return;
      }

      console.log('Purchasing tickets:', quantity);
      // Purchase tickets
      const { data, error } = await supabase.rpc('purchase_lottery_tickets', {
        p_user_id: user.id,
        p_quantity: quantity,
      });

      if (error) {
        console.error('Purchase error:', error);
        Alert.alert(t('error'), error.message || t('failedToPurchaseTicketsText'));
        return;
      }

      if (!data.success) {
        Alert.alert(t('error'), data.error || t('failedToPurchaseTicketsText'));
        return;
      }

      console.log('Purchase successful:', data);
      Alert.alert(
        t('successTitle'),
        t('successfullyPurchasedTicketsText', { 
          count: data.tickets_purchased, 
          cost: data.total_cost.toFixed(2), 
          source: sourceName 
        })
      );

      // Reload data
      await loadLotteryData();
      await loadAvailableBalances();
      
    } catch (error: any) {
      console.error('Purchase exception:', error);
      Alert.alert(t('error'), error.message || t('failedToPurchaseTicketsText'));
    } finally {
      setPurchasing(false);
    }
  };

  const getProgressPercentage = () => {
    if (!currentRound) return 0;
    return (currentRound.tickets_sold / currentRound.max_tickets) * 100;
  };

  const getUserTicketCount = () => {
    return userTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('bonusParticipation')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loadingBonusText')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentRound) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('bonusParticipation')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('noActiveBonusRoundText')}</Text>
          <TouchableOpacity
            style={[buttonStyles.primary, { marginTop: 20 }]}
            onPress={loadLotteryData}
          >
            <Text style={buttonStyles.primaryText}>{t('retryButton')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('bonusParticipation')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Round Card */}
        <View style={[commonStyles.card, styles.roundCard]}>
          <View style={styles.roundHeader}>
            <View style={styles.roundIconContainer}>
              <Text style={styles.roundIconEmoji}>🎰</Text>
            </View>
            <View style={styles.roundHeaderText}>
              <Text style={styles.roundTitle}>{t('roundText')} #{currentRound.round_number}</Text>
              <Text style={styles.roundStatus}>
                {currentRound.status === 'open' ? `🟢 ${t('openText')}` : `🔒 ${t('lockedText')}`}
              </Text>
            </View>
          </View>

          <View style={styles.prizeContainer}>
            <Text style={styles.prizeLabel}>{t('prizePoolText')}</Text>
            <Text style={styles.prizeAmount}>{currentRound.prize_amount.toFixed(2)} MXI</Text>
            <Text style={styles.totalPool}>{t('totalPoolText')}: {currentRound.total_pool.toFixed(2)} MXI</Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{t('ticketsSoldText')}</Text>
              <Text style={styles.progressValue}>
                {currentRound.tickets_sold} / {currentRound.max_tickets}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('ticketPriceText')}</Text>
              <Text style={styles.statValue}>{currentRound.ticket_price} MXI</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('yourTicketsText')}</Text>
              <Text style={styles.statValue}>{getUserTicketCount()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('availableMXIText')}</Text>
              <Text style={styles.statValue}>{availableBalances.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Purchase Section */}
        {currentRound.status === 'open' && (
          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>{t('purchaseTicketsText')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('buyBetween1And20TicketsText')}
            </Text>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.purchaseButton]}
              onPress={() => setShowPurchaseModal(true)}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <React.Fragment>
                  <IconSymbol ios_icon_name="ticket.fill" android_material_icon_name="confirmation_number" size={20} color="#000" />
                  <Text style={buttonStyles.primaryText}>{t('buyTicketsText')}</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Your Tickets */}
        {userTickets.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>{t('yourTicketsText')}</Text>
            <View style={styles.ticketsList}>
              {userTickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketNumber}>
                    <Text style={styles.ticketNumberText}>#{ticket.ticket_number}</Text>
                  </View>
                  <View style={styles.ticketDetails}>
                    <Text style={styles.ticketCost}>{ticket.total_cost.toFixed(2)} MXI</Text>
                    <Text style={styles.ticketDate}>
                      {new Date(ticket.purchased_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How It Works */}
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>{t('howItWorksBonusText')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1.</Text>
              <Text style={styles.infoText}>{t('eachTicketCosts2MXIText')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2.</Text>
              <Text style={styles.infoText}>{t('buyBetween1And20TicketsPerRoundText')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>3.</Text>
              <Text style={styles.infoText}>{t('roundLocksWhen1000TicketsSoldText')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>4.</Text>
              <Text style={styles.infoText}>{t('winnerReceives90PercentText')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>5.</Text>
              <Text style={styles.infoText}>{t('winnerAnnouncedOnSocialMediaText')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>6.</Text>
              <Text style={styles.infoText}>{t('purchaseIsFinalNoRefundsText')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Purchase Modal */}
      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('purchaseTicketsText')}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('numberOfTicketsText')}</Text>
              <TextInput
                style={styles.input}
                value={ticketQuantity}
                onChangeText={setTicketQuantity}
                keyboardType="number-pad"
                placeholder={t('enterQuantityText')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.costSummary}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>{t('ticketsText')}:</Text>
                <Text style={styles.costValue}>{ticketQuantity || 0}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>{t('pricePerTicketText')}:</Text>
                <Text style={styles.costValue}>{currentRound.ticket_price} MXI</Text>
              </View>
              <View style={[styles.costRow, styles.costTotal]}>
                <Text style={styles.costTotalLabel}>{t('totalCostText')}:</Text>
                <Text style={styles.costTotalValue}>
                  {(currentRound.ticket_price * (parseInt(ticketQuantity) || 0)).toFixed(2)} MXI
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={() => setShowPurchaseModal(false)}
              >
                <Text style={buttonStyles.outlineText}>{t('cancelButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={handleOpenPurchaseModal}
                disabled={purchasing}
              >
                <Text style={buttonStyles.primaryText}>{t('continueButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Source Selection Modal */}
      <Modal
        visible={showPaymentSourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentSourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectPaymentSourceText')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('chooseWhichMXIBalanceText')}
            </Text>

            <View style={styles.paymentSourcesList}>
              {/* MXI Purchased */}
              <TouchableOpacity
                style={[
                  styles.paymentSourceItem,
                  availableBalances.mxiPurchasedDirectly < (currentRound.ticket_price * parseInt(ticketQuantity)) && styles.paymentSourceItemDisabled
                ]}
                onPress={() => handlePurchaseWithSource('purchased')}
                disabled={availableBalances.mxiPurchasedDirectly < (currentRound.ticket_price * parseInt(ticketQuantity)) || purchasing}
              >
                <View style={styles.paymentSourceHeader}>
                  <IconSymbol 
                    ios_icon_name="dollarsign.circle.fill" 
                    android_material_icon_name="monetization_on" 
                    size={24} 
                    color={colors.primary} 
                  />
                  <View style={styles.paymentSourceInfo}>
                    <Text style={styles.paymentSourceTitle}>{t('mxiPurchasedSourceText')}</Text>
                    <Text style={styles.paymentSourceBalance}>
                      {availableBalances.mxiPurchasedDirectly.toFixed(2)} MXI
                    </Text>
                  </View>
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron_right" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>

              {/* MXI from Commissions */}
              <TouchableOpacity
                style={[
                  styles.paymentSourceItem,
                  availableBalances.mxiFromUnifiedCommissions < (currentRound.ticket_price * parseInt(ticketQuantity)) && styles.paymentSourceItemDisabled
                ]}
                onPress={() => handlePurchaseWithSource('commissions')}
                disabled={availableBalances.mxiFromUnifiedCommissions < (currentRound.ticket_price * parseInt(ticketQuantity)) || purchasing}
              >
                <View style={styles.paymentSourceHeader}>
                  <IconSymbol 
                    ios_icon_name="arrow.triangle.merge" 
                    android_material_icon_name="merge_type" 
                    size={24} 
                    color={colors.success} 
                  />
                  <View style={styles.paymentSourceInfo}>
                    <Text style={styles.paymentSourceTitle}>{t('mxiFromCommissionsSourceText')}</Text>
                    <Text style={styles.paymentSourceBalance}>
                      {availableBalances.mxiFromUnifiedCommissions.toFixed(2)} MXI
                    </Text>
                  </View>
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron_right" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>

              {/* MXI from Challenges */}
              <TouchableOpacity
                style={[
                  styles.paymentSourceItem,
                  availableBalances.mxiFromChallenges < (currentRound.ticket_price * parseInt(ticketQuantity)) && styles.paymentSourceItemDisabled
                ]}
                onPress={() => handlePurchaseWithSource('challenges')}
                disabled={availableBalances.mxiFromChallenges < (currentRound.ticket_price * parseInt(ticketQuantity)) || purchasing}
              >
                <View style={styles.paymentSourceHeader}>
                  <IconSymbol 
                    ios_icon_name="trophy.fill" 
                    android_material_icon_name="emoji_events" 
                    size={24} 
                    color={colors.warning} 
                  />
                  <View style={styles.paymentSourceInfo}>
                    <Text style={styles.paymentSourceTitle}>{t('mxiFromChallengesSourceText')}</Text>
                    <Text style={styles.paymentSourceBalance}>
                      {availableBalances.mxiFromChallenges.toFixed(2)} MXI
                    </Text>
                  </View>
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron_right" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[buttonStyles.outline, { marginTop: 16 }]}
              onPress={() => setShowPaymentSourceModal(false)}
            >
              <Text style={buttonStyles.outlineText}>{t('cancelButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  roundCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roundIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roundIconEmoji: {
    fontSize: 32,
  },
  roundHeaderText: {
    flex: 1,
  },
  roundTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  roundStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  prizeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  prizeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  prizeAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  totalPool: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  purchaseButton: {
    marginTop: 8,
  },
  ticketsList: {
    gap: 12,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ticketNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  ticketDetails: {
    flex: 1,
  },
  ticketCost: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ticketDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 12,
    width: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  costSummary: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  costTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  costTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  costTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  paymentSourcesList: {
    gap: 12,
    marginBottom: 16,
  },
  paymentSourceItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  paymentSourceItemDisabled: {
    opacity: 0.5,
  },
  paymentSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  paymentSourceInfo: {
    flex: 1,
  },
  paymentSourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paymentSourceBalance: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
