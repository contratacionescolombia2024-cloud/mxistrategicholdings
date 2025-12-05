
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { APP_VERSION, BUILD_ID, BUILD_DATE } from '@/constants/AppVersion';

export default function Index() {
  useEffect(() => {
    // Log version info on app start
    console.log('='.repeat(60));
    console.log('APP STARTING');
    console.log('Platform:', Platform.OS);
    console.log('Version:', APP_VERSION);
    console.log('Build ID:', BUILD_ID);
    console.log('Build Date:', BUILD_DATE);
    console.log('='.repeat(60));
    
    // For web, add version to page title
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const originalTitle = document.title;
      document.title = `${originalTitle} (${APP_VERSION})`;
    }
  }, []);

  return <Redirect href="/(auth)/login" />;
}
