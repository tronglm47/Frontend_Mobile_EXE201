import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

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

// Some backends expect only a token (OTP code) for email verification
export type VerifyEmailBody = {
  token: string;
};

export type UserInfo = {
  userID: number;
  username: string;
  email: string;
  role?: string;
  fullName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
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
    // Gọi API logout (giữ nguyên pattern đã dùng ở các API khác)
    await api.post('Auth/logout');
  } catch (error) {
    console.warn('Logout API call failed:', error);
    // Tiếp tục xóa token local dù API call thất bại
  } finally {
    // Xóa tất cả dữ liệu auth khỏi AsyncStorage
    await AsyncStorage.multiRemove([
      'authToken',
      'refreshToken', 
      'tokenExpiresAt',
      'hasSeenPlans',
      'selectedLocation'
    ]);
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

// Verify email with code sent to user's mailbox
export async function verifyEmail(body: VerifyEmailBody): Promise<void> {
  // Sử dụng cùng convention với các endpoint khác để tránh /api bị lặp
  await api.post('Auth/verify-email', body);
}

// Resend verification code to email
export async function resendVerification(email: string): Promise<void> {
  await api.post('Auth/resend-verification', { email });
}

// Get current logged-in user info
export async function getUserInfo(): Promise<UserInfo> {
  const data = await api.get<UserInfo>('Auth/userinfo', true);
  return data;
}
