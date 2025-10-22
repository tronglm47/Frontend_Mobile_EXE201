LiveLocationTracker component

Props:
- bookingId: string | number (required)
- userId?: number | string (optional); if omitted, component attempts to read 'userId' from AsyncStorage
- otherUserLabel?: string; default 'Other user'
- selfLabel?: string; default 'You'
- speedMetersPerSecond?: number; default 1.4 (walking)
- hubPath?: string; default '/locationHub'
- initialRegion?: react-native-maps Region; optional

Behavior:
- Requests location permission (iOS/Android) using react-native-geolocation-service (builds) or expo-location (Expo Go)
- Optional SignalR: connects to hub at `${EXPO_PUBLIC_API_BASE_URL}${hubPath}?userId=...` (disabled by default in our booking overlay) to receive peer updates
- REST-only mode: posts updates to `Location/update` and `Location/track/{bookingId}` and polls `Location/history/{bookingId}` for peer location when SignalR disabled
- Distance and ETA:
  - If a meeting/apartment coordinate is provided via `meetingLatitude`/`meetingLongitude`, the component fetches a real road route (like Google Maps) and renders it as a Polyline
  - Route provider: Google Directions API when `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set; otherwise OSRM public server is used as a fallback
  - Distance/ETA are taken from the route; rerouting is throttled (when moved >30m or every ~20s)
- On unmount, stops all watchers/timers and SignalR connection if any

Usage example:

import LiveLocationTracker from './components/LiveLocationTracker';

export default function BookingTrackingScreen({ route }) {
  const { bookingId, userId } = route.params;
  return (
    <LiveLocationTracker bookingId={bookingId} userId={userId} otherUserLabel="Landlord" />
  );
}

Notes for Expo/Android:
- Ensure EXPO_PUBLIC_API_BASE_URL is set in .env (e.g., https://api.example.com)
- app.json updated with iOS infoPlist and Android permissions for location
- For turn-by-turn routes like Google Maps:
  - Create an API key in Google Cloud, enable Directions API, and set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in your `.env` (no quotes)
  - If no key is set, the component falls back to OSRM's public demo server for routing (suitable for development/testing only)
  - Provide destination via `meetingLatitude`/`meetingLongitude` props to see the route

