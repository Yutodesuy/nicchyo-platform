// app/map/MapPageClient.tsx
"use client";

import { useState } from "react";
import MapView from "./components/MapView";
import ShopDetailBanner from "./components/ShopDetailBanner";

export default function MapPageClient() {
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  return (
    <div className="relative h-full w-full">
      {/* そのままの MapView */}
      <MapView />

      {/* デモ用トリガーボタン（あとでお店アイコンから開くように差し替え予定） */}
      <button
        type="button"
        onClick={() => setIsBannerOpen(true)}
        className="absolute bottom-4 left-4 z-40 rounded-full bg-lime-600 px-3 py-2 text-xs font-semibold text-white shadow-lg active:scale-95"
      >
        土佐刃物専門店のバナーを表示
      </button>

      {/* さっき作ったスワイプバナー（包丁画像2枚セット） */}
      {isBannerOpen && (
        <ShopDetailBanner
          shopName="土佐刃物専門店"
          onClose={() => setIsBannerOpen(false)}
        />
      )}
    </div>
  );
}
