
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
const PROJECTILE_SIZE = 15;

interface Player {
  id: string;
  x: number;
  y: number;
  survivalTime: number;
  collisions: number;
  color: string;
  alive: boolean;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  speed: number;
}

export default function DodgeArenaGame() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [difficulty, setDifficulty] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const projectileSpawnRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeGame();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (projectileSpawnRef.current) clearInterval(projectileSpawnRef.current);
    };
  }, []);

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
        x: ARENA_SIZE / 2,
        y: ARENA_SIZE / 2,
        survivalTime: 0,
        collisions: 0,
        color: colors[index % colors.length],
        alive: true,
      }));

      setPlayers(initialPlayers);
      setMyPlayerId(user?.id || '');

      // Game loop
      gameLoopRef.current = setInterval(() => {
        updateGame();
      }, 50);

      // Spawn projectiles
      projectileSpawnRef.current = setInterval(() => {
        spawnProjectile();
      }, 1000 / difficulty);

      // Increase difficulty every 10 seconds
      setInterval(() => {
        setDifficulty(prev => prev + 0.2);
      }, 10000);

    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  const spawnProjectile = () => {
    const newProjectile: Projectile = {
      id: `${Date.now()}-${Math.random()}`,
      x: Math.random() * ARENA_SIZE,
      y: -PROJECTILE_SIZE,
      speed: 2 + difficulty * 0.5,
    };
    setProjectiles(prev => [...prev, newProjectile]);
  };

  const updateGame = () => {
    // Update projectiles
    setProjectiles(prevProjectiles => {
      const updated = prevProjectiles
        .map(p => ({ ...p, y: p.y + p.speed }))
        .filter(p => p.y < ARENA_SIZE + PROJECTILE_SIZE);

      // Check collisions
      setPlayers(prevPlayers =>
        prevPlayers.map(player => {
          if (!player.alive) return player;

          let hit = false;
          for (const proj of updated) {
            const dx = proj.x - player.x;
            const dy = proj.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < (PLAYER_SIZE + PROJECTILE_SIZE) / 2) {
              hit = true;
              break;
            }
          }

          if (hit) {
            const newCollisions = player.collisions + 1;
            if (newCollisions >= 3) {
              return { ...player, collisions: newCollisions, alive: false };
            }
            return { ...player, collisions: newCollisions };
          }

          return { ...player, survivalTime: player.survivalTime + 0.05 };
        })
      );

      return updated;
    });

    // Check if game over
    setPlayers(prevPlayers => {
      const alivePlayers = prevPlayers.filter(p => p.alive);
      if (alivePlayers.length <= 1 && !gameOver) {
        endGame();
      }
      return prevPlayers;
    });
  };

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (player.id === myPlayerId && player.alive) {
          const speed = 8;
          let newX = player.x;
          let newY = player.y;

          switch (direction) {
            case 'up':
              newY = Math.max(PLAYER_SIZE / 2, player.y - speed);
              break;
            case 'down':
              newY = Math.min(ARENA_SIZE - PLAYER_SIZE / 2, player.y + speed);
              break;
            case 'left':
              newX = Math.max(PLAYER_SIZE / 2, player.x - speed);
              break;
            case 'right':
              newX = Math.min(ARENA_SIZE - PLAYER_SIZE / 2, player.x + speed);
              break;
          }

          return { ...player, x: newX, y: newY };
        }
        return player;
      })
    );
  };

  const endGame = async () => {
    setGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (projectileSpawnRef.current) clearInterval(projectileSpawnRef.current);

    try {
      const winner = players.reduce((prev, current) => {
        if (current.survivalTime !== prev.survivalTime) {
          return current.survivalTime > prev.survivalTime ? current : prev;
        }
        return current.collisions < prev.collisions ? current : prev;
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
            if (b.survivalTime !== a.survivalTime) return b.survivalTime - a.survivalTime;
            return a.collisions - b.collisions;
          })
          .findIndex(p => p.id === player.id) + 1;

        await supabase
          .from('game_participants')
          .update({
            survival_time: player.survivalTime,
            collisions: player.collisions,
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
          {myPlayer && (
            <>
              <Text style={styles.statText}>Tiempo: {myPlayer.survivalTime.toFixed(1)}s</Text>
              <Text style={styles.statText}>Colisiones: {myPlayer.collisions}/3</Text>
              <Text style={styles.statText}>Dificultad: {difficulty.toFixed(1)}x</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.arenaContainer}>
        <View style={[styles.arena, { width: ARENA_SIZE, height: ARENA_SIZE }]}>
          {projectiles.map(proj => (
            <View
              key={proj.id}
              style={[
                styles.projectile,
                {
                  left: proj.x - PROJECTILE_SIZE / 2,
                  top: proj.y - PROJECTILE_SIZE / 2,
                }
              ]}
            />
          ))}

          {players.map(player => (
            <React.Fragment key={player.id}>
              {player.alive && (
                <View
                  style={[
                    styles.player,
                    {
                      left: player.x - PLAYER_SIZE / 2,
                      top: player.y - PLAYER_SIZE / 2,
                      backgroundColor: player.color,
                    }
                  ]}
                />
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
    borderWidth: 2,
    borderColor: '#fff',
  },
  projectile: {
    position: 'absolute',
    width: PROJECTILE_SIZE,
    height: PROJECTILE_SIZE,
    borderRadius: PROJECTILE_SIZE / 2,
    backgroundColor: colors.error,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
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
});
