'use client';

<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, ImageOverlay, CircleMarker, useMap } from "react-leaflet";
=======
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, useMap, useMapEvents, Tooltip, CircleMarker } from "react-leaflet";
import L from "leaflet";
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b
import "leaflet/dist/leaflet.css";
import { shops, Shop } from "../data/shops";
import ShopDetailBanner from "./ShopDetailBanner";
import ShopMarker from "./ShopMarker";
import RoadOverlay from "./RoadOverlay";
import BackgroundOverlay from "./BackgroundOverlay";
import UserLocationMarker from "./UserLocationMarker";
import GrandmaGuide from "./GrandmaGuide";
<<<<<<< HEAD
import { ingredientIcons, type Recipe } from "../../../../lib/recipes";
=======
import MapAgentAssistant from "./MapAgentAssistant";
import { ingredientIcons, type Recipe } from "../../../../lib/recipes";
import { getRoadBounds } from '../config/roadConfig';
import { getZoomConfig, filterShopsByZoom } from '../utils/zoomCalculator';
import { FAVORITE_SHOPS_KEY, loadFavoriteShopIds } from "../../../../lib/favoriteShops";
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b

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

const ORDER_SYMBOLS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
const PLAN_MARKER_ICON = "🗒️";

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

// ===== スマホ用のズームボタンコンポーネント =====
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

// ズームレベル追跡コンポーネント
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
};

export default function MapView({
  initialShopId,
  selectedRecipe,
  showRecipeOverlay,
  onCloseRecipeOverlay,
<<<<<<< HEAD
}: MapViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mounted, setMounted] = useState(false);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [addQuery, setAddQuery] = useState("");
  const [highlightIngredient, setHighlightIngredient] = useState<string | null>(null);
  // Leaflet の再利用エラーを避けるため、MapContainer の key をユニークにする。
  const mapKeyRef = useRef(`map-${crypto.randomUUID()}`);
=======
}: MapViewProps = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [planOrder, setPlanOrder] = useState<number[]>([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // 現在のズームレベルに応じて表示する店舗をフィルタリング
  const visibleShops = filterShopsByZoom(shops, currentZoom);

  // プラン順序のマップ
  const planOrderMap = useMemo(() => {
    const m = new Map<number, number>();
    planOrder.forEach((id, idx) => m.set(id, idx));
    return m;
  }, [planOrder]);
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b

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
<<<<<<< HEAD
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
=======
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

  // エージェントプランの読み込み
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

  // お気に入りの読み込み
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
        icon: iconKey ? ingredientIcons[iconKey] : "🛒",
      };
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b
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
      setSelectedShop(target);
      if (mapRef.current) {
        mapRef.current.flyTo([target.lat, target.lng], Math.max(mapRef.current.getZoom(), 18), {
          duration: 0.75,
        });
      }
    }
  }, []);

<<<<<<< HEAD
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

  if (!mounted) return null;
=======
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
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b

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
<<<<<<< HEAD
        key={mapKeyRef.current}
=======
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b
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
<<<<<<< HEAD
        <ImageOverlay url={HANDDRAWN_MAP_IMAGE} bounds={MAP_BOUNDS} opacity={1} zIndex={10} />
=======
        {/* レイヤー構造（下から順に描画） */}
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b

        {/* Layer 1: 背景オーバーレイ（将来の拡張用） */}
        <BackgroundOverlay />

        {/* Layer 2: 道路オーバーレイ */}
        <RoadOverlay />

        {/* Layer 3: 店舗マーカー - ズームレベルに応じて表示密度を調整 */}
        {visibleShops.map((shop) => {
          const orderIdx = planOrderMap.get(shop.id);
          const isFavorite = favoriteShopIds.includes(shop.id);

          return (
            <ShopMarker
              key={shop.id}
              shop={shop}
              onClick={setSelectedShop}
              isSelected={selectedShop?.id === shop.id}
              planOrderIndex={orderIdx}
              isFavorite={isFavorite}
            />
          );
        })}

        {/* レシピオーバーレイ - 材料が買える店舗を強調表示 */}
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

        {/* Layer 4: ユーザー位置マーカー */}
        <UserLocationMarker
          onLocationUpdate={(_, position) => {
            setUserLocation(position);
          }}
        />

        {/* ズームレベル追跡 */}
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* スマホのときだけ大きめズームボタンを表示 */}
        {isMobile && <MobileZoomControls />}
<<<<<<< HEAD

        {shops.map((shop) => {
          const isHighlighted =
            highlightIngredient &&
            shopsByIngredient
              .get(highlightIngredient)
              ?.some((s) => s.id === shop.id);
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
            />
          );
        })}

        <UserLocationMarker />
=======
>>>>>>> d609b396a855bd01909a2ef28b3dd87416db300b
      </MapContainer>

      {/* レシピオーバーレイ閉じるボタン */}
      {showRecipeOverlay && onCloseRecipeOverlay && (
        <button
          onClick={onCloseRecipeOverlay}
          className="absolute top-4 right-4 z-[1500] rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg hover:bg-gray-50"
        >
          レシピモードを閉じる
        </button>
      )}

      {/* 店舗詳細バナー */}
      {selectedShop && (
        <ShopDetailBanner
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}

      {/* おばあちゃんの説明ガイド */}
      <GrandmaGuide />

      {/* AIエージェントアシスタント */}
      <MapAgentAssistant
        onOpenShop={handleOpenShop}
        onPlanUpdate={handlePlanUpdate}
        userLocation={userLocation}
      />
    </div>
  );
}
