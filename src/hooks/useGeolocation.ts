import { useState, useEffect, useCallback, useRef } from 'react';
import { GpsPositionData, GpsStatus } from '../types/moviradar';

export interface GeolocationHookReturn {
  position: GpsPositionData | null;
  status: GpsStatus;
  errorMessage: string | null;
  isWatching: boolean;
  isRealGps: boolean;
  retryGps: () => void;
  centerCoordinates: { lat: number; lng: number };
}

// Ubicación de respaldo predeterminada (Bucaramanga, Colombia)
const DEFAULT_COORDS = { lat: 7.1193, lng: -73.1227 };
const LAST_GPS_STORAGE_KEY = 'moviradar_last_gps_v1';

function readCachedGpsPosition(): GpsPositionData | null {
  try {
    const raw = localStorage.getItem(LAST_GPS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GpsPositionData>;
    if (
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      !Number.isNaN(parsed.lat) &&
      !Number.isNaN(parsed.lng)
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        accuracy: typeof parsed.accuracy === 'number' ? parsed.accuracy : null,
        speed: typeof parsed.speed === 'number' ? parsed.speed : 0.0,
        heading: typeof parsed.heading === 'number' ? parsed.heading : 0,
        altitude: typeof parsed.altitude === 'number' ? parsed.altitude : null,
        timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
      };
    }
  } catch {
    // Ignore malformed localStorage cache
  }
  return null;
}

function writeCachedGpsPosition(pos: GpsPositionData): void {
  try {
    localStorage.setItem(LAST_GPS_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // Ignore storage quota errors
  }
}

export function useGeolocation(): GeolocationHookReturn {
  const initialCached = useRef<GpsPositionData | null>(readCachedGpsPosition());
  const hasRealOrCachedGpsRef = useRef<boolean>(Boolean(initialCached.current));
  const hasUsedDefaultOnceRef = useRef<boolean>(false);

  const [position, setPosition] = useState<GpsPositionData | null>(() => initialCached.current);
  const [status, setStatus] = useState<GpsStatus>(() =>
    initialCached.current ? 'active' : 'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [isRealGps, setIsRealGps] = useState<boolean>(Boolean(initialCached.current));
  const watchIdRef = useRef<number | null>(null);

  const applyBucaramangaFallbackOnce = useCallback(() => {
    setIsWatching(false);
    // Regla estricta: nunca sobrescribir si ya hay GPS real, caché o ya se usó una sola vez
    if (hasRealOrCachedGpsRef.current || hasUsedDefaultOnceRef.current) {
      setStatus('active');
      setErrorMessage(null);
      return;
    }

    hasUsedDefaultOnceRef.current = true;
    setPosition((prev) => {
      if (prev) return prev;
      return {
        lat: DEFAULT_COORDS.lat,
        lng: DEFAULT_COORDS.lng,
        accuracy: null,
        speed: 0.0,
        heading: 0,
        altitude: null,
        timestamp: Date.now(),
      };
    });
    setStatus('active');
    setErrorMessage(null);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      applyBucaramangaFallbackOnce();
      return;
    }

    if (!hasRealOrCachedGpsRef.current) {
      setStatus('loading');
    }
    setErrorMessage(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

      const speedKmH = speed !== null && speed >= 0 ? Number((speed * 3.6).toFixed(1)) : 0.0;

      const nextPosition: GpsPositionData = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ? Math.round(accuracy) : null,
        speed: speedKmH,
        heading: heading !== null ? Math.round(heading) : null,
        altitude: altitude !== null ? Math.round(altitude) : null,
        timestamp: pos.timestamp,
      };

      hasRealOrCachedGpsRef.current = true;
      writeCachedGpsPosition(nextPosition);

      setPosition(nextPosition);
      setIsRealGps(true);
      setStatus('active');
      setErrorMessage(null);
      setIsWatching(true);
    };

    // 1) Lectura inicial rápida (con reintento sin alta precisión si tarda en interiores)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        if (err && err.code === err.PERMISSION_DENIED) {
          applyBucaramangaFallbackOnce();
          return;
        }
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          () => {
            applyBucaramangaFallbackOnce();
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    // 2) Seguimiento continuo en tiempo real
    try {
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        (err) => {
          applyBucaramangaFallbackOnce();
          if (err && err.code === err.PERMISSION_DENIED && watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 3000,
        }
      );
      watchIdRef.current = id;
    } catch {
      applyBucaramangaFallbackOnce();
    }
  }, [applyBucaramangaFallbackOnce]);

  const retryGps = useCallback(() => {
    hasUsedDefaultOnceRef.current = false;
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    startWatching();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startWatching]);

  return {
    position,
    status,
    errorMessage,
    isWatching,
    isRealGps,
    retryGps,
    centerCoordinates: position ? { lat: position.lat, lng: position.lng } : DEFAULT_COORDS,
  };
}
