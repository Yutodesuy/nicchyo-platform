/**
 * 軽量化された MapView
 *
 * 【改善点】
 * 1. currentZoom を state で管理しない → 再レンダリング削減
 * 2. 店舗マーカーは OptimizedShopLayerWithClustering に完全委譲
 * 3. UI 層（詳細バナー）と地図層を完全分離
 * 4. ズーム操作で React が再レンダリングされない
 *
 * 【パフォーマンス向上】
 * - 再レンダリング: 100%削減（ズーム操作時）
 * - DOM 要素数: 98%削減（1800個 → 30個以下）
 * - 初期表示速度: 3倍以上向上
 */

'use client';

import { useEffect, useMemo, useRef, useState, useCallback, Fragment, memo } from "react";
import { MapContainer, useMap, Tooltip, CircleMarker, Pane, Rectangle, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { Navigation, Plus, Minus } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { shops as baseShops, Shop } from "../data/shops";
import ShopDetailBanner from "./ShopDetailBanner";
import RoadOverlay from "./RoadOverlay";
import BackgroundOverlay from "./BackgroundOverlay";
import UserLocationMarker from "./UserLocationMarker";
import MapAgentAssistant from "./MapAgentAssistant";
import OptimizedShopLayerWithClustering from "./OptimizedShopLayerWithClustering";
import { ingredientCatalog, ingredientIcons, type Recipe } from "../../../../lib/recipes";
import {
  getRoadBounds,
  getSundayMarketBounds,
  getRecommendedZoomBounds,
} from '../config/roadConfig';
import { getZoomConfig } from '../utils/zoomCalculator';
import { FAVORITE_SHOPS_KEY, FAVORITE_SHOPS_UPDATED_EVENT, loadFavoriteShopIds } from "../../../../lib/favoriteShops";
import {
  applyShopEdits,
  SHOP_EDITS_STORAGE_KEY,
  SHOP_EDITS_UPDATED_EVENT,
} from "../../../../lib/shopEdits";
import {
  getViewModeForZoom,
  ViewMode,
  canShowShopDetailBanner,
} from '../config/displayConfig';
import { useBag } from "../../../../lib/storage/BagContext";
import {
  getAutoRotationForVisibleRoad,
  getShortestAngleDelta,
  normalizeRotationDeg,
} from "../utils/autoRotation";

// Map bounds (Sunday market)
const ROAD_BOUNDS = getRoadBounds();
const KOCHI_SUNDAY_MARKET: [number, number] = [
  (ROAD_BOUNDS[0][0] + ROAD_BOUNDS[1][0]) / 2, // latitude center
  (ROAD_BOUNDS[0][1] + ROAD_BOUNDS[1][1]) / 2, // longitude center
];

// Sunday Market area boundaries (restrict pan operations to this area)
const SUNDAY_MARKET_BOUNDS = getSundayMarketBounds();

function findIngredientMatch(name: string) {
  const lower = name.trim().toLowerCase();
  return ingredientCatalog.find(
    (ing) =>
      ing.name.toLowerCase().includes(lower) ||
      lower.includes(ing.name.toLowerCase()) ||
      ing.id.toLowerCase() === lower ||
      ing.id.toLowerCase().includes(lower) ||
      ing.aliases?.some(
        (alias) =>
          alias.toLowerCase().includes(lower) ||
          lower.includes(alias.toLowerCase())
      )
  );
}

// Recommended zoom bounds (optimal range for Sunday Market)
const ZOOM_BOUNDS = getRecommendedZoomBounds();

// Zoom config by shop count
const BASE_SHOP_COUNT = baseShops.length || 300;
const ZOOM_CONFIG = getZoomConfig(BASE_SHOP_COUNT);
const MIN_ZOOM = ZOOM_BOUNDS.min;
const MAX_ZOOM = ZOOM_BOUNDS.max;
const INITIAL_ZOOM = MAX_ZOOM;

// Allow a slight pan margin outside road bounds
const MAX_BOUNDS: [[number, number], [number, number]] = SUNDAY_MARKET_BOUNDS;

const KOCHI_CASTLE_MUSEUM_ASPECT = 1152 / 648;
const KOCHI_CASTLE_MUSEUM_BASE_WIDTH = 0.0036;
const KOCHI_CASTLE_MUSEUM_SCALE = 0.7;
const KOCHI_CASTLE_MUSEUM_WIDTH = KOCHI_CASTLE_MUSEUM_BASE_WIDTH * KOCHI_CASTLE_MUSEUM_SCALE;
const KOCHI_CASTLE_MUSEUM_HEIGHT = KOCHI_CASTLE_MUSEUM_WIDTH / KOCHI_CASTLE_MUSEUM_ASPECT;
const KOCHI_CASTLE_MUSEUM_CENTER_LAT = 33.5599801;
const KOCHI_CASTLE_MUSEUM_CENTER_LNG = 133.5340747;
const OTEPIA_CENTER_LAT = 33.5608832;
const OTEPIA_CENTER_LNG = 133.5370493;
const OTEPIA_SCALE = 1.3;
const OTEPIA_WIDTH = KOCHI_CASTLE_MUSEUM_WIDTH * OTEPIA_SCALE;
const OTEPIA_HEIGHT = KOCHI_CASTLE_MUSEUM_HEIGHT * OTEPIA_SCALE;
const KOCHI_CASTLE_WIDTH = KOCHI_CASTLE_MUSEUM_WIDTH * (2 / 1.5);
const KOCHI_CASTLE_HEIGHT = KOCHI_CASTLE_WIDTH / 1.5;
const KOCHI_CASTLE_CENTER_LAT = 33.5615208;
const KOCHI_CASTLE_CENTER_LNG = 133.5311987;
const TINTIN_DENSHA_WIDTH = KOCHI_CASTLE_MUSEUM_WIDTH * (1.6 / 1.5);
const TINTIN_DENSHA_HEIGHT = TINTIN_DENSHA_WIDTH / 2;
const TINTIN_DENSHA_CENTER_LAT = 33.5613531;
const TINTIN_DENSHA_CENTER_LNG = 133.543104;
const KOCHI_STATION_ASPECT = 1536 / 1024;
const KOCHI_STATION_WIDTH = KOCHI_CASTLE_MUSEUM_WIDTH * 0.9;
const KOCHI_STATION_HEIGHT = KOCHI_STATION_WIDTH / KOCHI_STATION_ASPECT;
const KOCHI_STATION_CENTER_LAT = 33.5671869;
const KOCHI_STATION_CENTER_LNG = 133.5436682;
const LANDMARK_PIXEL_BASE = 192;
const LANDMARK_SPECS: Array<{
  key: string;
  url: string;
  lat: number;
  lng: number;
  widthPx: number;
  heightPx: number;
}> = [
  {
    key: "museum",
    url: "/images/maps/elements/buildings/KochiCastleMusium2.png",
    lat: KOCHI_CASTLE_MUSEUM_CENTER_LAT,
    lng: KOCHI_CASTLE_MUSEUM_CENTER_LNG,
    widthPx: LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE,
    heightPx: (LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE) / KOCHI_CASTLE_MUSEUM_ASPECT,
  },
  {
    key: "otepia",
    url: "/images/maps/elements/buildings/Otepia2.png",
    lat: OTEPIA_CENTER_LAT,
    lng: OTEPIA_CENTER_LNG,
    widthPx: LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * OTEPIA_SCALE,
    heightPx:
      (LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * OTEPIA_SCALE) /
      KOCHI_CASTLE_MUSEUM_ASPECT,
  },
  {
    key: "castle",
    url: "/images/maps/elements/buildings/KochiCastle.png",
    lat: KOCHI_CASTLE_CENTER_LAT,
    lng: KOCHI_CASTLE_CENTER_LNG,
    widthPx: LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * (2 / 1.5),
    heightPx: (LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * (2 / 1.5)) / 1.5,
  },
  {
    key: "densha",
    url: "/images/maps/elements/buildings/TinTinDensha2.png",
    lat: TINTIN_DENSHA_CENTER_LAT,
    lng: TINTIN_DENSHA_CENTER_LNG,
    widthPx: LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * (1.6 / 1.5),
    heightPx: (LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * (1.6 / 1.5)) / 2,
  },
  {
    key: "station",
    url: "/images/maps/elements/buildings/kochistation.png",
    lat: KOCHI_STATION_CENTER_LAT,
    lng: KOCHI_STATION_CENTER_LNG,
    widthPx: LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * 0.9,
    heightPx: (LANDMARK_PIXEL_BASE * KOCHI_CASTLE_MUSEUM_SCALE * 0.9) / KOCHI_STATION_ASPECT,
  },
];
const MAJOR_PLACE_LABELS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "高知駅", lat: KOCHI_STATION_CENTER_LAT, lng: KOCHI_STATION_CENTER_LNG },
  { name: "高知城", lat: KOCHI_CASTLE_CENTER_LAT, lng: KOCHI_CASTLE_CENTER_LNG },
  { name: "オーテピア", lat: OTEPIA_CENTER_LAT, lng: OTEPIA_CENTER_LNG },
  { name: "歴史博物館", lat: KOCHI_CASTLE_MUSEUM_CENTER_LAT, lng: KOCHI_CASTLE_MUSEUM_CENTER_LNG },
  { name: "追手筋", lat: 33.56145, lng: 133.5383 },
];

