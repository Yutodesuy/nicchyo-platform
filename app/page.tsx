"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";
import { motion } from "framer-motion";
import { MapPin, Coffee, ChevronRight, User, Sparkles, Compass } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  // Remove zooming class if it exists from previous navigation
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.remove("home-poster-zoom-open");
  }, []);

  const handleMapClick = () => {
    startMapLoading();
    setTimeout(() => {
      router.push("/map");
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#fdfbf7] via-white to-[#f8f4ee] text-amber-950 font-sans selection:bg-amber-200">
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/home-hero.jpg"
            alt="Sunday Market Atmosphere"
            className="h-full w-full object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/90" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl flex-col items-center gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm ring-1 ring-amber-200">
              <Sparkles className="h-4 w-4" />
              Smart Sunday Guide
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-amber-950 md:text-5xl">
              迷わず、心地よく。
              <br />
              日曜市を楽しむスマートナビ
            </h1>
            <p className="mt-6 text-base leading-relaxed text-amber-900/80 md:text-lg">
              広くてにぎやかな日曜市を、やさしくガイド。
              <br />
              「お守りマップ」があなたの散策をスマートにサポートします。
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleMapClick}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              >
                マップを開く
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 rounded-full bg-white/80 px-6 py-4 text-sm font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">
                <Compass className="h-5 w-5 text-orange-500" />
                初めてでも安心の道案内
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80">
              <span>Local Tips</span>
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              <span>Smart Map</span>
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              <span>Free Access</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <div className="relative rounded-[2.5rem] bg-white/90 p-8 shadow-2xl ring-1 ring-white/80 backdrop-blur-md">
              <div className="absolute -top-8 right-10 h-16 w-16 rounded-2xl bg-orange-500/90 blur-2xl" />
              <div className="mb-6 flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border-[6px] border-white shadow-md">
                  <img src="/images/obaasan.webp" alt="にちよさん" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-700">やさしい案内人</p>
                  <p className="text-lg font-bold text-amber-950">にちよさん</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-amber-900/80">
                「トイレは？」「おすすめは？」そんな疑問にすぐ答えます。お買い物のペースに合わせて、
                ぴったりのルートをご案内。
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "トイレ・休憩スポットを即検索",
                  "近くの人気店をお知らせ",
                  "現在地から迷わず移動",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- EMPATHY SECTION (Warm & Reassuring) --- */}
      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-gradient-to-b from-white to-[#fdfaf5] px-6 py-20 shadow-[0_-20px_40px_-30px_rgba(0,0,0,0.15)]">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-lg font-bold text-amber-800 md:text-xl">
              はじめてでも、大丈夫。
            </h2>
            <p className="mt-4 text-amber-900/70 leading-relaxed">
              「お店が多すぎてわからない」<br />
              「トイレはどこにあるの？」<br />
              そんな不安を解消します。
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: "迷子にならない", text: "現在地と目的地をシンプルに表示。", icon: <MapPin className="h-5 w-5" /> },
              { title: "休憩もスマート", text: "ベンチやトイレ情報をまとめてチェック。", icon: <Coffee className="h-5 w-5" /> },
              { title: "優しい案内", text: "にちよさんがおすすめスポットへ導きます。", icon: <User className="h-5 w-5" /> },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-amber-100 bg-white p-5 text-left shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-amber-900">{item.title}</h3>
                <p className="mt-2 text-sm text-amber-800/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Concrete Benefits) --- */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-900 md:text-3xl">おでかけをスマートに</h2>
              <p className="mt-3 text-sm text-amber-800/70 md:text-base">
                直感的に操作できるインターフェースと、迷わない導線で日曜市をもっと楽しく。
              </p>
            </div>
            <button
              onClick={handleMapClick}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
            >
              今すぐ試す
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "最短ルート案内",
                text: "目的地までの距離感がひと目でわかるルート設計。",
              },
              {
                title: "知りたい情報だけ",
                text: "混み具合やおすすめ店など、必要な情報を厳選。",
              },
              {
                title: "軽くて快適",
                text: "スマホでもサクサク動くシンプル設計。",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-amber-100 bg-[#fdfbf7] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-amber-900">{item.title}</h3>
                <p className="mt-3 text-sm text-amber-800/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="bg-amber-50 py-20 px-6 text-center">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-amber-100 bg-white/80 p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-amber-900">
            さあ、日曜市へ出かけましょう。
          </h2>
          <p className="mt-3 text-sm text-amber-800/70">
            迷わず歩けるから、もっと会話が弾む。今日の発見を増やすお手伝いをします。
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleMapClick}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-10 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
            >
              マップを開く
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600/80">
              nicchyo Sunday Market
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
