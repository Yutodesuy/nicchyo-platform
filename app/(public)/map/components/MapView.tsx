'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, ImageOverlay, CircleMarker, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { shops, Shop } from "../data/shops";
import ShopDetailBanner from "./ShopDetailBanner";
import UserLocationMarker from "./UserLocationMarker";
import GrandmaGuide from "./GrandmaGuide";
import MapAgentAssistant from "./MapAgentAssistant";
import { ingredientIcons, type Recipe } from "../../../../lib/recipes";
import { FAVORITE_SHOPS_KEY, loadFavoriteShopIds } from "../../../../lib/favoriteShops";

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
  [33.565, 133.532],
  [33.5533, 133.53],
];
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [33.567, 133.533],
  [33.551, 133.529],
];
const PLAN_MARKER_ICON = "\u{1F5D2}";

type BagItem = {
  id: string;
  name: string;
  fromShopId?: number;
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
  selectedRecipe?: Recipe;
  showRecipeOverlay?: boolean;
  onCloseRecipeOverlay?: () => void;
};

export default function MapView({
  initialShopId,
  selectedRecipe,
  showRecipeOverlay,
  onCloseRecipeOverlay,
}: MapViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mounted, setMounted] = useState(false);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [addQuery, setAddQuery] = useState("");
  const [highlightIngredient, setHighlightIngredient] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [planOrder, setPlanOrder] = useState<number[]>([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  // Leaflet の再利用エラーを避けるため、MapContainer の key をユニークにする。
  const mapKeyRef = useRef(`map-${crypto.randomUUID()}`);

  useEffect(() => {
    const detectMobile = () => {
      if (typeof window === "undefined") return;
      const touch = "ontouchstart" in window;
      const narrow = window.innerWidth <= 768;
      setIsMobile(touch || narrow);
    };

    detectMobile();
    window.addEventListener("resize", detectMobile);
    return () => window.removeEventListener("resize", detectMobile);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setBagItems(loadBag());
  }, []);

  const handleAddToBag = (name: string, fromShopId?: number) => {
    const value = name.trim();
    if (!value) return;
    setBagItems((prev) => {
      const exists = prev.some((item) => item.name.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      const next: BagItem[] = [
        { id: crypto.randomUUID(), name: value, fromShopId, createdAt: Date.now() },
        ...prev,
      ];
      saveBag(next);
      return next;
    });
  };

  const handleRemoveFromBag = (id: string) => {
    setBagItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveBag(next);
      return next;
    });
  };

  useEffect(() => {
    if (!initialShopId) return;
    const target = shops.find((s) => s.id === initialShopId);
    if (target) {
      setSelectedShop(target);
    }
  }, [initialShopId]);

  const productPool = useMemo(() => {
    const set = new Set<string>();
    shops.forEach((shop) => {
      shop.products.forEach((p) => set.add(p));
    });
    return Array.from(set);
  }, []);

  const bagSuggestions = useMemo(() => {
    const existing = new Set(bagItems.map((b) => b.name.toLowerCase()));
    const q = addQuery.trim().toLowerCase();
    return productPool
      .filter((p) => !existing.has(p.toLowerCase()))
      .filter((p) => {
        if (!q) return true;
        return p.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [addQuery, bagItems, productPool]);

  const bagIngredientSet = useMemo(() => {
    return new Set(bagItems.map((item) => item.name.toLowerCase()));
  }, [bagItems]);

  const shopsByIngredient = useMemo(() => {
    if (!selectedRecipe) return new Map<string, Shop[]>();
    const map = new Map<string, Shop[]>();
    selectedRecipe.ingredients.forEach((ing) => {
      const matches = shops.filter((shop) =>
        shop.products.some((p) => p.toLowerCase().includes(ing.name.toLowerCase()))
      );
      map.set(ing.id, matches);
    });
    return map;
  }, [selectedRecipe]);

  const planOrderMap = useMemo(() => {
    const m = new Map<number, number>();
    planOrder.forEach((id, idx) => m.set(id, idx));
    return m;
  }, [planOrder]);

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

  const handleOpenShop = useCallback((shopId: number) => {
    const target = shops.find((s) => s.id === shopId);
    if (target) {
      setSelectedShop(target);
      if (mapRef.current) {
        mapRef.current.flyTo([target.lat, target.lng], Math.max(mapRef.current.getZoom(), 18), {
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

  if (!mounted) return null;

  return (
    <div className="relative h-full w-full">
      {selectedRecipe && showRecipeOverlay && (
        <div className="absolute left-0 right-0 top-0 z-[1200] px-4 pt-4">
          <div className="rounded-2xl border border-amber-200 bg-white/95 shadow-lg p-3 md:p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                  今日の土佐料理
                </p>
                <h3 className="text-lg font-bold text-gray-900">{selectedRecipe.title}</h3>
                <p className="text-xs text-gray-700">{selectedRecipe.description}</p>
              </div>
              <button
                type="button"
                onClick={onCloseRecipeOverlay}
                className="h-8 w-8 rounded-full border border-amber-200 bg-white text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50"
                aria-label="バナーを閉じる"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedRecipe.ingredients.map((ing) => {
                const owned = bagIngredientSet.has(ing.name.toLowerCase());
                const isHighlighted = highlightIngredient === ing.id;
                return (
                  <div
                    key={ing.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs shadow-sm ${
                      isHighlighted
                        ? "border-amber-500 bg-amber-100"
                        : "border-amber-100 bg-white"
                    }`}
                  >
                    <span className="text-base" aria-hidden>
                      {ingredientIcons[ing.id] ?? "🧺"}
                    </span>
                    <span className="font-semibold text-gray-900">{ing.name}</span>
                    {ing.seasonal && (
                      <span className="rounded-full bg-amber-50 px-2 py-[2px] text-[10px] text-amber-700 border border-amber-100">
                        旬
                      </span>
                    )}
                    {owned && (
                      <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700 border border-emerald-100">
                        バッグにあり
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-full border border-amber-200 bg-white px-2 py-[2px] text-[10px] font-semibold text-amber-800 hover:bg-amber-50"
                        onClick={() => setHighlightIngredient(ing.id)}
                      >
                        お店をハイライト
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-amber-600 px-2 py-[2px] text-[10px] font-semibold text-white hover:bg-amber-500"
                        onClick={() => handleAddToBag(ing.name)}
                      >
                        買った！
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-700">
              <span>
                完成度:{" "}
                {Math.round(
                  (selectedRecipe.ingredients.filter((ing) =>
                    bagIngredientSet.has(ing.name.toLowerCase())
                  ).length /
                    selectedRecipe.ingredients.length) *
                    100
                )}
                %
              </span>
              <button
                type="button"
                onClick={() => setHighlightIngredient(null)}
                className="text-amber-700 underline"
              >
                ハイライトをリセット
              </button>
            </div>
          </div>
        </div>
      )}

      <MapContainer
        key={mapKeyRef.current}
        center={KOCHI_SUNDAY_MARKET}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={!isMobile}
        dragging
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
        ref={mapRef}
      >
        <ImageOverlay url={HANDDRAWN_MAP_IMAGE} bounds={MAP_BOUNDS} opacity={1} zIndex={10} />

        {/* スマホのときだけ大きめズームボタンを表示 */}
        {isMobile && <MobileZoomControls />}

        {shops.map((shop) => {
          const isHighlighted =
            highlightIngredient &&
            shopsByIngredient
              .get(highlightIngredient)
              ?.some((s) => s.id === shop.id);
          const orderIdx = planOrderMap.get(shop.id);
          const isFavorite = favoriteShopIds.includes(shop.id);
          return (
            <CircleMarker
              key={shop.id}
              center={[shop.lat, shop.lng]}
              radius={35}
              pathOptions={{
                fillColor: isHighlighted ? "#fbbf24" : "#3b82f6",
                fillOpacity: isHighlighted ? 0.35 : 0.05,
                color: isHighlighted ? "#f59e0b" : "#3b82f6",
                weight: isHighlighted ? 4 : 2,
                opacity: isHighlighted ? 0.9 : 0.1,
              }}
              eventHandlers={{
                click: () => setSelectedShop(shop),
                mouseover: (e) => {
                  e.target.setStyle({
                    fillColor: "#fbbf24",
                    fillOpacity: 0.4,
                    color: "#f59e0b",
                    opacity: 1,
                    weight: 4,
                  });
                  e.target.bringToFront();
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    fillColor: isHighlighted ? "#fbbf24" : "#3b82f6",
                    fillOpacity: isHighlighted ? 0.35 : 0.05,
                    color: isHighlighted ? "#f59e0b" : "#3b82f6",
                    opacity: isHighlighted ? 0.9 : 0.1,
                    weight: isHighlighted ? 4 : 2,
                  });
                },
              }}
            >
              {orderIdx !== undefined && (
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -10]}
                  className="bg-white text-amber-900 border border-amber-300 rounded-full px-2 py-1 text-sm font-bold shadow-md"
                >
                  {PLAN_MARKER_ICON}
                </Tooltip>
              )}
              {isFavorite && (
                <Tooltip
                  permanent
                  direction="right"
                  offset={[10, 0]}
                  className="bg-pink-50 text-pink-600 border border-pink-200 rounded-full px-2 py-1 text-sm font-bold shadow-md"
                >
                  {"\u2665"}
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}

        <UserLocationMarker
          onLocationUpdate={(_, position) => {
            setUserLocation(position);
          }}
        />
      </MapContainer>

      {/* 店舗詳細バナー */}
      {selectedShop && (
        <ShopDetailBanner
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}

      <GrandmaGuide />
      <MapAgentAssistant
        onOpenShop={handleOpenShop}
        onPlanUpdate={handlePlanUpdate}
        userLocation={userLocation}
      />
    </div>
  );
}
