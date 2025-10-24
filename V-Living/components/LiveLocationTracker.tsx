import { Ionicons } from '@expo/vector-icons';
import * as SignalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { getRoute } from '../apis/directions';
import { calculateDistance as apiCalculateDistance, trackLocationByBooking, updateCurrentLocation } from '../apis/locations';

type LatLng = { latitude: number; longitude: number };

type DistancePayload = {
  bookingId: string | number;
  distanceMeters: number;
  etaSeconds?: number;
};

type LocationUpdatedPayload = {
  bookingId: string | number;
  userId: number | string;
  latitude: number;
  longitude: number;
  updatedAt?: string;
};

export type LiveLocationTrackerProps = {
  bookingId: string | number;
  // The current logged-in user's ID (used by the server to route updates). If not provided, we will try fetching from storage or user info API if available.
  userId?: number | string;
  // Optional label for the other user (e.g., 'Landlord' or 'Renter')
  otherUserLabel?: string;
  // Optional label for current user marker
  selfLabel?: string;
  // Estimated speed in m/s to compute rough ETA if server ETA not provided
  speedMetersPerSecond?: number;
  // Optional hub path (default: '/locationHub')
  hubPath?: string;
  // Optional base URL specifically for SignalR (use if your REST base has '/api' but hubs don't)
  signalRBaseUrl?: string;
  // Optional full hub URL override (e.g., 'https://example.com/locationHub')
  hubUrlOverride?: string;
  // Initial map region; if not set, it will auto-fit to markers when available
  initialRegion?: Region;
  // Optional meeting location for REST distance calculation fallback
  meetingLatitude?: number;
  meetingLongitude?: number;
  meetingLabel?: string;
  // Enable or disable SignalR; if disabled or connection fails, REST-only mode is used
  enableSignalR?: boolean;
};

function resolveBaseUrl(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  const extra = (Constants.expoConfig?.extra as any) || ((Constants as any).manifest?.extra as any);
  const fromExtra = extra?.API_BASE_URL || extra?.apiBaseUrl;
  return fromEnv || fromExtra || undefined;
}

function resolveSignalRBaseUrl(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_SIGNALR_BASE_URL as string | undefined;
  const extra = (Constants.expoConfig?.extra as any) || ((Constants as any).manifest?.extra as any);
  const fromExtra = extra?.SIGNALR_BASE_URL || extra?.signalRBaseUrl;
  return fromEnv || fromExtra || undefined;
}

// Normalize localhost for Android emulator (10.0.2.2) and general platforms
function normalizeBaseUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      if (Platform.OS === 'android') {
        u.hostname = '10.0.2.2'; // Android emulator maps host machine to 10.0.2.2
      }
      // iOS simulator can use localhost; leave unchanged
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

