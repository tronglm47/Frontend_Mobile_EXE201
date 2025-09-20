import React from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { LoadingScreen } from '@/components/loading-screen';

export default function Index() {
  const [ready, setReady] = React.useState(false);
  const [hasSeen, setHasSeen] = React.useState<boolean | null>(null);
  const [hasToken, setHasToken] = React.useState<boolean | null>(null);
    const [hasSeenPlans, setHasSeenPlans] = React.useState<boolean | null>(null);

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
  let t: ReturnType<typeof setTimeout> | number | undefined;

    (async () => {
      const start = Date.now();
      try {
          const [seenFlag, token, plansFlag] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          AsyncStorage.getItem('authToken'),
            AsyncStorage.getItem('hasSeenPlans'),
          preloadAssets(),
        ]);
        setHasSeen(seenFlag === 'true');
        setHasToken(Boolean(token));
          setHasSeenPlans(plansFlag === 'true');
      } finally {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_LOADING_MS - elapsed);
        t = setTimeout(() => setReady(true), wait);
      }
    })();

    return () => {
      if (t !== undefined && t !== null) {
        clearTimeout(t as any);
      }
    };
  }, [preloadAssets]);

    if (!ready || hasSeen === null || hasToken === null || hasSeenPlans === null) return <LoadingScreen />;

  // Routing:
  // - If logged in: go home tabs
  // - Else if already saw onboarding: go to login
  // - Else: show onboarding
  const target = hasToken
      ? (hasSeenPlans ? '/(tabs)' : '/choose-plan')
    : hasSeen
    ? '/onboarding'
    : '/login';

  return <Redirect href={target as any} />;
}