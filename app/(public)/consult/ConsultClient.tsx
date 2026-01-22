"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationBar from "../../components/NavigationBar";
import GrandmaChatter from "../map/components/GrandmaChatter";
import { grandmaComments } from "../map/data/grandmaComments";
import type { Shop } from "../map/data/shops";
import ShopDetailBanner from "../map/components/ShopDetailBanner";
import { saveConsultMapPayload } from "../../../lib/consultMapStorage";

type ConsultClientProps = {
  shops: Shop[];
};

export default function ConsultClient({ shops }: ConsultClientProps) {
  const router = useRouter();
  const [aiSuggestedShops, setAiSuggestedShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const searchParams = useSearchParams();
  const shopById = useMemo(() => {
    const map = new Map<number, Shop>();
    shops.forEach((shop) => map.set(shop.id, shop));
    return map;
  }, [shops]);

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

  const handleSelectShop = useCallback((shopId: number) => {
    const shop = shopById.get(shopId);
    if (shop) {
      setSelectedShop(shop);
    }
  }, [shopById]);

  const handleOpenMap = useCallback(() => {
    if (aiSuggestedShops.length === 0) return;
    const label = "AIおすすめ";
    saveConsultMapPayload({
      ids: aiSuggestedShops.map((shop) => shop.id),
      label,
    });
    router.push(`/map?consult=1&label=${encodeURIComponent(label)}`);
  }, [aiSuggestedShops, router]);

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
      <main className="relative z-10 flex h-full w-full items-start justify-center px-3 pb-24 pt-20">
        <GrandmaChatter
          titleLabel="にちよさん"
          fullWidth
          comments={grandmaComments}
          onAsk={handleGrandmaAsk}
          allShops={shops}
          aiSuggestedShops={aiSuggestedShops}
          onSelectShop={handleSelectShop}
          initialOpen
          layout="page"
          onClear={() => setAiSuggestedShops([])}
          autoAskText={autoAskText}
          autoAskContext={autoAskContext}
          onOpenSuggestedMap={handleOpenMap}
        />
      </main>
      {selectedShop && (
        <ShopDetailBanner
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}
      {!selectedShop && <NavigationBar activeHref="/consult" position="absolute" />}
    </div>
  );
}
