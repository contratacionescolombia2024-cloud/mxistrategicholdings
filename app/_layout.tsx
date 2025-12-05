
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { registerWebConfirmHandler } from '@/utils/confirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useState } from 'react';
import { ConfirmConfig } from '@/utils/confirmDialog';
import { notificationService } from '@/utils/notificationService';
import { Platform } from 'react-native';

export default function RootLayout() {
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  useEffect(() => {
    // Register web confirm dialog handler
    registerWebConfirmHandler((config) => {
      setConfirmConfig(config);
    });

    // Initialize notification service
    if (Platform.OS === 'web') {
      notificationService.requestWebNotificationPermission();
    }
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <RealtimeProvider>
            <WidgetProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="email-confirmed" />
              </Stack>
              {confirmConfig && (
                <ConfirmDialog
                  config={confirmConfig}
                  onClose={() => setConfirmConfig(null)}
                />
              )}
            </WidgetProvider>
          </RealtimeProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
