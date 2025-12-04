// app/(public)/map/components/MapView.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ShopDetailBanner from '../components/ShopDetailBanner'; // ★ 追加

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
  const [activeShopName, setActiveShopName] = useState<string | null>(null); // ★ 追加：表示中のお店

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

  // 仮の「店を開く」関数（あとでマーカーから呼ぶ）
  const openShopDetail = (shopName: string) => {
    setActiveShopName(shopName);
  };

  const closeShopDetail = () => {
    setActiveShopName(null);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={KOCHI_SUNDAY_MARKET}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={!isMobile}
        dragging={true}
        touchZoom={isMobile ? 'center' : true}
        doubleClickZoom={!isMobile}
        className="h-full w-full z-0"
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#faf8f3',
        }}
        zoomControl={!isMobile}
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

        {/* ★ テスト用：ボタンでバナーを出す（あとでマーカーの onClick に差し替え） */}
        {/* これは MapContainer の外に出したいなら、absolute で重ねてもOK */}
      </MapContainer>

      {/* テスト用トリガーボタン（上に重ねて表示） */}
      <button
        type="button"
        onClick={() => openShopDetail('土佐刃物 シャツル')}
        className="absolute top-4 left-4 z-[1200] rounded-full bg-white/90 px-3 py-1 text-xs shadow border border-amber-300"
      >
        バナーを表示（テスト）
      </button>

      {/* ★ 店舗バナー：activeShopName があるときだけ表示 */}
      {activeShopName && (
        <ShopDetailBanner
          shopName={activeShopName}
          onClose={closeShopDetail}
        />
      )}
    </div>
  );
}
