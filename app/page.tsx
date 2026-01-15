"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";

export default function HomePage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.remove("home-poster-zoom-open");
  }, []);


  return (
    <div className="h-screen overflow-hidden text-gray-900">
      <section className="relative h-screen w-screen overflow-hidden">
        <div
          className={`absolute inset-0 z-0 scale-[1.06] transition-opacity duration-300 filter blur-[3px] brightness-95 contrast-90 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src="/homepagebackground.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col text-gray-900">
          <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+12px)]">
            <div className="flex items-center gap-3 text-2xl font-semibold tracking-[0.18em] text-amber-900">
              <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-amber-200/80 shadow-sm">
                <img
                  src="/images/obaasan.webp"
                  alt="おせっかいばあちゃん"
                  className="h-full w-full object-cover"
                />
              </span>
              nicchyo
            </div>

          </header>

          <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6 pb-28">
            <div className="relative space-y-6">
                <div className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-amber-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  日曜市×高知高専×デジタルマップ
                </div>

                <article className="mt-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-3xl border border-amber-200/80 bg-white/95 px-5 py-6 shadow-sm">
                  <div className="flex items-center justify-between text-[26px] font-semibold tracking-[0.2em] text-amber-700">
                    <span>特集</span>
                    <span>Sunday Market</span>
                  </div>
                  <h1 className="mt-5 text-3xl font-semibold leading-snug text-slate-900">
                    情報を詰め込まない、話しかけるようなマップ。
                  </h1>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    高知の日曜市は、ずらりと店が並び、人の気配にあふれた魅力的な場所です。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    一方で、初めて訪れると「どこから見ればいいのか」「自分に合う店があるのか」と、少し戸惑ってしまうこともあります。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    nicchyoのマップは、そんなときのためのデジタルガイドです。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    市の全体像や雰囲気を把握しながら、無理に計画を立てることなく、安心して歩き始めることができます。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    nicchyoのマップには、案内役として「にちよさん」というおばあちゃんが登場します。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    お店を探すというより、「ちょっと聞いてみる」感覚で使えるのが特徴です。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    無機質な情報を並べるのではなく、人の気配を感じられる形で情報を届けることで、
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    日曜市らしい寄り道や偶然の出会いを邪魔しない設計になっています。
                  </p>
                  <h2 className="mt-8 text-2xl font-semibold leading-snug text-slate-900">
                    調べすぎなくても、迷っても大丈夫。
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    このマップは、効率よく回るためのものではありません。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    どこに何があるのかを大まかに知りながら、自分のペースで歩くためのものです。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    「今日はなんとなくぶらぶらしたい」
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    そんな気分のまま使ってもらえるよう、必要以上の情報は載せていません。
                  </p>
                  <h2 className="mt-8 text-2xl font-semibold leading-snug text-slate-900">
                    日曜市を、少し安心して楽しむために。
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    nicchyoは、初めての日曜市でも、構えすぎずに一歩を踏み出せるようにつくられました。
                  </p>
                  <p className="mt-5 text-lg leading-relaxed text-slate-700">
                    誰かに付き添ってもらうような感覚で、マップを開いてみてください。
                  </p>
                </article>

                                <div className="mt-5" />

            </div>
          </div>
        </div>
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+8px)] left-1/2 z-[1300] w-[min(520px,92vw)] -translate-x-1/2 px-6">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-amber-200/40 blur-xl opacity-80 animate-pulse" />
          <button
            type="button"
            onClick={() => {
              startMapLoading();
              window.setTimeout(() => {
                router.push("/map");
              }, 350);
            }}
            className="relative h-14 w-full overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-400 to-orange-400 px-6 text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:from-amber-400/95 hover:to-orange-400/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 active:translate-y-0.5"
            aria-label="マップへ"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
            <span className="inline-flex items-center justify-center gap-2">
              マップへ
              <span className="text-xl">↗</span>
            </span>
          </button>
        </div>
      </div>

      </section>
    </div>
  );
}
