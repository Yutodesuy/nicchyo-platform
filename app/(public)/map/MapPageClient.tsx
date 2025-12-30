"use client";

import NavigationBar from "../../components/NavigationBar";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Map as LeafletMap } from "leaflet";
import { pickDailyRecipe, type Recipe } from "../../../lib/recipes";
import { loadSearchMapPayload } from "../../../lib/searchMapStorage";
import GrandmaChatter from "./components/GrandmaChatter";
import { useTimeBadge } from "./hooks/useTimeBadge";
import { BadgeModal } from "./components/BadgeModal";
import { useAuth } from "../../../lib/auth/AuthContext";
import { shops as baseShops } from "./data/shops";
import { applyShopEdits } from "../../../lib/shopEdits";
import { useMapLoading } from "../../components/MapLoadingProvider";
import { grandmaEvents } from "./data/grandmaEvents";

const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
});

export default function MapPageClient() {
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
  const mapRef = useRef<LeafletMap | null>(null);
  const [searchMarkerPayload, setSearchMarkerPayload] = useState<{
    ids: number[];
    label: string;
  } | null>(null);
  const vendorShopId = user?.vendorId ?? null;
  const activeEvent = useMemo(
    () => grandmaEvents.find((event) => event.id === activeEventId) ?? null,
    [activeEventId]
  );
  const activeMessage = activeEvent?.messages[eventMessageIndex] ?? null;

  const vendorShop = useMemo(() => {
    if (!vendorShopId) return null;
    const merged = applyShopEdits(baseShops);
    return merged.find((shop) => shop.id === vendorShopId) ?? null;
  }, [vendorShopId]);

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
    []
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 背景デコレーション */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* メイン */}
      <main className="flex-1 relative pb-16 z-10">
        <div className="h-full relative">
            {isHoldActive && !activeEvent && (
              <div className="map-hold-dim absolute inset-0 z-[1200] pointer-events-none" />
            )}
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
                  {(vendorShop?.images?.main || "/images/shops/tosahamono.webp") && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-100 bg-white">
                      <img
                        src={vendorShop?.images?.main ?? "/images/shops/tosahamono.webp"}
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
              initialShopId={initialShopId}
              selectedRecipe={recommendedRecipe ?? undefined}
              showRecipeOverlay={showRecipeOverlay}
              onCloseRecipeOverlay={() => setShowRecipeOverlay(false)}
              agentOpen={agentOpen}
              onAgentToggle={setAgentOpen}
              searchShopIds={searchMarkerPayload?.ids}
              searchLabel={searchMarkerPayload?.label}
              onMapReady={markMapReady}
              eventTargets={grandmaEvents.map((event) => ({
                id: event.id,
                lat: event.location.lat,
                lng: event.location.lng,
              }))}
              highlightEventTargets={isHoldActive}
              onMapInstance={(map) => {
                mapRef.current = map;
              }}
            />
            <GrandmaChatter
              onOpenAgent={() => setAgentOpen(true)}
              titleLabel="マップばあちゃん"
              fullWidth
              onHoldChange={setIsHoldActive}
              onDrop={handleGrandmaDrop}
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
                <div className="relative z-10 flex w-[min(960px,92vw)] flex-col gap-6 rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl sm:flex-row sm:items-center">
                  <div className="flex items-center justify-center">
                    <div className="h-40 w-40 overflow-hidden rounded-3xl border-4 border-amber-400 bg-amber-100 shadow-xl sm:h-56 sm:w-56">
                      <img
                        src="/images/obaasan.webp"
                        alt="おばあちゃん"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                      {activeEvent.title}
                    </div>
                    <p className="text-base leading-relaxed text-gray-900">{activeMessage.text}</p>
                    {activeMessage.image && (
                      <div className="overflow-hidden rounded-2xl border border-amber-200">
                        <img
                          src={activeMessage.image}
                          alt=""
                          className="h-44 w-full object-cover object-center sm:h-56"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {eventMessageIndex + 1}/{activeEvent.messages.length}
                      </span>
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
            )}
          </div>
      </main>

      <NavigationBar />
    </div>
  );
}


