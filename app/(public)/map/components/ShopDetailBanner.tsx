// app/map/components/ShopDetailBanner.tsx
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
  // 画像の位置が「左側」か「右側」か
  const [imagePosition, setImagePosition] = useState<"left" | "right">("left");
  // ドラッグ中のオフセット
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const initialPosition = useRef<"left" | "right">("left");

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    initialPosition.current = imagePosition;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - touchStartX.current;
    // オフセットを制限（-100 to 100）
    setDragOffset(Math.max(-100, Math.min(100, offset)));
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40; // スワイプ判定のしきい値(px)

    if (deltaX > threshold) {
      // 右へスワイプ（画像が右側へ）
      setImagePosition("right");
    } else if (deltaX < -threshold) {
      // 左へスワイプ（画像が左側へ）
      setImagePosition("left");
    }

    setDragOffset(0);
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

        {/* ===== メインコンテンツエリア（画像 + テキスト） ===== */}
        <div
          className="relative mt-2 rounded-2xl bg-white overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* レイアウト：テキストが2つ並んでいて、その上を画像が動く */}
          <div className="relative flex gap-0 items-stretch min-h-40">
            {/* 左側テキスト：出店者の思い */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="inline-block rounded-full bg-emerald-500 px-2 py-[2px] text-[9px] font-semibold text-white">
                  出店者の思い
                </div>
                <p className="text-xs leading-snug text-slate-800">
                  土佐刃物は高知の歴史やき。ちょっくら見ていきや〜。
                </p>
                <div className="rounded-lg bg-yellow-100 px-2 py-2">
                  <p className="text-[9px] font-semibold text-amber-800">好きな土佐料理</p>
                  <p className="text-[10px] text-slate-700 mt-1">藁焼きカツオのタタキ</p>
                </div>
              </div>
            </div>

            {/* 右側テキスト：商品情報 */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-between pl-8">
              <div className="space-y-2 text-xs text-slate-800">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">ジャンル</p>
                  <p className="text-sm font-bold">シャツル</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">主な商品</p>
                  <ul className="list-disc list-inside space-y-[2px] text-[11px]">
                    <li>○○包丁</li>
                    <li>○○釜</li>
                    <li>○○包丁研ぎ</li>
                  </ul>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span>❤️</span>
                  <span className="text-[10px] font-semibold">301人</span>
                </div>
              </div>
            </div>

            {/* 画像：上に浮かんで左右に動く */}
            <div
              className={`absolute top-0 h-full flex-shrink-0 transition-all ${
                dragOffset === 0 ? "duration-300" : "duration-0"
              }`}
              style={{
                width: "160px",
                left: imagePosition === "left" 
                  ? `${dragOffset}px` 
                  : `calc(100% - 160px + ${dragOffset}px)`,
              }}
            >
              <Image
                src="/images/shops/tosahamono.webp"
                alt="土佐刃物の包丁"
                width={160}
                height={160}
                className="object-cover object-center cursor-grab active:cursor-grabbing h-full w-full scale-1"
              />
            </div>
          </div>

          {/* スワイプのヒント */}
          <div className="py-2 text-center text-[9px] text-slate-400 bg-white border-t border-slate-100">
            画像をドラッグして切り替え
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
