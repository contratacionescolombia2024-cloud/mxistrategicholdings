
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';

export default function EmailConfirmedScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      console.log('Email confirmation screen loaded');
      
      // Get the URL that opened the app
      const url = await Linking.getInitialURL();
      console.log('Initial URL:', url);
      
      if (url) {
        // Extract the token from the URL
        const { data, error } = await supabase.auth.getSessionFromUrl({ url });
        
        if (error) {
          console.error('Error confirming email:', error);
          setStatus('error');
          setMessage('Failed to verify email. Please try again.');
          setTimeout(() => router.replace('/(auth)/login'), 3000);
          return;
        }
        
        if (data.session) {
          console.log('Email verified successfully');
          
          // Update user's email_verified status in database
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_verified: true })
            .eq('id', data.session.user.id);
          
          if (updateError) {
            console.error('Error updating email_verified status:', updateError);
          }
          
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          
          // Sign out the user so they can log in properly
          await supabase.auth.signOut();
          
          setTimeout(() => router.replace('/(auth)/login'), 2000);
        } else {
          setStatus('error');
          setMessage('No session found. Please try logging in.');
          setTimeout(() => router.replace('/(auth)/login'), 3000);
        }
      } else {
        // No URL found, might be a direct navigation
        setStatus('success');
        setMessage('Email verification complete! Please log in.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    } catch (error: any) {
      console.error('Exception in email confirmation:', error);
      setStatus('error');
      setMessage('An error occurred. Please try logging in.');
      setTimeout(() => router.replace('/(auth)/login'), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <View style={styles.iconContainer}>
              <IconSymbol name="checkmark.circle.fill" size={80} color={colors.success} />
            </View>
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <View style={styles.iconContainer}>
              <IconSymbol name="xmark.circle.fill" size={80} color={colors.error} />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});
