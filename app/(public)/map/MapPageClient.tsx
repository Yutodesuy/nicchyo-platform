"use client";

import NavigationBar from "../../components/NavigationBar";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import SearchClient from "../search/SearchClient";
import type { Map as LeafletMap } from "leaflet";
import { pickDailyRecipe, recipes, type Recipe } from "../../../lib/recipes";
import { clearSearchMapPayload, loadAiMapPayload, loadSearchMapPayload } from "../../../lib/searchMapStorage";
import { getShopBannerImage } from "../../../lib/shopImages";
const GrandmaChatter = dynamic(() => import("./components/GrandmaChatter"), { ssr: false });
import { useTimeBadge } from "./hooks/useTimeBadge";
import { BadgeModal } from "./components/BadgeModal";
import { useAuth } from "../../../lib/auth/AuthContext";
import type { Shop } from "./data/shops";
import type { Landmark } from "./types/landmark";
import type { MapRoute } from "./types/mapRoute";
import { grandmaComments, mapTutorialComments } from "./data/grandmaComments";
import { loadKotodute } from "../../../lib/kotoduteStorage";
import { useMapLoading } from "../../components/MapLoadingProvider";
import { grandmaEvents } from "./data/grandmaEvents";
import { recordMarketEnter, recordMarketExit } from "../../../lib/storage/marketStats";
import { buildSearchIndex } from "../search/lib/searchIndex";
import { useShopSearch } from "../search/hooks/useShopSearch";
import { getOrCreateConsultVisitorKey } from "../../../lib/consultVisitorKey";
import MapCharacterConsult from "./components/MapCharacterConsult";
import {
  buildCouponVendorIdsByType,
  COUPON_LOTTERY_PENDING_KEY,
  fetchCouponTypes,
  fetchMyCoupons,
  getEligibleCouponVendorIds,
  todayJstString,
} from "../../../lib/coupons/client";
import type { CouponTypeWithParticipants, MyCouponsResponse } from "../../../lib/coupons/types";

const TUTORIAL_STORAGE_KEY = "nicchyo-tutorial-progress";

const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
});

type MapPageClientProps = {
  shops: Shop[];
  landmarks: Landmark[];
  mapRoute: MapRoute;
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
};

const NEARBY_RADIUS_METERS = 120;
const NEARBY_MAX_SHOPS = 10;
const INTRO_TAP_HINT = "";
const INTRO_STRENGTH_FALLBACK =
  "あら、ここのお店、最近行ってないねぇ。今日は何が出ちゅうか、ちょっと見てきてくれん？";

function buildShopIntroText(shop: Shop): string {
  const name = shop.name?.trim() || `お店${shop.id}`;
  const strength = shop.shopStrength?.trim() || INTRO_STRENGTH_FALLBACK;
  return `${name}\n${strength}${INTRO_TAP_HINT}`;
}

function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function interleaveComments<T>(primary: T[], secondary: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(primary.length, secondary.length);
  for (let i = 0; i < max; i += 1) {
    if (primary[i]) result.push(primary[i]);
    if (secondary[i]) result.push(secondary[i]);
  }
  return result;
}

