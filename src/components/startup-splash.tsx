import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// At module scope so Expo Router cannot hide the native splash before mounting.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export function StartupSplash({ onFinished }: { onFinished: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  useEffect(() => {
    if (!loaded || !laidOut) return;
    // The full-screen artwork is painted before removing the system splash.
    void SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(onFinished, 1100);
    return () => clearTimeout(timer);
  }, [loaded, laidOut, onFinished]);
  return <View accessibilityLabel="Tamakoro démarre" accessibilityRole="image"
    style={[StyleSheet.absoluteFill, { backgroundColor: '#090f18', zIndex: 100 }]}
    onLayout={() => setLaidOut(true)}>
    <Image source={require('../../assets/images/tamakoro-splash.png')}
      style={StyleSheet.absoluteFill} contentFit="cover" transition={0}
      onDisplay={() => setLoaded(true)} onError={() => setLoaded(true)} />
  </View>;
}
