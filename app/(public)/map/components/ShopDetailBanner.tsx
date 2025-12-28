// app/(public)/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import type { DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shop } from "../data/shops";
import {
  FAVORITE_SHOPS_KEY,
  FAVORITE_SHOPS_UPDATED_EVENT,
  loadFavoriteShopIds,
  toggleFavoriteShopId,
} from "../../../../lib/favoriteShops";

type ShopDetailBannerProps = {
  shop: Shop;
  bagCount?: number;
  onClose?: () => void;
  onAddToBag?: (name: string, fromShopId?: number) => void;
};

type BagItem = {
  name: string;
  fromShopId?: number;
};

const STORAGE_KEY = "nicchyo-fridge-items";

const buildBagKey = (name: string, shopId?: number) =>
  `${name.trim().toLowerCase()}-${shopId ?? "any"}`;

function loadBagItems(): BagItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BagItem[];
  } catch {
    return [];
  }
}

export default function ShopDetailBanner({
  shop,
  bagCount,
  onClose,
  onAddToBag,
}: ShopDetailBannerProps) {
  const router = useRouter();
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [isBagHover, setIsBagHover] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);
  const [bagProductKeys, setBagProductKeys] = useState<Set<string>>(new Set());
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateBag = () => {
      const items = loadBagItems();
      const keys = new Set<string>();
      items.forEach((item) => {
        const key = buildBagKey(item.name, item.fromShopId);
        keys.add(key);
        // 互換性: fromShopId が無いデータは any として扱う
        if (item.fromShopId === undefined) {
          keys.add(buildBagKey(item.name, undefined));
        }
      });
      setBagProductKeys(keys);
    };
    updateBag();
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        updateBag();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateFavorites = () => {
      setFavoriteShopIds(loadFavoriteShopIds());
    };
    updateFavorites();
    const handler = (event: StorageEvent) => {
      if (event.key === FAVORITE_SHOPS_KEY) {
        updateFavorites();
      }
    };
    const updateHandler = (event: Event) => {
      if (event.type === FAVORITE_SHOPS_UPDATED_EVENT) {
        updateFavorites();
      }
    };
    window.addEventListener("storage", handler);
    window.addEventListener(FAVORITE_SHOPS_UPDATED_EVENT, updateHandler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(FAVORITE_SHOPS_UPDATED_EVENT, updateHandler);
    };
  }, [shop.id]);

  const handleProductDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, product: string) => {
      event.dataTransfer.setData("text/plain", product);
      event.dataTransfer.effectAllowed = "move";
      setDraggedProduct(product);
    },
    []
  );

  const handleProductDragEnd = useCallback(() => {
    setDraggedProduct(null);
    setIsBagHover(false);
  }, []);

  const handleBagDragOver = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsBagHover(true);
  }, []);

  const handleBagDragLeave = useCallback(() => {
    setIsBagHover(false);
  }, []);

  const handleBagDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const product = event.dataTransfer.getData("text/plain") || draggedProduct;
      if (product) {
        setPendingProduct(product);
      }
      setIsBagHover(false);
      setDraggedProduct(null);
    },
    [draggedProduct]
  );

  const handleProductTap = useCallback((product: string) => {
    setPendingProduct(product);
  }, []);

  const handleBagClick = useCallback(() => {
    router.push("/bag");
  }, [router]);

  const isFavorite = favoriteShopIds.includes(shop.id);

  const handleToggleFavorite = useCallback(() => {
    const next = toggleFavoriteShopId(shop.id);
    setFavoriteShopIds(next);
  }, [shop.id]);

  const handleConfirmAdd = useCallback(() => {
    if (!pendingProduct) return;
    onAddToBag?.(pendingProduct, shop.id);
    setBagProductKeys((prev) => {
      const next = new Set(prev);
      next.add(buildBagKey(pendingProduct, shop.id));
      return next;
    });
    setPendingProduct(null);
  }, [onAddToBag, pendingProduct, shop.id]);

  const handleCancelAdd = useCallback(() => {
    setPendingProduct(null);
  }, []);

  return (
    <div className="fixed inset-x-0 top-16 bottom-16 z-[2000] flex items-stretch justify-center bg-black/40 px-4 py-4">
      <div className="h-[calc(100%-4rem)] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#c8f58a] p-3 shadow-2xl">
        {/* ヘッダー */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {shop.name}
            </h2>
            <p className="text-sm text-slate-600">
              {shop.category} | {shop.ownerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`mr-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm transition-transform hover:scale-105 ${isFavorite ? "bg-pink-100 text-pink-600" : "bg-white/70 text-pink-500"}`}
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            >
              <span className="text-lg font-bold">{isFavorite ? "❤" : "♡"}</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 text-2xl font-bold shadow transition-transform hover:scale-110"
              type="button"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        {/* 写真 */}
        <div className="mt-2 overflow-hidden rounded-2xl bg-white">
          <Image
            src="/images/shops/tosahamono.webp"
            alt={`${shop.name}の写真`}
            width={960}
            height={640}
            className="h-56 w-full object-cover object-center md:h-72"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* 商品名 */}
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm text-slate-800 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-amber-500 px-2 py-[1px] text-sm font-semibold text-white">
                商品名
              </span>
              <span className="text-sm text-amber-800">タップ/ドラッグでバッグへ</span>
            </div>
            <button
              type="button"
              onClick={handleBagClick}
              onDragOver={handleBagDragOver}
              onDragLeave={handleBagDragLeave}
              onDrop={handleBagDrop}
              className={`flex items-center gap-2 rounded-full border px-3 py-[3px] text-sm font-semibold shadow-sm transition ${
                isBagHover
                  ? "border-amber-500 bg-amber-100 text-amber-900"
                  : "border-amber-200 bg-white text-amber-800"
              }`}
              aria-label="買い物リストへ"
            >
              <span className="text-base" aria-hidden>
                {"\u{1F6CD}"}
              </span>
              バッグ
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {shop.products.map((product) => {
              const specificKey = buildBagKey(product, shop.id);
              const anyKey = buildBagKey(product, undefined);
              const isInBag = bagProductKeys.has(specificKey) || bagProductKeys.has(anyKey);
              return (
                <button
                  key={product}
                  type="button"
                  draggable
                  onDragStart={(event) => handleProductDragStart(event, product)}
                  onDragEnd={handleProductDragEnd}
                  onClick={() => handleProductTap(product)}
                  className={`cursor-grab rounded-full border px-2 py-[2px] text-sm font-semibold shadow-sm active:cursor-grabbing ${
                    isInBag
                      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                      : "border-amber-200 bg-white text-amber-800"
                  }`}
                  aria-label={`${product}`}
                >
                  {product}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-sm border border-yellow-100">
            <p className="text-[11px] font-semibold text-amber-700">出店スタイル</p>
            <p className="mt-1 text-base text-slate-700">{shop.stallStyle ?? shop.schedule}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-sm border border-emerald-100">
            <p className="text-[11px] font-semibold text-emerald-700">出店者の想い・こだわり</p>
            <p className="mt-1 text-base leading-snug text-slate-800">
              {shop.aboutVendor || shop.message || shop.description}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-sm border border-amber-100">
            <p className="text-[11px] font-semibold text-amber-700">得意料理</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {shop.specialtyDish ?? "なし"}
            </p>
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
            ことづてページで、お店の感想を共有できます。
          </div>
        </div>

        {pendingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
              <p className="text-sm font-semibold text-gray-900">
                {`バッグに${pendingProduct}を入れますか？`}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  いいえ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500"
                >
                  はい
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
