
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { GameErrorHandler } from '@/utils/gameErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCode: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    const gameError = GameErrorHandler.logError(
      error,
      'ErrorBoundary - Component Error',
      {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }
    );

    this.setState({
      errorInfo,
      errorCode: gameError.code,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    console.log('[ErrorBoundary] Resetting error boundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={64}
                color={colors.error}
              />
            </View>

            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>
              La aplicación encontró un error inesperado. Por favor intenta de nuevo.
            </Text>

            {this.state.errorCode && (
              <View style={styles.errorCodeContainer}>
                <Text style={styles.errorCodeLabel}>Código de error:</Text>
                <Text style={styles.errorCode}>{this.state.errorCode}</Text>
              </View>
            )}

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Información de depuración:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[buttonStyles.primary, styles.button]}
              onPress={this.handleReset}
            >
              <Text style={buttonStyles.primaryText}>Intentar de nuevo</Text>
            </TouchableOpacity>

            <Text style={styles.supportText}>
              Si el problema persiste, contacta al soporte con el código de error.
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorCodeContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    alignItems: 'center',
  },
  errorCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  errorCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    fontFamily: 'monospace',
  },
  debugContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  button: {
    marginBottom: 16,
    minWidth: 200,
  },
  supportText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
