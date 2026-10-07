import { ScrollView, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>Virtual Pet</Text>
      <Text style={styles.message}>Un petit compagnon, tout un monde dans ton téléphone.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  subtitle: { fontSize: 28, fontWeight: '700', color: '#a5e4bd', textAlign: 'center' },
  message: { fontSize: 18, lineHeight: 28, color: '#eaf6f0', textAlign: 'center', maxWidth: 320 },
});
