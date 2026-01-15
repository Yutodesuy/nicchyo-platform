"use client";

import { useCallback } from "react";
import NavigationBar from "../../components/NavigationBar";
import GrandmaChatter from "../map/components/GrandmaChatter";
import { grandmaComments } from "../map/data/grandmaComments";

export default function ConsultPage() {
  const handleGrandmaAsk = useCallback(async (text: string) => {
    try {
      const response = await fetch("/api/grandma/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          location: null,
        }),
      });
      if (!response.ok) {
        return {
          reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        };
      }
      const payload = (await response.json()) as {
        reply?: string;
        imageUrl?: string;
      };
      return {
        reply:
          payload.reply ??
          "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        imageUrl: payload.imageUrl,
      };
    } catch {
      return {
        reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
      };
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fbf8f3] pb-16">
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
      <main className="relative z-10 flex min-h-screen w-full items-center justify-center px-3 pb-24 pt-16">
        <GrandmaChatter
          titleLabel="にちよさん"
          fullWidth
          comments={grandmaComments}
          onAsk={handleGrandmaAsk}
          initialOpen
          layout="page"
        />
      </main>
      <NavigationBar activeHref="/consult" />
    </div>
  );
}
