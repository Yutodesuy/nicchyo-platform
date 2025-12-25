'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavigationBar from '../../../components/NavigationBar';
import { getKotoduteProgress, NOTE_BADGES, LIKE_BADGES } from '../services/kotoduteBadgeService';

type ProgressState = {
  notes: number;
  likes: number;
};

function buildStatus(threshold: number, current: number) {
  return current >= threshold;
}

export default function KotoduteBadgesPage() {
  const [progress, setProgress] = useState<ProgressState>({ notes: 0, likes: 0 });

  useEffect(() => {
    const p = getKotoduteProgress();
    setProgress({ notes: p.noteCount, likes: p.likeCount });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">badges</p>
            <h1 className="text-2xl font-bold text-gray-900">ことづてバッジ一覧</h1>
            <p className="text-sm text-gray-700">投稿数といいね数で解放されます。</p>
          </div>
          <Link
            href="/badges"
            className="rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-800 shadow-sm hover:bg-sky-50"
          >
            バッジトップへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <section className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">投稿バッジ</h2>
              <p className="text-sm text-gray-700">現在 {progress.notes} 通</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {NOTE_BADGES.map((badge) => {
              const unlocked = buildStatus(badge.threshold, progress.notes);
              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
                    unlocked ? 'border-amber-200 bg-amber-50/80' : 'border-gray-200 bg-gray-50/80'
                  }`}
                >
                  <span
                    className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg"
                    style={{
                      backgroundColor: unlocked ? '#fef3c7' : 'white',
                      borderColor: unlocked ? '#f59e0b' : '#d1d5db',
                    }}
                    aria-hidden
                  >
                    ✉️
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-gray-900">{badge.label}</p>
                    <p className="text-xs text-gray-600">必要: {badge.threshold} 通</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-700">
                    {unlocked ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">いいねバッジ</h2>
              <p className="text-sm text-gray-700">現在 {progress.likes} 個</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {LIKE_BADGES.map((badge) => {
              const unlocked = buildStatus(badge.threshold, progress.likes);
              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
                    unlocked ? 'border-sky-200 bg-sky-50/80' : 'border-gray-200 bg-gray-50/80'
                  }`}
                >
                  <span
                    className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg"
                    style={{
                      backgroundColor: unlocked ? '#e0f2fe' : 'white',
                      borderColor: unlocked ? '#38bdf8' : '#d1d5db',
                    }}
                    aria-hidden
                  >
                    💌
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-gray-900">{badge.label}</p>
                    <p className="text-xs text-gray-600">必要: {badge.threshold} いいね</p>
                  </div>
                  <span className="text-sm font-semibold text-sky-700">
                    {unlocked ? '✓' : ''}
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
