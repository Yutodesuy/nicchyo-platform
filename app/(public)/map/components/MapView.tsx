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
import { ingredientIcons, type Recipe } from "../../../../lib/recipes";
import { getRoadBounds } from '../config/roadConfig';
import { getZoomConfig, filterShopsByZoom } from '../utils/zoomCalculator';
import { FAVORITE_SHOPS_KEY, loadFavoriteShopIds } from "../../../../lib/favoriteShops";
import { canOpenShopDetails, getMinZoomForShopDetails } from '../config/displayConfig';

// 驕薙・蠎ｧ讓吶ｒ蝓ｺ貅悶↓險ｭ螳壹ｒ蜿門ｾ・
const ROAD_BOUNDS = getRoadBounds();
const KOCHI_SUNDAY_MARKET: [number, number] = [
  (ROAD_BOUNDS[0][0] + ROAD_BOUNDS[1][0]) / 2, // 邱ｯ蠎ｦ縺ｮ荳ｭ蠢・
  (ROAD_BOUNDS[0][1] + ROAD_BOUNDS[1][1]) / 2, // 邨悟ｺｦ縺ｮ荳ｭ蠢・
];

// 繧ｺ繝ｼ繝險ｭ螳壹ｒ蜍慕噪縺ｫ險育ｮ・
const ZOOM_CONFIG = getZoomConfig(shops.length);
const INITIAL_ZOOM = ZOOM_CONFIG.initial;  // 蠎苓・縺碁㍾縺ｪ繧峨↑縺・怙驕ｩ繧ｺ繝ｼ繝
const MIN_ZOOM = ZOOM_CONFIG.min;
const MAX_ZOOM = ZOOM_CONFIG.max;

// 遘ｻ蜍募庄閭ｽ遽・峇繧貞宛髯撰ｼ磯％縺ｮ遽・峇繧医ｊ蟆代＠蠎・ａ・・
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [ROAD_BOUNDS[0][0] + 0.002, ROAD_BOUNDS[0][1] + 0.001],
  [ROAD_BOUNDS[1][0] - 0.002, ROAD_BOUNDS[1][1] - 0.001],
];

const ORDER_SYMBOLS = ["1", "2", "3", "4", "5", "6", "7", "8"];
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

// ===== 繧ｹ繝槭・逕ｨ縺ｮ繧ｺ繝ｼ繝繝懊ち繝ｳ繧ｳ繝ｳ繝昴・繝阪Φ繝・=====
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
        竏・
      </button>
    </div>
  );
}

