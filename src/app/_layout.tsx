import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AppHeader } from '@/components/app-header';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#090f18' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ header: ({ route }) => <AppHeader helpOpen={route.name === 'help'} />, contentStyle: { backgroundColor: '#090f18' } }}>
        <Stack.Screen name="index" options={{ title: 'Tamakoro' }} />
        <Stack.Screen name="help" options={{ title: 'Aide Tamakoro', presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
