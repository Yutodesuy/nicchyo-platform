"use client";

import { useCallback, useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import GrandmaChatter from "../map/components/GrandmaChatter";
import { grandmaComments } from "../map/data/grandmaComments";
import { shops } from "../map/data/shops";

export default function ConsultPage() {
  const [aiSuggestedShops, setAiSuggestedShops] = useState<typeof shops>([]);

  const handleGrandmaAsk = useCallback(async (text: string, imageFile?: File | null) => {
    try {
      const useForm = !!imageFile;
      const body = useForm
        ? (() => {
            const form = new FormData();
            form.append("text", text);
            form.append("location", JSON.stringify(null));
            if (imageFile) form.append("image", imageFile);
            return form;
          })()
        : JSON.stringify({
            text,
            location: null,
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
  }, []);

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
      <main className="relative z-10 flex h-full w-full items-start justify-center px-3 pb-24 pt-6">
        <GrandmaChatter
          titleLabel="にちよさん"
          fullWidth
          comments={grandmaComments}
          onAsk={handleGrandmaAsk}
          allShops={shops}
          aiSuggestedShops={aiSuggestedShops}
          initialOpen
          layout="page"
        />
      </main>
      <NavigationBar activeHref="/consult" position="absolute" />
    </div>
  );
}
