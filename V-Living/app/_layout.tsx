import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FavoritesProvider } from './favorites-context';
import { LocationProvider } from './location-context';
import { RecentViewedProvider } from './recent-viewed-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import Toast from '@/components/Toast';
import { onGlobalToast } from '@/utils/toast';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info'>('info');

  React.useEffect(() => {
    const off = onGlobalToast(({ message, type }) => {
      setToastMessage(message);
      setToastType(type);
      setToastVisible(true);
    });
    return off;
  }, []);

  return (

    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
      <FavoritesProvider>
      <LocationProvider>
      <RecentViewedProvider>
      <Stack>
        {/* hide header for the root index (loading/redirect) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="location-selection" options={{ headerShown: false }} />
        <Stack.Screen name="location-map" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="choose-plan" options={{ headerShown: false }} />
        <Stack.Screen name="subscribe" options={{ headerShown: false }} />
        <Stack.Screen name="payment-webview" options={{ headerShown: false }} />
        <Stack.Screen name="detail" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        {/* Do not declare a `messages` screen here; its children (messages/index, messages/[id]) are routed directly */}
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="create-new-password" options={{ headerShown: false }} />
        <Stack.Screen name="password-changed-success" options={{ headerShown: false }} />
        <Stack.Screen name="popular" options={{ headerShown: false }} />
  
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      </RecentViewedProvider>
      </LocationProvider>
      </FavoritesProvider>
      </SafeAreaProvider>
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
