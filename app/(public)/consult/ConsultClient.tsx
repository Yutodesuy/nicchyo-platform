"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavigationBar from "../../components/NavigationBar";
import GrandmaChatter from "../map/components/GrandmaChatter";
import ShopDetailBanner from "../map/components/ShopDetailBanner";
import { grandmaComments } from "../map/data/grandmaComments";
import type { ConsultCharacterId } from "./data/consultCharacters";
import type { ConsultAskResponse, ConsultHistoryEntry } from "./types/consultConversation";
import type { Shop } from "../map/data/shops";

const PREFERRED_CHARACTER_STORAGE_KEY = "nicchyo-consult-preferred-character";

export default function ConsultClient() {
  const [aiSuggestedShops, setAiSuggestedShops] = useState<Shop[]>([]);
  const [knownShops, setKnownShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [preferredCharacterId, setPreferredCharacterId] = useState<ConsultCharacterId | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(PREFERRED_CHARACTER_STORAGE_KEY);
    if (!saved) return;
    setPreferredCharacterId(saved as ConsultCharacterId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!preferredCharacterId) {
      window.localStorage.removeItem(PREFERRED_CHARACTER_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PREFERRED_CHARACTER_STORAGE_KEY, preferredCharacterId);
  }, [preferredCharacterId]);

  const mergeKnownShops = useCallback((shops: Shop[] | undefined) => {
    if (!shops || shops.length === 0) return;
    setKnownShops((prev) => {
      const next = new Map<number, Shop>();
      prev.forEach((shop) => next.set(shop.id, shop));
      shops.forEach((shop) => next.set(shop.id, shop));
      return Array.from(next.values());
    });
  }, []);

  const handleGrandmaAsk = useCallback(async (
    text: string,
    imageFile?: File | null,
    context?: { shopId?: number; shopName?: string; source?: "suggestion" | "input" },
    history?: ConsultHistoryEntry[],
    memorySummary?: string
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
            form.append("history", JSON.stringify(history ?? []));
            form.append("memorySummary", memorySummary ?? "");
            if (preferredCharacterId) {
              form.append("preferredCharacterId", preferredCharacterId);
            }
            if (imageFile) form.append("image", imageFile);
            return form;
          })()
        : JSON.stringify({
            text,
            location: null,
            shopId: context?.shopId ?? null,
            shopName: context?.shopName ?? null,
            history: history ?? [],
            memorySummary: memorySummary ?? "",
            preferredCharacterId,
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
        shops?: Shop[];
        turns?: ConsultAskResponse["turns"];
        followUpQuestion?: string;
        memorySummary?: string;
        errorCode?: ConsultAskResponse["errorCode"];
        helperQuestions?: string[];
        errorMessage?: string;
        retryable?: boolean;
      };
      if (!response.ok) {
        mergeKnownShops(payload.shops);
        setAiSuggestedShops(payload.shops && payload.shops.length > 0 ? payload.shops : []);
        return {
          reply:
            payload.reply ??
            "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
          imageUrl: payload.imageUrl,
          shopIds: payload.shopIds,
          shops: payload.shops,
          turns: payload.turns,
          followUpQuestion: payload.followUpQuestion,
          memorySummary: payload.memorySummary,
          errorCode: payload.errorCode ?? "system_error",
          helperQuestions: payload.helperQuestions,
          errorMessage:
            payload.errorMessage ??
            "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
          retryable: payload.retryable ?? payload.errorCode === "system_error",
        };
      }
      mergeKnownShops(payload.shops);
      if (payload.shops && payload.shops.length > 0) {
        setAiSuggestedShops(payload.shops);
      } else {
        setAiSuggestedShops([]);
      }
      return {
        reply:
          payload.reply ??
          "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        imageUrl: payload.imageUrl,
        shopIds: payload.shopIds,
        shops: payload.shops,
        turns: payload.turns,
        followUpQuestion: payload.followUpQuestion,
        memorySummary: payload.memorySummary,
        errorCode: payload.errorCode,
        helperQuestions: payload.helperQuestions,
        errorMessage: payload.errorMessage,
        retryable: payload.retryable ?? false,
      };
    } catch {
      setAiSuggestedShops([]);
      return {
        reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        errorCode: "system_error",
        errorMessage: "接続に失敗しました。少し時間をおいて、もう一度試してください。",
        retryable: true,
      };
    }
  }, [mergeKnownShops, preferredCharacterId]);

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
            <p className="text-lg font-semibold uppercase tracking-[0.14em] text-amber-700">
              Consult
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">にちよさんに相談する</h1>
            <p className="mt-1 text-base text-gray-700">
              お店探し、回り方、旬のもの、写真つきの質問までまとめて相談できます。
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-slate-600">
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
            allShops={knownShops}
            aiSuggestedShops={aiSuggestedShops}
            onSelectShop={(shopId, shopFromCard) => {
              const shop =
                shopFromCard ?? knownShops.find((item) => item.id === shopId) ?? null;
              if (shop) {
                setSelectedShop(shop);
              }
            }}
            initialOpen
            layout="page"
            onClear={() => setAiSuggestedShops([])}
            autoAskText={autoAskText}
            autoAskContext={autoAskContext}
            enableSpeechInput
            preferredCharacterId={preferredCharacterId}
            onPreferredCharacterChange={setPreferredCharacterId}
          />
        </div>
      </main>
      {selectedShop && <ShopDetailBanner shop={selectedShop} onClose={() => setSelectedShop(null)} />}
      <NavigationBar activeHref="/consult" />
    </div>
  );
}
