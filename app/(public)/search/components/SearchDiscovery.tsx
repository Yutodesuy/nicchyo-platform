'use client';

import { Tag } from 'lucide-react';
import type { CouponTypeWithParticipants } from '@/lib/coupons/types';

interface SearchDiscoveryProps {
  categories: string[];
  onCategorySelect: (category: string) => void;
  couponTypes?: CouponTypeWithParticipants[];
  selectedCouponTypeId?: string | null;
  onCouponTypeSelect?: (couponTypeId: string | null) => void;
}

/**
 * 検索ディスカバリーコンポーネント
 * 検索前の「何を探しますか？」状態を表示し、
 * ユーザーが直感的に探索を開始できるようにする
 */
export default function SearchDiscovery({
  categories,
  onCategorySelect,
  couponTypes = [],
  selectedCouponTypeId = null,
  onCouponTypeSelect,
}: SearchDiscoveryProps) {
  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      {couponTypes.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2 text-emerald-800">
            <span aria-hidden className="text-sm">🎟️</span>
            <h3 className="text-sm font-bold tracking-wider uppercase">クーポン種類から探す</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {couponTypes.map((couponType) => {
              const isActive = selectedCouponTypeId === couponType.id;
              return (
                <button
                  key={couponType.id}
                  type="button"
                  onClick={() => onCouponTypeSelect?.(isActive ? null : couponType.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{couponType.emoji} {couponType.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      <section>
        <div className="mb-3 flex items-center gap-2 text-amber-800">
          <Tag className="h-4 w-4" />
          <h3 className="text-sm font-bold tracking-wider uppercase">ジャンルから探す</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className="flex items-center justify-center rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:shadow-md active:scale-95"
            >
              {cat}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
