// app/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadKotodute, KotoduteNote } from "../../../../lib/kotoduteStorage";
import { shops } from "../data/shops";

type ShopDetailBannerProps = {
  shopId: number;
  shopName: string;
  onClose?: () => void;
};

export default function ShopDetailBanner({
  shopId,
  shopName,
  onClose,
}: ShopDetailBannerProps) {
  const [imagePosition, setImagePosition] = useState<"left" | "right">("left");
  const [sparkle, setSparkle] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [notes, setNotes] = useState<KotoduteNote[]>([]);
  const touchStartX = useRef<number | null>(null);
  const initialPosition = useRef<"left" | "right">("left");

  // 店舗データを取得
  const shop = shops.find((s) => s.id === shopId);

  useEffect(() => {
    const all = loadKotodute();
    setNotes(all.filter((n) => n.shopId === shopId));
  }, [shopId]);

  const playChime = () => {
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
      // AudioContext が使えない環境では何もしない
    }
  };

  const triggerSparkle = () => {
    setSparkle(true);
    playChime();
    setTimeout(() => setSparkle(false), 600);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    initialPosition.current = imagePosition;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - touchStartX.current;
    setDragOffset(Math.max(-100, Math.min(100, offset)));
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;

    if (deltaX > threshold) {
      if (imagePosition !== "right") {
        triggerSparkle();
      }
      setImagePosition("right");
    } else if (deltaX < -threshold) {
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
            <p className="text-[11px] text-slate-600">お店の紹介</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[11px] text-pink-500 shadow-sm"
              type="button"
            >
              <span>❤</span>
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

        {/* メインコンテンツ：テキスト + 画像 */}
        <div
          className="relative mt-2 rounded-2xl bg-white overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative flex gap-0 items-stretch min-h-40">
            <div className="flex-1 px-4 py-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="inline-block rounded-full bg-emerald-500 px-2 py-[2px] text-[9px] font-semibold text-white">
                  出店者の思い
                </div>
                <p className="text-xs leading-snug text-slate-800">
                  土佐のものは高知の歴史そのもの。ちょっと見ていってね。
                </p>
                <div className="rounded-lg bg-yellow-100 px-2 py-2">
                  <p className="text-[9px] font-semibold text-amber-800">好きな土佐料理</p>
                  <p className="text-[10px] text-slate-700 mt-1">藁焼きカツオのタタキ</p>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 py-3 flex flex-col justify-between pl-8">
              <div className="space-y-2 text-xs text-slate-800">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">ジャンル</p>
                  <p className="text-sm font-bold">{shop?.category || 'シャモ鍋'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">主な商品</p>
                  <ul className="list-disc list-inside space-y-[2px] text-[11px]">
                    {shop?.products.slice(0, 3).map((product, idx) => (
                      <li key={idx}>{product}</li>
                    )) || (
                      <>
                        <li>鍋セット</li>
                        <li>だし</li>
                        <li>薬味</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span>❤</span>
                  <span className="text-[10px] font-semibold">301人</span>
                </div>
              </div>
            </div>

            <div
              className={`absolute top-0 h-full flex-shrink-0 transition-all ${
                dragOffset === 0 ? "duration-300" : "duration-0"
              }`}
              style={{
                width: "160px",
                left:
                  imagePosition === "left"
                    ? `${dragOffset}px`
                    : `calc(100% - 160px + ${dragOffset}px)`,
              }}
            >
              <Image
                src="/images/shops/tosahamono.webp"
                alt="土佐物の店"
                width={160}
                height={160}
                className="object-cover object-center cursor-grab active:cursor-grabbing h-full w-full scale-1"
              />
              {sparkle && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 rounded-xl border-2 border-amber-300/50 blur-sm animate-pulse"></div>
                  <div className="absolute -4 -4 h-16 w-16 rounded-full bg-amber-200/60 animate-ping" />
                  <div className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-yellow-200/80 animate-ping" />
                  <div className="absolute top-2 right-6 h-6 w-6 rounded-full bg-white/70 shadow-lg shadow-amber-200/60 animate-ping" />
                </div>
              )}
            </div>
          </div>

          <div className="py-2 text-center text-[9px] text-slate-400 bg-white border-t border-slate-100">
            画像をドラッグして切り替え
          </div>
        </div>

        {/* ことづてエリア */}
        <div className="mt-3 rounded-2xl bg-white/90 px-3 py-2 text-xs text-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-lime-500 px-2 py-[1px] text-[11px] font-semibold text-white">
                ことづて
              </span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 text-[11px]">
                {notes.length}
              </span>
            </div>
            <Link
              href={`/kotodute?shopId=${shopId}`}
              className="rounded-full border border-lime-500 px-2 py-[2px] text-[11px] font-semibold text-lime-600"
            >
              投稿・もっと読む
            </Link>
          </div>

          {notes.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/80 px-2 py-2 text-[11px] text-slate-600 text-center">
              まだ投稿がありません。# {shopId} で投稿してもらいましょう。
            </div>
          ) : (
            <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-snug space-y-2">
              {notes.slice(0, 3).map((n) => (
                <div key={n.id} className="rounded-lg bg-lime-50 px-2 py-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span># {shopId}</span>
                    <span>
                      {new Date(n.createdAt).getHours().toString().padStart(2, "0")}:
                      {new Date(n.createdAt).getMinutes().toString().padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-800">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
