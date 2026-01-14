"use client";

import { useEffect, useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import { listTimeBadgeProgress, type TimeBadgeProgress } from "../map/services/timeBadgeService";
import { getShoppingProgress, SHOPPING_SEGMENTS } from "./services/shoppingBadgeService";
import { getKotoduteProgress } from "./services/kotoduteBadgeService";

export default function BadgesPage() {
  const [badges, setBadges] = useState<TimeBadgeProgress[]>([]);
  const [shoppingUnlocked, setShoppingUnlocked] = useState<Set<string>>(new Set());
  const [kotoduteCounts, setKotoduteCounts] = useState<{ notes: number; likes: number }>(
    {
      notes: 0,
      likes: 0,
    }
  );

  useEffect(() => {
    setBadges(listTimeBadgeProgress());
    const shopping = getShoppingProgress();
    setShoppingUnlocked(shopping.unlocked);
    const kotodute = getKotoduteProgress();
    setKotoduteCounts({ notes: kotodute.noteCount, likes: kotodute.likeCount });
  }, []);

  const collected = badges.filter((b) => b.count > 0).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16 pt-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Badges</p>
          <h1 className="mt-1 text-4xl font-bold text-gray-900">集めたバッジ</h1>
          <p className="mt-1 text-xl text-gray-700">日曜市で集めたバッジをまとめて確認できます。</p>
        </div>
        <div className="flex justify-center">
          <div className="rounded-full border border-amber-200 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
            {collected} / {badges.length} 取得
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4">
        <section className="space-y-4 rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">時間帯ゲージ</p>
              <h2 className="text-xl font-bold text-gray-900">時間帯ゲージ</h2>
              <p className="text-sm text-gray-700">
                朝から夕方まで、訪れた時間帯の記録がゲージに溜まっていきます。
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
                        {entry.slot} {acquired ? `取得済み (${entry.count}回)` : "未取得"}
                      </span>
                      <div
                        className={`absolute inset-0 ${acquired ? "bg-emerald-500" : "bg-gray-300"}`}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-nowrap items-center gap-6 text-[11px] text-gray-600">
                {[
                  "05:00",
                  "06:00",
                  "07:00",
                  "08:00",
                  "09:00",
                  "10:00",
                  "11:00",
                  "12:00",
                  "13:00",
                  "14:00",
                  "15:00",
                  "16:00",
                  "17:00",
                ].map((label) => (
                  <span key={label} className="shrink-0">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-inner">
            <p className="mb-2 text-sm font-semibold text-amber-900">日曜市の小さなイメージ</p>
            <div className="flex items-center gap-3 text-3xl">
              <span role="img" aria-label="market-stall">
                🏮
              </span>
              <span role="img" aria-label="fruit">
                🍊
              </span>
              <span role="img" aria-label="vegetable">
                🥕
              </span>
              <span role="img" aria-label="fish">
                🐟
              </span>
              <span role="img" aria-label="flower">
                🌼
              </span>
            </div>
            <p className="mt-2 text-xs text-amber-800">ゲージを埋めて、朝から夕方までの記録を集めよう。</p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">お買い物バッジ</p>
              <h2 className="text-xl font-bold text-gray-900">お買い物バッジ</h2>
              <p className="text-sm text-gray-700">
                bag に入れたカテゴリが増えるほど、買い物バッジが解放されます。
              </p>
            </div>
            <a
              href="/badges/shopping"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
            >
              お買い物バッジを見る
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-600">カテゴリ別の進捗</p>
            <div className="relative mx-auto flex h-40 w-full max-w-md items-center justify-center">
              <svg viewBox="0 0 260 140" className="h-full w-full">
                {SHOPPING_SEGMENTS.map((seg, idx) => {
                  const x = 20 + idx * 40;
                  const y = 30 + (idx % 2) * 40;
                  const unlocked = shoppingUnlocked.has(seg.id);
                  return (
                    <g key={seg.id}>
                      <rect
                        x={x}
                        y={y}
                        width={30}
                        height={60}
                        rx={6}
                        className="stroke-gray-700"
                        strokeWidth={2}
                        fill={unlocked ? seg.color : "white"}
                        fillOpacity={unlocked ? 1 : 0}
                      />
                      <rect
                        x={x}
                        y={y}
                        width={30}
                        height={60}
                        rx={6}
                        fill="none"
                        className="stroke-gray-700"
                        strokeDasharray="4 3"
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-dashed border-gray-400" aria-hidden />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              {SHOPPING_SEGMENTS.map((seg) => (
                <div key={seg.id} className="flex items-center gap-2">
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300"
                    style={{ backgroundColor: shoppingUnlocked.has(seg.id) ? seg.color : "white" }}
                    aria-hidden
                  />
                  <span>{seg.label}</span>
                  <span className="text-[10px] text-gray-500">
                    {shoppingUnlocked.has(seg.id) ? "取得済み" : "未取得"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">ことづてバッジ</p>
              <h2 className="text-xl font-bold text-gray-900">ことづてバッジ</h2>
              <p className="text-sm text-gray-700">
                投稿数やいいね数に応じて、ことづてバッジが増えていきます。
              </p>
            </div>
            <a
              href="/badges/kotodute"
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 shadow-sm transition hover:bg-sky-100"
            >
              ことづてバッジを見る
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-600">投稿といいねの進捗</p>
            <div className="relative mx-auto flex h-48 w-full max-w-md items-end justify-center">
              {Array.from({ length: 8 }).map((_, idx) => {
                const filled = idx < Math.min(kotoduteCounts.notes, 8);
                const y = 10 * idx;
                const rotate = (idx % 3) * 2 - 2;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 120 60"
                    className="absolute"
                    style={{
                      bottom: `${y}px`,
                      transform: `translateY(${y}px) rotate(${rotate}deg)`,
                    }}
                  >
                    <rect
                      x="10"
                      y="10"
                      width="100"
                      height="40"
                      rx="6"
                      fill={filled ? "#fef3c7" : "#ffffff"}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                    <path d="M10 10 L60 40 L110 10" fill="none" stroke="#0f172a" strokeWidth="2" />
                    {filled && (
                      <path d="M55 33 L60 38 L65 33" fill="none" stroke="#f97316" strokeWidth="2" />
                    )}
                  </svg>
                );
              })}
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-dashed border-gray-400" aria-hidden />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-amber-400 bg-amber-300"
                  aria-hidden
                />
                <span>投稿数</span>
                <span className="text-[10px] text-gray-500">{kotoduteCounts.notes} 件</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-400 bg-sky-300"
                  aria-hidden
                />
                <span>いいね数</span>
                <span className="text-[10px] text-gray-500">{kotoduteCounts.likes} 件</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <NavigationBar />
    </main>
  );
}
