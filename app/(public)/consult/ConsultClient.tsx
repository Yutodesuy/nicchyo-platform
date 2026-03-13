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

type ConsultAskResponse = {
  reply: string;
  imageUrl?: string;
  shopIds?: number[];
  errorMessage?: string;
  retryable?: boolean;
};

export default function ConsultClient({ shops }: ConsultClientProps) {
  const [aiSuggestedShops, setAiSuggestedShops] = useState<Shop[]>([]);
  const searchParams = useSearchParams();

  const handleGrandmaAsk = useCallback(async (
    text: string,
    imageFile?: File | null,
    context?: { shopId?: number; shopName?: string; source?: "suggestion" | "input" }
  ): Promise<ConsultAskResponse> => {
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
        setAiSuggestedShops([]);
        return {
          reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
          errorMessage: "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
          retryable: true,
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
        retryable: false,
      };
    } catch {
      setAiSuggestedShops([]);
      return {
        reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        errorMessage: "接続に失敗しました。少し時間をおいて、もう一度試してください。",
        retryable: true,
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

  return (
    <div
      className="relative min-h-screen bg-[var(--consult-bg)]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[var(--consult-bg)]" aria-hidden="true" />
      <main className="relative z-10 flex w-full items-start justify-center px-3 pb-24 pt-6">
        <div className="flex w-full max-w-5xl flex-col gap-3">
          <section className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
            <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">
              Consult
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">にちよさんに相談する</h1>
            <p className="mt-1 text-sm text-gray-700">
              お店探し、回り方、旬のもの、写真つきの質問までまとめて相談できます。
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">音声入力OK</span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">写真相談OK</span>
            </div>
          </section>
          <GrandmaChatter
            titleLabel="にちよさん"
            fullWidth
            variant="consult"
            comments={grandmaComments}
            onAsk={handleGrandmaAsk}
            allShops={shops}
            aiSuggestedShops={aiSuggestedShops}
            initialOpen
            layout="page"
            onClear={() => setAiSuggestedShops([])}
            autoAskText={autoAskText}
            autoAskContext={autoAskContext}
            enableSpeechInput
          />
        </div>
      </main>
      <NavigationBar activeHref="/consult" position="absolute" />
    </div>
  );
}
