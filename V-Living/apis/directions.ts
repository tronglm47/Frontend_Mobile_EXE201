import Constants from 'expo-constants';

export type LatLng = { latitude: number; longitude: number };

export type RouteStep = {
  instruction?: string; // human-readable (may contain HTML if from Google)
  maneuver?: string;    // e.g., turn-left, turn-right
  distanceMeters?: number;
  durationSeconds?: number;
};

export type RouteResult = {
  coordinates: LatLng[];         // decoded polyline along roads
  distanceMeters: number;        // total
  durationSeconds: number;       // total
  steps?: RouteStep[];
  provider: 'google' | 'osrm';
};

function getGoogleKey(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  const extra = (Constants.expoConfig?.extra as any) || ((Constants as any).manifest?.extra as any);
  const fromExtra = extra?.GOOGLE_MAPS_API_KEY || extra?.googleMapsApiKey;
  return fromEnv || fromExtra || undefined;
}

// Polyline decoder (Google polyline algorithm). Precision 1e5 by default; set precision=1e6 for OSRM polyline6
function decodePolyline(polyline: string, precision = 5): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  const factor = Math.pow(10, precision);

  while (index < polyline.length) {
    let result = 0, shift = 0, byte = 0;
    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0; shift = 0;
    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push({ latitude: lat / factor, longitude: lng / factor });
  }
  return coordinates;
}

async function fetchGoogleDirections(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  const key = getGoogleKey();
  if (!key) throw new Error('Missing Google Maps API key');
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
  url.searchParams.set('destination', `${destination.latitude},${destination.longitude}`);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('key', key);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) {
    const msg = data.error_message || data.status || 'No route';
    throw new Error(`Google Directions error: ${msg}`);
  }
  const route = data.routes[0];
  const leg = route.legs?.[0];
  const overview = route.overview_polyline?.points as string;
  const coords = overview ? decodePolyline(overview, 5) : [];
  const steps: RouteStep[] | undefined = Array.isArray(leg?.steps)
    ? leg.steps.map((s: any) => ({
        instruction: s.html_instructions,
        maneuver: s.maneuver,
        distanceMeters: s.distance?.value,
        durationSeconds: s.duration?.value,
      }))
    : undefined;

  return {
    coordinates: coords,
    distanceMeters: leg?.distance?.value ?? route?.legs?.reduce((a: number, l: any) => a + (l.distance?.value || 0), 0) ?? 0,
    durationSeconds: leg?.duration?.value ?? route?.legs?.reduce((a: number, l: any) => a + (l.duration?.value || 0), 0) ?? 0,
    steps,
    provider: 'google',
  };
}

async function fetchOsrmRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  // Note: Public OSRM server for demo/testing. Do not use for production/SLA.
  const base = 'https://router.project-osrm.org';
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${base}/route/v1/driving/${coords}?overview=full&geometries=polyline6&steps=true&alternatives=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data?.routes?.length) throw new Error('OSRM returned no route');
  const route = data.routes[0];
  const geometry = route.geometry as string; // polyline6
  const decoded = geometry ? decodePolyline(geometry, 6) : [];
  const steps: RouteStep[] | undefined = Array.isArray(route?.legs?.[0]?.steps)
    ? route.legs[0].steps.map((s: any) => ({
        instruction: s.name,
        maneuver: s.maneuver?.type,
        distanceMeters: s.distance,
        durationSeconds: s.duration ? Math.round(s.duration) : undefined,
      }))
    : undefined;
  return {
    coordinates: decoded,
    distanceMeters: Math.round(route.distance ?? 0),
    durationSeconds: Math.round(route.duration ?? 0),
    steps,
    provider: 'osrm',
  };
}

// Try Google first when key is available, else OSRM. Caller can catch and fallback.
export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  const key = getGoogleKey();
  if (key) {
    try {
      return await fetchGoogleDirections(origin, destination);
    } catch (e) {
      // Fallthrough to OSRM on error
      console.warn('[Directions] Google failed, falling back to OSRM:', (e as any)?.message || e);
    }
  }
  return fetchOsrmRoute(origin, destination);
}

export function formatEta(seconds?: number): string | undefined {
  if (seconds == null) return undefined;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
