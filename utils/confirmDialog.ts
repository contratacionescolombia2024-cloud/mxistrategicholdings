
import { Platform, Alert } from 'react-native';

// Global state for web confirmation dialogs
let webConfirmCallback: ((config: ConfirmConfig) => void) | null = null;

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'error' | 'success';
  icon?: {
    ios: string;
    android: string;
  };
}

/**
 * Register the web confirm dialog handler
 * This should be called from the root layout component
 */
export function registerWebConfirmHandler(handler: (config: ConfirmConfig) => void) {
  webConfirmCallback = handler;
}

/**
 * Show a confirmation dialog that works on all platforms
 * On native: uses Alert.alert
 * On web: uses custom ConfirmDialog component
 */
export function showConfirm(config: ConfirmConfig) {
  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
  } = config;

  if (Platform.OS === 'web') {
    // Use custom dialog on web
    if (webConfirmCallback) {
      webConfirmCallback(config);
    } else {
      // Fallback to browser confirm
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    }
  } else {
    // Use native Alert on mobile
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: confirmText,
          onPress: onConfirm,
        },
      ]
    );
  }
}

/**
 * Show an alert message that works on all platforms
 */
export function showAlert(
  title: string,
  message: string,
  onPress?: () => void,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
) {
  showConfirm({
    title,
    message,
    confirmText: 'OK',
    cancelText: '',
    onConfirm: onPress || (() => {}),
    onCancel: onPress || (() => {}),
    type,
  });
}
