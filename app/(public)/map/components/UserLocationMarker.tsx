'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { isInsideSundayMarket, convertGpsToIllustration, snapToRoadCenter } from '../config/roadConfig';

const MARKET_CENTER: [number, number] = [33.55915, 133.53100];

const UPDATE_INTERVAL_IN_MARKET_MS = 1000;
const UPDATE_INTERVAL_OUTSIDE_MS = 15000;
const ANIMATION_MS = 300;

// 精度の閾値（メートル）- これより大きい場合は再取得を待つ
const ACCURACY_THRESHOLD_METERS = 15;
// 精度が悪い状態が続いた場合のフォールバック時間（ミリ秒）
const ACCURACY_FALLBACK_MS = 5000;
// 初回位置取得時のズームレベル
const INITIAL_ZOOM_LEVEL = 19;

interface UserLocationMarkerProps {
  onLocationUpdate?: (isInMarket: boolean, position: [number, number]) => void;
  isTracking?: boolean;
}

export default function UserLocationMarker({ onLocationUpdate, isTracking }: UserLocationMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const lastUpdateRef = useRef(0);
  const onLocationUpdateRef = useRef(onLocationUpdate);
  const isTrackingRef = useRef(isTracking);
  const animFrameRef = useRef<number | null>(null);
  const animFromRef = useRef<[number, number] | null>(null);
  const animToRef = useRef<[number, number] | null>(null);
  const animStartRef = useRef(0);
  // 精度が悪い状態が始まった時刻（精度改善用）
  const lowAccuracyStartRef = useRef<number | null>(null);
  // 最後に受け入れた精度
  const lastAccuracyRef = useRef<number | null>(null);
  // 初回位置取得フラグ（マップを位置に移動させるため）
  const isFirstLocationRef = useRef(true);

  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  useEffect(() => {
    isTrackingRef.current = isTracking;
    // If tracking is enabled and we have a valid position (implied by marker existence),
    // center the map immediately.
    if (isTracking && markerRef.current) {
        const latlng = markerRef.current.getLatLng();
        map.panTo(latlng, { animate: true, duration: 0.5 });
    }
  }, [isTracking, map]);

  // Handle device orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
        if (!markerRef.current) return;

        let heading: number | null = null;

        // iOS WebKit
        if ((event as any).webkitCompassHeading) {
            heading = (event as any).webkitCompassHeading;
        } else if (event.alpha !== null) {
            heading = 360 - event.alpha;
        }

        if (heading !== null && arrowRef.current) {
             arrowRef.current.style.transform = `rotate(${heading}deg)`;
             arrowRef.current.style.opacity = '1';
        }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const checkIfInMarket = (lat: number, lng: number): boolean => {
    return isInsideSundayMarket(lat, lng);
  };

  useEffect(() => {
    if (!map) return;

    // Create marker with direction arrow structure
    const createIconHtml = () => {
        return `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
           <!-- The direction cone/arrow -->
           <div class="user-heading-arrow" style="
             position: absolute;
             top: 0;
             left: 0;
             width: 100%;
             height: 100%;
             background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%233b82f6%22><path d=%22M12 2L2 22l10-3 10 3L12 2z%22/></svg>');
             background-size: contain;
             background-repeat: no-repeat;
             background-position: center;
             transform-origin: center center;
             transition: transform 0.1s linear;
             opacity: 0.3;
           "></div>
           <!-- The center dot -->
           <div style="
              width: 16px;
              height: 16px;
              background-color: #2563eb;
              border: 3px solid white;
              border-radius: 50%;
              z-index: 10;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
           "></div>
        </div>
        `;
    };

    const userIcon = L.divIcon({
      html: createIconHtml(),
      className: 'user-location-marker-container',
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

    const setupMarker = (lat: number, lng: number) => {
        const newMarker = L.marker([lat, lng], {
            icon: userIcon,
            zIndexOffset: 1000,
        }).addTo(map);

        // Store reference to the arrow element for rotation updates
        // We need to wait for the marker to be added to DOM or use a mutation observer?
        // Leaflet creates the icon immediately.
        // We can try to access the element via the marker
        // However, L.divIcon creates HTML string.
        // We need to select the arrow element after it is added.

        // A trick is to use a unique class or id, but multiple markers might exist? No, only one user marker.
        // Let's rely on finding it inside the marker element.

        const el = newMarker.getElement();
        if (el) {
            const arrow = el.querySelector('.user-heading-arrow') as HTMLDivElement;
            if (arrow) {
                arrowRef.current = arrow;
            }
        }

        newMarker.bindPopup(`
            <div style="text-align: center; font-family: sans-serif;">
            <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
            <strong style="font-size: 14px;">現在地</strong>
            </div>
        `);

        return newMarker;
    };

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const inMarket = checkIfInMarket(latitude, longitude);
          const now = Date.now();
          const interval = inMarket ? UPDATE_INTERVAL_IN_MARKET_MS : UPDATE_INTERVAL_OUTSIDE_MS;
          if (markerRef.current && now - lastUpdateRef.current < interval) {
            return;
          }

          // 精度チェック：閾値より大きい場合は再取得を待つ
          const isAccuracyGood = accuracy <= ACCURACY_THRESHOLD_METERS;

          if (!isAccuracyGood) {
            // 精度が悪い状態の開始時刻を記録
            if (lowAccuracyStartRef.current === null) {
              lowAccuracyStartRef.current = now;
            }

            // フォールバック：一定時間経過したら精度が悪くても更新
            const lowAccuracyDuration = now - lowAccuracyStartRef.current;
            const shouldFallback = lowAccuracyDuration >= ACCURACY_FALLBACK_MS;

            // マーカーが既にある場合、フォールバック時間まで待つ
            if (markerRef.current && !shouldFallback) {
              console.log(`位置精度が低いため再取得を待機中 (精度: ${accuracy.toFixed(1)}m, 閾値: ${ACCURACY_THRESHOLD_METERS}m)`);
              return;
            }

            if (shouldFallback) {
              console.log(`フォールバック: 精度 ${accuracy.toFixed(1)}m で更新`);
            }
          } else {
            // 精度が良い場合、低精度タイマーをリセット
            lowAccuracyStartRef.current = null;
          }

          lastUpdateRef.current = now;
          lastAccuracyRef.current = accuracy;

          // 実際のGPS座標を道路イラスト上の座標に変換し、道路中央にスナップ
          let displayPosition: [number, number];
          if (inMarket) {
            const converted = convertGpsToIllustration(latitude, longitude);
            const snapped = snapToRoadCenter(converted.lat, converted.lng);
            displayPosition = [snapped.lat, snapped.lng];
          } else {
            displayPosition = MARKET_CENTER;
          }

          // 初回位置取得時はマップをその位置に移動
          if (isFirstLocationRef.current) {
            isFirstLocationRef.current = false;
            map.flyTo(displayPosition, INITIAL_ZOOM_LEVEL, {
              animate: true,
              duration: 1.0,
            });
          } else if (isTrackingRef.current) {
            // Tracking enabled: Center map on user
            map.panTo(displayPosition, { animate: true, duration: 0.5 });
          }

          if (markerRef.current) {
            animateMarkerTo(displayPosition);
            // Re-bind arrow ref if lost (e.g. if leaflet re-renders icon)
             const el = markerRef.current.getElement();
             if (el) {
                 const arrow = el.querySelector('.user-heading-arrow') as HTMLDivElement;
                 if (arrow) arrowRef.current = arrow;
             }
          } else {
            markerRef.current = setupMarker(displayPosition[0], displayPosition[1]);
          }

          onLocationUpdateRef.current?.(inMarket, displayPosition);
        },
        (error) => {
          console.warn('Failed to get geolocation', error);
          const defaultPosition = MARKET_CENTER;

          if (!markerRef.current) {
            markerRef.current = setupMarker(defaultPosition[0], defaultPosition[1]);
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

    markerRef.current = setupMarker(defaultPosition[0], defaultPosition[1]);
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
