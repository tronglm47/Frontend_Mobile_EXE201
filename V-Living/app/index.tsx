import React from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { LoadingScreen } from '@/components/loading-screen';

export default function Index() {
  const [ready, setReady] = React.useState(false);
  const [seen, setSeen] = React.useState<boolean | null>(null);

  const MIN_LOADING_MS = 800;

  const preloadAssets = React.useCallback(async () => {
    try {
      await Asset.loadAsync([
  require('../assets/images/screenKhoa/1.png'),
  require('../assets/images/screenKhoa/2.png'),
  require('../assets/images/screenKhoa/3.png'),
  require('../assets/images/screenKhoa/4.png'),
  require('../assets/images/screenKhoa/5.png'),
  require('../assets/images/screenKhoa/6.png'),
  require('../assets/images/screenKhoa/bg.png'),
  require('../assets/images/screenKhoa/loading.png'),
      ]);
    } catch {}
  }, []);

  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const start = Date.now();
      try {
        const [flag] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          preloadAssets(),
        ]);
        setSeen(flag === 'true');
      } finally {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_LOADING_MS - elapsed);
        t = setTimeout(() => setReady(true), wait);
      }
    })();

    return () => t && clearTimeout(t);
  }, [preloadAssets]);

  if (!ready || seen === null) return <LoadingScreen />;

  return <Redirect href={seen ? '/onboarding' : '/(tabs)'} />;
}