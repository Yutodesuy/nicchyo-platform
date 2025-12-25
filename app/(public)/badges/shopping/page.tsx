'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavigationBar from '../../../components/NavigationBar';
import { getShoppingProgress, SHOPPING_SEGMENTS } from '../services/shoppingBadgeService';

export default function ShoppingBadgesPage() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    const progress = getShoppingProgress();
    setUnlocked(progress.unlocked);
    setItemsCount(progress.itemsCount);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              badges
            </p>
            <h1 className="text-2xl font-bold text-gray-900">お買い物バッジ一覧</h1>
            <p className="text-sm text-gray-700">bag に追加したカテゴリごとに色がつきます。</p>
          </div>
          <Link
            href="/badges"
            className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
          >
            バッジトップへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <section className="rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">塗り絵の進捗</h2>
              <p className="text-sm text-gray-700">
                追加アイテム数: {itemsCount} 件 / 獲得: {unlocked.size} / {SHOPPING_SEGMENTS.length}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {SHOPPING_SEGMENTS.map((seg) => {
              const filled = unlocked.has(seg.id);
              return (
                <div
                  key={seg.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
                    filled ? 'border-emerald-200 bg-emerald-50/80' : 'border-gray-200 bg-gray-50/80'
                  }`}
                >
                  <span
                    className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                    style={{
                      backgroundColor: filled ? seg.color : 'white',
                      borderColor: filled ? seg.color : '#d1d5db',
                    }}
                    aria-hidden
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-gray-900">{seg.label}</p>
                    <p className="text-xs text-gray-600">
                      {filled ? '獲得済み' : '未獲得（bagに追加すると色がつきます）'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">
                    {filled ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <NavigationBar />
    </main>
  );
}
