'use client';

import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// 高知市日曜市の中心地点
const KOCHI_SUNDAY_MARKET: [number, number] = [33.559154, 133.531113];
const INITIAL_ZOOM = 17;  // 初期表示のズームレベル
const MIN_ZOOM = 16;      // 最小ズーム（縮小しすぎない）
const MAX_ZOOM = 19;      // 最大ズーム（拡大しすぎない）

// 手書きマップ画像のパス
const HANDDRAWN_MAP_IMAGE = '/images/maps/placeholder-map.svg';

// 手書きマップの表示範囲
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [33.5650, 133.5350], // 北東
  [33.5530, 133.5270], // 南西
];

// 移動可能範囲を制限
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [33.5680, 133.5370], // 北東
  [33.5500, 133.5250], // 南西
];

// ===== スマホ用のズームボタンコンポーネント =====
function MobileZoomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={handleZoomIn}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white text-xl shadow-lg active:scale-95"
      >
        +
      </button>
      <button
        type="button"
        onClick={handleZoomOut}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white text-xl shadow-lg active:scale-95"
      >
        −
      </button>
    </div>
  );
}

export default function MapView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const detectMobile = () => {
      if (typeof window === 'undefined') return;
      const touch = 'ontouchstart' in window;
      const narrow = window.innerWidth <= 768;
      setIsMobile(touch || narrow);
    };

    detectMobile();
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={KOCHI_SUNDAY_MARKET}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={!isMobile}          // スマホではホイールズーム無し
        dragging={true}
        touchZoom={isMobile ? 'center' : true} // スマホはピンチズームを中心寄せ
        doubleClickZoom={!isMobile}          // ダブルタップ誤操作防止
        className="h-full w-full z-0"
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#faf8f3',
        }}
        zoomControl={!isMobile}              // スマホでは標準ズームボタンを非表示
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <ImageOverlay
          url={HANDDRAWN_MAP_IMAGE}
          bounds={MAP_BOUNDS}
          opacity={1}
          zIndex={10}
        />

        {/* スマホのときだけ大きめズームボタンを表示 */}
        {isMobile && <MobileZoomControls />}

        {/*
          将来のマーカー表示：
          {getAllElements().map((element) => (
            <MapElementMarker key={element.id} element={element} />
          ))}
        */}
      </MapContainer>
    </div>
  );
}
