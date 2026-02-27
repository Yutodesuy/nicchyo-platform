"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, ShieldCheck, User } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const endpoint = "/api/analytics/home-visit";
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    void fetch(endpoint, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, [loaded]);

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

  const handleAnalysisClick = () => {
    router.push("/analysis");
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] text-amber-950 font-sans selection:bg-amber-200">

      {/* --- HERO SECTION --- */}
      <section className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
           <img
            src="/images/home-hero.jpg"
            alt="Sunday Market Atmosphere"
            className="h-full w-full object-cover object-center scale-105 blur-[2px] opacity-90"
          />
          {/* Gentle overlay to harmonize */}
          <div className="absolute inset-0 bg-amber-900/10" />
        </div>

        {/* Smart Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mx-6 w-full max-w-sm rounded-[2.5rem] bg-white/90 backdrop-blur-md p-8 shadow-2xl ring-1 ring-white/50"
        >
          <div className="flex flex-col items-center text-center">
            {/* Branding Icon */}
            <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-[6px] border-white shadow-lg">
              <img
                src="/images/obaasan.webp"
                alt="にちよさん"
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="font-serif text-2xl font-bold tracking-widest text-amber-950/90 mb-2">
              迷ってこそが
            </h1>
            <div className="text-4xl font-extrabold text-orange-600 tracking-wider mb-6 drop-shadow-sm">
              日曜市！
            </div>

            <p className="text-sm font-medium leading-relaxed text-amber-800/80 mb-8">
              初めてでも、ゆっくり歩ける。<br />
              <span className="font-bold text-amber-900">「お守りマップ」</span>で<br />
              迷いを安心に。
            </p>

            <motion.button
              onClick={handleMapClick}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              <div className="flex items-center justify-center gap-2 text-lg font-bold tracking-wide">
                <span>マップを見る</span>
                <ChevronRight className="h-5 w-5" />
              </div>
              <div className="absolute inset-0 -z-10 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>

            <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">
              <span className="rounded-full bg-amber-100 px-3 py-1">迷わない</span>
              <span className="rounded-full bg-amber-100 px-3 py-1">やさしい</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- EMPATHY SECTION (Warm & Reassuring) --- */}
      <section className="relative z-20 px-6 py-16 -mt-10 bg-gradient-to-b from-[#FAFAF8] to-white rounded-t-[3rem]">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-lg font-bold text-amber-800 md:text-xl">
              はじめてでも、安心。
            </h2>
            <p className="mt-4 text-amber-900/70 leading-relaxed">
              「どこに行けばいい？」<br />
              そんな気持ちに寄り添います。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <ShieldCheck className="h-6 w-6 text-orange-600" />
              <p className="text-sm font-semibold text-amber-900">迷ったらすぐ戻れる</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <MapPin className="h-6 w-6 text-orange-600" />
              <p className="text-sm font-semibold text-amber-900">現在地がひと目でわかる</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <User className="h-6 w-6 text-orange-600" />
              <p className="text-sm font-semibold text-amber-900">案内人がそっと提案</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- DATA SECTION --- */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-900 md:text-2xl">
              日曜市をデータで見る
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-amber-900/70">
              出店数やジャンル傾向を、ひと目で把握できます。
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <p className="text-xs font-semibold tracking-wider text-amber-700/80">出店カテゴリ</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">12+</p>
              <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
                野菜・果物・加工品などのカテゴリ分布を確認。
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <p className="text-xs font-semibold tracking-wider text-amber-700/80">注目エリア</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">5</p>
              <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
                時間帯ごとの混雑傾向をエリア別に表示。
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <p className="text-xs font-semibold tracking-wider text-amber-700/80">今週の動向</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">更新中</p>
              <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
                新着の出店情報と人気の傾向をチェック。
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleAnalysisClick}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-amber-800 active:scale-95"
            >
              <span>分析ページを見る</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-20 px-6 text-center bg-amber-50">
        <h2 className="text-lg font-bold text-amber-900 mb-6">
          さあ、日曜市へ出かけましょう。
        </h2>
        <div className="mx-auto w-full max-w-sm">
          <button
             onClick={handleMapClick}
             className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95"
           >
             <div className="flex items-center justify-center gap-2 text-xl font-bold tracking-wide">
               <span>マップを開く</span>
               <ChevronRight className="h-6 w-6" />
             </div>
           </button>
           <p className="mt-4 text-xs text-amber-800/50">
             nicchyo - 日曜市デジタルマップ
           </p>
        </div>
      </section>
    </div>
  );
}
