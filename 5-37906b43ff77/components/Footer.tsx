
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        MAXCOIN (MXI) is a registered trademark of MXI Strategic Holdings Ltd., Cayman Islands.
      </Text>
      <Text style={styles.text}>
        Operated by MXI Technologies Inc. (Panamá)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  text: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
