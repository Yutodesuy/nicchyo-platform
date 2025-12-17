'use client';

import { useEffect, useState } from 'react';
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { shops, Shop } from '../data/shops';
import ShopDetailBanner from './ShopDetailBanner';
import ShopMarker from './ShopMarker';
import RoadOverlay from './RoadOverlay';
import BackgroundOverlay from './BackgroundOverlay';
import UserLocationMarker from './UserLocationMarker';
import GrandmaGuide from './GrandmaGuide';
import { getRoadBounds } from '../config/roadConfig';
import { getZoomConfig, filterShopsByZoom } from '../utils/zoomCalculator';

// 道の座標を基準に設定を取得
const ROAD_BOUNDS = getRoadBounds();
const KOCHI_SUNDAY_MARKET: [number, number] = [
  (ROAD_BOUNDS[0][0] + ROAD_BOUNDS[1][0]) / 2, // 緯度の中心
  (ROAD_BOUNDS[0][1] + ROAD_BOUNDS[1][1]) / 2, // 経度の中心
];

// ズーム設定を動的に計算
const ZOOM_CONFIG = getZoomConfig(shops.length);
const INITIAL_ZOOM = ZOOM_CONFIG.initial;  // 店舗が重ならない最適ズーム
const MIN_ZOOM = ZOOM_CONFIG.min;
const MAX_ZOOM = ZOOM_CONFIG.max;

// 移動可能範囲を制限（道の範囲より少し広め）
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [ROAD_BOUNDS[0][0] + 0.002, ROAD_BOUNDS[0][1] + 0.001],
  [ROAD_BOUNDS[1][0] - 0.002, ROAD_BOUNDS[1][1] - 0.001],
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

// ズームレベル追跡コンポーネント
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

export default function MapView() {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);

  // 現在のズームレベルに応じて表示する店舗をフィルタリング
  const visibleShops = filterShopsByZoom(shops, currentZoom);

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
        attributionControl={false}           // Leaflet表示を非表示
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        {/* レイヤー構造（下から順に描画） */}

        {/* Layer 1: 背景オーバーレイ（将来の拡張用） */}
        <BackgroundOverlay />

        {/* Layer 2: 道路オーバーレイ */}
        <RoadOverlay />

        {/* Layer 3: 店舗マーカー - ズームレベルに応じて表示密度を調整 */}
        {visibleShops.map((shop) => (
          <ShopMarker
            key={shop.id}
            shop={shop}
            onClick={setSelectedShop}
            isSelected={selectedShop?.id === shop.id}
          />
        ))}

        {/* Layer 4: ユーザー位置マーカー */}
        <UserLocationMarker />

        {/* ズームレベル追跡 */}
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* スマホのときだけ大きめズームボタンを表示 */}
        {isMobile && <MobileZoomControls />}
      </MapContainer>

      {/* 店舗詳細バナー */}
      {selectedShop && (
        <ShopDetailBanner
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}

      {/* おばあちゃんの説明ガイド */}
      <GrandmaGuide />
    </div>
  );
}
