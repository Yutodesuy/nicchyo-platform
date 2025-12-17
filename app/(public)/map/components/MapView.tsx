'use client';

import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { shops, Shop } from '../data/shops';
import ShopDetailBanner from './ShopDetailBanner';
import ShopMarker from './ShopMarker';
import UserLocationMarker from './UserLocationMarker';
import GrandmaGuide from './GrandmaGuide';

// 高知市日曜市の中心地点（道の中央）
const KOCHI_SUNDAY_MARKET: [number, number] = [33.55915, 133.53100];
const INITIAL_ZOOM = 17;  // 初期表示（1.3kmの市場全体が見やすい）
const MIN_ZOOM = 16;      // 最小ズーム（市場の全体像を確認）
const MAX_ZOOM = 20;      // 最大ズーム（個別店舗の詳細を見る）

// 移動可能範囲を制限（日曜市周辺）
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [33.56700, 133.53300], // 西側上端（余裕あり）
  [33.55100, 133.52900], // 東側下端（余裕あり）
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
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

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
        {/* スマホのときだけ大きめズームボタンを表示 */}
        {isMobile && <MobileZoomControls />}

        {/* 店舗マーカー - 新アーキテクチャ：イラスト + 当たり判定が完全一致 */}
        {shops.map((shop) => (
          <ShopMarker
            key={shop.id}
            shop={shop}
            onClick={setSelectedShop}
            isSelected={selectedShop?.id === shop.id}
          />
        ))}

        {/* ユーザー位置マーカー */}
        <UserLocationMarker />
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
