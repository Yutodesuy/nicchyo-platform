"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const MapView = dynamic(() => import("./(public)/map/components/MapView"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-amber-50">
      <div className="absolute inset-0 scale-[1.04] blur-md opacity-70">
        <MapView />
      </div>
      <Link
        href="/map"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30 text-center backdrop-blur-sm"
        aria-label="マップページへ移動"
      >
        <span className="text-5xl font-bold tracking-[0.08em] text-amber-900 md:text-7xl">
          nicchyo
        </span>
        <span className="mt-4 text-sm font-semibold text-amber-800 md:text-base">
          タップで始める
        </span>
      </Link>
    </div>
  );
}
