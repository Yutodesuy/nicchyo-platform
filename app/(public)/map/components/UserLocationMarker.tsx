'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const MARKET_BOUNDS = {
  north: 33.56500,
  south: 33.55330,
  west: 133.53000,
  east: 133.53200,
};

const MARKET_CENTER: [number, number] = [33.55915, 133.53100];

const UPDATE_INTERVAL_IN_MARKET_MS = 1000;
const UPDATE_INTERVAL_OUTSIDE_MS = 15000;
const ANIMATION_MS = 300;

interface UserLocationMarkerProps {
  onLocationUpdate?: (isInMarket: boolean, position: [number, number]) => void;
}

export default function UserLocationMarker({ onLocationUpdate }: UserLocationMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const lastUpdateRef = useRef(0);
  const onLocationUpdateRef = useRef(onLocationUpdate);
  const animFrameRef = useRef<number | null>(null);
  const animFromRef = useRef<[number, number] | null>(null);
  const animToRef = useRef<[number, number] | null>(null);
  const animStartRef = useRef(0);

  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  const checkIfInMarket = (lat: number, lng: number): boolean => {
    return (
      lat >= MARKET_BOUNDS.south &&
      lat <= MARKET_BOUNDS.north &&
      lng >= MARKET_BOUNDS.west &&
      lng <= MARKET_BOUNDS.east
    );
  };

  useEffect(() => {
    if (!map) return;

    const userIcon = L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 3px solid #3b82f6;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          font-size: 24px;
          animation: pulse 10s ease-in-out infinite;
        ">
          🚶
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
            50% { transform: scale(1.03); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35); }
          }
        </style>
      `,
      className: 'user-location-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const animateMarkerTo = (target: [number, number]) => {
      if (!markerRef.current) return;
      const current = markerRef.current.getLatLng();
      animFromRef.current = [current.lat, current.lng];
      animToRef.current = target;
      animStartRef.current = performance.now();

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const step = (ts: number) => {
        const from = animFromRef.current;
        const to = animToRef.current;
        if (!from || !to || !markerRef.current) return;
        const progress = Math.min(1, (ts - animStartRef.current) / ANIMATION_MS);
        const lat = from[0] + (to[0] - from[0]) * progress;
        const lng = from[1] + (to[1] - from[1]) * progress;
        markerRef.current.setLatLng([lat, lng]);
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    };

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const inMarket = checkIfInMarket(latitude, longitude);
          const now = Date.now();
          const interval = inMarket ? UPDATE_INTERVAL_IN_MARKET_MS : UPDATE_INTERVAL_OUTSIDE_MS;
          if (markerRef.current && now - lastUpdateRef.current < interval) {
            return;
          }
          lastUpdateRef.current = now;
          const displayPosition: [number, number] = inMarket
            ? [latitude, longitude]
            : MARKET_CENTER;

          if (markerRef.current) {
            animateMarkerTo(displayPosition);
          } else {
            const newMarker = L.marker(displayPosition, {
              icon: userIcon,
              zIndexOffset: 1000,
            }).addTo(map);

            newMarker.bindPopup(`
              <div style="text-align: center; font-family: sans-serif;">
                <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
                <strong style="font-size: 14px;">Current location</strong>
              </div>
            `);

            markerRef.current = newMarker;
          }

          onLocationUpdateRef.current?.(inMarket, displayPosition);
        },
        (error) => {
          console.warn('Failed to get geolocation', error);
          const defaultPosition = MARKET_CENTER;

          if (!markerRef.current) {
            const newMarker = L.marker(defaultPosition, {
              icon: userIcon,
              zIndexOffset: 1000,
            }).addTo(map);

            newMarker.bindPopup(`
              <div style="text-align: center; font-family: sans-serif;">
                <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
                <strong style="font-size: 14px;">Current location</strong>
              </div>
            `);

            markerRef.current = newMarker;
          }
          onLocationUpdateRef.current?.(false, defaultPosition);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
          markerRef.current = null;
        }
      };
    }

    console.warn('Geolocation is not supported by this browser');
    const defaultPosition = MARKET_CENTER;
    const newMarker = L.marker(defaultPosition, {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    newMarker.bindPopup(`
      <div style="text-align: center; font-family: sans-serif;">
        <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
        <strong style="font-size: 14px;">Current location</strong>
      </div>
    `);

    markerRef.current = newMarker;
    onLocationUpdateRef.current?.(false, defaultPosition);
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map]);

  return null;
}
