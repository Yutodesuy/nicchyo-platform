'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, useMap, useMapEvents, Tooltip, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { shops, Shop } from "../data/shops";
import ShopDetailBanner from "./ShopDetailBanner";
import ShopMarker from "./ShopMarker";
import RoadOverlay from "./RoadOverlay";
import BackgroundOverlay from "./BackgroundOverlay";
import UserLocationMarker from "./UserLocationMarker";
import MapAgentAssistant from "./MapAgentAssistant";
import { ingredientCatalog, ingredientIcons, type Recipe } from "../../../../lib/recipes";
import {
  getRoadBounds,
  getSundayMarketBounds,
  getRecommendedZoomBounds,
} from '../config/roadConfig';
import { getZoomConfig, filterShopsByZoom } from '../utils/zoomCalculator';
import { FAVORITE_SHOPS_KEY, loadFavoriteShopIds } from "../../../../lib/favoriteShops";
import {
  getMinZoomForShopDetails,
  getOptimalSpacing,
  getViewModeForZoom,
  ViewMode,
  canShowShopDetailBanner,
  getFilterIntervalForDevice,
} from '../config/displayConfig';

// Map bounds (Sunday market)
const ROAD_BOUNDS = getRoadBounds();
const KOCHI_SUNDAY_MARKET: [number, number] = [
  (ROAD_BOUNDS[0][0] + ROAD_BOUNDS[1][0]) / 2, // latitude center
  (ROAD_BOUNDS[0][1] + ROAD_BOUNDS[1][1]) / 2, // longitude center
];

// Sunday Market area boundaries (restrict pan operations to this area)
const SUNDAY_MARKET_BOUNDS = getSundayMarketBounds();

// Recommended zoom bounds (optimal range for Sunday Market)
const ZOOM_BOUNDS = getRecommendedZoomBounds();

// Zoom config by shop count
const ZOOM_CONFIG = getZoomConfig(shops.length);
const INITIAL_ZOOM = ZOOM_CONFIG.initial;
const MIN_ZOOM = ZOOM_BOUNDS.min; // Use recommended zoom bounds
const MAX_ZOOM = ZOOM_BOUNDS.max; // Use recommended zoom bounds

// DEPRECATED: Use SUNDAY_MARKET_BOUNDS instead
// Allow a slight pan margin outside road bounds
const MAX_BOUNDS: [[number, number], [number, number]] = SUNDAY_MARKET_BOUNDS;

const ORDER_SYMBOLS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const PLAN_MARKER_ICON = "🗒️";

type BagItem = {
  id: string;
  name: string;
  fromShopId?: number;
  category?: string;
  qty?: string;
  note?: string;
  photo?: string;
  createdAt: number;
};

const STORAGE_KEY = "nicchyo-fridge-items";
const AGENT_STORAGE_KEY = "nicchyo-map-agent-plan";

function loadBag(): BagItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BagItem[];
  } catch {
    return [];
  }
}

function saveBag(items: BagItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isIngredientName(name: string) {
  const lower = name.trim().toLowerCase();
  return ingredientCatalog.some(
    (ing) =>
      ing.name.toLowerCase().includes(lower) ||
      lower.includes(ing.name.toLowerCase()) ||
      ing.id.toLowerCase() === lower ||
      ing.id.toLowerCase().includes(lower) ||
      ing.aliases?.some(
        (alias) =>
          alias.toLowerCase().includes(lower) || lower.includes(alias.toLowerCase())
      )
  );
}

// ===== Mobile zoom buttons =====
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
        −
      </button>
    </div>
  );
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

type MapViewProps = {
  initialShopId?: number;
  selectedRecipe?: Recipe;
  showRecipeOverlay?: boolean;
  onCloseRecipeOverlay?: () => void;
  agentOpen?: boolean;
  onAgentToggle?: (open: boolean) => void;
};

