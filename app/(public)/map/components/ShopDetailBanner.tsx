// app/(public)/map/components/ShopDetailBanner.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import type { DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shop } from "../data/shops";
import { useAuth } from "../../../../lib/auth/AuthContext";
import { getShopBannerImage } from "../../../../lib/shopImages";
import { useBag } from "../../../../lib/storage/BagContext";
import {
  KOTODUTE_UPDATED_EVENT,
  loadKotodute,
  type KotoduteNote,
} from "../../../../lib/kotoduteStorage";
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
const KOTODUTE_PREVIEW_LIMIT = 3;
const KOTODUTE_TAG_REGEX = /\s*#\d+|\s*#all/gi;

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
  const { permissions } = useAuth();
  const { addItem } = useBag();
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [isBagHover, setIsBagHover] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);
  const [bagProductKeys, setBagProductKeys] = useState<Set<string>>(new Set());
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const [kotoduteNotes, setKotoduteNotes] = useState<KotoduteNote[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("shop-banner-open");
    return () => {
      document.body.classList.remove("shop-banner-open");
    };
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateKotodute = () => {
      const notes = loadKotodute().filter(
        (note) => typeof note.shopId === "number" && note.shopId === shop.id
      );
      const sorted = notes.slice().sort((a, b) => b.createdAt - a.createdAt);
      setKotoduteNotes(sorted);
    };
    updateKotodute();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "nicchyo-kotodute-notes") {
        updateKotodute();
      }
    };
    const handleUpdate = () => updateKotodute();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(KOTODUTE_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(KOTODUTE_UPDATED_EVENT, handleUpdate);
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

  const canEditShop = permissions.canEditShop(shop.id);
  const bannerImage = shop.images?.main ?? getShopBannerImage(shop.category);

  const handleEditShop = useCallback(() => {
    router.push("/my-shop");
  }, [router]);

  const handleConfirmAdd = useCallback(() => {
    if (!pendingProduct) return;
    if (onAddToBag) {
      onAddToBag(pendingProduct, shop.id);
    } else {
      addItem({ name: pendingProduct, fromShopId: shop.id });
    }
    setBagProductKeys((prev) => {
      const next = new Set(prev);
      next.add(buildBagKey(pendingProduct, shop.id));
      return next;
    });
    setPendingProduct(null);
  }, [addItem, onAddToBag, pendingProduct, shop.id]);

  const handleCancelAdd = useCallback(() => {
    setPendingProduct(null);
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] flex items-stretch justify-center bg-slate-900/30">
      <div className="h-full w-full max-w-none overflow-y-auto bg-white/95 p-6 shadow-2xl">
        {/* ヘッダー */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-4xl font-semibold text-slate-900">
                {shop.name}
              </h2>
              <button
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xl shadow-sm transition-transform hover:scale-105 ${isFavorite ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}
                type="button"
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
              >
                <span className="text-2xl font-bold">{isFavorite ? "❤" : "♡"}</span>
              </button>
              {canEditShop && (
                <button
                  type="button"
                  onClick={handleEditShop}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xl font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  編集する
                </button>
              )}
            </div>
            <p className="text-xl text-slate-600">
              {shop.category} | {shop.ownerName}
            </p>
          </div>
          <div className="fixed right-6 top-6 z-[2105] flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-700 text-3xl font-bold shadow transition-transform hover:scale-110"
              type="button"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        {/* 写真 */}
        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Image
            src={bannerImage}
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

        <div className="mt-8 divide-y divide-slate-200">
          <section className="py-6 text-xl text-slate-700">
            <p className="text-base font-semibold text-slate-500">主な商品</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{shop.category}</p>
          </section>

          {/* 商品名 */}
          <section className="py-6 text-xl text-slate-700">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-base font-semibold text-slate-500">
                商品名
              </span>
              <button
                type="button"
                onClick={handleBagClick}
                onDragOver={handleBagDragOver}
                onDragLeave={handleBagDragLeave}
                onDrop={handleBagDrop}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xl font-semibold shadow-sm transition ${
                  isBagHover
                    ? "border-slate-500 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                aria-label="買い物リストへ"
              >
                <span className="text-xl" aria-hidden>
                  {"\u{1F6CD}"}
                </span>
                バッグ
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
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
                    className={`cursor-grab rounded-full border px-3 py-1.5 text-xl font-semibold shadow-sm active:cursor-grabbing ${
                      isInBag
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                    aria-label={`${product}`}
                  >
                    {product}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="py-6 text-slate-800">
            <div className="space-y-6 text-2xl">
              <div className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold text-slate-500">出店スタイル</p>
                <p className="mt-2 text-2xl text-slate-700">
                  {shop.stallStyle ?? shop.schedule}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold text-slate-500">出店者の想い・こだわり</p>
                <p className="mt-2 text-2xl leading-snug text-slate-800">
                  {shop.aboutVendor || shop.message || shop.description}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <p className="text-base font-semibold text-slate-500">得意料理</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {shop.specialtyDish ?? "なし"}
                </p>
              </div>
            </div>
          </section>

          {/* ことづてセクション */}
          <section className="py-6 text-lg text-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-slate-500">
                  ことづて
                </span>
                <span className="text-base text-slate-600">
                  {kotoduteNotes.length}
                </span>
              </div>
              <Link
                href={`/kotodute?shopId=${shop.id}`}
                className="rounded-full border border-slate-300 px-3 py-1 text-base font-semibold text-slate-600"
              >
                投稿・もっと読む
              </Link>
            </div>

            {kotoduteNotes.length === 0 ? (
              <div className="mt-4 border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-base text-slate-600">
                ことづてページで、お店の感想を共有できます。
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {kotoduteNotes.slice(0, KOTODUTE_PREVIEW_LIMIT).map((note) => (
                  <div
                    key={note.id}
                    className="border border-slate-200 bg-slate-50 px-3 py-3 text-lg text-slate-800"
                  >
                    {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {pendingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
              <p className="text-xl font-semibold text-gray-900">
                {`バッグに${pendingProduct}を入れますか？`}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-lg font-semibold text-gray-600 hover:bg-gray-50"
                >
                  いいえ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="rounded-full bg-slate-800 px-3 py-2 text-lg font-semibold text-white shadow-sm hover:bg-slate-700"
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
