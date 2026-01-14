"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "./components/MapLoadingProvider";

export default function HomePage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const [loaded, setLoaded] = useState(false);
  const posters = [
    {
      title: "おばあちゃんおせっかい 1",
      lead: "めっちゃ喋りかけてくる？！",
      accent: "声に導かれる",
      image: "/images/home/posters/HomePagePoster1.png",
    },
    {
      title: "おばあちゃんおせっかい 2",
      lead: "日曜市について質問できる？！",
      accent: "聞いたら返ってくる",
      image: "/images/home/posters/HomePagePoster2.png",
    },
    {
      title: "おばあちゃんおせっかい 3",
      lead: "日曜市周辺にも詳しい？！",
      accent: "街まで守備範囲",
      image: "/images/home/posters/HomePagePoster3.jpeg",
    },
    {
      title: "魅力的なマップ",
      lead: "現在地機能と直感操作で日曜市を楽しめ！",
      accent: "歩く体験が中心",
      image: "/images/home/posters/HomePagePoster4.png",
    },
    {
      title: "便利な検索機能",
      lead: "ジャンル検索とマップ表示が楽！",
      accent: "探すがすぐ叶う",
      image: "/images/home/posters/HomePagePoster5.png",
    },
    {
      title: "これが欲しかったレシピ機能",
      lead: "土佐の郷土料理と日曜市の商品がつながる！",
      accent: "買い物と献立が一つに",
      image: "/images/home/posters/HomePagePoster6.jpeg",
    },
    {
      title: "これで安心ことづて機能",
      lead: "その日限りの新鮮な情報をみんなで共有！",
      accent: "今日の声が集まる",
      image: "/images/home/posters/HomePagePoster7.png",
    },
  ];
  const [carouselIndex, setCarouselIndex] = useState(1);
  const [carouselTransition, setCarouselTransition] = useState(true);
  const [zoomPosterIndex, setZoomPosterIndex] = useState<number | null>(null);
  const carouselTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoomTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const carouselItems =
    posters.length > 0
      ? [posters[posters.length - 1], ...posters, posters[0]]
      : posters;
  const activePosterIndex =
    posters.length > 0 ? (carouselIndex - 1 + posters.length) % posters.length : 0;
  const zoomPoster = zoomPosterIndex !== null ? posters[zoomPosterIndex] : null;

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("home-poster-zoom-open", zoomPosterIndex !== null);
    return () => {
      document.body.classList.remove("home-poster-zoom-open");
    };
  }, [zoomPosterIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCarouselIndex((prev) => prev + 1);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [posters.length]);

  const handleCarouselTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    carouselTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCarouselTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = carouselTouchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const threshold = 40;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      setCarouselIndex((prev) => prev + (dx < 0 ? 1 : -1));
    }
    carouselTouchStartRef.current = null;
  };

  const handleZoomTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    zoomTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleZoomTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = zoomTouchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const threshold = 40;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      setZoomPosterIndex((prev) => {
        if (prev === null) return prev;
        return (prev + (dx < 0 ? 1 : -1) + posters.length) % posters.length;
      });
    }
    zoomTouchStartRef.current = null;
  };

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

          <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6 pb-0">
            <div className="relative space-y-6">
                <div className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-amber-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  日曜市×高知高専×デジタルマップ
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className="relative w-full overflow-hidden"
                    onTouchStart={handleCarouselTouchStart}
                    onTouchEnd={handleCarouselTouchEnd}
                  >
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
                      {carouselItems.map((item, index) => {
                        const normalizedIndex =
                          posters.length > 0 ? (index - 1 + posters.length) % posters.length : 0;
                        return (
                        <button
                          key={`${item.title}-${index}`}
                          className={`relative flex w-full shrink-0 items-center justify-center min-h-[220px] ${
                            index === carouselIndex ? "opacity-100" : "opacity-70"
                          }`}
                          type="button"
                          onClick={() => setZoomPosterIndex(normalizedIndex)}
                          aria-label={`${item.title}を拡大表示`}
                        >
                          <div className="w-[70%] overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full object-contain"
                            />
                          </div>
                        </button>
                      );
                      })}
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

                </div>
            </div>
          </div>
        </div>
      </section>
      {zoomPoster && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 px-4"
          onTouchStart={handleZoomTouchStart}
          onTouchEnd={handleZoomTouchEnd}
        >
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setZoomPosterIndex(null)}
              className="absolute -top-4 -right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-gray-900 shadow-lg"
              aria-label="閉じる"
            >
              ×
            </button>
            <div className="overflow-hidden rounded-2xl border border-white/40 bg-black shadow-2xl">
              <img
                src={zoomPoster.image}
                alt={zoomPoster.title}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
