'use client';

import { Tag } from 'lucide-react';

interface SearchDiscoveryProps {
  categories: string[];
  onCategorySelect: (category: string) => void;
}

/**
 * 検索ディスカバリーコンポーネント
 * 検索前の「何を探しますか？」状態を表示し、
 * ユーザーが直感的に探索を開始できるようにする
 */
export default function SearchDiscovery({
  categories,
  onCategorySelect,
}: SearchDiscoveryProps) {
  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
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
