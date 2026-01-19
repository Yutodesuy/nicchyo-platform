"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";
import { motion } from "framer-motion";
import { Search, MapPin, Smile } from "lucide-react";

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
    // Short delay to allow animation if needed, or immediate
    setTimeout(() => {
      router.push("/map");
    }, 300);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-900 text-white">
      {/* Background Image */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10" />
        <img
          src="/homepagebackground.png"
          alt="Background"
          className="h-full w-full object-cover scale-[1.02]"
        />
      </div>

      {/* Header (Branding) */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center p-6 pt-[calc(env(safe-area-inset-top)+24px)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white/80 shadow-lg">
            <img
              src="/images/obaasan.webp"
              alt="nicchyo icon"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-widest text-white drop-shadow-md">
            nicchyo
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex h-full flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl drop-shadow-lg leading-tight">
            迷ってこそが
            <br />
            日曜市！
          </h1>
          <p className="mt-6 max-w-md text-base md:text-lg font-medium text-white/90 drop-shadow-md leading-relaxed">
            迷う楽しみと、見つける喜び。
            <br />
            高知の日曜市を、もっと自由に。
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 w-full max-w-xs"
        >
          <button
            onClick={handleMapClick}
            className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-orange-600 p-[2px] shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-transform active:scale-95"
          >
            <div className="relative flex h-14 w-full items-center justify-center rounded-full bg-transparent px-8 transition-colors group-hover:bg-white/10">
              <span className="text-lg font-bold tracking-wide text-white">
                マップを見る
              </span>
              <MapPin className="ml-2 h-5 w-5 text-white animate-bounce" />
            </div>
          </button>
        </motion.div>
      </main>

      {/* Features / Benefits (Bottom Overlay) */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-0 left-0 right-0 z-20 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-6 bg-gradient-to-t from-black/80 to-transparent"
      >
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-6 text-center text-white/90">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Search className="h-5 w-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold tracking-wide">探せる</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Smile className="h-5 w-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold tracking-wide">ガイド</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <MapPin className="h-5 w-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold tracking-wide">迷わない</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
