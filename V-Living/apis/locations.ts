import { api } from '../utils/api';

export type LocationItem = {
  locationId: number;
  name: string;
  description?: string | null;
  locationType?: string | null;
  locationCode?: string | null;
  fullAddress?: string | null;
  parentLocationId?: number | null;
  level?: number | null;
  isActive?: boolean;
  createdAt?: string;
};

export type LocationsResponse = {
  success: boolean;
  data: LocationItem[];
};

export async function fetchLocations(): Promise<LocationItem[]> {
  const res = await api.get<LocationsResponse>('Location');
  if (!res?.success) return [];
  return Array.isArray(res.data) ? res.data : [];
}

// New REST endpoints for live tracking

export type UpdateLocationBody = { latitude: number; longitude: number };
export async function updateCurrentLocation(body: UpdateLocationBody): Promise<{ success?: boolean; message?: string } | void> {
  // POST /api/Location/update (auth)
  try {
    console.log('[LocationAPI] updateCurrentLocation -> request', body);
    const res = await api.post<{ success?: boolean; message?: string }>('Location/update', body, true);
    console.log('[LocationAPI] updateCurrentLocation -> response', res);
    return res;
  } catch (e) {
    console.error('[LocationAPI] updateCurrentLocation -> error', e);
    throw e;
  }
}

export type CalculateDistanceBody = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};
export type CalculateDistanceResponse = {
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
};
export async function calculateDistance(body: CalculateDistanceBody): Promise<CalculateDistanceResponse> {
  try {
    console.log('[LocationAPI] calculateDistance -> request', body);
    const res = await api.post<CalculateDistanceResponse>('Location/calculate-distance', body, true);
    console.log('[LocationAPI] calculateDistance -> response', res);
    return res;
  } catch (e) {
    console.error('[LocationAPI] calculateDistance -> error', e);
    throw e;
  }
}

export async function trackLocationByBooking(
  bookingId: number | string,
  body: UpdateLocationBody
): Promise<{ trackingId?: number | string; distanceKm?: number; durationMinutes?: number }> {
  try {
    console.log('[LocationAPI] trackLocationByBooking -> request', { bookingId, ...body });
    const res = await api.post<{ trackingId?: number | string; distanceKm?: number; durationMinutes?: number }>(
      `Location/track/${bookingId}`,
      body,
      true
    );
    console.log('[LocationAPI] trackLocationByBooking -> response', res);
    return res;
  } catch (e) {
    console.error('[LocationAPI] trackLocationByBooking -> error', e);
    throw e;
  }
}

export type TrackingPoint = {
  latitude: number;
  longitude: number;
  timestamp?: string;
  userId?: number | string;
};

export async function getTrackingHistory(
  bookingId: number | string
): Promise<{ points?: TrackingPoint[]; items?: TrackingPoint[] } | TrackingPoint[]> {
  try {
    console.log('[LocationAPI] getTrackingHistory -> request', { bookingId });
    const res = await api.get<any>(`Location/history/${bookingId}`, true);
    const count = Array.isArray(res) ? res.length : (res?.points?.length ?? res?.items?.length ?? 0);
    console.log('[LocationAPI] getTrackingHistory -> response count', count);
    return res;
  } catch (e) {
    console.error('[LocationAPI] getTrackingHistory -> error', e);
    throw e;
  }
}


