
import { Stack } from 'expo-router';
import React from 'react';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="withdrawals" />
      <Stack.Screen name="withdraw-mxi" />
      <Stack.Screen name="withdrawal" />
      <Stack.Screen name="contrataciones" />
      <Stack.Screen name="lottery" />
      <Stack.Screen name="vesting" />
      <Stack.Screen name="kyc-verification" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="support" />
      <Stack.Screen name="challenge-history" />
    </Stack>
  );
}
