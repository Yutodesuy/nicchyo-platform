'use client';

import type { CouponTypeWithParticipants } from '@/lib/coupons/types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
  couponTypes?: CouponTypeWithParticipants[];
  selectedCouponTypeId?: string | null;
  onCouponTypeChange?: (couponTypeId: string | null) => void;
}

/**
 * カテゴリーフィルターコンポーネント
 * 横スクロール可能なタブUI（モバイル最適化）
 */
export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
  couponTypes = [],
  selectedCouponTypeId = null,
  onCouponTypeChange,
}: CategoryFilterProps) {
  return (
    <div className="mt-4 space-y-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          カテゴリー
        </p>
      </div>
      <div
        role="group"
        aria-label="カテゴリーで絞り込み"
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
            selectedCategory === null
              ? 'bg-amber-600 text-white'
              : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
          }`}
          aria-label="すべてのカテゴリーを表示"
          aria-pressed={selectedCategory === null}
        >
          リセット
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              selectedCategory === cat
                ? 'bg-amber-600 text-white'
                : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
            }`}
            aria-label={`${cat}で絞り込む`}
            aria-pressed={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>
      {couponTypes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              クーポン
            </p>
          </div>
          <div
            role="group"
            aria-label="クーポン種類で絞り込み"
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            <button
              type="button"
              onClick={() => onCouponTypeChange?.(null)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                selectedCouponTypeId === null
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
              aria-label="すべてのクーポン種類を表示"
              aria-pressed={selectedCouponTypeId === null}
            >
              リセット
            </button>
            {couponTypes.map((couponType) => {
              const isActive = selectedCouponTypeId === couponType.id;
              return (
                <button
                  key={couponType.id}
                  type="button"
                  onClick={() => onCouponTypeChange?.(isActive ? null : couponType.id)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                  }`}
                  aria-label={`${couponType.name}で絞り込む`}
                  aria-pressed={isActive}
                >
                  {couponType.emoji} {couponType.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
