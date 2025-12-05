
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
const BOMB_SIZE = 15;
const BLOCK_SIZE = 30;
const GAME_DURATION = 120;

interface Player {
  id: string;
  x: number;
  y: number;
  blocksDestroyed: number;
  damageDealt: number;
  color: string;
  alive: boolean;
}

interface Bomb {
  id: string;
  x: number;
  y: number;
  ownerId: string;
  timeToExplode: number;
}

interface Block {
  x: number;
  y: number;
  destroyed: boolean;
}

export default function BombRunnerGame() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
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
        x: (index + 1) * (ARENA_SIZE / (participants.length + 1)),
        y: ARENA_SIZE / 2,
        blocksDestroyed: 0,
        damageDealt: 0,
        color: colors[index % colors.length],
        alive: true,
      }));

      setPlayers(initialPlayers);
      setMyPlayerId(user?.id || '');

      // Initialize blocks
      const initialBlocks: Block[] = [];
      const gridSize = Math.floor(ARENA_SIZE / BLOCK_SIZE);
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (Math.random() > 0.3) {
            initialBlocks.push({
              x: i * BLOCK_SIZE,
              y: j * BLOCK_SIZE,
              destroyed: false,
            });
          }
        }
      }
      setBlocks(initialBlocks);

      gameLoopRef.current = setInterval(() => {
        updateGame();
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  const updateGame = () => {
    setBombs(prevBombs => {
      const updated = prevBombs.map(b => ({
        ...b,
        timeToExplode: b.timeToExplode - 1,
      }));

      // Explode bombs
      const exploding = updated.filter(b => b.timeToExplode <= 0);
      exploding.forEach(bomb => {
        explodeBomb(bomb);
      });

      return updated.filter(b => b.timeToExplode > 0);
    });
  };

  const explodeBomb = (bomb: Bomb) => {
    const explosionRange = 60;

    // Damage players
    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (!player.alive) return player;

        const dx = player.x - bomb.x;
        const dy = player.y - bomb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < explosionRange) {
          return { ...player, alive: false };
        }
        return player;
      })
    );

    // Destroy blocks
    setBlocks(prevBlocks =>
      prevBlocks.map(block => {
        if (block.destroyed) return block;

        const dx = block.x - bomb.x;
        const dy = block.y - bomb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < explosionRange) {
          setPlayers(prevPlayers =>
            prevPlayers.map(p =>
              p.id === bomb.ownerId
                ? { ...p, blocksDestroyed: p.blocksDestroyed + 1, damageDealt: p.damageDealt + 10 }
                : p
            )
          );
          return { ...block, destroyed: true };
        }
        return block;
      })
    );
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

  const placeBomb = () => {
    const myPlayer = players.find(p => p.id === myPlayerId);
    if (!myPlayer || !myPlayer.alive) return;

    const newBomb: Bomb = {
      id: `${Date.now()}-${Math.random()}`,
      x: myPlayer.x,
      y: myPlayer.y,
      ownerId: myPlayerId,
      timeToExplode: 3,
    };

    setBombs(prev => [...prev, newBomb]);
  };

  const endGame = async () => {
    setGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    try {
      const alivePlayers = players.filter(p => p.alive);
      let winner: Player;

      if (alivePlayers.length === 1) {
        winner = alivePlayers[0];
      } else if (alivePlayers.length === 0) {
        winner = players.reduce((prev, current) => {
          if (current.blocksDestroyed !== prev.blocksDestroyed) {
            return current.blocksDestroyed > prev.blocksDestroyed ? current : prev;
          }
          return current.damageDealt > prev.damageDealt ? current : prev;
        });
      } else {
        winner = alivePlayers.reduce((prev, current) => {
          if (current.blocksDestroyed !== prev.blocksDestroyed) {
            return current.blocksDestroyed > prev.blocksDestroyed ? current : prev;
          }
          const centerX = ARENA_SIZE / 2;
          const centerY = ARENA_SIZE / 2;
          const prevDist = Math.sqrt(Math.pow(prev.x - centerX, 2) + Math.pow(prev.y - centerY, 2));
          const currDist = Math.sqrt(Math.pow(current.x - centerX, 2) + Math.pow(current.y - centerY, 2));
          return currDist < prevDist ? current : prev;
        });
      }

      await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          winner_user_id: winner.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      for (const player of players) {
        const centerX = ARENA_SIZE / 2;
        const centerY = ARENA_SIZE / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(player.x - centerX, 2) + Math.pow(player.y - centerY, 2)
        );

        const rank = players
          .sort((a, b) => {
            if (a.alive !== b.alive) return a.alive ? -1 : 1;
            if (b.blocksDestroyed !== a.blocksDestroyed) return b.blocksDestroyed - a.blocksDestroyed;
            const aDist = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2));
            const bDist = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2));
            return aDist - bDist;
          })
          .findIndex(p => p.id === player.id) + 1;

        await supabase
          .from('game_participants')
          .update({
            blocks_destroyed: player.blocksDestroyed,
            distance_from_center: distanceFromCenter,
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
              <Text style={styles.statText}>Bloques: {myPlayer.blocksDestroyed}</Text>
              <Text style={styles.statText}>Vivo: {myPlayer.alive ? 'Sí' : 'No'}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.arenaContainer}>
        <View style={[styles.arena, { width: ARENA_SIZE, height: ARENA_SIZE }]}>
          {blocks.map((block, index) => (
            <React.Fragment key={`block-${index}`}>
              {!block.destroyed && (
                <View
                  style={[
                    styles.block,
                    {
                      left: block.x,
                      top: block.y,
                    }
                  ]}
                />
              )}
            </React.Fragment>
          ))}

          {bombs.map(bomb => (
            <View
              key={bomb.id}
              style={[
                styles.bomb,
                {
                  left: bomb.x - BOMB_SIZE / 2,
                  top: bomb.y - BOMB_SIZE / 2,
                }
              ]}
            >
              <Text style={styles.bombTimer}>{bomb.timeToExplode}</Text>
            </View>
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

          <TouchableOpacity style={styles.bombButton} onPress={placeBomb}>
            <IconSymbol
              ios_icon_name="flame.fill"
              android_material_icon_name="whatshot"
              size={32}
              color={colors.background}
            />
            <Text style={styles.bombButtonText}>BOMBA</Text>
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
    borderWidth: 2,
    borderColor: '#fff',
  },
  bomb: {
    position: 'absolute',
    width: BOMB_SIZE,
    height: BOMB_SIZE,
    borderRadius: BOMB_SIZE / 2,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bombTimer: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  block: {
    position: 'absolute',
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    backgroundColor: '#8B4513',
    borderWidth: 1,
    borderColor: '#654321',
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
  bombButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  bombButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
  },
});
