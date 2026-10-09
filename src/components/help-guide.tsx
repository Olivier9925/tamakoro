import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DigitalBackground } from '@/components/digital-background';
import { TERMINAL_FONT } from '@/components/digital-art';
import { TerminalPanel } from '@/components/terminal-panel';

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
  return <View style={{ flex: 1 }}>
    <DigitalBackground />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{
      padding: 14, paddingBottom: Math.max(insets.bottom, 14), gap: 12,
      width: '100%', maxWidth: 560, alignSelf: 'center' }}>
      <Text accessibilityRole="header" style={{ color: '#eaf6f0', fontFamily: TERMINAL_FONT,
        fontSize: 22, fontWeight: '700' }}>Guide du compagnon</Text>
      <GuideSection title="Les soins">
        <GuideText>{'Nourrir : +25 satiété, +3 humeur.\nHydrater : +8 satiété, +5 santé.\nNettoyer : +35 hygiène, +5 humeur.\nJouer : +25 humeur, −8 énergie, −4 satiété.'}</GuideText>
        <GuideText>Les jauges vont de 0 à 100. Orange : besoin faible. Rouge : besoin critique.</GuideText>
      </GuideSection>
      <GuideSection title="Dormir et réveiller">
        <GuideText>Dormir rend 18 points d’énergie par heure. À 100 d’énergie, ton Tamakoro se réveille automatiquement. Tu peux aussi le réveiller avant pour accéder aux autres soins.</GuideText>
        <GuideText>La satiété, l’hygiène et l’humeur continuent de baisser pendant son sommeil.</GuideText>
      </GuideSection>
      <GuideSection title="Grandir ensemble">
        <GuideText>Une nouvelle forme tous les 15 jours : bébé, petite pousse, enfant, juvénile, adolescent, jeune adulte, puis adulte à 90 jours. Chaque forme est animée.</GuideText>
      </GuideSection>
      <GuideSection title="Absence et santé">
        <GuideText>Le temps passe même quand l’app est fermée ou hors ligne. Les besoins et la croissance sont recalculés à ton retour ; les soins sont sauvegardés sur cet appareil.</GuideText>
        <GuideText>Si satiété, hygiène ou humeur passe sous 20, la santé baisse de 2/h. Quand ces trois besoins sont à 20 ou plus, elle remonte de 1/h.</GuideText>
        <GuideText>À 0 de santé, le décès est définitif : soins et croissance s’arrêtent. Tu peux ensuite confirmer une nouvelle adoption pour remplacer la partie.</GuideText>
      </GuideSection>
    </ScrollView>
  </View>;
}
