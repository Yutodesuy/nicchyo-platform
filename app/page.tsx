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
  const homeNpcLines = useState(
    () => [
      "今日はどこから歩く？ まずはマップを開いてみて！",
      "気になる屋台があったら、まずは覗いてみて。",
      "歩きながら探すと、新しい出会いがあるかもね。",
      "迷ったら、人気のお店から行ってみるとえいよ。",
      "寄り道しながらゆっくり歩くのが日曜市の楽しみ。",
    ]
  )[0];
  const [npcLineIndex, setNpcLineIndex] = useState(0);
  const posters = [
    {
      title: "おばあちゃんおせっかい 1",
      lead: "めっちゃ喋りかけてくる？！",
      accent: "声に導かれる",
    },
    {
      title: "おばあちゃんおせっかい 2",
      lead: "日曜市について質問できる？！",
      accent: "聞いたら返ってくる",
    },
    {
      title: "おばあちゃんおせっかい 3",
      lead: "日曜市周辺にも詳しい？！",
      accent: "街まで守備範囲",
    },
    {
      title: "魅力的なマップ",
      lead: "現在地機能と直感操作で日曜市を楽しめ！",
      accent: "歩く体験が中心",
    },
    {
      title: "便利な検索機能",
      lead: "ジャンル検索とマップ表示が楽！",
      accent: "探すがすぐ叶う",
    },
    {
      title: "これが欲しかったレシピ機能",
      lead: "土佐の郷土料理と日曜市の商品がつながる！",
      accent: "買い物と献立が一つに",
    },
    {
      title: "これで安心ことづて機能",
      lead: "その日限りの新鮮な情報をみんなで共有！",
      accent: "今日の声が集まる",
    },
  ];
  const [carouselIndex, setCarouselIndex] = useState(1);
  const [carouselTransition, setCarouselTransition] = useState(true);
  const carouselItems =
    posters.length > 0
      ? [posters[posters.length - 1], ...posters, posters[0]]
      : posters;
  const activePosterIndex =
    posters.length > 0 ? (carouselIndex - 1 + posters.length) % posters.length : 0;

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNpcLineIndex((prev) => (prev + 1) % homeNpcLines.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [homeNpcLines.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCarouselIndex((prev) => prev + 1);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [posters.length]);

  return (
    <div className="h-screen overflow-hidden bg-amber-50 text-gray-900">
      <section className="relative h-screen w-screen overflow-hidden">
        <div
          className={`absolute inset-0 scale-[1.06] transition-opacity duration-300 filter blur-[3px] brightness-95 contrast-90 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <MapView />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col text-gray-900">
          <div className="pointer-events-none absolute -top-20 left-6 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-4 top-24 h-64 w-64 rounded-full bg-orange-200/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-24 left-8 h-56 w-56 rounded-full bg-emerald-100/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85)_0%,_rgba(255,255,255,0.6)_45%,_rgba(255,255,255,0.9)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_55%,_rgba(15,8,0,0.18)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light bg-[linear-gradient(120deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_45%,rgba(255,255,255,0.25)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.5)_0,rgba(255,255,255,0.5)_1px,rgba(255,255,255,0)_1px,rgba(255,255,255,0)_6px)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-10 mix-blend-soft-light"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.4'/></svg>')",
            }}
          />
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
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/50 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              aria-label="ログインメニュー"
            >
              <span className="text-sm text-amber-800">?</span>
            </button>
          </header>

          <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6 pb-0">
            <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-amber-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  日曜市のデジタルマップ
                </div>
                <h1 className="text-3xl font-bold leading-tight text-amber-950 font-['Cinzel','Yu_Mincho','Hiragino_Mincho_ProN',serif] tracking-[0.12em]">
                  高知高専×日曜市
                </h1>

                <div className="flex items-center justify-center">
                  <div className="relative w-full overflow-hidden">
                    <div
                      className={`flex gap-6 ease-out ${
                        carouselTransition ? "transition-transform duration-700" : ""
                      }`}
                      style={{
                        transform: `translateX(calc(${carouselIndex} * -1 * (100% + 24px)))`,
                      }}
                      onTransitionEnd={(event) => {
                        if (event.propertyName !== "transform") return;
                        if (carouselIndex === carouselItems.length - 1) {
                          setCarouselTransition(false);
                          setCarouselIndex(1);
                          window.requestAnimationFrame(() => {
                            window.requestAnimationFrame(() => {
                              setCarouselTransition(true);
                            });
                          });
                        }
                        if (carouselIndex === 0 && posters.length > 0) {
                          setCarouselTransition(false);
                          setCarouselIndex(carouselItems.length - 2);
                          window.requestAnimationFrame(() => {
                            window.requestAnimationFrame(() => {
                              setCarouselTransition(true);
                            });
                          });
                        }
                      }}
                    >
                      {carouselItems.map((item, index) => (
                        <div
                          key={`${item.title}-${index}`}
                          className={`w-full shrink-0 rounded-2xl border border-amber-200/70 px-5 py-6 min-h-[220px] shadow-sm ${
                            index === carouselIndex ? "opacity-100" : "opacity-70"
                          } ${
                            index % 7 === 0
                              ? "bg-amber-50"
                              : index % 7 === 1
                              ? "bg-orange-50"
                              : index % 7 === 2
                              ? "bg-rose-50"
                              : index % 7 === 3
                              ? "bg-emerald-50"
                              : index % 7 === 4
                              ? "bg-sky-50"
                              : index % 7 === 5
                              ? "bg-lime-50"
                              : "bg-yellow-50"
                          }`}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700/80">
                            poster
                          </div>
                          <p className="mt-4 text-lg font-bold text-amber-900">
                            {item.title}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-amber-800/90">
                            {item.lead}
                          </p>
                          <p className="mt-4 text-[11px] font-semibold text-amber-700/70">
                            {item.accent}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {posters.map((_, index) => (
                        <span
                          key={index}
                          className={`h-2 w-2 rounded-full ${
                            index === activePosterIndex
                              ? "bg-amber-500"
                              : "bg-amber-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-amber-700/80" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
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
                      aria-label="歩き出す"
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                      <span className="inline-flex items-center justify-center gap-2">
                        歩き出す
                        <span className="text-xl">↗</span>
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-amber-800/80">
                    ログインなしで閲覧できます
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

                <div
                  className={`mt-6 flex items-end gap-3 transition-all duration-700 ${
                    loaded ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="absolute top-full left-1/2 -translate-x-1/2">
                      <span className="relative -top-[4px] inline-flex items-center whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                        おせっかいばあちゃん
                      </span>
                    </div>
                    <div className="relative h-[84px] w-[84px] shrink-0 sm:h-[96px] sm:w-[96px]">
                      <div className="absolute inset-0 rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 shadow-lg" />
                      <div className="absolute inset-1 overflow-hidden rounded-xl border border-white bg-white shadow-inner">
                        <img
                          src="/images/obaasan.webp"
                          alt="おせっかいばあちゃん"
                          className="h-full w-full scale-110 object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNpcLineIndex((prev) => (prev + 1) % homeNpcLines.length)
                    }
                    className="group relative max-w-[280px] rounded-2xl border-2 border-amber-400 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl"
                    aria-label="おばあちゃんのコメントを進める"
                  >
                    <div className="absolute -left-3 bottom-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-amber-400" />
                    <div className="absolute -left-2 bottom-6 h-0 w-0 border-y-7 border-y-transparent border-r-7 border-r-white" />
                    <div className="flex items-start gap-3">
                      <span className="text-xl" aria-hidden>
                        ✨
                      </span>
                      <div className="space-y-1">
                        <p className="text-base leading-relaxed text-gray-900">
                          {homeNpcLines[npcLineIndex]}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
