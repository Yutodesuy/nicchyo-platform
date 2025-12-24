'use client';

import { useEffect, useState } from 'react';
import NavigationBar from '../../components/NavigationBar';
import { listTimeBadgeProgress, type TimeBadgeProgress } from '../map/services/timeBadgeService';

export default function BadgesPage() {
  const [badges, setBadges] = useState<TimeBadgeProgress[]>([]);

  useEffect(() => {
    setBadges(listTimeBadgeProgress());
  }, []);

  const collected = badges.filter((b) => b.count > 0).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-amber-100/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">badges</p>
            <h1 className="text-2xl font-bold">集めたバッジ</h1>
            <p className="text-sm text-gray-700">日曜市で集めたバッジを見返せます。</p>
          </div>
          <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200">
            {collected} / {badges.length || '–'} 獲得
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">時間帯ゲージ</h2>
              <p className="text-sm text-gray-700">
                毎週日曜の30分ごとの来訪状況をゲージで表示します。緑が訪問済み、灰色が未訪問。
              </p>
            </div>
            <a
              href="/badges/time"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
            >
              時間帯バッジを見る
            </a>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max flex-col gap-2">
              <div className="flex flex-nowrap items-end gap-1 pb-1">
                {badges.map((entry) => {
                  const acquired = entry.count > 0;
                  return (
                    <div key={entry.slot} className="relative h-10 w-[21px] shrink-0 overflow-hidden rounded-full">
                      <span className="sr-only">
                        {entry.slot} {acquired ? `訪問済み (${entry.count}回)` : '未訪問'}
                      </span>
                      <div
                        className={`absolute inset-0 ${acquired ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-nowrap items-center gap-6 text-[11px] text-gray-600">
                {['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(
                  (label) => (
                    <span key={label} className="shrink-0">{label}</span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-inner">
            <p className="text-sm font-semibold text-amber-900 mb-2">日曜市の小路イメージ（仮）</p>
            <div className="flex items-center gap-3 text-4xl">
              <span role="img" aria-label="market-stall">🏘️</span>
              <span role="img" aria-label="fruit">🍊</span>
              <span role="img" aria-label="vegetable">🥕</span>
              <span role="img" aria-label="fish">🐟</span>
              <span role="img" aria-label="flower">🌼</span>
            </div>
            <p className="mt-2 text-xs text-amber-800">後日イラストに差し替え予定です。</p>
          </div>
        </section>
      </div>

      <NavigationBar />
    </main>
  );
}
