"use client";

import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadKotodute, KotoduteNote } from "../../../../lib/kotoduteStorage";
import { Shop } from "../data/shops";

type ShopDetailBannerProps = {
  shop: Shop;
  bagCount: number;
  onAddProduct?: (name: string) => void;
  onClose?: () => void;
};

export default function ShopDetailBanner({
  shop,
  bagCount,
  onAddProduct,
  onClose,
}: ShopDetailBannerProps) {
  const [notes, setNotes] = useState<KotoduteNote[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>(shop.products);

  useEffect(() => {
    const all = loadKotodute();
    setNotes(all.filter((n) => n.shopId === shop.id));
    setAvailableProducts(shop.products);
  }, [shop.id, shop.products]);

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, product: string) => {
    e.dataTransfer?.setData("text/plain", product);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                vendor detail
              </p>
            <h2 className="text-lg font-bold text-slate-900">{shop.name}</h2>
            <p className="text-[11px] text-slate-600">
              #{shop.id} / {shop.category} / {shop.schedule}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm hover:bg-slate-200"
              type="button"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex-1 space-y-2 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">紹介</p>
            <p className="text-xs leading-relaxed text-slate-700">{shop.description}</p>
            {shop.message && (
              <p className="rounded-lg bg-white px-3 py-2 text-[11px] text-amber-800 shadow-sm">
                {shop.message}
              </p>
            )}
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

        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-slate-800 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-amber-500 px-2 py-[1px] text-[11px] font-semibold text-white">
                商品
              </span>
              <span className="text-[11px] text-amber-800">このお店の扱い</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-2 py-[2px] text-[10px] font-semibold text-amber-800 border border-amber-100">
                バッグ {bagCount} 点
              </span>
              <Link
                href="/recipes"
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-[6px] text-[11px] font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
              >
                バッグを見る
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableProducts.map((product) => (
              <button
                key={product}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, product)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-white px-2 py-1 font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
              >
                <span aria-hidden>➕</span>
                <span>{product}</span>
              </button>
            ))}
          </div>
        </div>

        {/* バッグへのドロップ/ボタン */}
        <div
          className="mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-amber-200 bg-white/90 px-3 py-3 text-xs text-amber-800"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const name = e.dataTransfer.getData("text/plain");
            if (!name) return;
            onAddProduct?.(name);
            setAvailableProducts((prev) => prev.filter((p) => p !== name));
          }}
        >
          <div className="flex items-center gap-3">
              <div className="relative h-14 w-16">
                <Image
                src="/images/bag_illustration.jpg"
                alt="買い物バッグ"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[12px] font-semibold">バッグにドロップ</p>
              <p className="text-[11px] text-amber-700">商品のチップをドラッグ＆ドロップ、またはタップ追加</p>
            </div>
          </div>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            バッグを見る
          </Link>
        </div>

        <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-800 shadow-sm border border-lime-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-lime-500 px-2 py-[1px] text-[11px] font-semibold text-white">
                ことづて
              </span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 text-[11px]">{notes.length}</span>
            </div>
            <Link
              href={`/kotodute?shopId=${shop.id}`}
              className="rounded-full border border-lime-500 px-2 py-[2px] text-[11px] font-semibold text-lime-600"
            >
              投稿・もっと読む
            </Link>
          </div>

          {notes.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white/80 px-2 py-2 text-[11px] text-slate-600 text-center">
              まだ投稿がありません。# {shop.id} で投稿してもらいましょう。
            </div>
          ) : (
            <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-snug space-y-2">
              {notes.slice(0, 3).map((n) => (
                <div key={n.id} className="rounded-lg bg-lime-50 px-2 py-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span># {shop.id}</span>
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
