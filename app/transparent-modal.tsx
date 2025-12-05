
import { StyleSheet, Text, Pressable, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';

export default function TransparentModal() {
  const theme = useTheme();

  return (
    <Pressable style={styles.backdrop} onPress={() => router.back()}>
      <Pressable onPress={(e) => e.stopPropagation()}>
        <GlassView style={styles.modal} glassEffectStyle="regular">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="cancel" 
                size={28} 
                color={theme.colors.text} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Transparent Modal</Text>
          <Text style={[styles.text, { color: theme.colors.text }]}>Tap outside or the X button to dismiss</Text>
        </GlassView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  modalHeader: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
