import { api } from '@/lib/api';

export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
}

export interface CalculateDistancePayload {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
}

export interface CalculateDistanceResponse {
  distanceInMeters: number;
  distanceInKm: number;
}

export async function updateMeetPoint(payload: UpdateLocationPayload) {
  return api.post<void>('/api/Location/update', payload, true);
}

export async function calculateDistance(payload: CalculateDistancePayload) {
  return api.post<CalculateDistanceResponse>('/api/Location/calculate-distance', payload, true);
}


