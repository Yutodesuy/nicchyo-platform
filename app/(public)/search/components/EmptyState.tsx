'use client';

import Link from "next/link";
import { SearchX, Map, Lightbulb } from "lucide-react";

interface EmptyStateProps {
  hasQuery: boolean;
  categories: string[];
  onCategoryClick?: (category: string) => void;
  onKeywordClick?: (keyword: string) => void;
}

/**
 * 空状態表示コンポーネント
 * 結果なし時（0件）のメッセージを表示
 * ※ クエリ未入力時の表示は SearchDiscovery コンポーネントに委譲
 */
export default function EmptyState({ hasQuery, categories, onCategoryClick, onKeywordClick }: EmptyStateProps) {
  // 注意: hasQueryがfalseの場合は親コンポーネントでSearchDiscoveryが表示されるため
  // ここでは理論上到達しないか、あるいは単純に何も表示しない
  if (!hasQuery) {
    return null;
  }

  // 結果なし時
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-white/90 px-6 py-10 text-center animate-in fade-in duration-300 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-400 mb-4">
        <SearchX size={32} />
      </div>

      <h3 className="text-lg font-bold text-gray-900">
        一致するお店が見つかりませんでした
      </h3>

      <div className="mt-4 rounded-xl bg-amber-50/80 p-4 text-left">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-bold text-amber-900">検索のヒント</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                ひらがなや、より短い単語で試してみてください。
                <br />
                <span className="text-xs text-gray-500">例：「オーガニックトマト」→「トマト」</span>
              </li>
              <li>
                漢字がわからない場合はひらがながおすすめです。
              </li>
            </ul>

            <div className="pt-2">
               <p className="text-xs font-semibold text-gray-500 mb-2">よく使われるキーワード：</p>
               <div className="flex flex-wrap gap-2">
                {onKeywordClick && (
                  <>
                    <button
                      type="button"
                      onClick={() => onKeywordClick('トマト')}
                      className="rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50"
                    >
                      トマト
                    </button>
                    <button
                      type="button"
                      onClick={() => onKeywordClick('包丁')}
                      className="rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50"
                    >
                      包丁
                    </button>
                    <button
                      type="button"
                      onClick={() => onKeywordClick('コーヒー')}
                      className="rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50"
                    >
                      コーヒー
                    </button>
                  </>
                )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {onCategoryClick && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium text-gray-500">
            または、人気のカテゴリーから探す
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryClick(cat)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 active:scale-95"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
         <p className="mb-4 text-sm text-gray-600">
           日曜市は、歩いて探すのも楽しみのひとつです。<br />
           マップに戻って、市場全体を見渡してみませんか？
         </p>
         <Link
           href="/map"
           className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-lg active:scale-95 sm:w-auto"
         >
           <Map size={18} className="group-hover:animate-pulse" />
           地図に戻って探検する
         </Link>
      </div>
    </div>
  );
}
