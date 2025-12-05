
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
const TANK_SIZE = 30;
const BULLET_SIZE = 8;
const WALL_SIZE = 40;
const GAME_DURATION = 120; // 2 minutes

interface Tank {
  id: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  eliminations: number;
  damageTaken: number;
  color: string;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
}

interface Wall {
  x: number;
  y: number;
  health: number;
}

export default function TankArenaGame() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [myTankId, setMyTankId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[TankArena] Game started with sessionId:', sessionId);
    initializeGame();
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && !gameOver) {
      console.log('[TankArena] Game time expired');
      endGame();
    }
  }, [timeLeft]);

  const initializeGame = async () => {
    try {
      console.log('[TankArena] Initializing game...');
      
      // Load participants
      const { data: participants, error } = await supabase
        .from('game_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        console.error('[TankArena] Error loading participants:', error);
        throw error;
      }

      console.log('[TankArena] Loaded', participants.length, 'participants');

      // Initialize tanks
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
      const initialTanks: Tank[] = participants.map((p, index) => ({
        id: p.user_id,
        x: Math.random() * (ARENA_SIZE - TANK_SIZE),
        y: Math.random() * (ARENA_SIZE - TANK_SIZE),
        angle: Math.random() * 360,
        health: 100,
        eliminations: 0,
        damageTaken: 0,
        color: colors[index % colors.length],
      }));

      setTanks(initialTanks);
      setMyTankId(user?.id || '');

      // Initialize walls
      const initialWalls: Wall[] = [];
      for (let i = 0; i < 15; i++) {
        initialWalls.push({
          x: Math.random() * (ARENA_SIZE - WALL_SIZE),
          y: Math.random() * (ARENA_SIZE - WALL_SIZE),
          health: 3,
        });
      }
      setWalls(initialWalls);

      // Start game loop
      gameLoopRef.current = setInterval(() => {
        updateGame();
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

      console.log('[TankArena] Game initialized successfully');
    } catch (error) {
      console.error('[TankArena] Error initializing game:', error);
      Alert.alert('Error', 'No se pudo inicializar el juego');
      router.back();
    }
  };

  const updateGame = () => {
    // Update bullets
    setBullets(prevBullets => {
      return prevBullets
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.vx,
          y: bullet.y + bullet.vy,
        }))
        .filter(bullet => 
          bullet.x >= 0 && 
          bullet.x <= ARENA_SIZE && 
          bullet.y >= 0 && 
          bullet.y <= ARENA_SIZE
        );
    });

    // Check collisions
    checkCollisions();
  };

  const checkCollisions = () => {
    setBullets(prevBullets => {
      let remainingBullets = [...prevBullets];
      
      setTanks(prevTanks => {
        let updatedTanks = [...prevTanks];
        
        remainingBullets = remainingBullets.filter(bullet => {
          let bulletHit = false;
          
          updatedTanks = updatedTanks.map(tank => {
            if (tank.id !== bullet.ownerId && tank.health > 0) {
              const dx = bullet.x - tank.x;
              const dy = bullet.y - tank.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < TANK_SIZE / 2) {
                bulletHit = true;
                const newHealth = Math.max(0, tank.health - 25);
                
                if (newHealth === 0) {
                  // Tank eliminated
                  const shooterTank = updatedTanks.find(t => t.id === bullet.ownerId);
                  if (shooterTank) {
                    return updatedTanks.map(t => 
                      t.id === bullet.ownerId 
                        ? { ...t, eliminations: t.eliminations + 1 }
                        : t
                    );
                  }
                }
                
                return {
                  ...tank,
                  health: newHealth,
                  damageTaken: tank.damageTaken + 25,
                };
              }
            }
            return tank;
          });
          
          return !bulletHit;
        });
        
        return updatedTanks;
      });
      
      return remainingBullets;
    });
  };

  const moveTank = (direction: 'up' | 'down' | 'left' | 'right') => {
    setTanks(prevTanks => 
      prevTanks.map(tank => {
        if (tank.id === myTankId && tank.health > 0) {
          let newX = tank.x;
          let newY = tank.y;
          let newAngle = tank.angle;
          
          const speed = 10;
          
          switch (direction) {
            case 'up':
              newY = Math.max(0, tank.y - speed);
              newAngle = 270;
              break;
            case 'down':
              newY = Math.min(ARENA_SIZE - TANK_SIZE, tank.y + speed);
              newAngle = 90;
              break;
            case 'left':
              newX = Math.max(0, tank.x - speed);
              newAngle = 180;
              break;
            case 'right':
              newX = Math.min(ARENA_SIZE - TANK_SIZE, tank.x + speed);
              newAngle = 0;
              break;
          }
          
          return { ...tank, x: newX, y: newY, angle: newAngle };
        }
        return tank;
      })
    );
  };

  const shoot = () => {
    const myTank = tanks.find(t => t.id === myTankId);
    if (!myTank || myTank.health <= 0) return;
    
    const angleRad = (myTank.angle * Math.PI) / 180;
    const bulletSpeed = 5;
    
    const newBullet: Bullet = {
      id: `${Date.now()}-${Math.random()}`,
      x: myTank.x + TANK_SIZE / 2,
      y: myTank.y + TANK_SIZE / 2,
      vx: Math.cos(angleRad) * bulletSpeed,
      vy: Math.sin(angleRad) * bulletSpeed,
      ownerId: myTankId,
    };
    
    setBullets(prev => [...prev, newBullet]);
  };

  const endGame = async () => {
    setGameOver(true);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    console.log('[TankArena] Ending game, determining winner...');

    try {
      // Determine winner
      const aliveTanks = tanks.filter(t => t.health > 0);
      let winner: Tank;
      
      if (aliveTanks.length === 1) {
        winner = aliveTanks[0];
      } else if (aliveTanks.length === 0) {
        // All dead, winner by most eliminations
        winner = tanks.reduce((prev, current) => 
          current.eliminations > prev.eliminations ? current : prev
        );
      } else {
        // Multiple alive, winner by most eliminations
        winner = aliveTanks.reduce((prev, current) => 
          current.eliminations > prev.eliminations ? current : prev
        );
        
        // Tie-breaker: least damage taken
        const topEliminations = winner.eliminations;
        const tiedTanks = aliveTanks.filter(t => t.eliminations === topEliminations);
        if (tiedTanks.length > 1) {
          winner = tiedTanks.reduce((prev, current) => 
            current.damageTaken < prev.damageTaken ? current : prev
          );
        }
      }

      console.log('[TankArena] Winner determined:', winner.id);

      // Update session with winner
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          winner_user_id: winner.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('[TankArena] Session update error:', sessionError);
        throw sessionError;
      }

      // Update participant stats
      for (const tank of tanks) {
        const rank = tanks
          .sort((a, b) => {
            if (b.eliminations !== a.eliminations) return b.eliminations - a.eliminations;
            return a.damageTaken - b.damageTaken;
          })
          .findIndex(t => t.id === tank.id) + 1;

        await supabase
          .from('game_participants')
          .update({
            score: tank.eliminations,
            eliminations: tank.eliminations,
            damage_taken: tank.damageTaken,
            rank: rank
          })
          .eq('session_id', sessionId)
          .eq('user_id', tank.id);
      }

      // Award prize to winner (100% of pool)
      const { data: session } = await supabase
        .from('game_sessions')
        .select('prize_amount')
        .eq('id', sessionId)
        .single();

      if (session && session.prize_amount > 0) {
        console.log('[TankArena] Awarding prize:', session.prize_amount, 'MXI to winner');
        
        // Get current balance
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('mxi_from_challenges')
          .eq('id', winner.id)
          .single();

        if (userError) {
          console.error('[TankArena] User data error:', userError);
          throw userError;
        }

        // Add to mxi_from_challenges
        const newBalance = (userData.mxi_from_challenges || 0) + session.prize_amount;
        
        const { error: prizeError } = await supabase
          .from('users')
          .update({
            mxi_from_challenges: newBalance
          })
          .eq('id', winner.id);

        if (prizeError) {
          console.error('[TankArena] Prize award error:', prizeError);
          throw prizeError;
        }

        console.log('[TankArena] Prize awarded successfully');

        // Record result
        await supabase
          .from('game_results')
          .insert({
            session_id: sessionId,
            user_id: winner.id,
            game_type: 'tank_arena',
            rank: 1,
            score: winner.eliminations,
            prize_won: session.prize_amount
          });
      }

      // Show result
      Alert.alert(
        'Juego Terminado',
        winner.id === myTankId 
          ? `¡Felicidades! Ganaste ${session?.prize_amount.toFixed(2)} MXI\n\nEl premio ha sido agregado a tu saldo de retos.`
          : `El ganador es el jugador ${tanks.findIndex(t => t.id === winner.id) + 1}\n\nPremio: ${session?.prize_amount.toFixed(2)} MXI`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/tournaments') }]
      );

    } catch (error) {
      console.error('[TankArena] Error ending game:', error);
      Alert.alert('Error', 'Hubo un problema al finalizar el juego');
      router.replace('/(tabs)/tournaments');
    }
  };

  const myTank = tanks.find(t => t.id === myTankId);
  const aliveTanks = tanks.filter(t => t.health > 0).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Tiempo: {timeLeft}s</Text>
          <Text style={styles.statText}>Vivos: {aliveTanks}/{tanks.length}</Text>
          {myTank && (
            <Text style={styles.statText}>Salud: {myTank.health}%</Text>
          )}
        </View>
      </View>

      <View style={styles.arenaContainer}>
        <View style={[styles.arena, { width: ARENA_SIZE, height: ARENA_SIZE }]}>
          {walls.map((wall, index) => (
            <View
              key={`wall-${index}`}
              style={[
                styles.wall,
                {
                  left: wall.x,
                  top: wall.y,
                  opacity: wall.health / 3,
                }
              ]}
            />
          ))}

          {tanks.map((tank) => (
            <React.Fragment key={tank.id}>
              {tank.health > 0 && (
                <View
                  style={[
                    styles.tank,
                    {
                      left: tank.x,
                      top: tank.y,
                      backgroundColor: tank.color,
                      transform: [{ rotate: `${tank.angle}deg` }],
                    }
                  ]}
                >
                  <View style={styles.tankBarrel} />
                  <View style={styles.healthBar}>
                    <View 
                      style={[
                        styles.healthBarFill, 
                        { width: `${tank.health}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}

          {bullets.map(bullet => (
            <View
              key={bullet.id}
              style={[
                styles.bullet,
                {
                  left: bullet.x,
                  top: bullet.y,
                }
              ]}
            />
          ))}
        </View>
      </View>

      {myTank && myTank.health > 0 && !gameOver && (
        <View style={styles.controls}>
          <View style={styles.dpadContainer}>
            <TouchableOpacity 
              style={[styles.dpadButton, styles.dpadUp]} 
              onPress={() => moveTank('up')}
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
                onPress={() => moveTank('left')}
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
                onPress={() => moveTank('right')}
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
              onPress={() => moveTank('down')}
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
  tank: {
    position: 'absolute',
    width: TANK_SIZE,
    height: TANK_SIZE,
    borderRadius: TANK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tankBarrel: {
    position: 'absolute',
    width: 20,
    height: 6,
    backgroundColor: '#333',
    right: -10,
    borderRadius: 3,
  },
  healthBar: {
    position: 'absolute',
    bottom: -8,
    width: TANK_SIZE,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  bullet: {
    position: 'absolute',
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: BULLET_SIZE / 2,
    backgroundColor: colors.primary,
  },
  wall: {
    position: 'absolute',
    width: WALL_SIZE,
    height: WALL_SIZE,
    backgroundColor: '#8B4513',
    borderWidth: 2,
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
