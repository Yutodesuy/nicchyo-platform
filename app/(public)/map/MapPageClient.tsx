"use client";

import NavigationBar from "../../components/NavigationBar";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Map as LeafletMap } from "leaflet";
import { pickDailyRecipe, recipes, type Recipe } from "../../../lib/recipes";
import { loadSearchMapPayload } from "../../../lib/searchMapStorage";
import { getShopBannerImage } from "../../../lib/shopImages";
import GrandmaChatter from "./components/GrandmaChatter";
import { useTimeBadge } from "./hooks/useTimeBadge";
import { BadgeModal } from "./components/BadgeModal";
import { useAuth } from "../../../lib/auth/AuthContext";
import type { Shop } from "./data/shops";
import { grandmaComments } from "./data/grandmaComments";
import { loadKotodute } from "../../../lib/kotoduteStorage";
import { applyShopEdits } from "../../../lib/shopEdits";
import { useMapLoading } from "../../components/MapLoadingProvider";
import { grandmaEvents } from "./data/grandmaEvents";
import FirstVisitGuide from "./components/FirstVisitGuide";

const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
});

type MapPageClientProps = {
  shops: Shop[];
  showGrandma?: boolean;
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
  showGrandma = true,
  shopBannerVariant = "default",
  attendanceEstimates,
}: MapPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, permissions } = useAuth();
  const { markMapReady } = useMapLoading();
  const initialShopIdParam = searchParams?.get("shop");
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
  const [commentHighlightShopId, setCommentHighlightShopId] = useState<number | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(21); // Default max zoom
  const mapRef = useRef<LeafletMap | null>(null);
  const introFocusTimerRef = useRef<number | null>(null);
  const [searchMarkerPayload, setSearchMarkerPayload] = useState<{
    ids: number[];
    label: string;
  } | null>(null);
  const [aiMarkerPayload, setAiMarkerPayload] = useState<{
    ids: number[];
    label: string;
  } | null>(null);
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
      const bannerSeed = (shop.position ?? shop.id) * 2 + (shop.side === "south" ? 1 : 0);
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
  }, []);

  const vendorShop = useMemo(() => {
    if (!vendorShopId) return null;
    const merged = applyShopEdits(shops);
    return merged.find((shop) => shop.id === vendorShopId) ?? null;
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
    context?: { shopId?: number; shopName?: string; source?: "suggestion" | "input" }
  ) => {
    try {
      const useForm = !!imageFile;
      const body = useForm
        ? (() => {
            const form = new FormData();
            form.append("text", text);
            form.append("location", JSON.stringify(userLocation ?? null));
            if (context?.shopId) form.append("shopId", String(context.shopId));
            if (context?.shopName) form.append("shopName", context.shopName);
            if (imageFile) form.append("image", imageFile);
            return form;
          })()
        : JSON.stringify({
            text,
            location: userLocation,
            shopId: context?.shopId ?? null,
            shopName: context?.shopName ?? null,
          });
      const response = await fetch("/api/grandma/ask", {
        method: "POST",
        headers: useForm ? undefined : { "Content-Type": "application/json" },
        body,
      });
      if (!response.ok) {
        return {
          reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        };
      }
      const payload = (await response.json()) as {
        reply?: string;
        imageUrl?: string;
        shopIds?: number[];
      };
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
      const maxZoom = map.getMaxZoom() ?? 19;
      map.flyTo([shop.lat, shop.lng], maxZoom, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    },
    [prefetchShopImage, shopById]
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

  const introImageUrl = useMemo(() => {
    if (!commentHighlightShopId) return null;
    const shop = shopById.get(commentHighlightShopId);
    if (!shop) return null;
    const bannerSeed = (shop.position ?? shop.id) * 2 + (shop.side === "south" ? 1 : 0);
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
    if (shopIntroComments.length > 0) {
      return interleaveComments(grandmaComments, shopIntroComments);
    }
    return grandmaComments;
  }, [isInMarket, shopIntroComments, showGrandma]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <FirstVisitGuide />
      {/* 背景デコレーション */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* メイン */}
      <main className="flex-1 relative pb-16 z-10">
        <div className="h-full relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-lg z-[1500] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-lg z-[1500] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-lg z-[1500] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-lg z-[1500] pointer-events-none"></div>

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
                      ((vendorShop?.position ?? vendorShop?.id ?? 0) * 2) +
                        (vendorShop?.side === "south" ? 1 : 0)
                    )) && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-100 bg-white">
                      <img
                        src={
                          vendorShop?.images?.main ??
                          getShopBannerImage(
                            vendorShop?.category,
                            ((vendorShop?.position ?? vendorShop?.id ?? 0) * 2) +
                              (vendorShop?.side === "south" ? 1 : 0)
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
                      ショップバナーを開く
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
              initialShopId={initialShopId}
              selectedRecipe={recommendedRecipe ?? undefined}
              showRecipeOverlay={showRecipeOverlay}
              onCloseRecipeOverlay={() => setShowRecipeOverlay(false)}
              agentOpen={agentOpen}
              onAgentToggle={setAgentOpen}
              searchShopIds={searchMarkerPayload?.ids}
              aiShopIds={aiMarkerPayload?.ids}
              searchLabel={searchMarkerPayload?.label ?? aiMarkerPayload?.label}
              onMapReady={markMapReady}
              eventTargets={eventTargets}
              highlightEventTargets={showGrandma ? isHoldActive : false}
              onMapInstance={handleMapInstance}
              onUserLocationUpdate={(coords) => {
                setUserLocation({ lat: coords.lat, lng: coords.lng });
                setIsInMarket(coords.inMarket);
              }}
              commentShopId={commentHighlightShopId ?? undefined}
              kotoduteShopIds={kotoduteShopIds}
              shopBannerVariant={shopBannerVariant}
              attendanceEstimates={attendanceEstimates}
              onZoomChange={setCurrentZoom}
            />
            {showGrandma && (
              <>
                <GrandmaChatter
                  titleLabel="にちよさん"
                  fullWidth
                  comments={commentPool}
                  onAsk={handleGrandmaAsk}
                  allShops={shops}
                  aiSuggestedShops={aiSuggestedShops}
                  onSelectShop={(shopId) => router.push(`/map?shop=${shopId}`)}
                  onHoldChange={setIsHoldActive}
                  onDrop={handleGrandmaDrop}
                  onActiveShopChange={setCommentHighlightShopId}
                  onCommentShopFocus={handleCommentShopFocus}
                  onCommentShopOpen={handleCommentShopOpen}
                  introImageUrl={introImageUrl}
                  onAiImageClick={handleAiImageClick}
                  currentZoom={currentZoom}
                  priorityMessage={
                    priority
                      ? {
                          text: `${priority.badge.slot}に日曜市へ訪れました！ ${priority.badge.tierIcon} ${priority.badge.badge.title}（${priority.badge.tierTitle}）`,
                          badgeTitle: priority.badge.badge.title,
                          badgeIcon: priority.badge.tierIcon,
                        }
                      : null
                  }
                  onPriorityClick={() => setShowBadgeModal(true)}
                  onPriorityDismiss={clearPriority}
                />
                <BadgeModal
                  open={showBadgeModal && !!priority}
                  onClose={() => {
                    setShowBadgeModal(false);
                    clearPriority();
                  }}
                  title={priority?.badge.badge.title ?? ""}
                  slot={priority?.badge.slot ?? ""}
                  tierTitle={priority?.badge.tierTitle ?? ""}
                  tierIcon={priority?.badge.tierIcon ?? ""}
                  count={priority?.badge.count ?? 0}
                />
                {activeEvent && activeMessage && (
                  <div className="fixed inset-0 z-[3000] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70" />
                    <div className="relative z-10 flex min-h-[70vh] w-[min(960px,92vw)] flex-col justify-end gap-6 overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl">
                      <div className="absolute inset-0">
                        <img
                          src="/images/obaasan.webp"
                          alt="おばあちゃん"
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="absolute left-6 top-4 z-10">
                        <h3 className="rounded-full bg-white/80 px-3 py-1 text-xl font-bold text-gray-900 shadow-sm">
                          {activeEvent.title}
                        </h3>
                      </div>
                      <div className="relative flex min-h-[45vh] flex-col pt-16">
                        <div className="mt-auto space-y-3 -translate-y-[10px]">
                          {activeMessage.image && (
                            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
                              <img
                                src={activeMessage.image}
                                alt=""
                                className="h-44 w-full object-cover object-center sm:h-56"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              {activeMessage.subtitle}
                            </div>
                            <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 text-base leading-relaxed text-gray-900 shadow-sm">
                              {activeMessage.text}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {eventMessageIndex + 1}/{activeEvent.messages.length}
                            </span>
                            <div className="flex items-center gap-2">
                              {eventMessageIndex > 0 && (
                                <button
                                  type="button"
                                  onClick={handleEventBack}
                                  className="rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
                                >
                                  戻る
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleEventAdvance}
                                className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500"
                              >
                                {eventMessageIndex + 1 < activeEvent.messages.length ? "次へ" : "閉じる"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
      </main>

      <NavigationBar />
    </div>
  );
}


