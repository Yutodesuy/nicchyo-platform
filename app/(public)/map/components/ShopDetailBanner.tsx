// app/(public)/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shop } from "../data/shops";

type ShopDetailBannerProps = {
  shop: Shop;
  onClose?: () => void;
};

export default function ShopDetailBanner({
  shop,
  onClose,
}: ShopDetailBannerProps) {
  // 画像の位置が「左側」か「右側」か
  const [imagePosition, setImagePosition] = useState<"left" | "right">("left");
  // キラキラ演出の表示
  const [sparkle, setSparkle] = useState(false);
  // ドラッグ中のオフセット
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const initialPosition = useRef<"left" | "right">("left");

  // 音声チャイム再生（最適化：useCallbackでメモ化）
  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContextが使えない環境では何もしない
    }
  }, []);

  // キラキラ演出トリガー（最適化：useCallbackでメモ化）
  const triggerSparkle = useCallback(() => {
    setSparkle(true);
    playChime();
    setTimeout(() => setSparkle(false), 600);
  }, [playChime]);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    initialPosition.current = imagePosition;
  }, [imagePosition]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - touchStartX.current;
    // オフセットを制限（-100 to 100）
    setDragOffset(Math.max(-100, Math.min(100, offset)));
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40; // スワイプ判定のしきい値(px)

    if (deltaX > threshold) {
      // 右へスワイプ（画像が右側へ）
      if (imagePosition !== "right") {
        triggerSparkle();
      }
      setImagePosition("right");
    } else if (deltaX < -threshold) {
      // 左へスワイプ（画像が左側へ）
      setImagePosition("left");
    }

    setDragOffset(0);
    touchStartX.current = null;
  }, [imagePosition, triggerSparkle]);

  // 画像のスタイルを計算（最適化：useMemoでメモ化）
  const imageStyle = useMemo(() => ({
    width: "160px",
    left: imagePosition === "left"
      ? `${dragOffset}px`
      : `calc(100% - 160px + ${dragOffset}px)`,
  }), [imagePosition, dragOffset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#c8f58a] p-3 shadow-2xl">
        {/* ヘッダー */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {shop.name}
            </h2>
            <p className="text-[11px] text-slate-600">
              {shop.category} | {shop.ownerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[11px] text-pink-500 shadow-sm transition-transform hover:scale-105"
              type="button"
              aria-label="お気に入りに追加"
            >
              <span>❤️</span>
              <span>お気に入り</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow transition-transform hover:scale-110"
              type="button"
              aria-label="閉じる"
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
                  {shop.message || shop.description}
                </p>
                <div className="rounded-lg bg-yellow-100 px-2 py-2">
                  <p className="text-[9px] font-semibold text-amber-800">出店予定</p>
                  <p className="text-[10px] text-slate-700 mt-1">{shop.schedule}</p>
                </div>
              </div>
            </div>

            {/* 右側テキスト：商品情報 */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-between pl-8">
              <div className="space-y-2 text-xs text-slate-800">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">ジャンル</p>
                  <p className="text-sm font-bold">{shop.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">主な商品</p>
                  <ul className="list-disc list-inside space-y-[2px] text-[11px]">
                    {shop.products.slice(0, 3).map((product, idx) => (
                      <li key={idx}>{product}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-lg">{shop.icon}</span>
                  <span className="text-[10px] font-semibold">
                    {shop.side === 'north' ? '北側' : '南側'} {shop.position + 1}番
                  </span>
                </div>
              </div>
            </div>

            {/* 画像：上に浮かんで左右に動く */}
            <div
              className={`absolute top-0 h-full flex-shrink-0 transition-all ${
                dragOffset === 0 ? "duration-300" : "duration-0"
              }`}
              style={imageStyle}
            >
              <Image
                src="/images/shops/tosahamono.webp"
                alt={`${shop.name}の商品`}
                width={160}
                height={160}
                className="object-cover object-center cursor-grab active:cursor-grabbing h-full w-full"
                priority
                onError={(e) => {
                  // 画像が読み込めない場合のフォールバック
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* キラキラ演出 */}
              {sparkle && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 rounded-xl border-2 border-amber-300/50 blur-sm animate-pulse" />
                  <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-amber-200/60 animate-ping" />
                  <div className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-yellow-200/80 animate-ping" />
                  <div className="absolute top-2 right-6 h-6 w-6 rounded-full bg-white/70 shadow-lg shadow-amber-200/60 animate-ping" />
                </div>
              )}
            </div>
          </div>
          <div className="h-28 w-28 overflow-hidden rounded-2xl bg-white shadow-sm">
            <Image
              src="/images/shops/tosahamono.webp"
              alt={shop.name}
              width={160}
              height={160}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* 商品リスト */}
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-slate-800 shadow-sm">
          <div className="mb-2 flex items-center gap-1">
            <span className="rounded-full bg-amber-500 px-2 py-[1px] text-[11px] font-semibold text-white">
              商品
            </span>
            <span className="text-[11px] text-amber-800">このお店の扱い</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {shop.products.map((product) => (
              <span
                key={product}
                className="rounded-full border border-amber-200 bg-white px-2 py-[2px] text-[11px] font-semibold text-amber-800"
              >
                {product}
              </span>
            ))}
          </div>
        </div>

        {/* ことづてセクション */}
        <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-800 shadow-sm border border-lime-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-lime-500 px-2 py-[1px] text-[11px] font-semibold text-white">
                ことづて
              </span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 text-[11px]">0</span>
            </div>
            <Link
              href={`/kotodute?shopId=${shop.id}`}
              className="rounded-full border border-lime-500 px-2 py-[2px] text-[11px] font-semibold text-lime-600"
            >
              投稿・もっと読む
            </Link>
          </div>

          <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/80 px-2 py-2 text-[11px] text-slate-600 text-center">
            ことづてページで、お店の情報や感想を共有できます。
          </div>
        </div>
      </div>
    </div>
  );
}
