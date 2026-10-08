import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { reminders } from '@/reminders/reminders';
import { observeReminderTap } from '@/reminders/reminder-platform';

export default function RootLayout() {
  useEffect(() => {
    void reminders.refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void reminders.refresh();
    });
    const stop = observeReminderTap(() => router.dismissTo('/'));
    return () => { subscription.remove(); stop(); };
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#090f18' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ header: ({ route }) => <AppHeader panel={route.name === 'help' || route.name === 'settings' ? route.name : undefined} />, contentStyle: { backgroundColor: '#090f18' } }}>
        <Stack.Screen name="index" options={{ title: 'Tamakoro' }} />
        <Stack.Screen name="help" options={{ title: 'Aide Tamakoro', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Paramètres Tamakoro', presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
