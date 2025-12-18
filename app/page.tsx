"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import NavigationBar from "./components/NavigationBar";

const pillars = [
  {
    title: "マップ",
    icon: "🗺️",
    desc: "屋台の位置やおすすめを地図で直感的に確認できます。",
    href: "/map",
    icon: "🗺️",
  },
  {
    title: "おすすめ",
    icon: "🔍",
    desc: "お目当ての商品や店舗を素早く検索して見つけられます。",
    href: "/search",
  },
  {
    title: "ことづて",
    desc: "出店者と来場者の声をつなぐ短いメッセージボード。",
    href: "/posts",
    icon: "💬",
    desc: "出店者や訪問者の声を共有し、人と人をつなぐメッセージボード。",
    href: "/kotodute",
  },
  {
    title: "土佐の料理レシピ",
    icon: "🍳",
    desc: "季節の食材を使った土佐料理のレシピを紹介します。",
    href: "/recipes",
  },
  {
    title: "午後のイベント",
    icon: "🎪",
    desc: "市場が終わった後も楽しめる、地域イベント・ワークショップ情報。",
    href: "/events",
  },
];

// ターゲットユーザーのデータ
const audiences = [
  {
    title: "はじめての来訪",
    subtitle: "どこを回ればいいか知りたい",
    icon: "🧳",
    points: [
      "目安ルート提案で迷わず回れる",
      "定番スポットと旬の見どころを表示",
      "徒歩時間と距離の目安を把握",
    ],
  },
  {
    title: "リピーター",
    subtitle: "新しい発見を探したい",
    icon: "🔍",
    points: [
      "その日だけの限定品をピックアップ",
      "お気に入り店をブックマーク",
      "ことづてで交流や質問ができる",
    ],
  },
  {
    title: "出店者",
    subtitle: "お客さんに見つけてもらいたい",
    icon: "🧺",
    points: [
      "出店位置と商品をシンプルに掲示",
      "おすすめ欄で季節の推しを告知",
      "簡単なアンケートで声を集める",
    ],
  },
];

type Pillar = (typeof pillars)[number];

function PillarCard({ item }: { item: Pillar }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const controls = useAnimation();

  useEffect(() => {
    controls.start(
      inView
        ? {
            y: 0,
            opacity: 1,
            scale: 1,
            borderColor: "#f97316",
            boxShadow: "0 10px 30px rgba(251, 146, 60, 0.16)",
          }
        : {
            y: 30,
            opacity: 0.75,
            scale: 0.99,
            borderColor: "#ffedd5",
            boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
          }
    );
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0.75, y: 30, scale: 0.99 }}
      animate={controls}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="group flex h-full flex-col rounded-2xl border bg-white p-5 transition"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg">
          <span>{item.icon}</span>
        </div>
        <h3 className="text-base font-semibold md:text-lg">{item.title}</h3>
      </div>
      <p className="flex-1 text-sm text-gray-700">{item.desc}</p>
      <Link
        href={item.href}
        className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold transition ${
          inView ? "opacity-100 text-amber-700" : "opacity-0 text-amber-700 group-hover:opacity-100"
        }`}
      >
        詳しくみる
        <span aria-hidden>↗</span>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900">
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-6 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="font-semibold tracking-wide">nicchyo 日曜市マップ</div>
          <div className="text-xs opacity-85">高知の朝を、地図でもっと楽しく</div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-orange-100">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-amber-300/50 blur-3xl" />
            <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-amber-200 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-10 px-4 py-14 md:flex-row md:items-center md:py-20">
            <div className="flex-1 space-y-6">
              <motion.h1
                className="text-4xl font-bold leading-tight md:text-5xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                日曜市を、
                <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                  もっと歩きやすく、
                </span>
              </motion.h1>

              <motion.p
                className="max-w-2xl text-sm text-gray-700 md:text-base"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                nicchyo は、高知・日曜市の「見つける」「歩く」「交流する」をまとめたガイドです。
                マップで位置を確認しながら、おすすめやイベント、ことづてをチェックできます。
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Link
                  href="/map"
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-300/40 transition hover:bg-amber-500"
                >
                  <span className="flex items-center gap-2">
                    マップを見る
                    <span aria-hidden>↗</span>
                  </span>
                </Link>
                <Link
                  href="/about"
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-800 transition hover:border-gray-300"
                >
                  プロジェクトについて
                </Link>
              </motion.div>
            </div>

            <motion.div
              className="w-full max-w-sm self-stretch rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-xl backdrop-blur md:max-w-xs"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <div className="mb-3 flex items-center justify-between text-xs text-gray-600">
                <span>市場の今をチェック</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  LIVE
                </span>
              </div>
              <div className="relative h-40 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100">
                <div className="absolute left-6 top-6 h-7 w-7 rounded-full border border-amber-500/60 bg-amber-500/50 shadow-lg shadow-amber-300/40" />
                <div className="absolute left-20 top-12 h-5 w-5 rounded-full border border-orange-500/60 bg-orange-500/50 shadow-lg shadow-orange-300/40" />
                <div className="absolute right-10 bottom-8 h-4 w-4 rounded-full border border-amber-300/60 bg-amber-200/80 shadow-lg shadow-amber-200/60" />
                <div className="absolute inset-x-4 bottom-4 h-1 rounded-full bg-orange-200/70" />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-gray-600">
                出店位置・おすすめをリアルタイムにまとめています。お気に入りをブックマークしながら、市場を歩いてみてください。
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pillars */}
        <section className="mx-auto max-w-5xl px-4 py-14 md:py-18">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">nicchyo を支える 5つの柱</h2>
            <p className="mt-3 text-sm text-gray-700 md:text-base">
              マップを中心に、おすすめ、ことづて、イベントまで。日曜市をまるごと楽しめる導線を揃えました。
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((item) => (
              <PillarCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        {/* Audience */}
        <section className="border-t border-orange-100 bg-amber-50/40">
          <div className="mx-auto max-w-5xl px-4 py-14 md:py-18">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-bold md:text-3xl">それぞれの楽しみ方に寄り添う</h2>
              <p className="mt-3 max-w-3xl text-sm text-gray-700 md:text-base">
                観光客、リピーター、出店者それぞれの立場で「知りたいこと」を手早く見つけられるよう設計しました。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {audiences.map((a) => (
                <div
                  key={a.title}
                  className="flex h-full flex-col rounded-2xl border border-orange-100 bg-white p-5 text-sm text-gray-800 shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2 text-base font-semibold">
                    <span className="text-lg">{a.icon}</span>
                    <span>{a.title}</span>
                  </div>
                  <p className="mb-3 text-xs text-gray-600">{a.subtitle}</p>
                  <ul className="mt-auto space-y-1.5 text-xs text-gray-700">
                    {a.points.map((p) => (
                      <li key={p}>・{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-orange-100 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-[11px] text-gray-600 md:flex-row">
          <span>© {new Date().getFullYear()} nicchyo – Kochi Sunday Market DX</span>
          <div className="flex gap-4">
            <Link href="/about" className="transition hover:text-amber-600">
              プロジェクトについて
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">
              Made in Kochi with ❤️
            </span>
          </div>
        </div>
      </footer>

      <NavigationBar />
    </div>
  );
}
