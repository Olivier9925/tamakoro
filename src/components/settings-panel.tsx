import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DigitalBackground } from '@/components/digital-background';
import { TERMINAL_FONT } from '@/components/digital-art';
import { ReminderSettings } from '@/components/reminder-settings';
import { loadPetRecords } from '@/game/storage';

export function SettingsPanel() {
  const insets = useSafeAreaInsets();
  const [hasMemorial, setHasMemorial] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadPetRecords().then(records => {
      if (active) setHasMemorial(records.length > 0);
    }).catch(() => {
      if (active) setHasMemorial(false);
    });
    return () => { active = false; };
  }, []));
  return <View style={{ flex: 1 }}>
    <DigitalBackground />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{
      padding: 14, paddingBottom: Math.max(insets.bottom, 14), gap: 12,
      width: '100%', maxWidth: 560, alignSelf: 'center' }}>
      <Text accessibilityRole="header" style={{ color: '#eaf6f0', fontFamily: TERMINAL_FONT,
        fontSize: 22, fontWeight: '700' }}>Paramètres</Text>
      {hasMemorial && <Link href="/memorial" asChild>
        <Pressable accessibilityRole="button" style={{ minHeight: 52, justifyContent: 'center', paddingHorizontal: 14,
          backgroundColor: '#101c26', borderRadius: 10, borderWidth: 1, borderColor: '#354650', borderTopColor: '#5a6974' }}>
          <Text style={{ color: '#d7ffe4', fontFamily: TERMINAL_FONT, fontSize: 13, fontWeight: '700' }}>Voir le mémorial ›</Text>
          <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9, marginTop: 4 }}>Retrouver les Tamakoro qui ont partagé ton aventure</Text>
        </Pressable>
      </Link>}
      <ReminderSettings />
    </ScrollView>
  </View>;
}
