
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  androidIcon: string;
  emoji: string;
}

export default function MenuButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-width * 0.75)).current;

  const menuItems: MenuItem[] = [
    {
      label: 'Inicio',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      androidIcon: 'home',
      emoji: '🏠',
    },
    {
      label: 'Perfil',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      androidIcon: 'person',
      emoji: '👤',
    },
  ];

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.75,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const handleNavigate = (route: string) => {
    closeMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/') {
      return pathname === '/(tabs)/(home)/' || pathname === '/(tabs)/(home)';
    }
    return pathname === route;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={openMenu}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconContainer}>
          <Text style={styles.menuButtonEmoji}>☰</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeMenu}
          />

          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={95} tint="dark" style={styles.menuContent}>
              <View style={styles.menuHeader}>
                <View style={styles.menuHeaderContent}>
                  <Text style={styles.menuHeaderEmoji}>💎</Text>
                  <Text style={styles.menuTitle}>Maxcoin Pool</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeMenu}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="close"
                    size={28}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.menuItems}>
                {menuItems.map((item, index) => {
                  const active = isActive(item.route);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.menuItem,
                        active && styles.menuItemActive,
                      ]}
                      onPress={() => handleNavigate(item.route)}
                    >
                      <View style={styles.menuItemContent}>
                        <View
                          style={[
                            styles.menuItemIconContainer,
                            active && styles.menuItemIconContainerActive,
                          ]}
                        >
                          <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                        </View>
                        <Text
                          style={[
                            styles.menuItemText,
                            active && styles.menuItemTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                      {active && (
                        <View style={styles.activeIndicator} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>
                  Maxcoin Liquidity Pool
                </Text>
                <Text style={styles.menuFooterSubtext}>
                  Versión 1.0.0
                </Text>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 1000,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButtonEmoji: {
    fontSize: 24,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    maxWidth: 300,
  },
  menuContent: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuHeaderEmoji: {
    fontSize: 32,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: colors.primary + '20',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconContainerActive: {
    backgroundColor: colors.primary + '30',
  },
  menuItemEmoji: {
    fontSize: 24,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuFooterSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
