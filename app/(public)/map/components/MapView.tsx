'use client';

import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { shops, Shop } from '../data/shops';
import ShopDetailBanner from './ShopDetailBanner';
import UserLocationMarker from './UserLocationMarker';
import GrandmaGuide from './GrandmaGuide';

// 高知市日曜市の中心地点（道の中央）
const KOCHI_SUNDAY_MARKET: [number, number] = [33.55915, 133.53100];
const INITIAL_ZOOM = 17;  // 初期表示（1.3kmの市場全体が見やすい）
const MIN_ZOOM = 16;      // 最小ズーム（市場の全体像を確認）
const MAX_ZOOM = 20;      // 最大ズーム（個別店舗の詳細を見る）

// 手書きマップ画像のパス（450x10000px - 300店舗対応、余白削減）
// マップの向き: 上=西（高知城側）、下=東
const HANDDRAWN_MAP_IMAGE = '/images/maps/placeholder-map.svg';

// 手書きマップの表示範囲（実測約1.3km - 正確な縮尺）
// 上側が西（高知城）、下側が東方向（追手筋）
// 1度の緯度 ≈ 111km、1.3km = 0.0117度
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [33.56500, 133.53200], // 西側上端（高知城前）
  [33.55330, 133.53000], // 東側下端（追手筋東端）
];

// 移動可能範囲を制限（マップより少し広め）
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
        <ImageOverlay
          url={HANDDRAWN_MAP_IMAGE}
          bounds={MAP_BOUNDS}
          opacity={1}
          zIndex={10}
        />

        {/* スマホのときだけ大きめズームボタンを表示 */}
        {isMobile && <MobileZoomControls />}

        {/* 店舗マーカー - クリック可能（店舗イラストの中央） */}
        {shops.map((shop) => (
          <CircleMarker
            key={shop.id}
            center={[shop.lat, shop.lng]}
            radius={35}
            pathOptions={{
              fillColor: '#3b82f6',
              fillOpacity: 0.05,
              color: '#3b82f6',
              weight: 2,
              opacity: 0.1,
            }}
            eventHandlers={{
              click: () => setSelectedShop(shop),
              mouseover: (e) => {
                e.target.setStyle({
                  fillColor: '#fbbf24',
                  fillOpacity: 0.4,
                  color: '#f59e0b',
                  opacity: 1,
                  weight: 4,
                });
                e.target.bringToFront();
              },
              mouseout: (e) => {
                e.target.setStyle({
                  fillColor: '#3b82f6',
                  fillOpacity: 0.05,
                  color: '#3b82f6',
                  opacity: 0.1,
                  weight: 2,
                });
              },
            }}
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
