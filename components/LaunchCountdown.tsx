
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function LaunchCountdown() {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launchDate] = useState(new Date('2026-02-15T12:00:00Z'));

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.borderContainer}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.08)', 'rgba(168, 85, 247, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Subtle animated background elements */}
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          
          <View style={styles.content}>
            {/* Compact Header */}
            <View style={styles.header}>
              <IconSymbol 
                ios_icon_name="sparkles" 
                android_material_icon_name="auto_awesome" 
                size={20} 
                color="rgba(255, 255, 255, 0.95)" 
              />
              <Text style={styles.title}>{t('officialLaunch')}</Text>
              <IconSymbol 
                ios_icon_name="sparkles" 
                android_material_icon_name="auto_awesome" 
                size={20} 
                color="rgba(255, 255, 255, 0.95)" 
              />
            </View>

            <Text style={styles.subtitle}>{t('maxcoinMXI')}</Text>

            {/* Compact Date Display */}
            <View style={styles.dateContainer}>
              <IconSymbol 
                ios_icon_name="calendar" 
                android_material_icon_name="event" 
                size={14} 
                color="rgba(255, 255, 255, 0.85)" 
              />
              <Text style={styles.dateText}>{t('launchDate')}</Text>
            </View>

            {/* Compact Countdown Display */}
            <View style={styles.countdownContainer}>
              {/* Days */}
              <View style={styles.timeBlock}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeValue}>{countdown.days}</Text>
                </View>
                <Text style={styles.timeLabel}>{t('days')}</Text>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Hours */}
              <View style={styles.timeBlock}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeValue}>{countdown.hours.toString().padStart(2, '0')}</Text>
                </View>
                <Text style={styles.timeLabel}>{t('hours')}</Text>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Minutes */}
              <View style={styles.timeBlock}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeValue}>{countdown.minutes.toString().padStart(2, '0')}</Text>
                </View>
                <Text style={styles.timeLabel}>{t('minutes')}</Text>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Seconds */}
              <View style={styles.timeBlock}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeValue}>{countdown.seconds.toString().padStart(2, '0')}</Text>
                </View>
                <Text style={styles.timeLabel}>{t('seconds')}</Text>
              </View>
            </View>

            {/* Compact Bottom Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check_circle" 
                  size={12} 
                  color="rgba(255, 255, 255, 0.85)" 
                />
                <Text style={styles.infoText}>{t('poolActive')}</Text>
              </View>
              <View style={styles.infoItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check_circle" 
                  size={12} 
                  color="rgba(255, 255, 255, 0.85)" 
                />
                <Text style={styles.infoText}>{t('vestingRealTime')}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  borderContainer: {
    borderWidth: 3,
    borderRadius: 16,
    borderColor: colors.primary,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: -30,
    right: -30,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    bottom: -20,
    left: -20,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  timeBlock: {
    alignItems: 'center',
    gap: 4,
  },
  timeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.98)',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 28,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  separator: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
