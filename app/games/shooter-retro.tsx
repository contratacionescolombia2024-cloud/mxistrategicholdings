
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARENA_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT * 0.6) - 40;
const PLAYER_SIZE = 20;
const GAME_DURATION = 120;

interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  score: number;
  aliveTime: number;
  color: string;
  alive: boolean;
}

export default function ShooterRetroGame() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeGame();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && !gameOver) {
      endGame();
    }
  }, [timeLeft]);

  const initializeGame = async () => {
    try {
      const { data: participants, error } = await supabase
        .from('game_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
      const initialPlayers: Player[] = participants.map((p, index) => ({
        id: p.user_id,
        x: Math.random() * (ARENA_SIZE - PLAYER_SIZE),
        y: Math.random() * (ARENA_SIZE - PLAYER_SIZE),
        health: 100,
        score: 0,
        aliveTime: 0,
        color: colors[index % colors.length],
        alive: true,
      }));

      setPlayers(initialPlayers);
      setMyPlayerId(user?.id || '');

      gameLoopRef.current = setInterval(() => {
        setPlayers(prev => prev.map(p => p.alive ? { ...p, aliveTime: p.aliveTime + 1 } : p));
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (player.id === myPlayerId && player.alive) {
          const speed = 10;
          let newX = player.x;
          let newY = player.y;

          switch (direction) {
            case 'up':
              newY = Math.max(0, player.y - speed);
              break;
            case 'down':
              newY = Math.min(ARENA_SIZE - PLAYER_SIZE, player.y + speed);
              break;
            case 'left':
              newX = Math.max(0, player.x - speed);
              break;
            case 'right':
              newX = Math.min(ARENA_SIZE - PLAYER_SIZE, player.x + speed);
              break;
          }

          return { ...player, x: newX, y: newY };
        }
        return player;
      })
    );
  };

  const shoot = () => {
    // Simplified: random hit on nearby player
    const myPlayer = players.find(p => p.id === myPlayerId);
    if (!myPlayer || !myPlayer.alive) return;

    setPlayers(prevPlayers => {
      const targets = prevPlayers.filter(p => p.id !== myPlayerId && p.alive);
      if (targets.length === 0) return prevPlayers;

      const target = targets[Math.floor(Math.random() * targets.length)];
      
      return prevPlayers.map(p => {
        if (p.id === target.id) {
          const newHealth = Math.max(0, p.health - 25);
          if (newHealth === 0) {
            return prevPlayers.map(pl =>
              pl.id === myPlayerId
                ? { ...pl, score: pl.score + 10 }
                : pl.id === target.id
                ? { ...p, health: 0, alive: false }
                : pl
            );
          }
          return { ...p, health: newHealth };
        }
        return p;
      }).flat();
    });
  };

  const endGame = async () => {
    setGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    try {
      const winner = players.reduce((prev, current) => {
        if (current.score !== prev.score) {
          return current.score > prev.score ? current : prev;
        }
        return current.aliveTime > prev.aliveTime ? current : prev;
      });

      await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          winner_user_id: winner.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      for (const player of players) {
        const rank = players
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.aliveTime - a.aliveTime;
          })
          .findIndex(p => p.id === player.id) + 1;

        await supabase
          .from('game_participants')
          .update({
            score: player.score,
            survival_time: player.aliveTime,
            rank: rank
          })
          .eq('session_id', sessionId)
          .eq('user_id', player.id);
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('prize_amount')
        .eq('id', sessionId)
        .single();

      if (session) {
        await supabase.rpc('add_mxi_from_challenges', {
          p_user_id: winner.id,
          p_amount: session.prize_amount
        });
      }

      Alert.alert(
        'Juego Terminado',
        winner.id === myPlayerId
          ? `¡Ganaste! ${session?.prize_amount.toFixed(2)} MXI`
          : 'Mejor suerte la próxima vez',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/tournaments') }]
      );

    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const myPlayer = players.find(p => p.id === myPlayerId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Tiempo: {timeLeft}s</Text>
          {myPlayer && (
            <>
              <Text style={styles.statText}>Puntos: {myPlayer.score}</Text>
              <Text style={styles.statText}>Salud: {myPlayer.health}%</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.arenaContainer}>
        <View style={[styles.arena, { width: ARENA_SIZE, height: ARENA_SIZE }]}>
          {players.map(player => (
            <React.Fragment key={player.id}>
              {player.alive && (
                <View
                  style={[
                    styles.player,
                    {
                      left: player.x,
                      top: player.y,
                      backgroundColor: player.color,
                    }
                  ]}
                >
                  <View style={styles.healthBar}>
                    <View
                      style={[styles.healthBarFill, { width: `${player.health}%` }]}
                    />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {myPlayer && myPlayer.alive && !gameOver && (
        <View style={styles.controls}>
          <View style={styles.dpadContainer}>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadUp]}
              onPress={() => movePlayer('up')}
            >
              <IconSymbol
                ios_icon_name="chevron.up"
                android_material_icon_name="keyboard_arrow_up"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={styles.dpadMiddle}>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadLeft]}
                onPress={() => movePlayer('left')}
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="keyboard_arrow_left"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadRight]}
                onPress={() => movePlayer('right')}
              >
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="keyboard_arrow_right"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadDown]}
              onPress={() => movePlayer('down')}
            >
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="keyboard_arrow_down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shootButton} onPress={shoot}>
            <IconSymbol
              ios_icon_name="scope"
              android_material_icon_name="gps_fixed"
              size={32}
              color={colors.background}
            />
            <Text style={styles.shootButtonText}>DISPARAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  arenaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  arena: {
    backgroundColor: '#1a1a2e',
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 8,
    position: 'relative',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: PLAYER_SIZE / 2,
  },
  healthBar: {
    position: 'absolute',
    bottom: -6,
    width: PLAYER_SIZE,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  dpadContainer: {
    width: 140,
    height: 140,
  },
  dpadButton: {
    width: 50,
    height: 50,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadUp: {
    alignSelf: 'center',
    marginBottom: 5,
  },
  dpadMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dpadLeft: {},
  dpadRight: {},
  dpadDown: {
    alignSelf: 'center',
  },
  shootButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  shootButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
  },
});
