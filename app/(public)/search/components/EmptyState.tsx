'use client';

interface EmptyStateProps {
  hasQuery: boolean;
  categories: string[];
  onCategoryClick?: (category: string) => void;
}

/**
 * 空状態表示コンポーネント
 * 結果なし時（0件）のメッセージを表示
 * ※ クエリ未入力時の表示は SearchDiscovery コンポーネントに委譲
 */
export default function EmptyState({ hasQuery, categories, onCategoryClick }: EmptyStateProps) {
  // 注意: hasQueryがfalseの場合は親コンポーネントでSearchDiscoveryが表示されるため
  // ここでは理論上到達しないか、あるいは単純に何も表示しない
  if (!hasQuery) {
    return null;
  }

  // 結果なし時
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 px-6 py-8 text-center animate-in fade-in duration-300">
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
