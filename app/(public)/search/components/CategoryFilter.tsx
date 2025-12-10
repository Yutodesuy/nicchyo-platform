'use client';

interface CategoryFilterProps {
  selected: string | null;
  onChange: (category: string | null) => void;
  categories: string[];
}

/**
 * カテゴリーフィルターコンポーネント
 * 横スクロール可能なタブUI（モバイル最適化）
 */
export default function CategoryFilter({ selected, onChange, categories }: CategoryFilterProps) {
  return (
    <div className="mt-3" role="group" aria-label="カテゴリーで絞り込み">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
        カテゴリー
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
            selected === null
              ? 'bg-amber-600 text-white'
              : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
          }`}
          aria-label="すべてのカテゴリーを表示"
          aria-pressed={selected === null}
        >
          すべて
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              selected === cat
                ? 'bg-amber-600 text-white'
                : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
            }`}
            aria-label={`${cat}で絞り込む`}
            aria-pressed={selected === cat}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
