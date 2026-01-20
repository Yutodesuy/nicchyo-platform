"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";
import { motion } from "framer-motion";
import { MapPin, Coffee, Utensils, HelpCircle, ChevronRight, User } from "lucide-react";

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
    <div className="min-h-screen w-full bg-[#FAFAF8] text-amber-950 font-sans selection:bg-amber-200">

      {/* --- HERO SECTION --- */}
      <section className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
           <img
            src="/homepagebackground.png"
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
              広くてにぎやかな日曜市。<br />
              <span className="font-bold text-amber-900">「お守りマップ」</span>があれば、<br />
              もう迷子も怖くありません。
            </p>

            <button
              onClick={handleMapClick}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              <div className="flex items-center justify-center gap-2 text-lg font-bold tracking-wide">
                <span>地図を見る</span>
                <ChevronRight className="h-5 w-5" />
              </div>
              <div className="absolute inset-0 -z-10 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">
               <span>Smart Guide</span>
               <span>•</span>
               <span>Free</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- EMPATHY SECTION (Warm & Reassuring) --- */}
      <section className="relative z-20 px-6 py-16 -mt-10 bg-gradient-to-b from-[#FAFAF8] to-white rounded-t-[3rem]">
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

            <div className="mt-8 bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <p className="text-center text-lg font-bold text-orange-700 leading-relaxed">
                nicchyoは、<br />
                あなたの「歩くパートナー」です。
              </p>
            </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Concrete Benefits) --- */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-xl font-bold text-amber-900 mb-10">
            安心して楽しむための<br className="md:hidden" />
            3つの機能
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-row md:flex-col items-center gap-4 bg-[#FAFAF8] rounded-2xl p-5 shadow-sm border border-amber-50">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Coffee className="h-6 w-6" />
              </div>
              <div className="text-left md:text-center">
                <h3 className="font-bold text-amber-900">休憩スポット検索</h3>
                <p className="mt-1 text-xs text-amber-800/70 leading-relaxed">
                  トイレやベンチの場所を一目でチェック。
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-row md:flex-col items-center gap-4 bg-[#FAFAF8] rounded-2xl p-5 shadow-sm border border-amber-50">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <User className="h-6 w-6" />
              </div>
              <div className="text-left md:text-center">
                <h3 className="font-bold text-amber-900">おせっかいな案内人</h3>
                <p className="mt-1 text-xs text-amber-800/70 leading-relaxed">
                  「にちよさん」がおすすめのお店を紹介。
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-row md:flex-col items-center gap-4 bg-[#FAFAF8] rounded-2xl p-5 shadow-sm border border-amber-50">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="text-left md:text-center">
                <h3 className="font-bold text-amber-900">現在地マップ</h3>
                <p className="mt-1 text-xs text-amber-800/70 leading-relaxed">
                  今いる場所の近くに何があるかすぐわかる。
                </p>
              </div>
            </div>
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
