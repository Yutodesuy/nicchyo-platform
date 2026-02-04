"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavigationBar from "../../components/NavigationBar";
import GrandmaChatter from "../map/components/GrandmaChatter";
import { grandmaComments } from "../map/data/grandmaComments";
import type { Shop } from "../map/data/shops";

type ConsultClientProps = {
  shops: Shop[];
};

export default function ConsultClient({ shops }: ConsultClientProps) {
  const [aiSuggestedShops, setAiSuggestedShops] = useState<Shop[]>([]);
  const [hasInputProgress, setHasInputProgress] = useState(false);
  const searchParams = useSearchParams();

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
            form.append("location", JSON.stringify(null));
            if (context?.shopId) form.append("shopId", String(context.shopId));
            if (context?.shopName) form.append("shopName", context.shopName);
            if (imageFile) form.append("image", imageFile);
            return form;
          })()
        : JSON.stringify({
            text,
            location: null,
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
      if (payload.shopIds && payload.shopIds.length > 0) {
        const shopSet = new Set(payload.shopIds);
        setAiSuggestedShops(shops.filter((shop) => shopSet.has(shop.id)));
      } else {
        setAiSuggestedShops([]);
      }
      return {
        reply:
          payload.reply ??
          "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        imageUrl: payload.imageUrl,
        shopIds: payload.shopIds,
      };
    } catch {
      setAiSuggestedShops([]);
      return {
        reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
      };
    }
  }, [shops]);

  const autoAskText = searchParams?.get("q") || null;
  const autoAskShopIdRaw = searchParams?.get("shopId");
  const autoAskShopId = autoAskShopIdRaw ? Number(autoAskShopIdRaw) : undefined;
  const autoAskShopName = searchParams?.get("shopName") || undefined;
  const autoAskContext =
    autoAskShopId || autoAskShopName
      ? { shopId: Number.isFinite(autoAskShopId) ? autoAskShopId : undefined, shopName: autoAskShopName }
      : undefined;
  const hasSuggestedShops = aiSuggestedShops.length > 0;
  const showSecondaryCta = hasInputProgress || hasSuggestedShops;

  const handlePrimaryCtaClick = useCallback(() => {
    const input = document.getElementById("consult-input") as HTMLInputElement | null;
    if (!input) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
  }, []);

  const handleSecondaryCtaClick = useCallback(() => {
    const targetId = hasSuggestedShops ? "consult-suggestions" : "consult-input";
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (targetId === "consult-input" && target instanceof HTMLInputElement) {
      target.focus();
    }
  }, [hasSuggestedShops]);

  return (
    <div
      className="relative overflow-hidden bg-[#fbf8f3]"
      style={{ height: "100svh" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/maps/placeholder-map.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          opacity: 0.35,
          transform: "scale(1.05)",
        }}
        aria-hidden="true"
      />
      <main className="relative z-10 flex h-full w-full items-start justify-center px-3 pb-[calc(112px+env(safe-area-inset-bottom))] pt-20">
        <GrandmaChatter
          titleLabel="にちよさん"
          fullWidth
          comments={grandmaComments}
          onAsk={handleGrandmaAsk}
          allShops={shops}
          aiSuggestedShops={aiSuggestedShops}
          initialOpen
          layout="page"
          onClear={() => setAiSuggestedShops([])}
          autoAskText={autoAskText}
          autoAskContext={autoAskContext}
          onInputProgressChange={setHasInputProgress}
          pageBottomOffset={96}
        />
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-amber-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <button
            type="button"
            onClick={handlePrimaryCtaClick}
            className="flex-1 rounded-full bg-amber-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            相談を入力する
          </button>
          {showSecondaryCta && (
            <button
              type="button"
              onClick={handleSecondaryCtaClick}
              className="rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50"
            >
              {hasSuggestedShops ? "提案を見る" : "入力を続ける"}
            </button>
          )}
        </div>
      </div>
      <NavigationBar activeHref="/consult" position="absolute" />
    </div>
  );
}
