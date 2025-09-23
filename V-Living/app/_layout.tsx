import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FavoritesProvider } from './favorites-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
      <FavoritesProvider>
      <Stack>
        {/* hide header for the root index (loading/redirect) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="popular" options={{ headerShown: false }} />
  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
  <Stack.Screen name="choose-plan" options={{ headerShown: false }} />
  <Stack.Screen name="detail" options={{ headerShown: false }} />
  <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
  <Stack.Screen name="verify-email" options={{ headerShown: false }} />
  <Stack.Screen name="create-new-password" options={{ headerShown: false }} />
  <Stack.Screen name="password-changed-success" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      </FavoritesProvider>
      </SafeAreaProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
