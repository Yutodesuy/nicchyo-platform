'use client';

import { Zap, MapPin, Tag } from 'lucide-react';

interface SearchDiscoveryProps {
  categories: string[];
  chomeOptions: { label: string; value: string }[];
  onCategorySelect: (category: string) => void;
  onChomeSelect: (chome: string) => void;
  onKeywordSelect: (keyword: string) => void;
}

/**
 * 検索ディスカバリーコンポーネント
 * 検索前の「何を探しますか？」状態を表示し、
 * ユーザーが直感的に探索を開始できるようにする
 */
export default function SearchDiscovery({
  categories,
  chomeOptions,
  onCategorySelect,
  onChomeSelect,
  onKeywordSelect,
}: SearchDiscoveryProps) {
  // "Smart"な提案として人気のキーワードを表示（現在は固定）
  const trendingKeywords = ["トマト", "包丁", "お弁当", "文旦", "植木", "田舎寿司", "芋天"];

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      {/* Categories Section */}
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

      {/* Area Section */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-amber-800">
          <MapPin className="h-4 w-4" />
          <h3 className="text-sm font-bold tracking-wider uppercase">場所から探す</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {chomeOptions.map((chome) => (
            <button
              key={chome.value}
              onClick={() => onChomeSelect(chome.value)}
              className="rounded-lg border border-orange-100 bg-orange-50/50 px-2 py-2 text-xs font-semibold text-orange-900 transition hover:bg-orange-100 active:scale-95"
            >
              {chome.label}
            </button>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-amber-800">
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <h3 className="text-sm font-bold tracking-wider uppercase">人気のキーワード</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingKeywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() => onKeywordSelect(keyword)}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50 hover:text-amber-600 hover:ring-amber-200"
            >
              # {keyword}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
