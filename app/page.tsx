"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";

const MapView = dynamic(() => import("./(public)/map/components/MapView"), {
  ssr: false,
});

export default function HomePage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900">
      <section className="relative h-screen w-screen overflow-hidden">
        <div
          className={`absolute inset-0 scale-[1.04] transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <MapView />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30 text-center backdrop-blur-sm transition-colors duration-500 -translate-y-4 md:-translate-y-6">
          <img
            src="/images/obaasan.webp"
            alt=""
            aria-hidden="true"
            className="-mt-6 mb-6 h-40 w-40 rounded-2xl object-cover shadow-lg md:h-56 md:w-56"
          />
          <span className="text-5xl font-bold tracking-[0.08em] text-amber-900 md:text-7xl">
            nicchyo
          </span>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-3 text-sm font-semibold text-amber-900 md:max-w-sm">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                router.push("/signup");
              }}
              className="rounded-xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm transition hover:bg-amber-50"
            >
              サインアップ
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                router.push("/login");
              }}
              className="rounded-xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm transition hover:bg-amber-50"
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={(event) => {
                startMapLoading();
                window.setTimeout(() => {
                  router.push("/map");
                }, 350);
              }}
              className="rounded-xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm transition hover:bg-amber-50"
            >
              ログイン無しで利用する
            </button>
          </div>
        </div>
      </section>

      <section className="relative border-t border-orange-100 bg-gradient-to-b from-amber-50 via-orange-50 to-white px-4 py-14 md:py-18">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              about nicchyo
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              日曜市を、もっと歩きやすく
            </h2>
            <p className="mt-3 text-sm text-gray-700 md:text-base">
              nicchyo は高知の日曜市を「迷わず、出会える」ようにするガイドです。
              位置、食材、口コミ、イベントをひとつにまとめて、今日の市場を見渡せます。
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900">今いる場所から逆算</h3>
              <p className="mt-2 text-sm text-gray-700">
                マップで屋台の位置とおすすめを確認。歩く順番の目安が見えるので、
                初めてでも迷わず楽しめます。
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900">旬の食材を軸に探す</h3>
              <p className="mt-2 text-sm text-gray-700">
                欲しい食材から出店を探せるので、買い逃しが減ります。
                気になるお店はその場でメモできます。
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900">声で広がるおすすめ</h3>
              <p className="mt-2 text-sm text-gray-700">
                ことづてでリアルな声が集まるので、地元の推しに出会えます。
                「次はここ行ってみよう」が生まれます。
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900">地図からすぐ始める</h3>
              <p className="mt-2 text-sm text-gray-700">
                ボタンからすぐにマップへ。今の市場を眺めながら、
                今日の一歩目を決められます。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
