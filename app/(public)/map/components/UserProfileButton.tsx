"use client";

import { useState } from "react";
import Link from "next/link";

export default function UserProfileButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute right-3 top-3 z-[1600] sm:right-4 sm:top-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-lg shadow-lg shadow-amber-200/60 transition hover:-translate-y-0.5 hover:shadow-xl"
        aria-label="ユーザーメニューを開く"
      >
        👤
      </button>

      {open && (
        <div className="mt-2 w-64 rounded-2xl border border-amber-100 bg-white/95 p-3 text-sm text-gray-800 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl">
              👤
            </div>
            <div>
              <p className="text-sm font-semibold">市場さん（仮）</p>
              <p className="text-xs text-gray-500">kochi_sunday@example.com</p>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-xs text-gray-700">
            <p>・お気に入り店舗: 12件</p>
            <p>・最近の訪問: 日曜市エリア A〜C</p>
            <p>・メモ: かつお藁焼き屋台が気になる</p>
          </div>

          <div className="mt-3 flex gap-2">
            <Link
              href="/user"
              className="flex-1 rounded-xl bg-amber-600 px-3 py-2 text-center text-xs font-semibold text-white shadow-md shadow-amber-200/60 transition hover:bg-amber-500"
            >
              ユーザーページへ
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-50"
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
