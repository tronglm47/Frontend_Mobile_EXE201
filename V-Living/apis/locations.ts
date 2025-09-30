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


