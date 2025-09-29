import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export type LoginBody = { username: string; password: string };
export type LoginResponse = { 
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  isEmailVerified: boolean;
};

export type RegisterBody = {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  role?: string;
};

export async function login(body: LoginBody): Promise<string> {
  const res = await api.post<LoginResponse>('Auth/login', body);
  const token = res?.accessToken;
  if (!token) throw new Error('Access token missing in response');
  await AsyncStorage.setItem('authToken', token);
  await AsyncStorage.setItem('refreshToken', res?.refreshToken || '');
  await AsyncStorage.setItem('tokenExpiresAt', res?.expiresAt || '');
  return token;
}

export async function register(body: RegisterBody): Promise<void> {
  await api.post('Auth/register', body);
}

export async function logout(): Promise<void> {
  try {
    await api.post('Auth/logout', undefined, true);
  } finally {
    await AsyncStorage.removeItem('authToken');
  }
}

export async function refreshToken(token: string): Promise<string> {
  const res = await api.post<LoginResponse>('Auth/refresh', { token });
  const newToken = res?.accessToken;
  if (!newToken) throw new Error('Refresh failed');
  await AsyncStorage.setItem('authToken', newToken);
  await AsyncStorage.setItem('refreshToken', res?.refreshToken || '');
  await AsyncStorage.setItem('tokenExpiresAt', res?.expiresAt || '');
  return newToken;
}
