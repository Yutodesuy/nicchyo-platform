"use client";

import NavigationBar from "../../components/NavigationBar";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { pickDailyRecipe, type Recipe } from "../../../lib/recipes";
import { loadSearchMapPayload } from "../../../lib/searchMapStorage";
import GrandmaChatter from "./components/GrandmaChatter";
import { useTimeBadge } from "./hooks/useTimeBadge";
import { BadgeModal } from "./components/BadgeModal";

const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
});

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialShopIdParam = searchParams?.get("shop");
  const searchParamsKey = searchParams?.toString() ?? "";
  const initialShopId = initialShopIdParam ? Number(initialShopIdParam) : undefined;
  const [recommendedRecipe, setRecommendedRecipe] = useState<Recipe | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showRecipeOverlay, setShowRecipeOverlay] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const { priority, clearPriority } = useTimeBadge();
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [searchMarkerPayload, setSearchMarkerPayload] = useState<{
    ids: number[];
    label: string;
  } | null>(null);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && localStorage.getItem("nicchyo-daily-recipe-dismissed");
    const todayId = typeof window !== "undefined" && localStorage.getItem("nicchyo-daily-recipe-id");
    const daily = pickDailyRecipe();
    if (!todayId) {
      localStorage.setItem("nicchyo-daily-recipe-id", daily.id);
    }
    if (!dismissed) {
      setRecommendedRecipe(daily);
      setShowBanner(true);
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

  const handleAcceptRecipe = () => {
    setShowRecipeOverlay(true);
    setShowBanner(false);
    localStorage.setItem("nicchyo-daily-recipe-dismissed", "false");
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("nicchyo-daily-recipe-dismissed", "true");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 背景デコレーション */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZDk3NzA2IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')]"></div>
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* メイン */}
      <main className="flex-1 relative pb-16 z-10">
        <div className="h-full p-2 md:p-4">
          <div className="h-full bg-white rounded-lg md:rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-200 relative">
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

            <MapView
              initialShopId={initialShopId}
              selectedRecipe={recommendedRecipe ?? undefined}
              showRecipeOverlay={showRecipeOverlay}
              onCloseRecipeOverlay={() => setShowRecipeOverlay(false)}
              agentOpen={agentOpen}
              onAgentToggle={setAgentOpen}
              searchShopIds={searchMarkerPayload?.ids}
              searchLabel={searchMarkerPayload?.label}
            />
            <GrandmaChatter
              onOpenAgent={() => setAgentOpen(true)}
              titleLabel="マップばあちゃん"
              fullWidth
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
          </div>
        </div>
      </main>

      <NavigationBar />
    </div>
  );
}


