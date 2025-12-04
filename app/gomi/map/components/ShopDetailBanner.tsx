// app/public/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useRef } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";

type ShopDetailBannerProps = {
  shopName: string;
  onClose?: () => void;
};

export default function ShopDetailBanner({
  shopName,
  onClose,
}: ShopDetailBannerProps) {
  // 包丁画像が「左のテキスト側」か「右のテキスト側」か
  const [position, setPosition] = useState<"left" | "right">("left");
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40; // スワイプ判定のしきい値(px)

    if (deltaX < -threshold) {
      // 左 → 右へスワイプ
      setPosition("right");
    } else if (deltaX > threshold) {
      // 右 → 左へスワイプ
      setPosition("left");
    }

    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#c8f58a] p-3 shadow-2xl">
        {/* ヘッダー */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {shopName}
            </h2>
            <p className="text-[11px] text-slate-600">お店の情報</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[11px] text-pink-500 shadow-sm"
              type="button"
            >
              <span>❤️</span>
              <span>お気に入り</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* ===== 包丁画像を前面にかぶせるエリア ===== */}
        <div
          className="relative mt-1 overflow-hidden rounded-3xl bg-white/90 px-3 py-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 背景のテキスト２つ（左右並び） */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-800">
            {/* 左：商品説明側 */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-500">ジャンル</div>
              <div className="text-sm font-semibold">土佐刃物専門店</div>
              <div className="pt-1 space-y-1 leading-snug">
                <p className="text-[11px] text-slate-500">主な商品</p>
                <ul className="list-disc pl-4">
                  <li>○○包丁</li>
                  <li>○○釜</li>
                  <li>○○包丁研ぎ</li>
                </ul>
              </div>
              <div className="pt-2 text-[11px] text-slate-600">
                お気に入り：<span className="font-semibold">301人</span>
              </div>
            </div>

            {/* 右：出店者の思い側 */}
            <div className="space-y-2">
              <div className="inline-block rounded-full bg-emerald-500 px-2 py-[2px] text-[10px] font-semibold text-white">
                出店者の思い
              </div>
              <p className="leading-snug">
                土佐刃物は高知の歴史やき。ちょっくら見ていきや〜。
              </p>
              <div className="inline-flex flex-col rounded-xl bg-yellow-200/80 px-3 py-2 text-[11px]">
                <span className="font-semibold text-amber-700">
                  好きな土佐料理
                </span>
                <span className="mt-1 text-slate-800">
                  藁焼きカツオのタタキ
                </span>
              </div>
            </div>
          </div>

          {/* 前面にかぶさる包丁画像（左右にスライド） */}
          <div
            className="
              pointer-events-none
              absolute top-1/2 h-28 w-28
              -translate-y-1/2 -translate-x-1/2
              overflow-hidden rounded-2xl bg-slate-200 shadow-lg
              transition-[left] duration-300 ease-out
            "
            style={{
              // 左右 2 箇所（左: 25%, 右: 75% あたり）を行き来する
              left: position === "left" ? "25%" : "75%",
            }}
          >
            
            <Image
              src="/images/shops/tosahamono.webp"
              alt="土佐刃物の包丁"
              fill
              className="object-cover"
            />
          </div>

          {/* スワイプのヒント */}
          <div className="mt-4 text-center text-[10px] text-slate-500">
            ◀ 包丁の写真を左右にスワイプして、{""}
            <span className="font-semibold">商品説明</span> と{" "}
            <span className="font-semibold">出店者の思い</span> を切り替えよう
          </div>
        </div>

        {/* ことづてエリア（下） */}
        <div className="mt-3 rounded-2xl bg-white/90 px-3 py-2 text-xs text-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-lime-500 px-2 py-[1px] text-[11px] font-semibold text-white">
                ことづて
              </span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 text-[11px]">
                2
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>2025/12/03 の投稿</span>
              <button
                type="button"
                className="rounded-full border border-lime-500 px-2 py-[2px] text-[11px] font-semibold text-lime-600"
              >
                投稿する
              </button>
            </div>
          </div>

          <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-snug">
            <div className="text-slate-500">出店者から：なし</div>
            <div className="mt-1">
              <span className="mr-1 text-[10px] text-slate-400">07時26分</span>
              <span>めっちゃ良いの買えた</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