export default function MapView({
  initialShopId,
  selectedRecipe,
  showRecipeOverlay,
  onCloseRecipeOverlay,
  agentOpen,
  onAgentToggle,
}: MapViewProps = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [planOrder, setPlanOrder] = useState<number[]>([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // 【Phase 3.5】デバイス対応フィルタリング
  // スマホの場合は mobileFilterInterval を優先使用
  const visibleShops = useMemo(() => {
    const viewMode = getViewModeForZoom(currentZoom);
    const interval = getFilterIntervalForDevice(viewMode, isMobile);

    // 全店舗表示の場合
    if (interval === 1) {
      return shops;
    }

    // 公平な間引きフィルタリング（zoomCalculator.ts と同じロジック）
    const zoomOffset = Math.floor(currentZoom * 2);
    return shops.filter((shop) => {
      return (shop.id + zoomOffset) % interval === 0;
    });
  }, [currentZoom, isMobile]);

  // 【Phase 3】表示モードに応じて詳細バナーのレンダリング自体を制御
  // CSS で隠すのではなく、コンポーネント自体をレンダリングしない（公平性の徹底）
  const shouldRenderDetailBanner = canShowShopDetailBanner(currentZoom);

  // レスポンシブ対応: 画面サイズとズームレベルに応じた最適間隔を計算
  // Phase 3のクラスタリング実装で使用予定
  const optimalSpacing = useMemo(() => {
    if (screenWidth === 0) return 80; // 初期値
    return getOptimalSpacing(screenWidth, currentZoom);
  }, [screenWidth, currentZoom]);

  const planOrderMap = useMemo(() => {
    const m = new Map<number, number>();
    planOrder.forEach((id, idx) => m.set(id, idx));
    return m;
  }, [planOrder]);

  useEffect(() => {
    const detectMobile = () => {
      if (typeof window === "undefined") return;
      const touch = "ontouchstart" in window;
      const narrow = window.innerWidth <= 768;
      setIsMobile(touch || narrow);
      setScreenWidth(window.innerWidth);
    };

    detectMobile();
    window.addEventListener("resize", detectMobile);
    return () => window.removeEventListener("resize", detectMobile);
  }, []);

  useEffect(() => {
    if (initialShopId) {
      const shop = shops.find((s) => s.id === initialShopId);
      if (shop) {
        setSelectedShop(shop);
        if (mapRef.current) {
          mapRef.current.setView([shop.lat, shop.lng], 18);
        }
      }
    }
  }, [initialShopId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(AGENT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.order)) {
        setPlanOrder(parsed.order);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFavoriteShopIds(loadFavoriteShopIds());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITE_SHOPS_KEY) {
        setFavoriteShopIds(loadFavoriteShopIds());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const recipeIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.ingredients.map((ing) => {
      const iconKey = Object.keys(ingredientIcons).find((key) =>
        ing.name.toLowerCase().includes(key)
      );
      return {
        name: ing.name,
        icon: iconKey ? ingredientIcons[iconKey] : "🛍️",
      };
    });
  }, [selectedRecipe]);

  const shopsWithIngredients = useMemo(() => {
    if (!selectedRecipe || recipeIngredients.length === 0) return [];
    return shops.filter((shop) =>
      shop.products.some((product) =>
        recipeIngredients.some((ing) =>
          product.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(product.toLowerCase())
        )
      )
    );
  }, [selectedRecipe, recipeIngredients]);

  const handleOpenShop = useCallback((shopId: number) => {
    const target = shops.find((s) => s.id === shopId);
    if (target) {
      const minZoom = getMinZoomForShopDetails();
      const currentZoom = mapRef.current?.getZoom() ?? INITIAL_ZOOM;
      const targetZoom = Math.max(currentZoom, minZoom, 18);

      setSelectedShop(target);
      if (mapRef.current) {
        mapRef.current.flyTo([target.lat, target.lng], targetZoom, {
          duration: 0.75,
        });
      }
    }
  }, []);

  const handlePlanUpdate = useCallback((order: number[]) => {
    setPlanOrder(order);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(AGENT_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify({ ...parsed, order }));
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const handleAddToBag = useCallback((name: string, fromShopId?: number) => {
    const value = name.trim();
    if (!value) return;
    const items = loadBag();
    const normalized = value.toLowerCase();
    const exists = items.some(
      (item) =>
        item.name.trim().toLowerCase() === normalized &&
        item.fromShopId === fromShopId
    );
    if (exists) return;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const category = isIngredientName(value) ? "食材" : undefined;
    saveBag([{ id, name: value, fromShopId, category, createdAt: Date.now() }, ...items]);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={KOCHI_SUNDAY_MARKET}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={!isMobile}
        dragging={true}
        touchZoom={isMobile ? "center" : true}
        doubleClickZoom={!isMobile}
        className="h-full w-full z-0"
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "#faf8f3",
        }}
        zoomControl={!isMobile}
        attributionControl={false}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        {}

        {}
        <BackgroundOverlay />

        {}
        <RoadOverlay />

        {}
        {visibleShops.map((shop) => {
          const orderIdx = planOrderMap.get(shop.id);
          const isFavorite = favoriteShopIds.includes(shop.id);

          return (
            <ShopMarker
              key={shop.id}
              shop={shop}
              currentZoom={currentZoom}
              onClick={(clickedShop) => {
                const viewMode = getViewModeForZoom(currentZoom);

                if (viewMode.mode === ViewMode.DETAIL) {
                  // 詳細モード: 詳細バナーを表示
                  setSelectedShop(clickedShop);
                } else {
                  // 【段階的ズームアップ】現在の段階から次の段階へ自然にズーム
                  // OVERVIEW → INTERMEDIATE（17.5）
                  // INTERMEDIATE → DETAIL（18.5）

                  // 周辺店舗を検索（緯度±0.001度、経度±0.0005度 ≈ 半径100m程度）
                  const nearbyShops = shops.filter(s =>
                    Math.abs(s.lat - clickedShop.lat) < 0.001 &&
                    Math.abs(s.lng - clickedShop.lng) < 0.0005
                  );

                  // 周辺店舗が1店舗のみの場合は、その店舗を中心にする
                  // 複数ある場合は、周辺エリアの重心を計算
                  let centerLat: number;
                  let centerLng: number;

                  if (nearbyShops.length === 0) {
                    // フォールバック: クリックした店舗を中心にする
                    centerLat = clickedShop.lat;
                    centerLng = clickedShop.lng;
                  } else {
                    // 周辺店舗の重心を計算
                    centerLat = nearbyShops.reduce((sum, s) => sum + s.lat, 0) / nearbyShops.length;
                    centerLng = nearbyShops.reduce((sum, s) => sum + s.lng, 0) / nearbyShops.length;
                  }

                  // 【段階的ズームアップ】現在のモードに応じて次の段階へ
                  let targetZoom: number;
                  if (viewMode.mode === ViewMode.OVERVIEW) {
                    // OVERVIEW → INTERMEDIATE（エリア探索）へ
                    targetZoom = 18.0;  // 【スマホUX】17.5 → 18.0
                  } else {
                    // INTERMEDIATE → DETAIL（詳細閲覧）へ
                    targetZoom = 19.0;  // 【スマホUX】18.5 → 19.0
                  }

                  if (mapRef.current) {
                    mapRef.current.flyTo(
                      [centerLat, centerLng],  // ピンポイントではなく、周辺エリアの中心
                      targetZoom,
                      {
                        duration: 0.75,
                        easeLinearity: 0.25, // 自然な減速カーブ
                      }
                    );
                  }
                }
              }}
              isSelected={selectedShop?.id === shop.id}
              planOrderIndex={orderIdx}
              isFavorite={isFavorite}
            />
          );
        })}

        {}
        {showRecipeOverlay && shopsWithIngredients.map((shop) => {
          const matchingIngredients = recipeIngredients.filter((ing) =>
            shop.products.some((product) =>
              product.toLowerCase().includes(ing.name.toLowerCase()) ||
              ing.name.toLowerCase().includes(product.toLowerCase())
            )
          );

          return (
            <CircleMarker
              key={`recipe-${shop.id}`}
              center={[shop.lat, shop.lng]}
              radius={40}
              pathOptions={{
                fillColor: "#f59e0b",
                fillOpacity: 0.2,
                color: "#f59e0b",
                weight: 3,
                opacity: 0.8,
              }}
              eventHandlers={{
                click: () => setSelectedShop(shop),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs">
                  <div className="font-bold mb-1">{shop.name}</div>
                  <div className="text-[10px] space-y-0.5">
                    {matchingIngredients.slice(0, 3).map((ing, i) => (
                      <div key={i}>
                        {ing.icon} {ing.name}
                      </div>
                    ))}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {}
        <UserLocationMarker
          onLocationUpdate={(_, position) => {
            setUserLocation(position);
          }}
        />

        {}
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {}
        {isMobile && <MobileZoomControls />}
      </MapContainer>

      {}
      {showRecipeOverlay && onCloseRecipeOverlay && (
        <button
          onClick={onCloseRecipeOverlay}
          className="absolute top-4 right-4 z-[1500] rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg hover:bg-gray-50"
        >
          レシピモードを閉じる
        </button>
      )}

      {/* 詳細バナー: 詳細モード（ズーム17以上）のときのみレンダリング */}
      {/* 【Phase 3】公平性の徹底: CSS で隠すのではなく、レンダリング自体を制御 */}
      {shouldRenderDetailBanner && selectedShop && (
        <ShopDetailBanner
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          onAddToBag={handleAddToBag}
        />
      )}

      <MapAgentAssistant
        onOpenShop={handleOpenShop}
        onPlanUpdate={handlePlanUpdate}
        userLocation={userLocation}
        isOpen={agentOpen}
        onToggle={onAgentToggle}
        hideLauncher
      />
    </div>
  );
}
