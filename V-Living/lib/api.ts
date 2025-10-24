import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Alert, LogBox } from 'react-native';
import { handleUnauthorizedError } from '../utils/auth-utils';

function resolveBaseUrl(): string | undefined {
  // Prefer EXPO_PUBLIC_* at runtime (works in all builds)
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Fallback to app.json extra (dev/preview and classic builds)
  const extra =
    (Constants.expoConfig?.extra as any) ||
    // older manifests on some channels
    ((Constants as any).manifest?.extra as any);

  const fromExtra = extra?.API_BASE_URL || extra?.apiBaseUrl;

  return (fromEnv as string) || (fromExtra as string) || undefined;
}

const baseUrl = resolveBaseUrl();

if (!baseUrl) {
   
  console.warn('[API] Missing API_BASE_URL. Set EXPO_PUBLIC_API_BASE_URL in .env or extra.API_BASE_URL in app.json');
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    auth?: boolean;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  // Suppress noisy yellow box and console warnings globally (optional)
  try {
    LogBox.ignoreLogs([
      '[LocationAPI] getTrackingHistory',
      'Warning: ...',
    ]);
  } catch {}
  const root = (baseUrl || '').replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  const url = path.startsWith('http') ? path : `${root}/${rel}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.auth) {
    const token = await AsyncStorage.getItem('authToken');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text as any;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.title)) || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.statusCode = res.status; // Add statusCode for compatibility
    err.data = data;
    err.errors = (data && (data.errors || data.modelState)) || undefined;
    if (res.status === 401) {
      try {
        Alert.alert('Vui lòng đăng nhập lại', 'Phiên đăng nhập đã hết hạn');
      } catch {}
      try {
        await handleUnauthorizedError();
      } catch {}
    }
    throw err;
  }

  return data as T;
}

export const api = {
  get:  <T>(path: string, auth = false) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: any, auth = false) => request<T>(path, { method: 'POST', body, auth }),
  put:  <T>(path: string, body?: any, auth = false) => request<T>(path, { method: 'PUT', body, auth }),
  del:  <T>(path: string, auth = false) => request<T>(path, { method: 'DELETE', auth }),
};
