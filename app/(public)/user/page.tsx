"use client";

import Link from "next/link";
import NavigationBar from "../../components/NavigationBar";

export default function UserPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900">
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="font-semibold tracking-wide">マイページ</div>
          <Link
            href="/map"
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
          >
            地図へ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <section className="rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
              👤
            </div>
            <div>
              <p className="text-lg font-semibold">市場さん（仮）</p>
              <p className="text-sm text-gray-600">kochi_sunday@example.com</p>
              <p className="mt-1 text-xs text-gray-500">
                高知・日曜市をもっと楽しむためのマイページです。
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">お気に入り</h2>
            <p className="mt-1 text-sm text-gray-600">ブックマーク中の店舗やスポット。</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-800">
              <li>・土佐刃物の匠</li>
              <li>・旬の野菜屋さん</li>
              <li>・藁焼きかつお屋</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">最近の訪問</h2>
            <p className="mt-1 text-sm text-gray-600">直近の散策メモ。</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-800">
              <li>・エリアA: 野菜メイン</li>
              <li>・エリアB: 伝統工芸</li>
              <li>・エリアC: おやつとお土産</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">メモ・ことづて</h2>
          <p className="mt-1 text-sm text-gray-600">気になったことをメモしておこう。</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm text-gray-800 shadow-sm">
              <p className="text-xs text-gray-500">2025/12/04</p>
              <p className="mt-1">かつおタタキが美味しい店を再訪したい。</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm text-gray-800 shadow-sm">
              <p className="text-xs text-gray-500">2025/11/27</p>
              <p className="mt-1">焼き芋屋さんの行列がすごい。開店直後が狙い目。</p>
            </div>
          </div>
        </section>
      </main>

      <NavigationBar />
    </div>
  );
}
