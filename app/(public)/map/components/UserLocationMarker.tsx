'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// 日曜市のエリア定義（実測1.3km）
const MARKET_BOUNDS = {
  north: 33.56500,  // 西側（高知城前）
  south: 33.55330,  // 東側（追手筋東端）
  west: 133.53000,
  east: 133.53200,
};

// 日曜市の中心座標（道の中心）
// 北端33.56500 + 南端33.55330 = 中心33.55915
// 西端133.53000 + 東端133.53200 = 中心133.53100
const MARKET_CENTER: [number, number] = [33.55915, 133.53100];

interface UserLocationMarkerProps {
  onLocationUpdate?: (isInMarket: boolean, position: [number, number]) => void;
}

export default function UserLocationMarker({ onLocationUpdate }: UserLocationMarkerProps) {
  const map = useMap();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isInMarket, setIsInMarket] = useState(false);
  const [marker, setMarker] = useState<L.Marker | null>(null);

  // 位置情報が日曜市のエリア内かチェック
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

    // カスタムアイコン（人のマーク）
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
          animation: pulse 2s infinite;
        ">
          🚶
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
            50% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6); }
          }
        </style>
      `,
      className: 'user-location-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // 位置情報の監視を開始
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const inMarket = checkIfInMarket(latitude, longitude);

          // 日曜市内にいる場合は実際の位置、外にいる場合は中央
          const displayPosition: [number, number] = inMarket
            ? [latitude, longitude]
            : MARKET_CENTER;

          setUserPosition(displayPosition);
          setIsInMarket(inMarket);

          // マーカーの更新または作成
          if (marker) {
            marker.setLatLng(displayPosition);
          } else {
            const newMarker = L.marker(displayPosition, {
              icon: userIcon,
              zIndexOffset: 1000,
            }).addTo(map);

            newMarker.bindPopup(`
              <div style="text-align: center; font-family: sans-serif;">
                <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
                <strong style="font-size: 14px;">現在地</strong>
                <p style="font-size: 12px; margin: 4px 0; color: #666;">
                  ${inMarket ? '日曜市内にいます' : '日曜市の中心を表示中'}
                </p>
              </div>
            `);

            setMarker(newMarker);
          }

          // コールバック
          if (onLocationUpdate) {
            onLocationUpdate(inMarket, displayPosition);
          }
        },
        (error) => {
          console.warn('位置情報の取得に失敗:', error);
          // エラー時は中央に表示
          const defaultPosition = MARKET_CENTER;
          setUserPosition(defaultPosition);
          setIsInMarket(false);

          if (!marker) {
            const newMarker = L.marker(defaultPosition, {
              icon: userIcon,
              zIndexOffset: 1000,
            }).addTo(map);

            newMarker.bindPopup(`
              <div style="text-align: center; font-family: sans-serif;">
                <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
                <strong style="font-size: 14px;">日曜市の中心</strong>
                <p style="font-size: 12px; margin: 4px 0; color: #666;">
                  位置情報が取得できません
                </p>
              </div>
            `);

            setMarker(newMarker);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      // クリーンアップ
      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (marker) {
          map.removeLayer(marker);
        }
      };
    } else {
      console.warn('このブラウザは位置情報をサポートしていません');
      // 位置情報非対応の場合は中央に表示
      const defaultPosition = MARKET_CENTER;
      setUserPosition(defaultPosition);

      const newMarker = L.marker(defaultPosition, {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      newMarker.bindPopup(`
        <div style="text-align: center; font-family: sans-serif;">
          <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
          <strong style="font-size: 14px;">日曜市の中心</strong>
          <p style="font-size: 12px; margin: 4px 0; color: #666;">
            位置情報が利用できません
          </p>
        </div>
      `);

      setMarker(newMarker);
    }
  }, [map]);

  return null;
}