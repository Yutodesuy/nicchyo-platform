"use client";

import Link from "next/link";
import { memo } from "react";
import { Shop } from "../../map/data/shops";

interface ShopResultCardProps {
  shop: Shop;
  isFavorite: boolean;
  onToggleFavorite?: (shopId: number) => void;
  onSelectShop?: (shop: Shop) => void;
}

/**
 * 店舗検索結果カードコンポーネント
 * 店舗情報と「地図で見る」リンクを表示
 */
function ShopResultCard({ shop, isFavorite, onToggleFavorite, onSelectShop }: ShopResultCardProps) {
  const previewImage =
    shop.images?.main ||
    shop.images?.thumbnail ||
    shop.images?.additional?.[0] ||
    "/images/shops/tosahamono.webp";

  return (
    <div
      className="cursor-pointer rounded-xl border-2 border-orange-300 bg-amber-50/40 px-4 py-3 shadow-sm transition hover:bg-orange-50 active:scale-[1.02] active:bg-orange-50"
      role="button"
      tabIndex={0}
      onClick={() => onSelectShop?.(shop)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectShop?.(shop);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {shop.icon}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{shop.name}</h3>
            <p className="text-xs text-gray-600">{shop.ownerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite?.(shop.id)}
            onMouseDown={(event) => event.stopPropagation()}
            onClickCapture={(event) => event.stopPropagation()}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition ${
              isFavorite
                ? "border-pink-300 bg-pink-500 text-white"
                : "border-pink-200 bg-white text-pink-500 hover:bg-pink-50"
            }`}
          >
            {"\u2665"}
          </button>
          <span className="rounded-full bg-amber-600 px-2 py-1 text-xs font-semibold text-white">
            #{shop.id}
          </span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-amber-100 bg-white">
        <img src={previewImage} alt={`${shop.name}の画像`} className="h-28 w-full object-cover" />
      </div>

      <p className="mt-2 text-xs text-amber-700">{shop.category}</p>

      <p className="mt-1 text-sm text-gray-700">
        取り扱い: {shop.products.slice(0, 4).join("・")}
        {shop.products.length > 4 && "..."}
      </p>

      <Link
        href={`/map?shop=${shop.id}`}
        onClick={(event) => event.stopPropagation()}
        className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
      >
        地図で見る →
      </Link>
    </div>
  );
}

export default memo(ShopResultCard);
