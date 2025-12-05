
import { StyleSheet } from 'react-native';

// Updated color scheme to match Balance Total MXI chart
export const colors = {
  // Primary colors matching the MXI chart
  primary: '#00ff88',        // Bright green from chart
  secondary: '#ffdd00',      // Yellow from chart
  accent: '#6366F1',         // Indigo for accents
  success: '#10b981',
  warning: '#FF9800',
  error: '#ff0044',
  background: '#000000',     // Dark background
  card: '#001414',           // Dark teal card background
  cardBackground: 'rgba(0, 20, 20, 0.95)',  // Matching chart card
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: 'rgba(0, 255, 136, 0.3)',  // Green border matching chart
  highlight: 'rgba(0, 255, 136, 0.1)',
  
  // Chart-specific colors
  chartGreen: '#00ff88',
  chartYellow: '#ffdd00',
  chartPurple: '#A855F7',
  chartIndigo: '#6366F1',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  outlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