// 繧ｺ繝ｼ繝繝ｬ繝吶Ν霑ｽ霍｡繧ｳ繝ｳ繝昴・繝阪Φ繝・
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
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [planOrder, setPlanOrder] = useState<number[]>([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // 迴ｾ蝨ｨ縺ｮ繧ｺ繝ｼ繝繝ｬ繝吶Ν縺ｫ蠢懊§縺ｦ陦ｨ遉ｺ縺吶ｋ蠎苓・繧偵ヵ繧｣繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ
  const visibleShops = filterShopsByZoom(shops, currentZoom);

  // 繝励Λ繝ｳ鬆・ｺ上・繝槭ャ繝・
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

  // 繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝医・繝ｩ繝ｳ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ
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

  // 縺頑ｰ励↓蜈･繧翫・隱ｭ縺ｿ霎ｼ縺ｿ
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
        icon: iconKey ? ingredientIcons[iconKey] : "將",
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
      // 繧ｺ繝ｼ繝繝ｬ繝吶Ν繧偵メ繧ｧ繝・け: 隧ｳ邏ｰ陦ｨ遉ｺ蜿ｯ閭ｽ繝ｬ繝吶Ν縺ｾ縺ｧ繧ｺ繝ｼ繝繧､繝ｳ
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
    saveBag([{ id, name: value, fromShopId, createdAt: Date.now() }, ...items]);
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
        {/* 繝ｬ繧､繝､繝ｼ讒矩・井ｸ九°繧蛾・↓謠冗判・・*/}

        {/* Layer 1: 閭梧勹繧ｪ繝ｼ繝舌・繝ｬ繧､・亥ｰ・擂縺ｮ諡｡蠑ｵ逕ｨ・・*/}
        <BackgroundOverlay />

        {/* Layer 2: 驕楢ｷｯ繧ｪ繝ｼ繝舌・繝ｬ繧､ */}
        <RoadOverlay />

        {/* Layer 3: 蠎苓・繝槭・繧ｫ繝ｼ - 繧ｺ繝ｼ繝繝ｬ繝吶Ν縺ｫ蠢懊§縺ｦ陦ｨ遉ｺ蟇・ｺｦ繧定ｪｿ謨ｴ */}
        {visibleShops.map((shop) => {
          const orderIdx = planOrderMap.get(shop.id);
          const isFavorite = favoriteShopIds.includes(shop.id);

          return (
            <ShopMarker
              key={shop.id}
              shop={shop}
              onClick={(clickedShop) => {
                // 縲仙・蟷ｳ諤ｧ縺ｮ菫晁ｨｼ縲・
                // 邵ｮ蟆乗凾縺ｯ蠎苓・隧ｳ邏ｰ繧帝幕縺九★縲・←蛻・↑繧ｺ繝ｼ繝繝ｬ繝吶Ν縺ｾ縺ｧ繧ｺ繝ｼ繝繧､繝ｳ
                if (!canOpenShopDetails(currentZoom)) {
                  const minZoom = getMinZoomForShopDetails();
                  if (mapRef.current) {
                    mapRef.current.flyTo([clickedShop.lat, clickedShop.lng], minZoom, {
                      duration: 0.75,
                    });
                  }
                  // 隧ｳ邏ｰ縺ｯ髢九°縺ｪ縺・ｼ医ぜ繝ｼ繝蠕後↓蜀榊ｺｦ繧ｯ繝ｪ繝・け縺悟ｿ・ｦ・ｼ・
                  return;
                }
                // 隧ｳ邏ｰ陦ｨ遉ｺ蜿ｯ閭ｽ縺ｪ繧ｺ繝ｼ繝繝ｬ繝吶Ν縺ｮ蝣ｴ蜷医・縺ｿ髢九￥
                setSelectedShop(clickedShop);
              }}
              isSelected={selectedShop?.id === shop.id}
              planOrderIndex={orderIdx}
              isFavorite={isFavorite}
            />
          );
        })}

        {/* 繝ｬ繧ｷ繝斐が繝ｼ繝舌・繝ｬ繧､ - 譚先侭縺瑚ｲｷ縺医ｋ蠎苓・繧貞ｼｷ隱ｿ陦ｨ遉ｺ */}
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

        {/* Layer 4: 繝ｦ繝ｼ繧ｶ繝ｼ菴咲ｽｮ繝槭・繧ｫ繝ｼ */}
        <UserLocationMarker
          onLocationUpdate={(_, position) => {
            setUserLocation(position);
          }}
        />

        {/* 繧ｺ繝ｼ繝繝ｬ繝吶Ν霑ｽ霍｡ */}
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* 繧ｹ繝槭・縺ｮ縺ｨ縺阪□縺大､ｧ縺阪ａ繧ｺ繝ｼ繝繝懊ち繝ｳ繧定｡ｨ遉ｺ */}
        {isMobile && <MobileZoomControls />}
      </MapContainer>

      {/* 繝ｬ繧ｷ繝斐が繝ｼ繝舌・繝ｬ繧､髢峨§繧九・繧ｿ繝ｳ */}
      {showRecipeOverlay && onCloseRecipeOverlay && (
        <button
          onClick={onCloseRecipeOverlay}
          className="absolute top-4 right-4 z-[1500] rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg hover:bg-gray-50"
        >
          繝ｬ繧ｷ繝斐Δ繝ｼ繝峨ｒ髢峨§繧・
        </button>
      )}

      {/* 蠎苓・隧ｳ邏ｰ繝舌リ繝ｼ */}
      {selectedShop && (
        <ShopDetailBanner
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          onAddToBag={handleAddToBag}
        />
      )}

      {/* 縺翫・縺ゅ■繧・ｓ縺ｮ隱ｬ譏弱ぎ繧､繝・*/}{/* AI繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝医い繧ｷ繧ｹ繧ｿ繝ｳ繝・*/}
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


