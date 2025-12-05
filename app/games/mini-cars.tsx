
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
const CAR_SIZE = 25;
const GAME_DURATION = 90; // 1.5 minutes

interface Car {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  accumulatedSpeed: number;
  color: string;
  alive: boolean;
}

export default function MiniCarsGame() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [myCarId, setMyCarId] = useState<string>('');
  const [arenaRadius, setArenaRadius] = useState(ARENA_SIZE / 2);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeGame();
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
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
      const centerX = ARENA_SIZE / 2;
      const centerY = ARENA_SIZE / 2;
      
      const initialCars: Car[] = participants.map((p, index) => {
        const angle = (index / participants.length) * 2 * Math.PI;
        const radius = ARENA_SIZE / 4;
        
        return {
          id: p.user_id,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          speed: 0,
          accumulatedSpeed: 0,
          color: colors[index % colors.length],
          alive: true,
        };
      });

      setCars(initialCars);
      setMyCarId(user?.id || '');

      gameLoopRef.current = setInterval(() => {
        updateGame();
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          // Shrink arena every 15 seconds
          if (newTime % 15 === 0 && newTime > 0) {
            setArenaRadius(prevRadius => Math.max(50, prevRadius - 30));
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error initializing game:', error);
      Alert.alert('Error', 'No se pudo inicializar el juego');
    }
  };

  const updateGame = () => {
    setCars(prevCars => {
      const centerX = ARENA_SIZE / 2;
      const centerY = ARENA_SIZE / 2;
      
      return prevCars.map(car => {
        if (!car.alive) return car;

        // Update position
        let newX = car.x + car.vx;
        let newY = car.y + car.vy;

        // Check if out of arena
        const dx = newX - centerX;
        const dy = newY - centerY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distanceFromCenter > arenaRadius) {
          return { ...car, alive: false };
        }

        // Apply friction
        const friction = 0.95;
        const newVx = car.vx * friction;
        const newVy = car.vy * friction;
        const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);

        return {
          ...car,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          speed: newSpeed,
          accumulatedSpeed: car.accumulatedSpeed + newSpeed,
        };
      });
    });
  };

  const accelerate = (direction: 'up' | 'down' | 'left' | 'right') => {
    setCars(prevCars =>
      prevCars.map(car => {
        if (car.id === myCarId && car.alive) {
          const acceleration = 0.5;
          let newVx = car.vx;
          let newVy = car.vy;

          switch (direction) {
            case 'up':
              newVy -= acceleration;
              break;
            case 'down':
              newVy += acceleration;
              break;
            case 'left':
              newVx -= acceleration;
              break;
            case 'right':
              newVx += acceleration;
              break;
          }

          // Limit max speed
          const maxSpeed = 5;
          const speed = Math.sqrt(newVx * newVx + newVy * newVy);
          if (speed > maxSpeed) {
            newVx = (newVx / speed) * maxSpeed;
            newVy = (newVy / speed) * maxSpeed;
          }

          return { ...car, vx: newVx, vy: newVy };
        }
        return car;
      })
    );
  };

  const endGame = async () => {
    setGameOver(true);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    try {
      const aliveCars = cars.filter(c => c.alive);
      const centerX = ARENA_SIZE / 2;
      const centerY = ARENA_SIZE / 2;

      let winner: Car;
      
      if (aliveCars.length === 1) {
        winner = aliveCars[0];
      } else if (aliveCars.length === 0) {
        winner = cars.reduce((prev, current) =>
          current.accumulatedSpeed > prev.accumulatedSpeed ? current : prev
        );
      } else {
        // Winner is furthest from edge (closest to center)
        winner = aliveCars.reduce((prev, current) => {
          const prevDist = Math.sqrt(
            Math.pow(prev.x - centerX, 2) + Math.pow(prev.y - centerY, 2)
          );
          const currDist = Math.sqrt(
            Math.pow(current.x - centerX, 2) + Math.pow(current.y - centerY, 2)
          );
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

      for (const car of cars) {
        const rank = cars
          .sort((a, b) => {
            if (a.alive !== b.alive) return a.alive ? -1 : 1;
            const aDist = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2));
            const bDist = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2));
            return aDist - bDist;
          })
          .findIndex(c => c.id === car.id) + 1;

        await supabase
          .from('game_participants')
          .update({
            accumulated_speed: car.accumulatedSpeed,
            rank: rank
          })
          .eq('session_id', sessionId)
          .eq('user_id', car.id);
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
        winner.id === myCarId
          ? `¡Felicidades! Ganaste ${session?.prize_amount.toFixed(2)} MXI`
          : 'Mejor suerte la próxima vez',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/tournaments') }]
      );

    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const myCar = cars.find(c => c.id === myCarId);
  const aliveCars = cars.filter(c => c.alive).length;
  const centerX = ARENA_SIZE / 2;
  const centerY = ARENA_SIZE / 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Tiempo: {timeLeft}s</Text>
          <Text style={styles.statText}>Vivos: {aliveCars}/{cars.length}</Text>
          <Text style={styles.statText}>Radio: {arenaRadius.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.arenaContainer}>
        <View style={[styles.arena, { width: ARENA_SIZE, height: ARENA_SIZE }]}>
          <View
            style={[
              styles.arenaCircle,
              {
                width: arenaRadius * 2,
                height: arenaRadius * 2,
                borderRadius: arenaRadius,
                left: centerX - arenaRadius,
                top: centerY - arenaRadius,
              }
            ]}
          />

          {cars.map(car => (
            <React.Fragment key={car.id}>
              {car.alive && (
                <View
                  style={[
                    styles.car,
                    {
                      left: car.x - CAR_SIZE / 2,
                      top: car.y - CAR_SIZE / 2,
                      backgroundColor: car.color,
                    }
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {myCar && myCar.alive && !gameOver && (
        <View style={styles.controls}>
          <View style={styles.dpadContainer}>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadUp]}
              onPress={() => accelerate('up')}
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
                onPress={() => accelerate('left')}
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
                onPress={() => accelerate('right')}
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
              onPress={() => accelerate('down')}
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
  arenaCircle: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  car: {
    position: 'absolute',
    width: CAR_SIZE,
    height: CAR_SIZE,
    borderRadius: CAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
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
