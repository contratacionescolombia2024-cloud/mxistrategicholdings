
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { showConfirm } from '@/utils/confirmDialog';

interface Participant {
  id: string;
  user_id: string;
  player_number: number;
  users: {
    name: string;
    email: string;
  };
}

interface GameSession {
  id: string;
  session_code: string;
  num_players: number;
  total_pool: number;
  prize_amount: number;
  status: string;
  tournament_games: {
    name: string;
    game_type: string;
    entry_fee: number;
  };
}

export default function GameLobbyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const gameType = params.gameType as string;
  
  const [session, setSession] = useState<GameSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isInLobby, setIsInLobby] = useState(true);
  const hasLeftRef = useRef(false);

  useEffect(() => {
    console.log('[GameLobby] Mounted - Session:', sessionId, 'Game:', gameType);
    
    if (!sessionId || !gameType) {
      Alert.alert(t('error'), t('invalidSession'), [
        { text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }
      ]);
      return;
    }

    setIsInLobby(true);
    loadSession();
    
    // Subscribe to updates
    const channel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          console.log('[GameLobby] Session update:', payload);
          loadSession();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_participants', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          console.log('[GameLobby] Participants update:', payload);
          loadSession();
        }
      )
      .subscribe();

    return () => {
      console.log('[GameLobby] Unmounting - isInLobby:', isInLobby);
      supabase.removeChannel(channel);
      
      // If user is still in lobby when component unmounts, they're leaving
      if (isInLobby && !hasLeftRef.current) {
        console.log('[GameLobby] User left lobby without proper exit');
        handleAutoLeave();
      }
    };
  }, [sessionId, gameType]);

  useEffect(() => {
    if (session && participants.length >= session.num_players && session.status === 'waiting') {
      setCountdown(5);
    }
  }, [session, participants]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      startGame();
    }
  }, [countdown]);

  const loadSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          *,
          tournament_games (name, game_type, entry_fee)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Check if session was cancelled
      if (sessionData.status === 'cancelled') {
        console.log('[GameLobby] Session was cancelled');
        Alert.alert(
          t('sessionCancelled'),
          t('sessionWasCancelled'),
          [{ text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }]
        );
        return;
      }

      setSession(sessionData);

      const { data: participantsData, error: participantsError } = await supabase
        .from('game_participants')
        .select(`
          *,
          users (name, email)
        `)
        .eq('session_id', sessionId)
        .order('player_number', { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      // Check if current user is still a participant
      const isUserParticipant = participantsData?.some(p => p.user_id === user?.id);
      if (!isUserParticipant && !hasLeftRef.current) {
        console.log('[GameLobby] User is no longer a participant');
        Alert.alert(
          t('removedFromSession'),
          t('youWereRemovedFromSession'),
          [{ text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }]
        );
        return;
      }

      if (sessionData.status === 'ready') {
        setIsInLobby(false);
        navigateToGame();
      }
    } catch (error) {
      console.error('[GameLobby] Load error:', error);
      Alert.alert(t('error'), t('invalidSession'), [
        { text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    try {
      await supabase
        .from('game_sessions')
        .update({ status: 'ready', started_at: new Date().toISOString() })
        .eq('id', sessionId);

      setIsInLobby(false);
      navigateToGame();
    } catch (error) {
      console.error('[GameLobby] Start error:', error);
    }
  };

  const navigateToGame = () => {
    const routes: { [key: string]: string } = {
      tank_arena: '/games/tank-arena',
      mini_cars: '/games/mini-cars',
      shooter_retro: '/games/shooter-retro',
      dodge_arena: '/games/dodge-arena',
      bomb_runner: '/games/bomb-runner',
    };

    const route = routes[gameType];
    if (route) {
      console.log('[GameLobby] Navigating to:', route);
      router.replace({ pathname: route as any, params: { sessionId } });
    } else {
      Alert.alert(t('error'), t('invalidSession'), [
        { text: t('ok'), onPress: () => router.replace('/(tabs)/tournaments') }
      ]);
    }
  };

  const handleAutoLeave = async () => {
    // Silent auto-leave when user navigates away
    try {
      await leaveSessionLogic();
    } catch (error) {
      console.error('[GameLobby] Auto-leave error:', error);
    }
  };

  const handleLeave = () => {
    showConfirm({
      title: t('leavingGameWarning'),
      message: t('leavingGameWarningMessage'),
      confirmText: t('yes'),
      cancelText: t('no'),
      type: 'warning',
      icon: {
        ios: 'exclamationmark.triangle.fill',
        android: 'warning',
      },
      onConfirm: async () => {
        hasLeftRef.current = true;
        setIsInLobby(false);
        
        try {
          await leaveSessionLogic();
          router.replace('/(tabs)/tournaments');
        } catch (error) {
          console.error('[GameLobby] Leave error:', error);
          router.replace('/(tabs)/tournaments');
        }
      },
      onCancel: () => {
        console.log('Leave cancelled');
      },
    });
  };

  const leaveSessionLogic = async () => {
    if (!session || !user) return;

    console.log('[GameLobby] Executing leave logic for session:', sessionId);

    // 1. Get user's participant record
    const { data: participant } = await supabase
      .from('game_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participant) {
      console.log('[GameLobby] No participant record found');
      return;
    }

    // 2. Remove participant
    await supabase
      .from('game_participants')
      .delete()
      .eq('id', participant.id);

    console.log('[GameLobby] Participant removed');

    // 3. Check remaining participants
    const { data: remainingParticipants } = await supabase
      .from('game_participants')
      .select('id')
      .eq('session_id', sessionId);

    const remainingCount = remainingParticipants?.length || 0;
    console.log('[GameLobby] Remaining participants:', remainingCount);

    if (remainingCount === 0) {
      // No participants left - cancel session
      console.log('[GameLobby] No participants left, cancelling session');
      await supabase
        .from('game_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);
    } else {
      // Update pool and prize
      const newPool = session.total_pool - session.tournament_games.entry_fee;
      const prizeAmount = newPool * 0.9;

      await supabase
        .from('game_sessions')
        .update({
          total_pool: newPool,
          prize_amount: prizeAmount
        })
        .eq('id', sessionId);

      console.log('[GameLobby] Pool updated, new total:', newPool);
    }

    // 4. Refund entry fee
    const { data: userData } = await supabase
      .from('users')
      .select('mxi_from_challenges')
      .eq('id', user.id)
      .single();

    if (userData) {
      const newBalance = (userData.mxi_from_challenges || 0) + session.tournament_games.entry_fee;
      await supabase
        .from('users')
        .update({ mxi_from_challenges: newBalance })
        .eq('id', user.id);

      console.log('[GameLobby] Entry fee refunded:', session.tournament_games.entry_fee);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle.fill" 
            android_material_icon_name="error" 
            size={64} 
            color={colors.error} 
          />
          <Text style={styles.errorText}>{t('invalidSession')}</Text>
          <TouchableOpacity
            style={[buttonStyles.primary, { marginTop: 20 }]}
            onPress={() => router.replace('/(tabs)/tournaments')}
          >
            <Text style={buttonStyles.primaryText}>{t('back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const spotsRemaining = session.num_players - participants.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="chevron_left" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('waitingForPlayers')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[commonStyles.card, styles.gameCard]}>
          <Text style={styles.gameName}>{session.tournament_games.name}</Text>
          <Text style={styles.sessionCode}>{session.session_code}</Text>
          
          <View style={styles.playerCountBadge}>
            <IconSymbol 
              ios_icon_name="person.3.fill" 
              android_material_icon_name="groups" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.playerCountText}>
              {t('createTournamentOf', { count: session.num_players })}
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('prize')} (90%)</Text>
              <Text style={styles.statValue}>{session.prize_amount.toFixed(2)} MXI</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('total')}</Text>
              <Text style={styles.statValue}>{session.total_pool.toFixed(2)} MXI</Text>
            </View>
          </View>
        </View>

        {countdown !== null && countdown > 0 && (
          <View style={[commonStyles.card, styles.countdownCard]}>
            <Text style={styles.countdownText}>{t('loading')}</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
          </View>
        )}

        <View style={[commonStyles.card, styles.playersCard]}>
          <View style={styles.playersHeader}>
            <Text style={styles.playersTitle}>{t('players')}</Text>
            <Text style={styles.playersCount}>
              {participants.length}/{session.num_players}
            </Text>
          </View>

          {participants.map((participant) => (
            <View key={participant.id} style={styles.playerRow}>
              <View style={styles.playerNumber}>
                <Text style={styles.playerNumberText}>{participant.player_number}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{participant.users.name}</Text>
                <Text style={styles.playerEmail}>{participant.users.email}</Text>
              </View>
              {participant.user_id === user?.id && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>TÚ</Text>
                </View>
              )}
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={24} 
                color={colors.success} 
              />
            </View>
          ))}

          {Array.from({ length: spotsRemaining }).map((_, index) => (
            <View key={`empty-${index}`} style={[styles.playerRow, styles.emptyRow]}>
              <View style={[styles.playerNumber, styles.emptyNumber]}>
                <Text style={styles.playerNumberText}>
                  {participants.length + index + 1}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.emptyText}>{t('waitingForPlayers')}...</Text>
              </View>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule" 
                size={24} 
                color={colors.textSecondary} 
              />
            </View>
          ))}
        </View>

        {spotsRemaining > 0 && (
          <View style={[commonStyles.card, styles.waitingCard]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.waitingText}>
              {t('waitingForPlayers')} {spotsRemaining} {spotsRemaining !== 1 ? t('players') : t('players').slice(0, -1)}...
            </Text>
          </View>
        )}
      </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  gameCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sessionCode: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  playerCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  countdownCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  countdownText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  playersCard: {
    marginBottom: 20,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  playersCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyRow: {
    opacity: 0.5,
  },
  playerNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyNumber: {
    backgroundColor: colors.border,
  },
  playerNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  playerEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  youBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  waitingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
