'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CouponTypeWithParticipants } from '@/lib/coupons/types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
  couponTypes?: CouponTypeWithParticipants[];
  selectedCouponTypeId?: string | null;
  onCouponTypeChange?: (couponTypeId: string | null) => void;
}

const INITIAL_SHOW = 2;

/**
 * カテゴリーフィルターコンポーネント
 * 最初はカテゴリー・クーポンを2件ずつ表示し、トグルで展開できる
 */
export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
  couponTypes = [],
  selectedCouponTypeId = null,
  onCouponTypeChange,
}: CategoryFilterProps) {
  // 選択中のものがあれば初期展開
  const [categoriesExpanded, setCategoriesExpanded] = useState(
    () => selectedCategory !== null && categories.indexOf(selectedCategory) >= INITIAL_SHOW
  );
  const [couponsExpanded, setCouponsExpanded] = useState(
    () => selectedCouponTypeId !== null && couponTypes.findIndex((c) => c.id === selectedCouponTypeId) >= INITIAL_SHOW
  );

  const visibleCategories = categoriesExpanded ? categories : categories.slice(0, INITIAL_SHOW);
  const visibleCoupons = couponsExpanded ? couponTypes : couponTypes.slice(0, INITIAL_SHOW);

  return (
    <div className="mt-3 space-y-3">
      {/* カテゴリー */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          カテゴリー
        </p>
        <div
          role="group"
          aria-label="カテゴリーで絞り込み"
          className="flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
              selectedCategory === null
                ? 'bg-amber-600 text-white'
                : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
            }`}
            aria-pressed={selectedCategory === null}
          >
            すべて
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
              }`}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
          {categories.length > INITIAL_SHOW && (
            <button
              type="button"
              onClick={() => setCategoriesExpanded((v) => !v)}
              className="flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              aria-expanded={categoriesExpanded}
            >
              {categoriesExpanded ? (
                <><ChevronUp className="h-3 w-3" />閉じる</>
              ) : (
                <><ChevronDown className="h-3 w-3" />あと{categories.length - INITIAL_SHOW}件</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* クーポン */}
      {couponTypes.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            クーポン
          </p>
          <div
            role="group"
            aria-label="クーポン種類で絞り込み"
            className="flex flex-wrap gap-1.5"
          >
            <button
              type="button"
              onClick={() => onCouponTypeChange?.(null)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                selectedCouponTypeId === null
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
              aria-pressed={selectedCouponTypeId === null}
            >
              すべて
            </button>
            {visibleCoupons.map((couponType) => {
              const isActive = selectedCouponTypeId === couponType.id;
              return (
                <button
                  key={couponType.id}
                  type="button"
                  onClick={() => onCouponTypeChange?.(isActive ? null : couponType.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                  }`}
                  aria-pressed={isActive}
                >
                  {couponType.emoji} {couponType.name}
                </button>
              );
            })}
            {couponTypes.length > INITIAL_SHOW && (
              <button
                type="button"
                onClick={() => setCouponsExpanded((v) => !v)}
                className="flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                aria-expanded={couponsExpanded}
              >
                {couponsExpanded ? (
                  <><ChevronUp className="h-3 w-3" />閉じる</>
                ) : (
                  <><ChevronDown className="h-3 w-3" />あと{couponTypes.length - INITIAL_SHOW}件</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
