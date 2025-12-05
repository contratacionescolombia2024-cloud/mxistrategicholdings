
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});

export function PaymentStatus() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Pagos</Text>
      <Text style={styles.emptyText}>
        El sistema de pagos ha sido deshabilitado
      </Text>
    </View>
  );
}
