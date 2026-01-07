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
          className={`absolute inset-0 scale-[1.06] transition-opacity duration-300 filter blur-[3px] brightness-95 contrast-90 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <MapView />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col bg-gradient-to-b from-white/85 via-white/70 to-white/85 text-gray-900 backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-20 left-6 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-4 top-24 h-64 w-64 rounded-full bg-orange-200/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-24 left-8 h-56 w-56 rounded-full bg-emerald-100/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85)_0%,_rgba(255,255,255,0.6)_45%,_rgba(255,255,255,0.9)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_55%,_rgba(15,8,0,0.18)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-10 mix-blend-soft-light"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.4'/></svg>')",
            }}
          />
          <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-6 pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-amber-900">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-amber-200/80 text-[10px] font-bold text-amber-900 shadow-sm">
                n
              </span>
              nicchyo
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/50 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              aria-label="ログインメニュー"
            >
              <span className="text-sm text-amber-800">?</span>
            </button>
          </header>

          <div className="relative mx-auto flex h-full w-full max-w-md flex-col justify-center px-6 pb-10 md:max-w-lg">
            <div className="relative mt-6 rounded-3xl border border-white/30 bg-white/55 p-6 shadow-xl backdrop-blur-xl md:p-8">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/50 via-transparent to-transparent" />
              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-amber-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  日曜市のデジタルマップ
                </div>
                <h1 className="text-3xl font-bold leading-tight text-amber-950">
                  日曜市を、歩いて楽しむデジタルマップ
                </h1>
                <p className="text-sm leading-relaxed text-amber-900/75">
                  お店・おすすめ・郷土料理のヒント。まずはマップを開こう。
                </p>

                <div className="flex gap-3 overflow-x-auto pb-1">
                  {[
                    { title: "お店を探す", icon: "🧺" },
                    { title: "おすすめルート", icon: "🧭" },
                    { title: "郷土料理ヒント", icon: "🍲" },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="min-w-[150px] rounded-2xl border border-amber-200/70 bg-white/80 px-3 py-3 shadow-sm"
                    >
                      <div className="text-base">{item.icon}</div>
                      <p className="mt-2 text-xs font-semibold text-amber-900">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      startMapLoading();
                      window.setTimeout(() => {
                        router.push("/map");
                      }, 350);
                    }}
                    className="relative h-14 w-full overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-400 to-orange-400 px-6 text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:from-amber-400/95 hover:to-orange-400/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 active:translate-y-0.5"
                    aria-label="マップを開く"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                    マップを開く
                  </button>
                  <p className="text-[11px] font-semibold text-amber-800/80">
                    ログインなしで閲覧できます（※可能なら）
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-amber-900/80 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                    aria-label="ログインする"
                  >
                    ログインする
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/obaasan.webp"
                      alt="おせっかいばあちゃん"
                      className="h-14 w-14 rounded-2xl object-cover shadow-sm"
                    />
                    <div className="relative flex-1">
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-amber-700">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          NPC
                        </span>
                        ばあちゃんからの一言
                      </div>
                      <div className="relative mt-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm">
                        <span className="absolute -left-2 top-3 h-0 w-0 border-y-6 border-y-transparent border-r-8 border-r-amber-50/80" />
                        <span className="absolute -left-2 top-3 h-0 w-0 border-y-6 border-y-transparent border-r-8 border-r-amber-200 -translate-x-[1px]" />
                        今日はどこから歩く？ まずはマップを開いてみて！
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