function haversine(a: LatLng | undefined, b: LatLng | undefined): number | undefined {
  if (!a || !b) return undefined;
  const R = 6371000; // meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export default function LiveLocationTracker({
  bookingId,
  userId: userIdProp,
  otherUserLabel = 'Other user',
  selfLabel = 'You',
  speedMetersPerSecond = 1.4,
  hubPath = '/locationHub',
  signalRBaseUrl,
  hubUrlOverride,
  initialRegion,
  meetingLatitude,
  meetingLongitude,
  meetingLabel = 'Meeting',
  enableSignalR = true,
}: LiveLocationTrackerProps) {
  const baseUrl = normalizeBaseUrl(resolveBaseUrl());
  const srBaseUrl = normalizeBaseUrl(signalRBaseUrl || resolveSignalRBaseUrl() || baseUrl);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [selfLoc, setSelfLoc] = useState<LatLng | undefined>(undefined);
  const [otherLoc, setOtherLoc] = useState<LatLng | undefined>(undefined);
  const [distanceMeters, setDistanceMeters] = useState<number | undefined>(undefined);
  const [etaSeconds, setEtaSeconds] = useState<number | undefined>(undefined);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | undefined>(undefined);
  const [connError, setConnError] = useState<string | undefined>(undefined);
  const [distanceSource, setDistanceSource] = useState<'users' | 'meeting' | undefined>(undefined);

  const connectionRef = useRef<SignalR.HubConnection | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<number | string | undefined>(userIdProp);
  const lastRouteOriginRef = useRef<LatLng | undefined>(undefined);
  const lastRouteAtRef = useRef<number>(0);
  const [routeCoords, setRouteCoords] = useState<LatLng[] | undefined>(undefined);
  const [routeProvider, setRouteProvider] = useState<'google' | 'osrm' | undefined>(undefined);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [heading, setHeading] = useState<number | undefined>(undefined);

  // Check if RNGS native module is available.
  // In Expo Go, native modules from react-native-geolocation-service are not available, so force false.
  const isRNGSAvailable = () => {
    const ownership = (Constants as any)?.appOwnership;
    if (ownership === 'expo') return false; // Expo Go
    return typeof (Geolocation as any)?.getCurrentPosition === 'function';
  };

  // Ask for location permission using expo-location (works in Expo Go and builds)
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setPermissionGranted(granted);
      return granted;
    } catch (e) {
      console.warn('Permission request failed', e);
      setPermissionGranted(false);
      return false;
    }
  }, []);

  // Build and start SignalR connection
  const startConnection = useCallback(async () => {
    if (!enableSignalR) return; // REST-only mode
    if (!srBaseUrl && !hubUrlOverride) {
      console.warn('[LiveLocation] Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL.');
      return;
    }
    if (connectionRef.current) return; // already

    const token = await AsyncStorage.getItem('authToken');
    if (!userIdRef.current) {
      // Try to read a stored userId if your app stores it; else rely on prop
      const stored = await AsyncStorage.getItem('userId');
      userIdRef.current = stored || userIdRef.current;
    }

    const qs = userIdRef.current ? `?userId=${encodeURIComponent(String(userIdRef.current))}` : '';
    const hubUrl = hubUrlOverride && /^https?:\/\//i.test(hubUrlOverride)
      ? `${hubUrlOverride}${qs}`
      : `${(srBaseUrl || '').replace(/\/+$/, '')}${hubPath.startsWith('/') ? hubPath : `/${hubPath}`}${qs}`;

    console.log('[LiveLocation] Connecting to hub:', hubUrl);

    const buildConnection = (transport?: SignalR.HttpTransportType) => {
      const builder = new SignalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => (token || ''),
          ...(transport ? { transport } : {}),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(SignalR.LogLevel.Information);
      return builder.build();
    };

    let connection = buildConnection();

    connection.onreconnecting((err) => {
      setConnected(false);
      if (err) console.warn('[LiveLocation] reconnecting due to', err?.message || err);
    });
    connection.onclose((err) => {
      setConnected(false);
      if (err) console.warn('[LiveLocation] connection closed', err?.message || err);
    });
    connection.onreconnected(() => setConnected(true));

    // Receive other user's location updates
    connection.on('LocationUpdated', (payload: LocationUpdatedPayload) => {
      if (!payload) return;
      setOtherLoc({ latitude: payload.latitude, longitude: payload.longitude });
      setLastUpdatedAt(payload.updatedAt);

      // If server doesn't push distance separately, compute locally too
      const d = haversine(selfLoc, { latitude: payload.latitude, longitude: payload.longitude });
      if (typeof d === 'number') {
        setDistanceMeters(d);
        if (!etaSeconds) setEtaSeconds(Math.round(d / speedMetersPerSecond));
      }
    });

    // Receive distance/ETA updates from server
    connection.on('DistanceBetweenUsers', (payload: DistancePayload) => {
      if (!payload) return;
      setDistanceMeters(payload.distanceMeters);
      if (typeof payload.etaSeconds === 'number') setEtaSeconds(payload.etaSeconds);
    });

    setConnecting(true);
    try {
      await connection.start();
      setConnected(true);
      connectionRef.current = connection;
      // Join tracking session
      await connection.invoke('StartLocationTracking', bookingId);
      setConnError(undefined);
    } catch (err) {
      console.error('SignalR start error:', err);
      setConnError((err as any)?.message || 'Failed to connect');
      // Try fallback to LongPolling if WebSocket fails or negotiation issues occur
      try {
        await connection.stop();
      } catch {}
      connectionRef.current = null;

      try {
        console.warn('[LiveLocation] Retrying connection with LongPolling transport...');
        connection = buildConnection(SignalR.HttpTransportType.LongPolling);
        connection.onreconnecting((e) => setConnected(false));
        connection.onreconnected(() => setConnected(true));
        connection.onclose(() => setConnected(false));
        // Re-register handlers
        connection.on('LocationUpdated', (payload: LocationUpdatedPayload) => {
          if (!payload) return;
          setOtherLoc({ latitude: payload.latitude, longitude: payload.longitude });
          setLastUpdatedAt(payload.updatedAt);
          const d = haversine(selfLoc, { latitude: payload.latitude, longitude: payload.longitude });
          if (typeof d === 'number') {
            setDistanceMeters(d);
            if (!etaSeconds) setEtaSeconds(Math.round(d / speedMetersPerSecond));
          }
        });
        connection.on('DistanceBetweenUsers', (payload: DistancePayload) => {
          if (!payload) return;
          setDistanceMeters(payload.distanceMeters);
          if (typeof payload.etaSeconds === 'number') setEtaSeconds(payload.etaSeconds);
        });
        await connection.start();
        setConnected(true);
        connectionRef.current = connection;
        await connection.invoke('StartLocationTracking', bookingId);
        setConnError(undefined);
      } catch (err2) {
        console.error('SignalR LongPolling fallback failed:', err2);
        setConnError((err2 as any)?.message || 'Failed to connect (fallback)');
        try { await connection.stop(); } catch {}
        connectionRef.current = null;
      }
    } finally {
      setConnecting(false);
    }
  }, [bookingId, enableSignalR, etaSeconds, hubPath, hubUrlOverride, selfLoc, speedMetersPerSecond, srBaseUrl]);

  const stopConnection = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return;
    try {
      await conn.invoke('StopLocationTracking', bookingId);
    } catch {
      // ignore
    }
    try {
      await conn.stop();
    } catch {}
    connectionRef.current = null;
  }, [bookingId]);

  // Helper to send updates to server via SignalR if connected; otherwise fallback to REST
  const sendLocationUpdate = useCallback(
    async (coords: LatLng) => {
      const conn = connectionRef.current;
      if (conn && connected) {
        try {
          await conn.invoke('UpdateLocation', bookingId, coords.latitude, coords.longitude);
        } catch {
          // fall back to REST on failure
          try { await updateCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude }); } catch {}
          try { await trackLocationByBooking(bookingId, { latitude: coords.latitude, longitude: coords.longitude }); } catch {}
        }
      } else {
        // REST fallback
        try { await updateCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude }); } catch {}
        try { await trackLocationByBooking(bookingId, { latitude: coords.latitude, longitude: coords.longitude }); } catch {}
      }

      // Compute distance/ETA: prefer other user's location if known; else meeting location if provided
      try {
        if (otherLoc) {
          const res = await apiCalculateDistance({
            startLatitude: coords.latitude,
            startLongitude: coords.longitude,
            endLatitude: otherLoc.latitude,
            endLongitude: otherLoc.longitude,
          });
          setDistanceMeters(res.distanceKm * 1000);
          setEtaSeconds(Math.round(res.durationMinutes * 60));
          setDistanceSource('users');
        } else if (
          typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number'
        ) {
          const res = await apiCalculateDistance({
            startLatitude: coords.latitude,
            startLongitude: coords.longitude,
            endLatitude: meetingLatitude,
            endLongitude: meetingLongitude,
          });
          setDistanceMeters(res.distanceKm * 1000);
          setEtaSeconds(Math.round(res.durationMinutes * 60));
          setDistanceSource('meeting');
        }
      } catch {
        // Ignore REST distance errors; local haversine remains as fallback
        if (otherLoc) {
          const d = haversine(coords, otherLoc);
          if (typeof d === 'number') {
            setDistanceMeters(d);
            setEtaSeconds(Math.round(d / speedMetersPerSecond));
            setDistanceSource('users');
          }
        } else if (
          typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number'
        ) {
          const d = haversine(coords, { latitude: meetingLatitude, longitude: meetingLongitude });
          if (typeof d === 'number') {
            setDistanceMeters(d);
            setEtaSeconds(Math.round(d / speedMetersPerSecond));
            setDistanceSource('meeting');
          }
        }
      }
    },
    [bookingId, connected, meetingLatitude, meetingLongitude, otherLoc, speedMetersPerSecond]
  );

  // Watch user location changes, apply 10m threshold, push update every 30s or when moved >10m
  const startWatchingLocation = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;

    // Initial getCurrentPosition to set map quickly
    if (isRNGSAvailable()) {
      Geolocation.getCurrentPosition(
        (pos: GeoPosition) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setSelfLoc(coords);
          if (typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading)) {
            setHeading(pos.coords.heading);
          }
          sendLocationUpdate(coords);
        },
        (error) => console.warn('getCurrentPosition error', error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    } else {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setSelfLoc(coords);
        if (typeof (pos as any)?.coords?.heading === 'number' && !isNaN((pos as any).coords.heading)) {
          setHeading((pos as any).coords.heading);
        }
        sendLocationUpdate(coords);
      } catch (error) {
        console.warn('Location.getCurrentPositionAsync error', error);
      }
    }

    // Continuous watch with distance filter
    if (isRNGSAvailable()) {
      const watchId = Geolocation.watchPosition(
        (pos: GeoPosition) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setSelfLoc((prev) => {
            const moved = prev ? (haversine(prev, coords) || 0) : Infinity;
            if (moved > 10) {
              sendLocationUpdate(coords);
              return coords;
            }
            return prev || coords;
          });
          if (typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading)) {
            setHeading(pos.coords.heading);
          }
        },
        (error) => console.warn('watchPosition error', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 10000,
          fastestInterval: 5000,
          showsBackgroundLocationIndicator: false,
          useSignificantChanges: false,
        }
      );
      watchIdRef.current = watchId as unknown as number;
    } else {
      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (pos) => {
            const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setSelfLoc((prev) => {
              const moved = prev ? (haversine(prev, coords) || 0) : Infinity;
              if (moved > 10) {
                sendLocationUpdate(coords);
                return coords;
              }
              return prev || coords;
            });
            if (typeof (pos as any)?.coords?.heading === 'number' && !isNaN((pos as any).coords.heading)) {
              setHeading((pos as any).coords.heading);
            }
          }
        );
        // Store subscription for cleanup
        (watchIdRef as any).current = sub as any;
      } catch (error) {
        console.warn('Location.watchPositionAsync error', error);
      }
    }

    // Fallback interval to ensure an update at least every 30s
    intervalRef.current = setInterval(() => {
      if (selfLoc) {
        sendLocationUpdate(selfLoc);
      }
    }, 30000);
  }, [requestPermission, selfLoc, sendLocationUpdate]);

  // Compute road route to destination (prefer meeting location; fallback to other user's location)
  const rerouteIfNeeded = useCallback(async (origin?: LatLng) => {
    const src = origin || selfLoc;
    const dest: LatLng | undefined = (typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number')
      ? { latitude: meetingLatitude, longitude: meetingLongitude }
      : (otherLoc ? { latitude: otherLoc.latitude, longitude: otherLoc.longitude } : undefined);
    if (!src || !dest) return;

    const last = lastRouteOriginRef.current;
    const now = Date.now();
    const movedSinceLast = last ? (haversine(last, src) || 0) : Infinity;
    const elapsed = now - lastRouteAtRef.current;
    // Recalculate if moved > 30m or > 20s since last route
    if (movedSinceLast < 30 && elapsed < 20000 && routeCoords && routeCoords.length > 0) return;

    try {
      setRouteLoading(true);
      const route = await getRoute(src, dest);
      setRouteCoords(route.coordinates);
      setRouteProvider(route.provider);
      setDistanceMeters(route.distanceMeters);
      setEtaSeconds(route.durationSeconds);
      lastRouteOriginRef.current = src;
      lastRouteAtRef.current = now;
      // Fit map to route once when first obtained
      if (mapRef.current && route.coordinates.length > 1) {
        try {
          mapRef.current.fitToCoordinates(route.coordinates, {
            edgePadding: { top: 100, right: 60, bottom: 200, left: 60 },
            animated: true,
          });
        } catch {}
      }
    } catch (e) {
      // Keep previous route or fallback to straight line metrics already handled elsewhere
      console.warn('[LiveLocation] getRoute failed:', (e as any)?.message || e);
    } finally {
      setRouteLoading(false);
    }
  }, [meetingLatitude, meetingLongitude, otherLoc, routeCoords, selfLoc]);

  const stopWatchingLocation = useCallback(() => {
    // Clear RNGS watch
    if (typeof watchIdRef.current === 'number') {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Clear expo-location subscription
    const sub: any = (watchIdRef as any).current;
    if (sub && typeof sub.remove === 'function') {
      try { sub.remove(); } catch {}
      (watchIdRef as any).current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (historyPollRef.current) {
      clearInterval(historyPollRef.current);
      historyPollRef.current = null;
    }
  }, []);

  // Lifecycle: start connection and location watching on mount; cleanup on unmount
  useEffect(() => {
    startConnection();
    startWatchingLocation();

    // When running in REST-only mode (no SignalR), poll history to update other user's location
    if (!enableSignalR) {
      const poll = async () => {
        try {
          const res: any = await (await import('../apis/locations')).getTrackingHistory(bookingId);
          const list: any[] = Array.isArray(res) ? res : (res?.points || res?.items || []);
          if (!Array.isArray(list) || list.length === 0) return;
          // Pick latest point from a different user than self
          const selfId = userIdRef.current != null ? String(userIdRef.current) : undefined;
          const latestByUser: Record<string, any> = {};
          for (const p of list) {
            const uid = p?.userId != null ? String(p.userId) : 'unknown';
            const ts = p?.timestamp ? new Date(p.timestamp).getTime() : 0;
            if (!latestByUser[uid] || (latestByUser[uid].ts || 0) < ts) {
              latestByUser[uid] = { ...p, ts };
            }
          }
          const otherEntry = Object.entries(latestByUser).find(([uid]) => (selfId ? uid !== selfId : uid !== 'unknown'))?.[1] as any;
          if (otherEntry?.latitude && otherEntry?.longitude) {
            const coords = { latitude: Number(otherEntry.latitude), longitude: Number(otherEntry.longitude) } as LatLng;
            setOtherLoc(coords);
            setLastUpdatedAt(otherEntry?.timestamp);
            // Compute distance using REST first
            if (selfLoc) {
              try {
                const resDist = await apiCalculateDistance({
                  startLatitude: selfLoc.latitude,
                  startLongitude: selfLoc.longitude,
                  endLatitude: coords.latitude,
                  endLongitude: coords.longitude,
                });
                setDistanceMeters(resDist.distanceKm * 1000);
                setEtaSeconds(Math.round(resDist.durationMinutes * 60));
                setDistanceSource('users');
              } catch {
                const d = haversine(selfLoc, coords);
                if (typeof d === 'number') {
                  setDistanceMeters(d);
                  setEtaSeconds(Math.round(d / speedMetersPerSecond));
                  setDistanceSource('users');
                }
              }
            }
          }
        } catch {
          // ignore polling errors to avoid console noise
        }
      };
      // initial run and start interval every 15s
      poll();
      historyPollRef.current = setInterval(poll, 15000);
    }

    return () => {
      stopWatchingLocation();
      stopConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-compute ETA if server doesn't provide one
  useEffect(() => {
    if (typeof distanceMeters === 'number' && (etaSeconds === undefined || etaSeconds === null)) {
      setEtaSeconds(Math.round(distanceMeters / speedMetersPerSecond));
    }
  }, [distanceMeters, etaSeconds, speedMetersPerSecond]);

  // Trigger routing when we have a self location and a destination
  useEffect(() => {
    rerouteIfNeeded();
  }, [selfLoc, meetingLatitude, meetingLongitude, otherLoc, rerouteIfNeeded]);

  // Animate camera to follow user
  useEffect(() => {
    if (mapRef.current && selfLoc) {
      try {
        mapRef.current.animateCamera({ center: selfLoc, heading, pitch: 45 }, { duration: 600 });
      } catch {}
    }
  }, [selfLoc, heading]);

  const region: Region | undefined = useMemo(() => {
    if (initialRegion) return initialRegion;
    if (selfLoc && otherLoc) {
      const midLat = (selfLoc.latitude + otherLoc.latitude) / 2;
      const midLng = (selfLoc.longitude + otherLoc.longitude) / 2;
      const latDelta = Math.max(Math.abs(selfLoc.latitude - otherLoc.latitude), 0.01) * 2.5;
      const lngDelta = Math.max(Math.abs(selfLoc.longitude - otherLoc.longitude), 0.01) * 2.5;
      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }
    if (selfLoc && typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number') {
      const b = { latitude: meetingLatitude, longitude: meetingLongitude };
      const midLat = (selfLoc.latitude + b.latitude) / 2;
      const midLng = (selfLoc.longitude + b.longitude) / 2;
      const latDelta = Math.max(Math.abs(selfLoc.latitude - b.latitude), 0.01) * 2.5;
      const lngDelta = Math.max(Math.abs(selfLoc.longitude - b.longitude), 0.01) * 2.5;
      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }
    if (selfLoc) {
      return {
        latitude: selfLoc.latitude,
        longitude: selfLoc.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return undefined;
  }, [initialRegion, meetingLatitude, meetingLongitude, otherLoc, selfLoc]);

  const distanceText = useMemo(() => {
    if (distanceMeters == null) return '—';
    if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }, [distanceMeters]);

  const etaText = useMemo(() => {
    if (etaSeconds == null) return '—';
    const m = Math.floor(etaSeconds / 60);
    const s = etaSeconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }, [etaSeconds]);

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          style={styles.mapContainer}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          region={region}
          showsUserLocation={false}
          toolbarEnabled={false}
          ref={(ref) => { mapRef.current = ref; }}
        >
          {selfLoc && (
            <Marker coordinate={selfLoc} title={selfLabel} pinColor="#2b8a3e" />
          )}
          {typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number' && (
            <Marker coordinate={{ latitude: meetingLatitude, longitude: meetingLongitude }} title={meetingLabel} pinColor="#e11d48" />
          )}
          {otherLoc && (
            <Marker coordinate={otherLoc} title={otherUserLabel} pinColor="#1971c2" />
          )}
          {/* Render routed polyline when available; fallback to straight line only if no route */}
          {routeCoords && routeCoords.length > 1 ? (
            <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#1a73e8" />
          ) : selfLoc && typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number' ? (
            <Polyline coordinates={[selfLoc, { latitude: meetingLatitude, longitude: meetingLongitude }]} strokeWidth={3} strokeColor="#e11d48" />
          ) : selfLoc && otherLoc ? (
            <Polyline coordinates={[selfLoc, otherLoc]} strokeWidth={3} strokeColor="#555" />
          ) : null}
        </MapView>
      )}

      {/* Floating navigate button */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.fab}
          onPress={async () => {
            // Determine destination: meeting point preferred; else other user's latest location
            const dest = (typeof meetingLatitude === 'number' && typeof meetingLongitude === 'number')
              ? { latitude: meetingLatitude, longitude: meetingLongitude }
              : (otherLoc ? { latitude: otherLoc.latitude, longitude: otherLoc.longitude } : undefined);
            if (!dest) {
              Alert.alert('Chưa có điểm đến', 'Chưa có tọa độ điểm hẹn hoặc đối tác.');
              return;
            }
            const origin = selfLoc;

            try {
              if (Platform.OS === 'android') {
                // Try Google Maps turn-by-turn intent first
                const gnav = `google.navigation:q=${dest.latitude},${dest.longitude}&mode=d`;
                const canGnav = await Linking.canOpenURL(gnav);
                if (canGnav) {
                  await Linking.openURL(gnav);
                  return;
                }
              }

              // Prefer Google Maps URL (works cross-platform if app available, else opens browser)
              const base = 'https://www.google.com/maps/dir/?api=1';
              const params = new URLSearchParams();
              params.set('destination', `${dest.latitude},${dest.longitude}`);
              if (origin) params.set('origin', `${origin.latitude},${origin.longitude}`);
              params.set('travelmode', 'driving');
              const gUrl = `${base}&${params.toString()}`;

              const canGoogle = await Linking.canOpenURL(gUrl);
              if (canGoogle) {
                await Linking.openURL(gUrl);
                return;
              }

              // iOS fallback to Apple Maps
              if (Platform.OS === 'ios') {
                const apple = `http://maps.apple.com/?daddr=${dest.latitude},${dest.longitude}&dirflg=d`;
                const canApple = await Linking.canOpenURL(apple);
                if (canApple) {
                  await Linking.openURL(apple);
                  return;
                }
              }

              // Final fallback: plain https open in browser
              await Linking.openURL(gUrl);
            } catch (e) {
              Alert.alert('Không thể mở chỉ đường', (e as any)?.message || 'Lỗi không xác định');
            }
          }}
        >
          <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.fabText}>Dẫn đường</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {distanceSource === 'meeting' ? 'Đến căn hộ' : 'Khoảng cách'}: <Text style={styles.bold}>{distanceText}</Text> | ETA: <Text style={styles.bold}>{etaText}</Text>
        </Text>
        <Text style={styles.subText}>
          Tuyến đường: {routeLoading ? 'đang tính…' : routeProvider ? (routeProvider === 'google' ? 'Google' : 'OSRM') : '—'} | Kết nối: {connecting ? 'đang kết nối…' : connected ? 'đã kết nối' : 'REST'}
        </Text>
        {lastUpdatedAt && (
          <Text style={styles.subText}>Last update: {new Date(lastUpdatedAt).toLocaleTimeString()}</Text>
        )}
        {!permissionGranted && (
          <Text style={[styles.subText, { color: '#b02a37' }]}>Location permission not granted</Text>
        )}
        {connError && (
          <Text style={[styles.subText, { color: '#b02a37' }]}>Connection error: {connError}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fabWrap: {
    position: 'absolute',
    right: 16,
    bottom: 96, // above infobar
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: { color: '#fff', fontWeight: '700' },
  infoBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoText: { fontSize: 15, color: '#222' },
  bold: { fontWeight: '700' },
  subText: { marginTop: 2, fontSize: 12, color: '#555' },
});
