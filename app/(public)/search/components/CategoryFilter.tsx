'use client';

interface CategoryFilterProps {
  mode: 'genre' | 'location';
  onModeChange: (mode: 'genre' | 'location') => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedChome: string | null;
  onChomeChange: (chome: string | null) => void;
  categories: string[];
  chomeOptions: { label: string; value: string }[];
}

/**
 * カテゴリーフィルターコンポーネント
 * 横スクロール可能なタブUI（モバイル最適化）
 */
export default function CategoryFilter({
  mode,
  onModeChange,
  selectedCategory,
  onCategoryChange,
  selectedChome,
  onChomeChange,
  categories,
  chomeOptions,
}: CategoryFilterProps) {
  return (
    <div className="mt-3" role="group" aria-label="カテゴリーで絞り込み">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          カテゴリー
        </p>
        <div
          className="inline-flex items-center rounded-full border border-amber-200 bg-white p-1 text-[11px] font-semibold text-amber-800"
          role="tablist"
          aria-label="カテゴリーの種類"
        >
          <button
            type="button"
            onClick={() => onModeChange('genre')}
            className={`rounded-full px-3 py-1 transition ${
              mode === 'genre' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
            }`}
            role="tab"
            aria-selected={mode === 'genre'}
          >
            ジャンル
          </button>
          <button
            type="button"
            onClick={() => onModeChange('location')}
            className={`rounded-full px-3 py-1 transition ${
              mode === 'location' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
            }`}
            role="tab"
            aria-selected={mode === 'location'}
          >
            場所
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        <button
          type="button"
          onClick={() => (mode === 'genre' ? onCategoryChange(null) : onChomeChange(null))}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
            mode === 'genre' ? selectedCategory === null : selectedChome === null
              ? 'bg-amber-600 text-white'
              : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
          }`}
          aria-label="すべてのカテゴリーを表示"
          aria-pressed={mode === 'genre' ? selectedCategory === null : selectedChome === null}
        >
          すべて
        </button>
        {mode === 'genre'
          ? categories.map((cat) => (
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
            ))
          : chomeOptions.map((chome) => (
              <button
                key={chome.value}
                type="button"
                onClick={() => onChomeChange(chome.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  selectedChome === chome.value
                    ? 'bg-amber-600 text-white'
                    : 'border border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
                }`}
                aria-label={`${chome.label}で絞り込む`}
                aria-pressed={selectedChome === chome.value}
              >
                {chome.label}
              </button>
            ))}
      </div>
    </div>
  );
}
