import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PixelPet } from '@/components/pixel-pet';
import { DigitalBackground } from '@/components/digital-background';
import { TERMINAL_FONT } from '@/components/digital-art';
import { TerminalPanel } from '@/components/terminal-panel';
import { NEEDS, petGrowth, type Need } from '@/game/pet';
import { loadPetRecords, type PetRecord } from '@/game/storage';
import { appearanceLabel, stageLabel } from '@/i18n/messages';
import { useI18n } from '@/i18n/provider';

const colors: Record<Need, string> = { food: '#ffac69', energy: '#59efff', hygiene: '#81bcff', mood: '#a0ff77', health: '#ef89ff' };

function dateLabel(timestamp: number, language: 'fr' | 'en') {
  return new Date(timestamp).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'long', timeStyle: 'short' });
}

export default function MemorialScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const [records, setRecords] = useState<PetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchRecords = useCallback(() => {
    void loadPetRecords().then(value => { setRecords(value); setError(null); })
      .catch(cause => setError(cause instanceof Error ? cause.message : t('memorial.readError')))
      .finally(() => setLoading(false));
  }, [t]);
  const refresh = () => { setLoading(true); fetchRecords(); };
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return <View style={{ flex: 1 }}>
    <DigitalBackground />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 14,
      paddingBottom: Math.max(insets.bottom, 14), gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: '#eaf6f0', fontFamily: TERMINAL_FONT, fontSize: 22, fontWeight: '700' }}>{t('memorial.title')}</Text>
        <Pressable accessibilityRole="button" onPress={refresh} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text style={{ color: '#a9d875', fontFamily: TERMINAL_FONT, fontSize: 11 }}>{t('memorial.refresh')}</Text>
        </Pressable>
      </View>
      <Text style={{ color: '#a3bcc0', fontFamily: TERMINAL_FONT, fontSize: 11, lineHeight: 17 }}>
        {t('memorial.description')}
      </Text>
      {loading ? <ActivityIndicator color="#a9d875" /> : error ? <TerminalPanel>
        <Text accessibilityRole="alert" style={{ color: '#ffb2a5', fontFamily: TERMINAL_FONT, fontSize: 11, lineHeight: 17 }}>{error}</Text>
      </TerminalPanel> : records.length === 0 ? <TerminalPanel style={{ gap: 6 }}>
        <Text style={{ color: '#d7ffe4', fontFamily: TERMINAL_FONT, fontSize: 13 }}>{t('memorial.emptyTitle')}</Text>
        <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 10, lineHeight: 16 }}>{t('memorial.emptyDescription')}</Text>
      </TerminalPanel> : [...records].reverse().map(({ id, pet }) => {
        const growth = petGrowth(pet, pet.updatedAt);
        const age = growth.ageDays === 0 ? t('home.ageHoursOnly', { hours: growth.ageHours })
          : growth.ageHours % 24 === 0 ? t('home.ageDaysOnly', { days: growth.ageDays })
            : t('memorial.age', { days: growth.ageDays, hours: growth.ageHours % 24 });
        return <TerminalPanel key={id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#09151b', borderWidth: 1, borderColor: '#2d474b', borderRadius: 7 }}>
              <PixelPet appearance={pet.appearance} stageIndex={growth.stageIndex} sleeping small />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: '#d7ffe4', fontFamily: TERMINAL_FONT, fontSize: 17, fontWeight: '700' }}>{pet.name}</Text>
              <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 10 }}>{appearanceLabel(pet.appearance, language)} · {stageLabel(growth.stageIndex, language)}</Text>
            </View>
          </View>
          <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 10 }}>{age}</Text>
          <Text style={{ color: '#a3bcc0', fontFamily: TERMINAL_FONT, fontSize: 10 }}>{t('memorial.adopted', { date: dateLabel(pet.createdAt, language) })}</Text>
          <Text style={{ color: '#a3bcc0', fontFamily: TERMINAL_FONT, fontSize: 10 }}>{t('memorial.died', { date: dateLabel(pet.updatedAt, language) })}</Text>
          <View accessible={false} style={{ height: 1, backgroundColor: '#2c404b' }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {NEEDS.map(key => <View key={key} style={{ minWidth: '30%', flexGrow: 1, padding: 7,
              backgroundColor: '#09151b', borderWidth: 1, borderColor: '#2d474b', borderRadius: 5 }}>
              <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9 }}>{t(`need.${key}`)}</Text>
              <Text style={{ color: colors[key], fontFamily: TERMINAL_FONT, fontSize: 12, fontWeight: '700' }}>{Math.round(pet.needs[key])} %</Text>
            </View>)}
          </View>
        </TerminalPanel>;
      })}
    </ScrollView>
  </View>;
}
