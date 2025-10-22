// Free geocoding/search via OpenStreetMap Nominatim
export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface PlaceResult {
  place_id: string;
  description: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
}

const BASE_URL = 'https://nominatim.openstreetmap.org';
const defaultHeaders = { 'User-Agent': 'V-Living/1.0 (nominatim@v-living.app)' } as const;

export async function searchPlaces(query: string, countryCodes = 'vn'): Promise<PlaceResult[]> {
  if (!query.trim()) return [];
  const url = `${BASE_URL}/search?format=json&limit=8&addressdetails=1&countrycodes=${countryCodes}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: defaultHeaders });
  const data: NominatimPlace[] = await res.json();
  return data.map(p => ({
    place_id: String(p.place_id),
    description: p.display_name.split(',')[0],
    formatted_address: p.display_name,
    latitude: parseFloat(p.lat),
    longitude: parseFloat(p.lon)
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `${BASE_URL}/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: defaultHeaders });
  const data = await res.json();
  return data?.display_name ?? null;
}


