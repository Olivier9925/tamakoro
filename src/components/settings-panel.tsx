import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DigitalBackground } from '@/components/digital-background';
import { TERMINAL_FONT } from '@/components/digital-art';
import { ReminderSettings } from '@/components/reminder-settings';

export function SettingsPanel() {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1 }}>
    <DigitalBackground />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{
      padding: 14, paddingBottom: Math.max(insets.bottom, 14), gap: 12,
      width: '100%', maxWidth: 560, alignSelf: 'center' }}>
      <Text accessibilityRole="header" style={{ color: '#eaf6f0', fontFamily: TERMINAL_FONT,
        fontSize: 22, fontWeight: '700' }}>Paramètres</Text>
      <ReminderSettings />
    </ScrollView>
  </View>;
}
