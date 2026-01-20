'use client';

import Link from "next/link";

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
      <p className="text-4xl" role="img" aria-label="Thinking Face">🤔</p>
      <h3 className="mt-3 text-base font-bold text-gray-900">
        お探しの条件では見つかりませんでした
      </h3>
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <p>キーワードが具体的すぎるかもしれません。</p>
        <p>
          <span className="font-semibold text-amber-700">「トマト」</span>や
          <span className="font-semibold text-amber-700">「お茶」</span>のように、
          <br />
          シンプルな単語やひらがなで試してみてください。
        </p>
      </div>

      {onCategoryClick && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            こちらもチェック
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryClick(cat)}
                className="rounded-full border border-amber-200 bg-white px-4 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-50 active:scale-95"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-amber-100">
         <p className="text-xs text-gray-500">
           日曜市は毎週変化します。<br/>
           どうしても見つからない場合は、全体のマップから探検してみましょう！
         </p>
         <Link
           href="/map"
           className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
         >
           マップに戻る &rarr;
         </Link>
      </div>
    </div>
  );
}