function shuffleArray<T>(items: T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function MapPageClient({
  shops,
  landmarks,
  mapRoute,
  shopBannerVariant = "default",
  attendanceEstimates,
}: MapPageClientProps) {
  const showGrandma = false;
  const searchParams = useSearchParams();
  const router = useRouter();
  const activePanel = searchParams?.get("panel") === "search" ? "search" : null;
  const { user, permissions } = useAuth();
  const { markMapReady } = useMapLoading();
  const initialShopIdParam = searchParams?.get("shop");
  const isAiFocusMode = searchParams?.get("ai") === "1";
  const searchParamsKey = searchParams?.toString() ?? "";
  const initialShopId = initialShopIdParam ? Number(initialShopIdParam) : undefined;
  const [recommendedRecipe, setRecommendedRecipe] = useState<Recipe | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showRecipeOverlay, setShowRecipeOverlay] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const { priority, clearPriority } = useTimeBadge();
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showVendorPrompt, setShowVendorPrompt] = useState(false);
  const [vendorShopName, setVendorShopName] = useState<string | null>(null);
  const [isHoldActive, setIsHoldActive] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [eventMessageIndex, setEventMessageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isInMarket, setIsInMarket] = useState<boolean | null>(null);
  useEffect(() => {
    if (isInMarket === true) recordMarketEnter();
    else if (isInMarket === false) recordMarketExit();
  }, [isInMarket]);
  // マーカーglow用（コメント表示中のお店を追跡）
  const [commentHighlightShopId, setCommentHighlightShopId] = useState<number | null>(null);
  // スポットライトモード用（タップ時のみ、2秒で自動解除）
  const [spotlightShopId, setSpotlightShopId] = useState<number | null>(null);
  const spotlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activateSpotlight = useCallback((shopId: number) => {
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    setSpotlightShopId(shopId);
    spotlightTimerRef.current = setTimeout(() => {
      setSpotlightShopId(null);
      spotlightTimerRef.current = null;
    }, 2000);
  }, []);
  const [currentZoom, setCurrentZoom] = useState<number>(21); // Default max zoom
  const [tutorialProgress, setTutorialProgress] = useState<number>(0);
  const [isShopBannerOpen, setIsShopBannerOpen] = useState(false);
  const [couponData, setCouponData] = useState<MyCouponsResponse | null>(null);
  const [couponTypes, setCouponTypes] = useState<CouponTypeWithParticipants[]>([]);
  const [mapSearchCouponTypeId, setMapSearchCouponTypeId] = useState<string | null>(null);
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(TUTORIAL_STORAGE_KEY) ?? "0", 10);
    setTutorialProgress(Math.min(10, stored));
  }, []);

  const refreshCouponData = useCallback(async (visitorKey?: string) => {
    const resolvedVisitorKey = visitorKey ?? getOrCreateConsultVisitorKey();
    if (!resolvedVisitorKey) return;
    try {
      const next = await fetchMyCoupons(resolvedVisitorKey, todayJstString());
      setCouponData(next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCouponTypes()
      .then((nextCouponTypes) => {
        setCouponTypes(nextCouponTypes.filter((couponType) => couponType.participant_count > 0));
      })
      .catch(() => {
        setCouponTypes([]);
      });
  }, []);

  // 初回クーポン発行（マップを開いた日に1回だけ。失敗しても無視する）
  useEffect(() => {
    const visitorKey = getOrCreateConsultVisitorKey();
    if (!visitorKey) return;
    const marketDate = todayJstString();
    fetch("/api/coupons/issue-initial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_key: visitorKey, market_date: marketDate }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { issued?: boolean };
      })
      .then((payload) => {
        if (payload?.issued && typeof window !== "undefined") {
          window.localStorage.setItem(COUPON_LOTTERY_PENDING_KEY, "1");
        }
      })
      .catch(() => {
        // 通信エラーは無視（クーポンは副次機能）
      })
      .finally(() => {
        refreshCouponData(visitorKey);
      });
  }, [refreshCouponData]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const handleFocus = () => {
      refreshCouponData();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCouponData();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCouponData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const updateBannerState = () => {
      setIsShopBannerOpen(document.body.classList.contains("shop-banner-open"));
    };
    updateBannerState();
    const observer = new MutationObserver(updateBannerState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  const dragControls = useDragControls();
  const [mapCharacterConsultActive, setMapCharacterConsultActive] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const introFocusTimerRef = useRef<number | null>(null);
  const [searchMarkerPayload, setSearchMarkerPayload] = useState<{
    ids: number[];
    label: string;
  } | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchCategory, setMapSearchCategory] = useState<string | null>(null);
  const couponEligibleVendorIds = useMemo(
    () => getEligibleCouponVendorIds(couponData),
    [couponData]
  );
  const couponVendorIdsByType = useMemo(
    () => buildCouponVendorIdsByType(couponTypes),
    [couponTypes]
  );
  const mapSearchCouponVendorIds = useMemo(
    () =>
      mapSearchCouponTypeId
        ? couponVendorIdsByType.get(mapSearchCouponTypeId)
        : undefined,
    [couponVendorIdsByType, mapSearchCouponTypeId]
  );
  const mapSearchCouponType = useMemo(
    () => couponTypes.find((couponType) => couponType.id === mapSearchCouponTypeId) ?? null,
    [couponTypes, mapSearchCouponTypeId]
  );
  const mapSearchIndex = useMemo(() => buildSearchIndex(shops), [shops]);
  const mapSearchResults = useShopSearch({
    shops,
    searchIndex: mapSearchIndex,
    textQuery: mapSearchQuery,
    category: mapSearchCategory,
    chome: null,
    couponVendorIds: mapSearchCouponVendorIds,
  });
  const activeCouponTypeId = couponData?.active_coupon?.coupon_type_id ?? undefined;
  const stampedVendorIds = useMemo(
    () => couponData?.stamps?.map((s) => s.vendor_id) ?? [],
    [couponData]
  );
  const mapSearchLabel = useMemo(() => {
    const parts: string[] = [];
    if (mapSearchQuery.trim()) parts.push(mapSearchQuery.trim());
    if (mapSearchCategory) parts.push(mapSearchCategory);
    if (mapSearchCouponType) parts.push(`${mapSearchCouponType.emoji} ${mapSearchCouponType.name}`);
    return parts.join(" / ");
  }, [mapSearchCategory, mapSearchCouponType, mapSearchQuery]);
  const mapSearchShopIds = useMemo(
    () =>
      mapSearchQuery.trim() || mapSearchCategory || mapSearchCouponTypeId
        ? mapSearchResults.map((s) => s.id)
        : undefined,
    [mapSearchCategory, mapSearchCouponTypeId, mapSearchQuery, mapSearchResults],
  );
  const [aiMarkerPayload, setAiMarkerPayload] = useState<{
    ids: number[];
    label: string;
  } | null>(null);
  const clearMapSearchState = useCallback(() => {
    clearSearchMapPayload();
    setSearchMarkerPayload(null);
    setMapSearchQuery('');
    setMapSearchCategory(null);
    setMapSearchCouponTypeId(null);
  }, []);
  const closeMapCharacterConsult = useCallback(() => {
    setMapCharacterConsultActive(false);
    setAiMarkerPayload(null);
  }, []);
  const startMapCharacterConsult = useCallback(() => {
    clearMapSearchState();
    setMapCharacterConsultActive(true);
    router.replace('/map');
  }, [clearMapSearchState, router]);
  const closeMapInteractionMode = useCallback(() => {
    clearMapSearchState();
    closeMapCharacterConsult();
    router.push('/map');
  }, [clearMapSearchState, closeMapCharacterConsult, router]);

  // 旧 URL 互換: /map?panel=consult が来ても直接 AI 相談モードを起動する
  useEffect(() => {
    if (searchParams?.get("panel") === "consult") {
      startMapCharacterConsult();
      return;
    }
    if (activePanel === 'search') {
      closeMapCharacterConsult();
    }
  }, [activePanel, closeMapCharacterConsult, searchParams, startMapCharacterConsult]);

  const vendorShopId = user?.vendorId ?? null;
  const activeEvent = useMemo(() => {
    if (!showGrandma) return null;
    return grandmaEvents.find((event) => event.id === activeEventId) ?? null;
  }, [activeEventId, showGrandma]);
  const aiImageTargets = useMemo(() => {
    return grandmaEvents
      .map((event) => {
        const image = event.messages.find((message) => message.image)?.image;
        if (!image) return null;
        return { image, location: event.location };
      })
      .filter(Boolean) as Array<{
      image: string;
      location: { lat: number; lng: number; radiusMeters: number };
    }>;
  }, []);
  const shopById = useMemo(() => {
    const map = new Map<number, Shop>();
    shops.forEach((shop) => map.set(shop.id, shop));
    return map;
  }, [shops]);

  const prefetchShopImage = useCallback(
    (shopId: number) => {
      if (typeof window === "undefined") return;
      const shop = shopById.get(shopId);
      if (!shop) return;
      const bannerSeed = shop.position ?? shop.id;
      const src = shop.images?.main ?? getShopBannerImage(shop.category, bannerSeed);
      if (!src) return;
      const img = new Image();
      img.src = src;
    },
    [shopById]
  );
  const activeMessage = activeEvent?.messages[eventMessageIndex] ?? null;
  const eventTargets = useMemo(() => {
    if (!showGrandma) return [];
    return grandmaEvents.map((event) => ({
      id: event.id,
      lat: event.location.lat,
      lng: event.location.lng,
    }));
  }, [showGrandma]);
  const handleMapInstance = useCallback((map: LeafletMap) => {
    mapRef.current = map;
    setMapInstance(map);
  }, []);

  const vendorShop = useMemo(() => {
    if (!vendorShopId) return null;
    return shops.find((shop) => shop.id === vendorShopId) ?? null;
  }, [shops, vendorShopId]);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && localStorage.getItem("nicchyo-daily-recipe-dismissed");
    const todayId = typeof window !== "undefined" && localStorage.getItem("nicchyo-daily-recipe-id");
    const daily = pickDailyRecipe();
    if (!todayId) {
      localStorage.setItem("nicchyo-daily-recipe-id", daily.id);
    }
    if (!dismissed) {
      setRecommendedRecipe(daily);
      // setShowBanner(true);
    } else if (todayId) {
      const match = pickDailyRecipe();
      setRecommendedRecipe(match);
    }
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const recipeId = searchParams.get("recipe");
    if (!recipeId) return;
    const match = recipes.find((recipe) => recipe.id === recipeId);
    if (!match) return;
    setRecommendedRecipe(match);
    setShowRecipeOverlay(true);
  }, [searchParams, searchParamsKey]);

  useEffect(() => {
    if (!searchParams) return;
    const enabled = searchParams.get("search");
    if (!enabled) {
      setSearchMarkerPayload(null);
      return;
    }
    const labelParam = searchParams.get("label") ?? "";
    const payload = loadSearchMapPayload();
    if (payload) {
      setSearchMarkerPayload(payload);
    } else if (labelParam) {
      setSearchMarkerPayload({ ids: [], label: labelParam });
    }
  }, [searchParams, searchParamsKey]);

  useEffect(() => {
    if (!searchParams) return;
    const enabled = searchParams.get("ai");
    if (!enabled) {
      setAiMarkerPayload(null);
      return;
    }
    const labelParam = searchParams.get("label") ?? "AIおすすめ";
    const payload = loadAiMapPayload();
    if (payload) {
      setAiMarkerPayload(payload);
    } else {
      setAiMarkerPayload({ ids: [], label: labelParam });
    }
  }, [searchParams, searchParamsKey]);

  useEffect(() => {
    if (!permissions.isVendor || !vendorShopId) return;
    if (!vendorShop) return;
    const key = `nicchyo-vendor-prompt-${vendorShopId}`;
    const already = typeof window !== "undefined" && localStorage.getItem(key);
    if (already) return;
    setVendorShopName(vendorShop.name);
    setShowVendorPrompt(true);
    localStorage.setItem(key, "dismissed");
  }, [permissions.isVendor, vendorShopId, vendorShop]);

  const handleAcceptRecipe = () => {
    setShowRecipeOverlay(true);
    setShowBanner(false);
    localStorage.setItem("nicchyo-daily-recipe-dismissed", "false");
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("nicchyo-daily-recipe-dismissed", "true");
  };

  const handleOpenVendorBanner = () => {
    if (!vendorShopId) return;
    router.push(`/map?shop=${vendorShopId}`);
    setShowVendorPrompt(false);
  };

  const handleGrandmaDrop = useCallback(
    (position: { x: number; y: number }) => {
      if (!showGrandma) return;
      if (!mapRef.current) return;
      const container = mapRef.current.getContainer();
      const rect = container.getBoundingClientRect();
      const point: [number, number] = [
        position.x - rect.left,
        position.y - rect.top,
      ];
      const latlng = mapRef.current.containerPointToLatLng(point);
      const hit = grandmaEvents.find((event) => {
        const target = { lat: event.location.lat, lng: event.location.lng };
        const dist = mapRef.current?.distance(latlng, target) ?? Infinity;
        return dist <= event.location.radiusMeters;
      });
      if (!hit) return;
      setActiveEventId(hit.id);
      setEventMessageIndex(0);
    },
    [showGrandma]
  );

  const handleEventAdvance = () => {
    if (!activeEvent) return;
    if (eventMessageIndex < activeEvent.messages.length - 1) {
      setEventMessageIndex((prev) => prev + 1);
    } else {
      setActiveEventId(null);
      setEventMessageIndex(0);
    }
  };

  const handleEventBack = () => {
    if (!activeEvent) return;
    if (eventMessageIndex > 0) {
      setEventMessageIndex((prev) => prev - 1);
    }
  };

  const handleGrandmaAsk = useCallback(async (
    text: string,
    imageFile?: File | null,
    context?: { shopId?: number; shopName?: string; source?: "suggestion" | "input" },
    _history?: Array<{ role: "user" | "assistant"; text: string }>,
    _memorySummary?: string
  ) => {
    try {
      const visitorKey = getOrCreateConsultVisitorKey();
      const useForm = !!imageFile;
      const body = useForm
        ? (() => {
            const form = new FormData();
            form.append("text", text);
            form.append("location", JSON.stringify(userLocation ?? null));
            if (context?.shopId) form.append("shopId", String(context.shopId));
            if (context?.shopName) form.append("shopName", context.shopName);
            if (visitorKey) form.append("visitorKey", visitorKey);
            if (imageFile) form.append("image", imageFile);
            return form;
          })()
        : JSON.stringify({
            text,
            location: userLocation,
            shopId: context?.shopId ?? null,
            shopName: context?.shopName ?? null,
            visitorKey,
          });
      const response = await fetch("/api/grandma/ask", {
        method: "POST",
        headers: useForm ? undefined : { "Content-Type": "application/json" },
        body,
      });
      const payload = (await response.json()) as {
        reply?: string;
        imageUrl?: string;
        shopIds?: number[];
        errorMessage?: string;
      };
      if (!response.ok) {
        return {
          reply:
            payload.reply ??
            payload.errorMessage ??
            "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        };
      }
      const rawReply =
        payload.reply ?? "ごめんね、今は答えを出せんかった。時間をおいて試してね。";
      if (payload.shopIds && payload.shopIds.length > 0) {
        setAiMarkerPayload({ ids: payload.shopIds, label: "AIおすすめ" });
        const cleaned = rawReply.replace(/SHOP_IDS:\s*([0-9,\s]+)/i, "").trim();
        return {
          reply: cleaned || "おすすめのお店を表示したよ。",
          imageUrl: payload.imageUrl,
          shopIds: payload.shopIds,
        };
      }
      setAiMarkerPayload(null);
      return { reply: rawReply, imageUrl: payload.imageUrl };
    } catch {
      return {
        reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
      };
    }
  }, [userLocation]);

  const handleCommentShopFocus = useCallback(
    (shopId: number) => {
      const map = mapRef.current;
      const shop = shopById.get(shopId);
      if (!map || !shop) return;
      prefetchShopImage(shopId);
      activateSpotlight(shopId);
      const maxZoom = map.getMaxZoom() ?? 19;
      map.flyTo([shop.lat, shop.lng], maxZoom, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    },
    [activateSpotlight, prefetchShopImage, shopById]
  );

  const handleCommentShopOpen = useCallback(
    (shopId: number) => {
      handleCommentShopFocus(shopId);
      if (introFocusTimerRef.current !== null) {
        window.clearTimeout(introFocusTimerRef.current);
        introFocusTimerRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.body.classList.add("shop-banner-open");
      }
      introFocusTimerRef.current = window.setTimeout(() => {
        router.push(`/map?shop=${shopId}`);
        introFocusTimerRef.current = null;
      }, 900);
    },
    [handleCommentShopFocus, router]
  );
  const handleAiImageClick = useCallback(
    (imageUrl: string) => {
      const target = aiImageTargets.find((entry) => entry.image === imageUrl);
      if (!target || !mapRef.current) return;
      const maxZoom = mapRef.current.getMaxZoom() ?? 19;
      mapRef.current.flyTo([target.location.lat, target.location.lng], maxZoom, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    },
    [aiImageTargets]
  );

  useEffect(() => {
    if (initialShopId) {
      prefetchShopImage(initialShopId);
    }
    return () => {
      if (introFocusTimerRef.current !== null) {
        window.clearTimeout(introFocusTimerRef.current);
      }
    };
  }, [initialShopId, prefetchShopImage]);

  const aiSuggestedShops = useMemo(() => {
    if (!aiMarkerPayload?.ids?.length) return [];
    const shopSet = new Set(aiMarkerPayload.ids);
    return shops.filter((shop) => shopSet.has(shop.id));
  }, [aiMarkerPayload, shops]);
  const hasSearchMode =
    activePanel === 'search' ||
    !!searchMarkerPayload ||
    !!mapSearchQuery.trim() ||
    !!mapSearchCategory ||
    !!mapSearchShopIds?.length;
  const hasAiMode =
    mapCharacterConsultActive ||
    !!aiMarkerPayload;

  const introImageUrl = useMemo(() => {
    if (!commentHighlightShopId) return null;
    const shop = shopById.get(commentHighlightShopId);
    if (!shop) return null;
    const bannerSeed = shop.position ?? shop.id;
    return shop.images?.main ?? getShopBannerImage(shop.category, bannerSeed);
  }, [commentHighlightShopId, shopById]);

  const kotoduteShopIds = useMemo(() => {
    const notes = loadKotodute();
    const ids = new Set<number>();
    notes.forEach((note) => {
      if (typeof note.shopId === "number") {
        ids.add(note.shopId);
      }
    });
    return Array.from(ids);
  }, []);

  const shopIntroComments = useMemo(() => {
    if (isInMarket === true && userLocation) {
      const withDistance = shops.map((shop) => ({
        shop,
        distance: distanceMeters(userLocation, { lat: shop.lat, lng: shop.lng }),
      }));
      const nearby = withDistance
        .filter((entry) => entry.distance <= NEARBY_RADIUS_METERS)
        .sort((a, b) => a.distance - b.distance);
      const chosen = (nearby.length > 0 ? nearby : withDistance.sort((a, b) => a.distance - b.distance))
        .slice(0, NEARBY_MAX_SHOPS);

      return chosen.map(({ shop }) => ({
        id: `shop-${shop.id}`,
        genre: "notice" as const,
        icon: "🏪",
        text: buildShopIntroText(shop),
        shopId: shop.id,
      }));
    }

    if (isInMarket === false) {
      return shuffleArray(shops)
        .map((shop) => ({
          id: `shop-${shop.id}`,
          genre: "notice" as const,
          icon: "🏪",
          text: buildShopIntroText(shop),
          shopId: shop.id,
        }));
    }

    return [];
  }, [isInMarket, shops, userLocation]);

  const commentPool = useMemo(() => {
    if (!showGrandma) return [];
    const tutorials = mapTutorialComments.slice(tutorialProgress);
    const base = shopIntroComments.length > 0
      ? interleaveComments(grandmaComments, shopIntroComments)
      : grandmaComments;
    return [...tutorials, ...base];
  }, [isInMarket, shopIntroComments, showGrandma, tutorialProgress]);

  const handleCommentSeen = useCallback((id: string, genre: string) => {
    if (genre !== "tutorial") return;
    const idx = mapTutorialComments.findIndex((c) => c.id === id);
    if (idx < 0) return;
    setTutorialProgress((prev) => {
      const next = Math.min(10, idx + 1);
      if (next > prev) {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, String(next));
        return next;
      }
      return prev;
    });
  }, []);

  const shouldShowNavigationBar = !isShopBannerOpen;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 背景デコレーション */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* メイン: NavigationBar(h-14=3.5rem) + safe-area-inset-bottom 分だけ下に余白 */}
      <main
        className="relative z-10 flex-1 overflow-hidden"
        style={{
          paddingBottom: shouldShowNavigationBar
            ? 'calc(3.5rem + var(--safe-bottom, 0px))'
            : '0px',
        }}
      >
        <div className="relative h-full overflow-hidden">
            {showBanner && recommendedRecipe && (
              <div className="absolute left-4 right-4 top-4 z-[1200]">
                <div className="rounded-2xl border border-amber-200 bg-white/95 shadow-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        本日のおすすめレシピ
                      </p>
                      <h2 className="text-lg font-bold text-gray-900">{recommendedRecipe.title}</h2>
                      <p className="text-xs text-gray-700">{recommendedRecipe.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDismissBanner}
                      className="h-8 w-8 rounded-full border border-amber-200 bg-white text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50"
                      aria-label="閉じる"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {recommendedRecipe.ingredients.map((ing) => (
                      <span
                        key={ing.id}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 font-semibold text-amber-800"
                      >
                        <span aria-hidden>🥕</span>
                        {ing.name}
                        {ing.seasonal ? " (旬)" : ""}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <button
                      type="button"
                      onClick={handleAcceptRecipe}
                      className="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
                    >
                      このレシピを見る
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/recipes")}
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                    >
                      ほかのレシピを探す
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showVendorPrompt && vendorShopName && (
              <div className="absolute left-4 right-4 top-1/2 z-[1300] -translate-y-1/2">
                <div className="rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        出店者向け
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {vendorShopName} のショップバナーを開きますか？
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVendorPrompt(false)}
                      className="h-8 w-8 rounded-full border border-amber-200 bg-white text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50"
                      aria-label="閉じる"
                    >
                      ×
                    </button>
                  </div>
                  {(vendorShop?.images?.main ||
                    getShopBannerImage(
                      vendorShop?.category,
                      (vendorShop?.position ?? vendorShop?.id ?? 0)
                    )) && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-100 bg-white">
                      <img
                        src={
                          vendorShop?.images?.main ??
                          getShopBannerImage(
                            vendorShop?.category,
                            (vendorShop?.position ?? vendorShop?.id ?? 0)
                          )
                        }
                        alt={`${vendorShopName}の写真`}
                        className="h-40 w-full object-cover object-center"
                      />
                    </div>
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <button
                      type="button"
                      onClick={handleOpenVendorBanner}
                      className="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
                    >
                        お店の情報を開く
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVendorPrompt(false)}
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                    >
                      後で
                    </button>
                  </div>
                </div>
              </div>
            )}

            <MapView
              shops={shops}
              landmarks={landmarks}
              mapRoute={mapRoute}
              initialShopId={initialShopId}
              openInitialShopBanner={!isAiFocusMode}
              selectedRecipe={recommendedRecipe ?? undefined}
              showRecipeOverlay={showRecipeOverlay}
              onCloseRecipeOverlay={() => setShowRecipeOverlay(false)}
              agentOpen={agentOpen}
              onAgentToggle={setAgentOpen}
              searchShopIds={searchMarkerPayload?.ids ?? mapSearchShopIds}
              aiShopIds={aiMarkerPayload?.ids}
              searchLabel={
                searchMarkerPayload?.label ??
                (mapSearchLabel || aiMarkerPayload?.label)
              }
              searchQuery={mapSearchQuery}
              couponEligibleVendorIds={Array.from(couponEligibleVendorIds)}
              activeCouponTypeId={activeCouponTypeId}
              stampedVendorIds={stampedVendorIds}
              onSearchQuery={(q) => {
                setMapSearchQuery(q);
                if (searchMarkerPayload) {
                  clearSearchMapPayload();
                  setSearchMarkerPayload(null);
                }
                if (aiMarkerPayload) {
                  setAiMarkerPayload(null);
                }
              }}
              onMapReady={markMapReady}
              onMapInstance={handleMapInstance}
              onUserLocationUpdate={(coords) => {
                setUserLocation({ lat: coords.lat, lng: coords.lng });
                setIsInMarket(coords.inMarket);
              }}
              spotlightShopId={spotlightShopId ?? undefined}
              onClearSearch={() => {
                clearSearchMapPayload();
                setSearchMarkerPayload(null);
                setMapSearchQuery('');
                setMapSearchCategory(null);
                setMapSearchCouponTypeId(null);
                setAiMarkerPayload(null);
              }}
              kotoduteShopIds={kotoduteShopIds}
              shopBannerVariant={shopBannerVariant}
              attendanceEstimates={attendanceEstimates}
              onZoomChange={setCurrentZoom}
              suppressInitialLocationFocus={isAiFocusMode}
              hideMapUI={mapCharacterConsultActive}
              overlaySlot={
                mapCharacterConsultActive ? (
                  <MapCharacterConsult
                    map={mapInstance}
                    shops={shops}
                    onShopsRecommended={(shopIds) => {
                      setAiMarkerPayload({ ids: shopIds, label: 'AIおすすめ' });
                    }}
                    onClose={closeMapCharacterConsult}
                  />
                ) : undefined
              }
            />
          </div>
      </main>

      {/* ── パネルオーバーレイ（検索のみ） ── */}
      <AnimatePresence>
        {activePanel === 'search' && (
          <>
            {/* マップ暗幕 */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[9989] bg-black/60"
            />

            {/* パネル本体（半透明背景） */}
            <motion.div
              key={activePanel}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  router.push("/map");
                }
              }}
              className="fixed inset-x-0 bottom-0 z-[9990] overflow-hidden rounded-t-3xl bg-black/50 backdrop-blur-xl"
              style={{ height: "92dvh" }}
            >
              {/* ドラッグハンドル */}
              <div
                className="absolute left-1/2 top-0 z-10 flex h-8 w-full -translate-x-1/2 cursor-grab items-center justify-center active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
                style={{ touchAction: "none" }}
              >
                <div className="h-1 w-10 rounded-full bg-white/40" />
              </div>
              <div className="h-full overflow-hidden pt-6">
                <Suspense fallback={null}>
                  <SearchClient
                    shops={shops}
                    landmarks={landmarks}
                    embedded
                    initialQuery={mapSearchQuery}
                    initialCategory={mapSearchCategory}
                    initialCouponTypeId={mapSearchCouponTypeId}
                    onQueryChange={(q, cat, couponTypeId) => {
                      setMapSearchQuery(q);
                      setMapSearchCategory(cat);
                      setMapSearchCouponTypeId(couponTypeId);
                      if (searchMarkerPayload) {
                        clearSearchMapPayload();
                        setSearchMarkerPayload(null);
                      }
                      if (aiMarkerPayload) {
                        setAiMarkerPayload(null);
                      }
                    }}
                  />
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {shouldShowNavigationBar && (
        <NavigationBar
          onMenuOpenChange={(open) => {
            if (open) {
              closeMapCharacterConsult();
            }
          }}
          onConsultClick={startMapCharacterConsult}
          closeModeActive={hasSearchMode || hasAiMode}
          onCloseMode={closeMapInteractionMode}
        />
      )}
    </div>
  );
}


