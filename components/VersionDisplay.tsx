
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { APP_VERSION } from '@/constants/AppVersion';
import { colors } from '@/styles/commonStyles';

interface VersionDisplayProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export default function VersionDisplay({ position = 'bottom', showDetails = false }: VersionDisplayProps) {
  const [expanded, setExpanded] = useState(showDetails);

  const handlePress = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.container, position === 'top' ? styles.top : styles.bottom]}>
      <TouchableOpacity onPress={handlePress} style={styles.versionButton}>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>📦 Información de Versión</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Versión:</Text>
            <Text style={styles.detailValue}>{APP_VERSION}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plataforma:</Text>
            <Text style={styles.detailValue}>{Platform.OS}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    zIndex: 9999,
  },
  top: {
    top: 10,
  },
  bottom: {
    bottom: 10,
  },
  versionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 250,
    maxWidth: 300,
  },
  detailTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  detailValue: {
    color: colors.text,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
});
