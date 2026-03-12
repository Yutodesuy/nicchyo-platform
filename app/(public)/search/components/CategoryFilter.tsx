'use client';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
}

/**
 * カテゴリーフィルターコンポーネント
 * 横スクロール可能なタブUI（モバイル最適化）
 */
export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
}: CategoryFilterProps) {
  return (
    <div className="mt-3" role="group" aria-label="カテゴリーで絞り込み">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          カテゴリー
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
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
          すべて
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
    </div>
  );
}
