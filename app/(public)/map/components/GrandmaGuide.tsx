"use client";

import { useState } from "react";

type Tip = {
  title: string;
  desc: string;
  icon: string;
};

const tips: Tip[] = [
  {
    title: "まずは現在地を確認",
    desc: "位置情報をオンにすると今いる場所が地図に表示されます。",
    icon: "📍",
  },
  {
    title: "気になるお店をタップ",
    desc: "ピンを押すとお店の紹介と「ことづて」をチェックできます。",
    icon: "🛒",
  },
  {
    title: "おすすめルートでお散歩",
    desc: "画面右下のおすすめプランから散策ルートを選べます。",
    icon: "🧭",
  },
];

export default function GrandmaGuide() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-24 right-3 z-[2000] flex h-12 w-12 items-center justify-center rounded-full border border-amber-300 bg-white text-2xl shadow-lg shadow-amber-200/80 transition hover:-translate-y-0.5 hover:shadow-xl sm:right-5"
        aria-label="ばあちゃんガイドを開く"
      >
        🧓
      </button>
    );
  }

  return (
    <section className="fixed bottom-24 right-3 z-[2000] w-64 rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-2xl shadow-amber-200/60 backdrop-blur-sm sm:right-5 sm:w-72 md:w-80">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            🧓
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
              ばあちゃんガイド
            </p>
            <p className="text-sm text-gray-700">迷ったらここをチェック</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-xs text-amber-800 transition hover:bg-amber-100"
          aria-label="ガイドをたたむ"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip.title}
            className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5"
          >
            <span className="text-lg" aria-hidden>
              {tip.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">{tip.title}</p>
              <p className="text-xs text-amber-900/80">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
