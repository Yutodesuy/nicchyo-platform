'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, useMap, useMapEvents, Tooltip, CircleMarker, Marker } from "react-leaflet";
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
import { getRoadBounds } from '../config/roadConfig';
import { getZoomConfig, filterShopsByZoom } from '../utils/zoomCalculator';
import { FAVORITE_SHOPS_KEY, FAVORITE_SHOPS_UPDATED_EVENT, loadFavoriteShopIds } from "../../../../lib/favoriteShops";
import { canOpenShopDetails, getMinZoomForShopDetails } from '../config/displayConfig';

// Map bounds (Sunday market)
const ROAD_BOUNDS = getRoadBounds();
const KOCHI_SUNDAY_MARKET: [number, number] = [
  (ROAD_BOUNDS[0][0] + ROAD_BOUNDS[1][0]) / 2, // latitude center
  (ROAD_BOUNDS[0][1] + ROAD_BOUNDS[1][1]) / 2, // longitude center
];

// Zoom config by shop count
const ZOOM_CONFIG = getZoomConfig(shops.length);
const INITIAL_ZOOM = ZOOM_CONFIG.initial;
const MIN_ZOOM = ZOOM_CONFIG.min;
const MAX_ZOOM = ZOOM_CONFIG.max;

// Allow a slight pan margin outside road bounds
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  searchShopIds?: number[];
  searchLabel?: string;
};

export default function MapView({
  initialShopId,
  selectedRecipe,
  showRecipeOverlay,
  onCloseRecipeOverlay,
  agentOpen,
  onAgentToggle,
  searchShopIds,
  searchLabel,
}: MapViewProps = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [planOrder, setPlanOrder] = useState<number[]>([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  const visibleShops = filterShopsByZoom(shops, currentZoom);
  const normalizedSearchLabel = searchLabel?.trim() || "検索結果";
  const searchIdSet = useMemo(() => {
    if (!searchShopIds || searchShopIds.length === 0) return null;
    return new Set(searchShopIds);
  }, [searchShopIds]);
  const searchShops = useMemo(() => {
    if (!searchIdSet) return [];
    return shops.filter((shop) => searchIdSet.has(shop.id));
  }, [searchIdSet]);
  const searchMarkerIcon = useMemo(() => {
    if (!searchIdSet) return null;
    const safeLabel = escapeHtml(normalizedSearchLabel);
    return L.divIcon({
      className: "",
      html: `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(255,255,255,0.96);border:2px solid #f59e0b;border-radius:18px;font-size:12px;font-weight:700;color:#92400e;box-shadow:0 6px 12px rgba(0,0,0,0.18);line-height:1.3;text-align:center;white-space:nowrap;">
        <span aria-hidden="true">🔍</span>
        <span style="display:inline-block;white-space:nowrap;">${safeLabel}</span>
      </div>`,
    });
  }, [searchIdSet, normalizedSearchLabel]);

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
    const handleFavoriteUpdate = (event: Event) => {
      if (event.type === FAVORITE_SHOPS_UPDATED_EVENT) {
        setFavoriteShopIds(loadFavoriteShopIds());
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(FAVORITE_SHOPS_UPDATED_EVENT, handleFavoriteUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FAVORITE_SHOPS_UPDATED_EVENT, handleFavoriteUpdate);
    };
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

  const selectedShopIndex = useMemo(() => {
    if (!selectedShop) return -1;
    return shops.findIndex((shop) => shop.id === selectedShop.id);
  }, [selectedShop]);

  const canNavigate = selectedShopIndex >= 0 && shops.length > 1;

  const handleSelectByOffset = useCallback((offset: number) => {
    if (!canNavigate) return;
    const nextIndex = (selectedShopIndex + offset + shops.length) % shops.length;
    const nextShop = shops[nextIndex];
    if (!nextShop) return;
    setSelectedShop(nextShop);
    const minZoom = getMinZoomForShopDetails();
    const currentZoom = mapRef.current?.getZoom() ?? INITIAL_ZOOM;
    const targetZoom = Math.max(currentZoom, minZoom, 18);
    if (mapRef.current) {
      mapRef.current.flyTo([nextShop.lat, nextShop.lng], targetZoom, {
        duration: 0.6,
      });
    }
  }, [canNavigate, selectedShopIndex]);

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
              onClick={(clickedShop) => {
                if (!canOpenShopDetails(currentZoom)) {
                  const minZoom = getMinZoomForShopDetails();
                  if (mapRef.current) {
                    mapRef.current.flyTo([clickedShop.lat, clickedShop.lng], minZoom, {
                      duration: 0.75,
                    });
                  }
                  return;
                }
                setSelectedShop(clickedShop);
              }}
              isSelected={selectedShop?.id === shop.id}
              planOrderIndex={orderIdx}
              isFavorite={isFavorite}
            />
          );
        })}

        {}
        {searchMarkerIcon && searchShops.map((shop) => (
          <Marker
            key={`search-${shop.id}`}
            position={[shop.lat, shop.lng]}
            icon={searchMarkerIcon}
            zIndexOffset={1200}
            eventHandlers={{
              click: () => setSelectedShop(shop),
            }}
          />
        ))}

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

      {selectedShop && (
        <>
          <ShopDetailBanner
            shop={selectedShop}
            onClose={() => setSelectedShop(null)}
            onAddToBag={handleAddToBag}
          />
          {canNavigate && (
            <div className="fixed bottom-28 left-1/2 z-[2100] flex -translate-x-1/2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectByOffset(-1)}
                className="rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
              >
                ←前へ
              </button>
              <button
                type="button"
                onClick={() => handleSelectByOffset(1)}
                className="rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
              >
                次へ→
              </button>
            </div>
          )}
        </>
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