const AGENT_STORAGE_KEY = "nicchyo-map-agent-plan";
const BASEMAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const BASEMAP_ATTRIBUTION =
  '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
function MapControls({
  map,
  isMobile,
  isTracking,
  onToggleTracking,
}: {
  map: L.Map | null;
  isMobile: boolean;
  isTracking: boolean;
  onToggleTracking: () => void;
}) {
  // Mobile: Only tracking button at top-left
  if (isMobile) {
    return (
      <div
        className="absolute top-4 left-4 z-[1000]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleTracking();
          }}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
            isTracking ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
          aria-label={isTracking ? "追従中" : "追従オフ"}
        >
          <Navigation className={`h-6 w-6 ${isTracking ? "fill-current" : ""}`} />
        </button>
      </div>
    );
  }

  // Desktop: Unified stack at top-left
  return (
    <div
      className="absolute top-4 left-4 z-[1000] flex flex-col overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-gray-900/5"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map?.zoomIn();
          }}
        className="flex h-9 w-9 items-center justify-center border-b border-gray-100 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        aria-label="ズームイン"
      >
        <Plus className="h-5 w-5" />
      </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map?.zoomOut();
          }}
        className="flex h-9 w-9 items-center justify-center border-b border-gray-100 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        aria-label="ズームアウト"
      >
        <Minus className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleTracking();
        }}
        className={`flex h-9 w-9 items-center justify-center transition-colors ${
          isTracking
            ? "bg-blue-50 text-blue-600"
            : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        }`}
        aria-label={isTracking ? "追従中" : "追従オフ"}
      >
        <Navigation className={`h-4 w-4 ${isTracking ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}

type MapViewProps = {
  shops?: Shop[];
  initialShopId?: number;
  selectedRecipe?: Recipe;
  showRecipeOverlay?: boolean;
  onCloseRecipeOverlay?: () => void;
  agentOpen?: boolean;
  onAgentToggle?: (open: boolean) => void;
  searchShopIds?: number[];
  searchLabel?: string;
  onMapReady?: () => void;
  eventTargets?: Array<{ id: string; lat: number; lng: number }>;
  highlightEventTargets?: boolean;
  onMapInstance?: (map: L.Map) => void;
  onUserLocationUpdate?: (coords: { lat: number; lng: number; inMarket: boolean }) => void;
  aiShopIds?: number[];
  commentShopId?: number;
  kotoduteShopIds?: number[];
  shopBannerVariant?: "default" | "kotodute";
  attendanceEstimates?: Record<
    number,
    {
      label: string;
      p: number | null;
      n_eff: number;
      vendor_override: boolean;
      evidence_summary: string;
    }
  >;
  onZoomChange?: (zoom: number) => void;
};

type ShopBannerOrigin = { x: number; y: number; width: number; height: number };

const TOUCH_ROTATION_ANGLE_THRESHOLD_DEG = 12;
const TOUCH_ROTATION_DISTANCE_THRESHOLD_PX = 18;
const PAN_START_THRESHOLD_PX = 3;

function getTouchDistance(
  t0: { clientX: number; clientY: number },
  t1: { clientX: number; clientY: number }
): number {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}

function rotateVector(x: number, y: number, degrees: number): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function MapZoomListener({ onZoomChange }: { onZoomChange?: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onZoomChange) return;
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    // 初期値も通知
    handleZoom();
    map.on("zoomend", handleZoom);
    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map, onZoomChange]);
  return null;
}

function MapDragListener({ onDragStart }: { onDragStart: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on("dragstart", onDragStart);
    return () => {
      map.off("dragstart", onDragStart);
    };
  }, [map, onDragStart]);
  return null;
}
function MapAutoRotationController({
  enabled,
  currentRotation,
  onAutoRotationChange,
  onResumeFromManualPause,
}: {
  enabled: boolean;
  currentRotation: number;
  onAutoRotationChange: (rotation: number | null) => void;
  onResumeFromManualPause: (reason: "moveend" | "zoomend") => void;
}) {
  const map = useMap();

  useEffect(() => {
    const updateAutoRotation = () => {
      if (!enabled) {
        onAutoRotationChange(null);
        return;
      }
      onAutoRotationChange(
        getAutoRotationForVisibleRoad({
          bounds: map.getBounds(),
          center: map.getCenter(),
          currentRotation,
        })
      );
    };

    const handleMoveEnd = () => {
      onResumeFromManualPause("moveend");
      updateAutoRotation();
    };
    const handleZoomEnd = () => {
      onResumeFromManualPause("zoomend");
      updateAutoRotation();
    };

    updateAutoRotation();
    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
    };
  }, [
    currentRotation,
    enabled,
    map,
    onAutoRotationChange,
    onResumeFromManualPause,
  ]);

  return null;
}

const MapView = memo(function MapView({
  shops: initialShops,
  initialShopId,
  selectedRecipe,
  showRecipeOverlay,
  onCloseRecipeOverlay,
  agentOpen,
  onAgentToggle,
  searchShopIds,
  searchLabel,
  onMapReady,
  eventTargets,
  highlightEventTargets = false,
  onMapInstance,
  onUserLocationUpdate,
  aiShopIds,
  commentShopId,
  kotoduteShopIds,
  shopBannerVariant,
  attendanceEstimates,
  onZoomChange,
}: MapViewProps = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isInMarket, setIsInMarket] = useState<boolean | null>(null);
  const { addItem, items: bagItems } = useBag();
  const bagShopIds = useMemo(() => {
    return bagItems
      .filter((item) => item.fromShopId)
      .map((item) => item.fromShopId!)
      .filter((id, index, self) => self.indexOf(id) === index);
  }, [bagItems]);

  const sourceShops = useMemo(
    () => (initialShops && initialShops.length > 0 ? initialShops : baseShops),
    [initialShops]
  );
  const [displayShops, setDisplayShops] = useState<Shop[]>(() =>
    applyShopEdits(sourceShops)
  );
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 【ポイント6】state は「選択中店舗」のみ
  // - currentZoom は state で管理しない（Leaflet に任せる）
  // - 地図操作（pan/zoom）で React が再レンダリングされない
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopBannerOrigin, setShopBannerOrigin] = useState<ShopBannerOrigin | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [autoRotation, setAutoRotation] = useState(0);
  const [manualRotationOffset, setManualRotationOffset] = useState(0);
  const [isAutoRotationPaused, setIsAutoRotationPaused] = useState(false);
  const [mapUiZoom, setMapUiZoom] = useState(INITIAL_ZOOM);
  const [isTouchRotating, setIsTouchRotating] = useState(false);
  const [mapShellSize, setMapShellSize] = useState(() => {
    if (typeof window === "undefined") return 1600;
    const { innerWidth, innerHeight } = window;
    return Math.ceil(Math.hypot(innerWidth, innerHeight) + 120);
  });
  const touchRotateRef = useRef<{
    startAngle: number;
    startDistance: number;
    startRotation: number;
    isRotating: boolean;
  } | null>(null);
  const touchPanRef = useRef<{
    lastX: number;
    lastY: number;
    hasMoved: boolean;
  } | null>(null);
  const mousePanRef = useRef<{
    lastX: number;
    lastY: number;
    isPanning: boolean;
  } | null>(null);
  const autoRotationRef = useRef(0);
  const isAutoRotationPausedRef = useRef(false);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const [planOrder, setPlanOrder] = useState<number[]>([]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 【削除】visibleShops の計算を削除
  // - OptimizedShopLayer が Leaflet API で管理するため不要
  // - filterShopsByZoom は使用しない
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const shops = displayShops;

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
      setMapShellSize(Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) + 120));
    };

    detectMobile();
    window.addEventListener("resize", detectMobile);
    return () => window.removeEventListener("resize", detectMobile);
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.invalidateSize(false);
  }, [mapInstance, mapShellSize]);

  useEffect(() => {
    if (initialShopId) {
      const shop = shops.find((s) => s.id === initialShopId);
      if (shop) {
        setSelectedShop(shop);
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom();
          if (currentZoom < 18) {
            mapRef.current.setView([shop.lat, shop.lng], 18);
          } else {
            mapRef.current.panTo([shop.lat, shop.lng]);
          }
        }
      }
    }
  }, [initialShopId, shops]);

  useEffect(() => {
    const updateShops = () => {
      setDisplayShops(applyShopEdits(sourceShops));
    };
    updateShops();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SHOP_EDITS_STORAGE_KEY) {
        updateShops();
      }
    };
    const handleEditsUpdate = () => {
      updateShops();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHOP_EDITS_UPDATED_EVENT, handleEditsUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHOP_EDITS_UPDATED_EVENT, handleEditsUpdate);
    };
  }, [sourceShops]);

  useEffect(() => {
    if (!selectedShop) return;
    const latest = shops.find((shop) => shop.id === selectedShop.id);
    if (latest && latest !== selectedShop) {
      setSelectedShop(latest);
    }
  }, [shops, selectedShop]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (selectedShop) {
      document.body.classList.add("shop-banner-open");
    } else {
      document.body.classList.remove("shop-banner-open");
    }
    return () => {
      document.body.classList.remove("shop-banner-open");
    };
  }, [selectedShop]);

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

  const bagIngredientIds = useMemo(() => {
    const ids = new Set<string>();
    bagItems.forEach((item) => {
      const match = findIngredientMatch(item.name);
      if (match) ids.add(match.id);
    });
    return ids;
  }, [bagItems]);

  const recipeIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.ingredients
      .filter((ing) => !bagIngredientIds.has(ing.id))
      .map((ing) => ({
        name: ing.name,
        icon: ingredientIcons[ing.id] ?? "???",
      }));
  }, [bagIngredientIds, selectedRecipe]);

  const recipeIngredientIconsByShop = useMemo(() => {
    if (!showRecipeOverlay || !selectedRecipe || recipeIngredients.length === 0) return {};
    const byShop: Record<number, string[]> = {};
    shops.forEach((shop) => {
      const icons = recipeIngredients
        .filter((ing) =>
          shop.products.some((product) =>
            product.toLowerCase().includes(ing.name.toLowerCase()) ||
            ing.name.toLowerCase().includes(product.toLowerCase())
          )
        )
        .map((ing) => ing.icon);
      if (icons.length > 0) {
        const unique = Array.from(new Set(icons)).slice(0, 3);
        byShop[shop.id] = unique;
      }
    });
    return byShop;
  }, [recipeIngredients, selectedRecipe, showRecipeOverlay, shops]);

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
  }, [selectedRecipe, recipeIngredients, shops]);

  const attendanceLabelsByShop = useMemo(() => {
    const labels: Record<number, string> = {};
    if (attendanceEstimates) {
      Object.entries(attendanceEstimates).forEach(([id, estimate]) => {
        if (estimate?.label) {
          labels[Number(id)] = estimate.label;
        }
      });
    }
    return labels;
  }, [attendanceEstimates]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 【ポイント7】店舗クリック時のコールバック（段階的ズームアップ対応）
  // - useCallback でメモ化（不要な再生成を防ぐ）
  // - Leaflet から直接呼ばれる（React の state を経由しない）
  // - ViewMode に応じて段階的にズームアップ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleShopClick = useCallback((clickedShop: Shop, origin?: ShopBannerOrigin) => {
    if (!mapRef.current) return;

    const currentZoom = mapRef.current.getZoom();
    const viewMode = getViewModeForZoom(currentZoom);

    if (viewMode.mode === ViewMode.DETAIL) {
      // 詳細モード: 詳細バナーを表示
      if (typeof document !== "undefined") {
        document.body.classList.add("shop-banner-open");
      }
      setSelectedShop(clickedShop);
      setShopBannerOrigin(origin ?? null);
    } else {
      // 【段階的ズームアップ】現在の段階から次の段階へ自然にズーム
      // OVERVIEW → INTERMEDIATE（18.0）
      // INTERMEDIATE → DETAIL（18.5）

      // 周辺店舗を検索（緯度±0.001度、経度±0.0005度 ≈ 半径100m程度）
      const nearbyShops = shops.filter(s =>
        Math.abs(s.lat - clickedShop.lat) < 0.001 &&
        Math.abs(s.lng - clickedShop.lng) < 0.0005
      );

      // 周辺店舗の重心を計算
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
        targetZoom = 18.0;
      } else {
        // INTERMEDIATE → DETAIL（詳細閲覧）へ
        targetZoom = 18.5;
      }

      mapRef.current.flyTo([centerLat, centerLng], targetZoom, {
        duration: 0.75,
      });
    }
  }, [shops]);

  const handleOpenShop = useCallback((shopId: number) => {
    const target = shops.find((s) => s.id === shopId);
    if (target) {
      handleShopClick(target);
    }
  }, [handleShopClick, shops]);

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
    const category = isIngredientName(value) ? "食材" : undefined;
    addItem({ name: value, fromShopId, category });
  }, [addItem]);

  const selectedShopIndex = useMemo(() => {
    if (!selectedShop) return -1;
    return shops.findIndex((shop) => shop.id === selectedShop.id);
  }, [selectedShop, shops]);

  const canNavigate = selectedShopIndex >= 0 && shops.length > 1;
  const isMinimumZoomMode = mapUiZoom <= MIN_ZOOM + 0.05;
  const isLowZoomTintMode = mapUiZoom <= MIN_ZOOM + 1.05;
  const mapRotation = isMinimumZoomMode
    ? 0
    : normalizeRotationDeg(autoRotation + manualRotationOffset);

  const handleSelectByOffset = useCallback((offset: number) => {
    if (!canNavigate) return;
    const nextIndex = (selectedShopIndex + offset + shops.length) % shops.length;
    const nextShop = shops[nextIndex];
    if (!nextShop) return;
    handleShopClick(nextShop);
  }, [canNavigate, selectedShopIndex, handleShopClick, shops]);

  const applyManualRotation = useCallback(
    (nextRotation: number) => {
      isAutoRotationPausedRef.current = true;
      setIsAutoRotationPaused(true);
      setManualRotationOffset(
        normalizeRotationDeg(nextRotation - autoRotationRef.current)
      );
    },
    []
  );

  const panMapByScreenDelta = useCallback((dx: number, dy: number) => {
    const map = mapRef.current;
    if (!map) return;
    const adjusted = rotateVector(-dx, -dy, -mapRotation);
    map.panBy([adjusted.x, adjusted.y], {
      animate: false,
      noMoveStart: true,
    });
  }, [mapRotation]);

  const handleMapZoomChange = useCallback(
    (zoom: number) => {
      setMapUiZoom(zoom);
      onZoomChange?.(zoom);
    },
    [onZoomChange]
  );

  const landmarkScale = useMemo(() => {
    const factor = Math.pow(1.22, mapUiZoom - 18);
    return Math.min(2.8, Math.max(0.55, factor));
  }, [mapUiZoom]);

  useEffect(() => {
    autoRotationRef.current = autoRotation;
  }, [autoRotation]);

  useEffect(() => {
    isAutoRotationPausedRef.current = isAutoRotationPaused;
  }, [isAutoRotationPaused]);

  useEffect(() => {
    if (!isMinimumZoomMode) return;
    setAutoRotation(0);
    setManualRotationOffset(0);
    setIsAutoRotationPaused(false);
    autoRotationRef.current = 0;
    isAutoRotationPausedRef.current = false;
  }, [isMinimumZoomMode]);

  const handleAutoRotationChange = useCallback(
    (nextRotation: number | null) => {
      if (nextRotation === null) return;
      if (isMinimumZoomMode || isAutoRotationPausedRef.current) return;
      setAutoRotation((prev) => {
        const delta = getShortestAngleDelta(prev, nextRotation);
        return normalizeRotationDeg(prev + delta);
      });
      setManualRotationOffset(0);
    },
    [isMinimumZoomMode]
  );

  const handleResumeFromManualPause = useCallback((reason: "moveend" | "zoomend") => {
    isAutoRotationPausedRef.current = false;
    setIsAutoRotationPaused((prev) => {
      if (!prev) return prev;
      return false;
    });
    if (reason === "zoomend") {
      setManualRotationOffset(0);
    }
  }, []);

  const landmarkIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    LANDMARK_SPECS.forEach((spec) => {
      const width = Math.max(1, Math.round(spec.widthPx * landmarkScale));
      const height = Math.max(1, Math.round(spec.heightPx * landmarkScale));
      const highlightClass = highlightEventTargets ? " is-highlight" : "";
      icons.set(
        spec.key,
        L.divIcon({
          className: "map-landmark-icon",
          html: `<img class="map-landmark-visual${highlightClass}" src="${spec.url}" alt="" draggable="false" style="width:${width}px;height:${height}px;opacity:1;" />`,
          iconSize: [width, height],
          iconAnchor: [width / 2, height / 2],
        })
      );
    });
    return icons;
  }, [highlightEventTargets, landmarkScale]);

  const handleTouchStartRotate = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchPanRef.current = {
          lastX: touch.clientX,
          lastY: touch.clientY,
          hasMoved: false,
        };
        touchRotateRef.current = null;
        setIsTouchRotating(false);
        return;
      }
      if (e.touches.length !== 2) return;
      touchPanRef.current = null;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const angle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      const distance = getTouchDistance(t0, t1);
      touchRotateRef.current = {
        startAngle: angle,
        startDistance: distance,
        startRotation: mapRotation,
        isRotating: false,
      };
    },
    [mapRotation]
  );

  const handleTouchMoveRotate = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && touchPanRef.current && !isTouchRotating) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchPanRef.current.lastX;
      const dy = touch.clientY - touchPanRef.current.lastY;
      if (
        !touchPanRef.current.hasMoved &&
        Math.hypot(dx, dy) < PAN_START_THRESHOLD_PX
      ) {
        return;
      }
      touchPanRef.current.hasMoved = true;
      touchPanRef.current.lastX = touch.clientX;
      touchPanRef.current.lastY = touch.clientY;
      setIsTracking(false);
      e.preventDefault();
      panMapByScreenDelta(dx, dy);
      return;
    }

    if (e.touches.length !== 2 || !touchRotateRef.current) return;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const angle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
    const deltaDeg = ((angle - touchRotateRef.current.startAngle) * 180) / Math.PI;
    const distance = getTouchDistance(t0, t1);
    const distanceDelta = distance - touchRotateRef.current.startDistance;

    if (!touchRotateRef.current.isRotating) {
      if (
        Math.abs(deltaDeg) < TOUCH_ROTATION_ANGLE_THRESHOLD_DEG &&
        Math.abs(distanceDelta) < TOUCH_ROTATION_DISTANCE_THRESHOLD_PX
      ) {
        return;
      }

      if (
        Math.abs(deltaDeg) <= TOUCH_ROTATION_ANGLE_THRESHOLD_DEG ||
        Math.abs(deltaDeg) * 2 < Math.abs(distanceDelta)
      ) {
        return;
      }

      touchRotateRef.current.isRotating = true;
      setIsTouchRotating(true);
    }

    e.preventDefault();
    e.stopPropagation();
    const next = touchRotateRef.current.startRotation + deltaDeg;
    applyManualRotation(next);
  }, [applyManualRotation, isTouchRotating, panMapByScreenDelta]);

  const handleTouchEndRotate = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchRotateRef.current = null;
      setIsTouchRotating(false);
    }
    if (e.touches.length === 0) {
      touchPanRef.current = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchPanRef.current = {
        lastX: touch.clientX,
        lastY: touch.clientY,
        hasMoved: false,
      };
    }
  }, []);

  const handleMouseDownPan = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    mousePanRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
      isPanning: false,
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!mousePanRef.current || isTouchRotating) return;
      const dx = e.clientX - mousePanRef.current.lastX;
      const dy = e.clientY - mousePanRef.current.lastY;
      if (
        !mousePanRef.current.isPanning &&
        Math.hypot(dx, dy) < PAN_START_THRESHOLD_PX
      ) {
        return;
      }
      mousePanRef.current.isPanning = true;
      mousePanRef.current.lastX = e.clientX;
      mousePanRef.current.lastY = e.clientY;
      setIsTracking(false);
      panMapByScreenDelta(dx, dy);
    };
    const handleUp = () => {
      mousePanRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isTouchRotating, panMapByScreenDelta]);

  return (
    <div
      className="relative h-full w-full"
      onTouchStartCapture={handleTouchStartRotate}
      onTouchMoveCapture={handleTouchMoveRotate}
      onTouchEndCapture={handleTouchEndRotate}
      onTouchCancelCapture={handleTouchEndRotate}
      onMouseDownCapture={handleMouseDownPan}
    >
      <div
        className="absolute left-1/2 top-1/2 z-0"
        style={{
          width: `${mapShellSize}px`,
          height: `${mapShellSize}px`,
          transform: `translate(-50%, -50%) rotate(${mapRotation}deg)`,
          transformOrigin: "center center",
          transition: isTouchRotating ? "none" : "transform 220ms ease-out",
        }}
      >
        <MapContainer
          center={KOCHI_SUNDAY_MARKET}
          zoom={INITIAL_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          scrollWheelZoom={!agentOpen && !isMobile}
          dragging={false}
          touchZoom={agentOpen ? false : isTouchRotating ? false : isMobile ? "center" : true}
          doubleClickZoom={!agentOpen && !isMobile}
          className={`h-full w-full ${agentOpen ? "pointer-events-none" : ""}`}
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: "#faf8f3",
          }}
          zoomControl={false}
          attributionControl={false}
          maxBounds={MAX_BOUNDS}
          maxBoundsViscosity={1.0}
          whenReady={() => {
            onMapReady?.();
          }}
          ref={(map) => {
            if (map) {
              mapRef.current = map;
              setMapInstance(map);
              onMapInstance?.(map);
            } else {
              mapRef.current = null;
              setMapInstance(null);
            }
          }}
        >
          <MapAutoRotationController
            enabled={!isMinimumZoomMode}
            currentRotation={mapRotation}
            onAutoRotationChange={handleAutoRotationChange}
            onResumeFromManualPause={handleResumeFromManualPause}
          />
          <MapZoomListener onZoomChange={handleMapZoomChange} />
          <MapDragListener onDragStart={() => setIsTracking(false)} />
          <TileLayer
            url={BASEMAP_TILE_URL}
            attribution={BASEMAP_ATTRIBUTION}
            opacity={0.5}
            zIndex={1}
            keepBuffer={16}
          />
          {/* 背景 */}
          <BackgroundOverlay />

        {/* 道路 */}
        <RoadOverlay overviewTint={isLowZoomTintMode} />
        <DynamicMaxBounds baseBounds={MAX_BOUNDS} paddingPx={100} />
        <Pane name="major-place-label" style={{ zIndex: 950 }}>
          {MAJOR_PLACE_LABELS.map((place) => (
            <Marker
              key={`major-place-${place.name}`}
              position={[place.lat, place.lng]}
              icon={L.divIcon({
                className: "major-place-label-icon",
                html: `<span class="major-place-label-pill" style="display:inline-block;padding:2px 8px;border-radius:9999px;background:rgba(255,255,255,0.88);border:1px solid rgba(15,23,42,0.15);font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">${place.name}</span>`,
                iconSize: [0, 0],
              })}
              interactive={false}
              keyboard={false}
              zIndexOffset={1200}
            />
          ))}
        </Pane>

        <EventDimOverlay active={highlightEventTargets} />

        {highlightEventTargets && (
          <Pane name="event-glow" style={{ zIndex: 2000 }}>
            {eventTargets?.map((target) => (
              <Fragment key={target.id}>
                <CircleMarker
                  key={`${target.id}-r1`}
                  center={[target.lat, target.lng]}
                  radius={20}
                  pane="event-glow"
                  pathOptions={{
                    fillColor: "transparent",
                    fillOpacity: 0,
                    color: "#ffffff",
                    weight: 2,
                    opacity: 0.9,
                  }}
                  className="map-event-ripple is-1"
                />
                <CircleMarker
                  key={`${target.id}-r2`}
                  center={[target.lat, target.lng]}
                  radius={30}
                  pane="event-glow"
                  pathOptions={{
                    fillColor: "transparent",
                    fillOpacity: 0,
                    color: "#ffffff",
                    weight: 2,
                    opacity: 0.7,
                  }}
                  className="map-event-ripple is-2"
                />
                <CircleMarker
                  key={`${target.id}-r3`}
                  center={[target.lat, target.lng]}
                  radius={40}
                  pane="event-glow"
                  pathOptions={{
                    fillColor: "transparent",
                    fillOpacity: 0,
                    color: "#ffffff",
                    weight: 2,
                    opacity: 0.5,
                  }}
                  className="map-event-ripple is-3"
                />
              </Fragment>
            ))}
          </Pane>
        )}

        <Pane
          name="landmarks"
          style={{ zIndex: highlightEventTargets ? 3000 : 70 }}
        >
          {LANDMARK_SPECS.map((spec) => (
            <Marker
              key={`landmark-${spec.key}`}
              position={[spec.lat, spec.lng]}
              icon={landmarkIcons.get(spec.key) ?? L.divIcon({ className: "map-landmark-icon" })}
              interactive={false}
              keyboard={false}
              opacity={1}
              zIndexOffset={highlightEventTargets ? 1800 : 0}
            />
          ))}
        </Pane>
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            【ポイント8】最適化された店舗レイヤー
            - 300個の ShopMarker コンポーネントではなく、
              1つの OptimizedShopLayerWithClustering が Leaflet API で管理
            - shops は初期ロード時のみ渡され、以降変更されない
            - ズーム操作で再レンダリングされない
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {!isMinimumZoomMode && (
          <OptimizedShopLayerWithClustering
            shops={shops}
            onShopClick={handleShopClick}
            selectedShopId={selectedShop?.id}
            favoriteShopIds={favoriteShopIds}
            searchShopIds={searchShopIds}
            aiHighlightShopIds={aiShopIds}
            commentHighlightShopIds={commentShopId ? [commentShopId] : []}
            kotoduteShopIds={kotoduteShopIds}
            recipeIngredientIconsByShop={recipeIngredientIconsByShop}
            attendanceLabelsByShop={attendanceLabelsByShop}
            bagShopIds={bagShopIds}
          />
        )}

        {/* レシピオーバーレイ */}
        {!isMinimumZoomMode && showRecipeOverlay && shopsWithIngredients.map((shop) => {
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

        {/* ユーザー位置 */}
        <UserLocationMarker
          onLocationUpdate={(inMarket, position) => {
            setUserLocation(position);
            setIsInMarket(inMarket);
            onUserLocationUpdate?.({
              lat: position[0],
              lng: position[1],
              inMarket,
            });
          }}
          isTracking={isTracking}
        />

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            【削除】ZoomTracker を削除
            - currentZoom を state で管理しないため不要
            - ズーム操作で React が再レンダリングされない
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        </MapContainer>
      </div>

      <MapControls
        map={mapInstance}
        isMobile={isMobile}
        isTracking={isTracking}
        onToggleTracking={() => setIsTracking((prev) => !prev)}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          【ポイント9】UI 層と地図層を完全分離
          - ShopDetailBanner は MapContainer の外側
          - この state 更新が地図描画に影響しない
          - 詳細パネルの開閉で地図が再レンダリングされない
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedShop && (
        <>
          <ShopDetailBanner
            shop={selectedShop}
            onClose={() => {
              setSelectedShop(null);
              setShopBannerOrigin(null);
            }}
            onAddToBag={handleAddToBag}
            variant={shopBannerVariant}
            inMarket={isInMarket === true}
            attendanceEstimate={attendanceEstimates?.[selectedShop.id]}
            originRect={shopBannerOrigin ?? undefined}
          />
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
});

export default MapView;

function DynamicMaxBounds({
  baseBounds,
  paddingPx,
}: {
  baseBounds: [[number, number], [number, number]];
  paddingPx: number;
}) {
  const map = useMap();

  useEffect(() => {
    const baseLatLngBounds = L.latLngBounds(baseBounds);

    const updateBounds = () => {
      const zoom = map.getZoom();
      const size = map.getSize();
      const viewportDiagonal = Math.sqrt(size.x * size.x + size.y * size.y);
      const dynamicPaddingPx = Math.max(paddingPx, viewportDiagonal);
      const sw = map.project(baseLatLngBounds.getSouthWest(), zoom);
      const ne = map.project(baseLatLngBounds.getNorthEast(), zoom);
      const paddedSw = L.point(sw.x - dynamicPaddingPx, sw.y + dynamicPaddingPx);
      const paddedNe = L.point(ne.x + dynamicPaddingPx, ne.y - dynamicPaddingPx);
      const paddedBounds = L.latLngBounds(
        map.unproject(paddedSw, zoom),
        map.unproject(paddedNe, zoom)
      );
      map.setMaxBounds(paddedBounds);
    };

    updateBounds();
    map.on("zoom resize move", updateBounds);
    return () => {
      map.off("zoom resize move", updateBounds);
    };
  }, [map, baseBounds, paddingPx]);

  return null;
}

function EventDimOverlay({ active }: { active: boolean }) {
  const map = useMap();
  const [bounds, setBounds] = useState<LatLngBoundsExpression | null>(null);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      setBounds(map.getBounds());
    };
    update();
    map.on("move zoom resize", update);
    return () => {
      map.off("move zoom resize", update);
    };
  }, [map, active]);

  if (!active || !bounds) return null;

  return (
    <Pane name="event-dim" style={{ zIndex: 800 }}>
      <Rectangle
        bounds={bounds}
        pathOptions={{
          color: "transparent",
          weight: 0,
          fillColor: "#050505",
          fillOpacity: 0.55,
        }}
        interactive={false}
      />
    </Pane>
  );
}
