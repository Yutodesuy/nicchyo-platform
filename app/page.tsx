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
      <section className="relative h-[85vh] w-full overflow-hidden">
        {/* Background Image with Warm Overlay */}
        <div className="absolute inset-0 z-0">
           <img
            src="/homepagebackground.png"
            alt="Sunday Market Atmosphere"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-amber-50/20 to-amber-50/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-12 text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {/* Branding Icon */}
            <div className="mb-6 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src="/images/obaasan.webp"
                alt="にちよさん"
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="font-serif text-3xl font-bold tracking-widest text-amber-900 md:text-5xl drop-shadow-sm">
              迷ってこそが<br />
              <span className="text-4xl md:text-6xl text-orange-700">日曜市！</span>
            </h1>

            <p className="mt-6 text-base font-medium leading-loose text-amber-900/80 md:text-lg">
              迷子を楽しむための、<br className="md:hidden" />
              お守りマップ。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 w-full max-w-sm"
          >
            <button
              onClick={handleMapClick}
              className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95"
            >
              <div className="flex items-center justify-center gap-2 text-lg font-bold tracking-wide">
                <span>地図を見る</span>
                <ChevronRight className="h-5 w-5 animate-pulse" />
              </div>
              <div className="absolute inset-0 -z-10 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            <p className="mt-3 text-xs text-amber-800/60">
              ※登録不要で、すぐに使えます
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- EMPATHY SECTION (Warm & Reassuring) --- */}
      <section className="relative -mt-12 z-20 px-6 pb-20">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-xl shadow-amber-900/5 ring-1 ring-amber-100">
          <div className="text-center">
            <h2 className="text-lg font-bold text-amber-800 md:text-xl">
              こんな不安、ありませんか？
            </h2>
            <div className="mt-6 space-y-4 text-left">
              <div className="flex items-start gap-4 rounded-xl bg-amber-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">
                  ?
                </div>
                <div>
                  <p className="font-bold text-amber-900">お店が多すぎて、見方がわからない</p>
                  <p className="text-sm text-amber-800/70 mt-1">
                    全長1km以上ある日曜市。どこから見ればいいのか、迷ってしまいがちです。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl bg-amber-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">
                  !
                </div>
                <div>
                  <p className="font-bold text-amber-900">トイレや休憩所はどこ？</p>
                  <p className="text-sm text-amber-800/70 mt-1">
                    人混みの中、急に探すのは大変。事前にわかれば安心です。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-lg font-bold text-orange-700 leading-relaxed">
                そんなあなたへ。<br />
                nicchyoは、<br className="md:hidden" />
                あなたの「歩くパートナー」です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Concrete Benefits) --- */}
      <section className="bg-amber-50/50 py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-amber-900 mb-10">
            安心して楽しむための<br className="md:hidden" />
            3つのポイント
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-100/50">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Coffee className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">休憩スポットが<br />すぐわかる</h3>
              <p className="mt-3 text-sm text-amber-800/80 leading-relaxed">
                トイレやベンチの場所を一目でチェック。疲れたらすぐに一休みできます。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-100/50">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">おせっかいな<br />案内人</h3>
              <p className="mt-3 text-sm text-amber-800/80 leading-relaxed">
                「にちよさん」が、おすすめのお店や旬の食材を教えてくれます。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-100/50">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">現在地から<br />迷わず探せる</h3>
              <p className="mt-3 text-sm text-amber-800/80 leading-relaxed">
                今いる場所の近くに何があるか、GPSですぐにわかります。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-xl font-bold text-amber-900 mb-6">
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
           <p className="mt-4 text-sm text-amber-800/60">
             nicchyo - 日曜市デジタルマップ
           </p>
        </div>
      </section>
    </div>
  );
}
