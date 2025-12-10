'use client';

interface EmptyStateProps {
  hasQuery: boolean;
  categories: string[];
  onCategoryClick?: (category: string) => void;
}

/**
 * 空状態表示コンポーネント
 * クエリ未入力時と結果なし時で異なるメッセージを表示
 */
export default function EmptyState({ hasQuery, categories, onCategoryClick }: EmptyStateProps) {
  if (!hasQuery) {
    // クエリ未入力時
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 px-6 py-8 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-sm font-semibold text-gray-900">
          キーワードを入力してください
        </p>
        <p className="mt-1 text-xs text-gray-600">
          お店の名前、商品名、カテゴリー、ブロック番号で検索できます
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs text-gray-700">
            例: レタス
          </span>
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs text-gray-700">
            例: 包丁
          </span>
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs text-gray-700">
            例: #42
          </span>
        </div>
      </div>
    );
  }

  // 結果なし時
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 px-6 py-8 text-center">
      <p className="text-4xl">😢</p>
      <p className="mt-3 text-sm font-semibold text-gray-900">
        条件に合うお店が見つかりません
      </p>
      <p className="mt-1 text-xs text-gray-600">
        別のキーワードやカテゴリーでお試しください
      </p>
      {onCategoryClick && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-gray-600">人気のカテゴリー:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryClick(cat)}
                className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
