'use client';

import { useEffect, useMemo, useState } from 'react';
import type L from 'leaflet';
import { MapContainer, ImageOverlay, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { shops, Shop } from '../data/shops';
import ShopDetailBanner from './ShopDetailBanner';
import UserLocationMarker from './UserLocationMarker';
import GrandmaGuide from './GrandmaGuide';

// 高知市日曜市の中心座標とズーム設定
const KOCHI_SUNDAY_MARKET: [number, number] = [33.55915, 133.531];
const INITIAL_ZOOM = 17;
const MIN_ZOOM = 16;
const MAX_ZOOM = 20;

// 手描きマップのオーバーレイ
const HANDDRAWN_MAP_IMAGE = '/images/maps/placeholder-map.svg';
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [33.565, 133.532],
  [33.5533, 133.53],
];
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [33.567, 133.533],
  [33.551, 133.529],
];

function MapInstanceSetter({ setInstance }: { setInstance: (map: L.Map | null) => void }) {
  const map = useMap();

  useEffect(() => {
    setInstance(map);
    return () => setInstance(null);
  }, [map, setInstance]);

  return null;
}

function MobileZoomControls() {
  const map = useMap();

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white text-xl shadow-lg active:scale-95"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white text-xl shadow-lg active:scale-95"
      >
        -
      </button>
    </div>
  );
}

type MapViewProps = {
  initialShopId?: number;
};

export default function MapView({ initialShopId }: MapViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // 開発時の再マウントで key を変えて二重初期化を防ぐ
  const mapKey = useMemo(
    () => `map-${typeof window !== 'undefined' ? Date.now() : 'ssr'}`,
    []
  );

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!initialShopId) return;
    const target = shops.find((s) => s.id === initialShopId);
    if (target) {
      setSelectedShop(target);
    }
  }, [initialShopId]);

  // HMR やページ遷移時に既存マップを確実に破棄
  useEffect(() => {
    return () => {
      mapInstance?.remove();
    };
  }, [mapInstance]);

  if (!mounted) return null;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        key={mapKey}
        center={KOCHI_SUNDAY_MARKET}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={!isMobile}
        dragging
        touchZoom={isMobile ? 'center' : true}
        doubleClickZoom={!isMobile}
        className="h-full w-full z-0"
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#faf8f3',
        }}
        zoomControl={!isMobile}
        attributionControl={false}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <MapInstanceSetter setInstance={setMapInstance} />
        <ImageOverlay url={HANDDRAWN_MAP_IMAGE} bounds={MAP_BOUNDS} opacity={1} zIndex={10} />

        {isMobile && <MobileZoomControls />}

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

        <UserLocationMarker />
      </MapContainer>

      <button
        type="button"
        onClick={() => setSelectedShop(shops[0])}
        className="absolute top-4 left-4 z-[1200] rounded-full bg-white/90 px-3 py-1 text-xs shadow border border-amber-300"
      >
        店舗カード表示テスト
      </button>

      {selectedShop && (
        <ShopDetailBanner
          shopId={selectedShop.id}
          shopName={selectedShop.name}
          onClose={() => setSelectedShop(null)}
        />
      )}

      <GrandmaGuide />
    </div>
  );
}
