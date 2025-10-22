import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * Handle 401 unauthorized errors by clearing auth token and redirecting to login
 */
export async function handleUnauthorizedError(): Promise<void> {
  try {
    // Clear stored auth token
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
    
    // Redirect to login screen
    router.replace('/(auth)/login');
  } catch (error) {
    // If there's an error clearing storage, still try to redirect
    router.replace('/(auth)/login');
  }
}

/**
 * Check if error is 401 unauthorized
 */
export function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.statusCode === 401;
}
