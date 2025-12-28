'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavigationBar from '../../../components/NavigationBar';
import { listTimeBadgeProgress, type TimeBadgeProgress } from '../../map/services/timeBadgeService';

function formatDate(date?: string) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function TimeBadgesPage() {
  const [badges, setBadges] = useState<TimeBadgeProgress[]>([]);

  useEffect(() => {
    setBadges(listTimeBadgeProgress());
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-amber-100/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">badges</p>
            <h1 className="text-2xl font-bold">時間帯バッジ一覧</h1>
            <p className="text-sm text-gray-700">毎週日曜 5:00〜17:00 / 30分刻み</p>
          </div>
          <Link
            href="/badges"
            className="rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
          >
            バッジトップへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            {badges.map((entry) => {
              const acquired = entry.count > 0;
              return (
                <div
                  key={entry.slot}
                  className={`rounded-xl border px-4 py-3 shadow-sm ${
                    acquired ? 'border-amber-200 bg-amber-50/70' : 'border-gray-100 bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                        {entry.slot}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          {acquired ? entry.tierIcon ?? entry.badge.icon : '⏳'}
                        </span>
                        <div>
                          <p className="text-base font-bold text-gray-900">{entry.badge.title}</p>
                          <p className="text-xs text-gray-600">
                            {acquired ? `${entry.tierTitle ?? ''} / ${entry.count}回` : '未獲得'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {acquired && (
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500">最終: {formatDate(entry.lastDate)}</p>
                      </div>
                    )}
                  </div>
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
