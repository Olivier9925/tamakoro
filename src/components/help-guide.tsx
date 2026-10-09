import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DigitalBackground } from '@/components/digital-background';
import { TERMINAL_FONT } from '@/components/digital-art';
import { TerminalPanel } from '@/components/terminal-panel';
import { useI18n } from '@/i18n/provider';

function GuideSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return <TerminalPanel style={{ gap: 8, padding: 14 }}>
    <Text accessibilityRole="header" style={{ color: '#d4fbb5', fontFamily: TERMINAL_FONT,
      fontSize: 16, fontWeight: '700' }}>{'>_ '}{title}</Text>
    {children}
  </TerminalPanel>;
}

function GuideText({ children }: PropsWithChildren) {
  return <Text selectable style={{ color: '#c3d7dc', fontFamily: TERMINAL_FONT,
    fontSize: 13, lineHeight: 20 }}>{children}</Text>;
}

export function HelpGuide() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return <View style={{ flex: 1 }}>
    <DigitalBackground />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{
      padding: 14, paddingBottom: Math.max(insets.bottom, 14), gap: 12,
      width: '100%', maxWidth: 560, alignSelf: 'center' }}>
      <Text accessibilityRole="header" style={{ color: '#eaf6f0', fontFamily: TERMINAL_FONT,
        fontSize: 22, fontWeight: '700' }}>{t('help.title')}</Text>
      <GuideSection title={t('help.care')}>
        <GuideText>{t('help.careDetails')}</GuideText>
        <GuideText>{t('help.gauges')}</GuideText>
      </GuideSection>
      <GuideSection title={t('help.sleep')}>
        <GuideText>{t('help.sleepEnergy')}</GuideText>
        <GuideText>{t('help.sleepNeeds')}</GuideText>
      </GuideSection>
      <GuideSection title={t('help.growth')}>
        <GuideText>{t('help.growthDetails')}</GuideText>
      </GuideSection>
      <GuideSection title={t('help.absence')}>
        <GuideText>{t('help.time')}</GuideText>
        <GuideText>{t('help.health')}</GuideText>
        <GuideText>{t('help.death')}</GuideText>
      </GuideSection>
    </ScrollView>
  </View>;
}
