import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#10252e' }, headerTintColor: '#eaf6f0', contentStyle: { backgroundColor: '#10252e' } }}>
        <Stack.Screen name="index" options={{ title: 'Tamakoro' }} />
      </Stack>
    </>
  );
}
