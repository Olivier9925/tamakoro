import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DigitalBackground } from '@/components/digital-background';
import { TERMINAL_FONT } from '@/components/digital-art';
import { ReminderSettings } from '@/components/reminder-settings';
import { loadPetRecords } from '@/game/storage';
import { useI18n } from '@/i18n/provider';
import type { LanguagePreference } from '@/i18n/provider';

export function SettingsPanel() {
  const insets = useSafeAreaInsets();
  const { t, preference, setPreference } = useI18n();
  const [hasMemorial, setHasMemorial] = useState(false);
  const [languageSaveError, setLanguageSaveError] = useState(false);
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
        fontSize: 22, fontWeight: '700' }}>{t('settings.title')}</Text>
      <View style={{ gap: 8, padding: 12, backgroundColor: '#101c26', borderRadius: 10,
        borderWidth: 1, borderColor: '#354650', borderTopColor: '#5a6974' }}>
        <Text accessibilityRole="header" style={{ color: '#d4fbb5', fontFamily: TERMINAL_FONT,
          fontSize: 14, fontWeight: '700' }}>{t('language.title')}</Text>
        {(['system', 'fr', 'en'] as LanguagePreference[]).map(option => <Pressable key={option}
          accessibilityRole="button" accessibilityState={{ selected: preference === option }}
          onPress={() => { void setPreference(option).then(saved => setLanguageSaveError(!saved)); }}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 6,
            borderWidth: 1, borderColor: preference === option ? '#a9d875' : '#2d474b',
            backgroundColor: preference === option ? '#1c342a' : '#09151b' }}>
          <Text style={{ color: preference === option ? '#d7ffe4' : '#a3bcc0', fontFamily: TERMINAL_FONT, fontSize: 11 }}>
            {option === 'system' ? t('language.system') : option === 'fr' ? t('language.french') : t('language.english')}
          </Text>
          {option === 'system' && <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9, marginTop: 3 }}>{t('language.systemDescription')}</Text>}
        </Pressable>)}
        {languageSaveError && <Text accessibilityRole="alert" style={{ color: '#ffb2a5', fontFamily: TERMINAL_FONT, fontSize: 10 }}>{t('language.saveError')}</Text>}
      </View>
      {hasMemorial && <Link href="/memorial" asChild>
        <Pressable accessibilityRole="button" style={{ minHeight: 52, justifyContent: 'center', paddingHorizontal: 14,
          backgroundColor: '#101c26', borderRadius: 10, borderWidth: 1, borderColor: '#354650', borderTopColor: '#5a6974' }}>
          <Text style={{ color: '#d7ffe4', fontFamily: TERMINAL_FONT, fontSize: 13, fontWeight: '700' }}>{t('settings.memorial')}</Text>
          <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9, marginTop: 4 }}>{t('settings.memorialDescription')}</Text>
        </Pressable>
      </Link>}
      <ReminderSettings />
    </ScrollView>
  </View>;
}
