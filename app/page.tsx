"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import { useMapLoading } from "./components/MapLoadingProvider";
import { CONSULT_CHARACTERS } from "./(public)/consult/data/consultCharacters";
import { getActivitiesSortedDesc } from "./data/activities";

type HomeSummary = {
  categoryCount: number | null;
  weeklyVisitorTotal: number | null;
};

const PREFERRED_CHARACTER_STORAGE_KEY = "nicchyo-consult-preferred-character";

const primaryCharacter = CONSULT_CHARACTERS[0];

const heroSpeeches = [
  {
    characterId: "nichiyosan",
    line: "迷ったら、まず一緒に見てみようかね。",
    prompt: "はじめての日曜市なんだけど、どこから歩けばいい？",
    chip: "回り方を相談",
  },
  {
    characterId: "yoichisan",
    line: "おすすめの見どころを、落ち着いて案内するよ。",
    prompt: "日曜市の見どころを教えて",
    chip: "見どころを聞く",
  },
  {
    characterId: "miraikun",
    line: "食べたいものがあるなら、検索からでもOK。",
    prompt: "食べ歩きにおすすめのお店を教えて",
    chip: "おすすめを聞く",
  },
  {
    characterId: "yosakochan",
    line: "なんとなく気になるだけでも、相談してみよっ。",
    prompt: "はじめてでも寄りやすいお店を教えて",
    chip: "気軽に相談",
  },
] as const;

const journeyCards = [
  {
    problem: "広くて、どこから歩けばいいかわからない",
    icon: MapPin,
    title: "まず、マップで全体を見る",
    body: "市の広さと位置関係がわかると、最初の一歩が決めやすい。",
    mediaSrc: "/images/home/Map-Demo.mp4",
    mediaAlt: "nicchyoのマップ画面デモ",
    actionLabel: "マップを見てみる",
    actionType: "map",
  },
  {
    problem: "気になるものはあるのに、探し方がわからない",
    icon: Search,
    title: "気になるものを探す",
    body: "食べたいものや見たいものから探せると、歩く理由が見えてくる。",
    mediaSrc: "/images/home/Search-Demo.mp4",
    mediaAlt: "nicchyoの検索につながるマップ画面デモ",
    actionLabel: "お店を探してみる",
    actionType: "search",
  },
  {
    problem: "人に聞きたいけど、最初のひと声が少し緊張する",
    icon: MessageCircle,
    title: "迷ったら、案内役に相談する",
    body: "言葉にしにくい迷いでも、会話から次の行き先を決められる。",
    mediaSrc: "/images/home/Consult-Demo.mp4",
    mediaAlt: "nicchyoの相談画面デモ",
    actionLabel: "相談を試してみる",
    actionType: "consult",
  },
] as const;

const characterCardDescriptions: Record<string, string> = {
  nichiyosan: "やさしく案内してくれる。",
  yoichisan: "落ち着いて教えてくれる。",
  miraikun: "軽やかに手伝ってくれる。",
  yosakochan: "気軽に話しかけやすい。",
};

const activityCategoryStyles: Record<string, string> = {
  行政連携: "bg-[#efe1ce] text-[#7b4721]",
  現地調査: "bg-[#f7e8d7] text-[#8b4d20]",
  発表: "bg-[#f1e5d4] text-[#754420]",
  受賞: "bg-[#f6ead7] text-[#7d4b1f]",
};

function createRevealVariants(reduceMotion: boolean) {
  return {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.16 : 0.52,
        ease: "easeOut",
      },
    },
  };
}

function createStaggerVariants(reduceMotion: boolean) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };
}

function CharacterPortrait({
  image,
  name,
  imageScale,
  imagePosition,
  className = "",
}: {
  image: string;
  name: string;
  imageScale: string;
  imagePosition: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-amber-100 via-orange-50 to-white ${className}`}
    >
      <div className="absolute inset-x-4 top-4 h-12 rounded-full bg-white/65 blur-xl" aria-hidden="true" />
      <img
        src={image}
        alt={name}
        className={`h-full w-full object-cover ${imageScale}`}
        style={{ objectPosition: imagePosition }}
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const shouldReduceMotion = useReducedMotion();
  const revealVariants = useMemo(
    () => createRevealVariants(shouldReduceMotion),
    [shouldReduceMotion]
  );
  const staggerVariants = useMemo(
    () => createStaggerVariants(shouldReduceMotion),
    [shouldReduceMotion]
  );

  const [loaded, setLoaded] = useState(false);
  const [summary, setSummary] = useState<HomeSummary>({
    categoryCount: null,
    weeklyVisitorTotal: null,
  });
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(0);
  const [activeJourneyIndex, setActiveJourneyIndex] = useState<number | null>(0);
  const [isMapLaunching, setIsMapLaunching] = useState(false);

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
      headers: { "Content-Type": "application/json" },
    });
  }, [loaded]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.remove("home-poster-zoom-open");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const response = await fetch("/api/analytics/home-summary", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as Partial<HomeSummary> & { ok?: boolean };
        if (!payload.ok || cancelled) return;

        setSummary({
          categoryCount:
            typeof payload.categoryCount === "number" ? payload.categoryCount : null,
          weeklyVisitorTotal:
            typeof payload.weeklyVisitorTotal === "number"
              ? payload.weeklyVisitorTotal
              : null,
        });
      } catch {
        // keep fallback values
      }
    };

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSpeechIndex((prev) => (prev + 1) % heroSpeeches.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  const handleMapClick = () => {
    if (isMapLaunching) return;
    setIsMapLaunching(true);
    startMapLoading();
    setTimeout(() => {
      router.push("/map");
    }, 300);
  };

  const handleConsultClick = () => {
    router.push("/consult");
  };

  const handleCharacterConsultClick = (characterId: string, prompt?: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFERRED_CHARACTER_STORAGE_KEY, characterId);
    }
    const query = prompt ? `?q=${encodeURIComponent(prompt)}` : "";
    router.push(`/consult${query}`);
  };

  const activeSpeech = heroSpeeches[activeSpeechIndex];
  const activeSpeaker =
    CONSULT_CHARACTERS.find((character) => character.id === activeSpeech.characterId) ??
    primaryCharacter;
  const sortedTrustPoints = useMemo(
    () => getActivitiesSortedDesc(),
    []
  );
  const visibleTrustPoints = sortedTrustPoints.slice(0, 5);
  const latestTrustPoint = visibleTrustPoints[0] ?? null;
  const remainingTrustPoints = visibleTrustPoints.slice(1);

  return (
    <main className="min-h-screen bg-[#f7f1e8] text-stone-900 selection:bg-[#f3c78f]">
      <section className="relative overflow-hidden border-b border-amber-100 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(247,241,232,0.86)_48%,_rgba(235,208,166,0.45)_100%)]">
        <div className="absolute inset-0">
          <img
            src="/images/home-hero.jpg"
            alt="高知の日曜市を歩く風景"
            className="h-full w-full object-cover object-center opacity-15"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(72,36,12,0.05),rgba(247,241,232,0.94))]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:py-16">
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <div className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-amber-800 backdrop-blur-sm">
                高知・日曜市の入口
              </div>

              <h1 className="mt-4 text-[2.45rem] font-bold leading-tight text-[#40230e] sm:text-[3rem] md:text-[4.6rem]">
                地図で見つける。
                <br />
                相談して、歩き出す。
                <br />
                はじめての日曜市へ。
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
                気になるお店を探して、
                <br />
                迷ったら案内役に聞ける。
              </p>

              <div className="sticky bottom-4 z-20 mt-8 -mx-1 rounded-[1.5rem] bg-white/78 p-2 backdrop-blur-md sm:static sm:mx-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
                <motion.button
                  onClick={handleMapClick}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -3,
                          scale: 1.015,
                        }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : isMapLaunching
                        ? {
                            scale: [1, 0.98, 1.02, 1],
                          }
                        : {
                            boxShadow: [
                              "0 18px 45px rgba(184,92,34,0.24)",
                              "0 22px 54px rgba(184,92,34,0.34)",
                              "0 18px 45px rgba(184,92,34,0.24)",
                            ],
                          }
                  }
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : isMapLaunching
                        ? { duration: 0.34, ease: "easeOut" }
                        : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                  }
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-[#b85c22] px-7 py-4 text-base font-bold text-white sm:w-auto sm:self-start"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.22)_28%,transparent_46%)] opacity-70 transition-transform duration-700 group-hover:translate-x-8" />
                  <span className="absolute inset-[1px] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
                  <span className="absolute -left-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
                  <span className="relative flex items-center gap-2">
                    <span>{isMapLaunching ? "マップを開いています..." : "マップを見る"}</span>
                    <motion.span
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : isMapLaunching
                            ? { x: [0, 8, 0] }
                            : { x: [0, 4, 0] }
                      }
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : isMapLaunching
                            ? { duration: 0.45, ease: "easeOut" }
                            : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                      }
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.span>
                  </span>
                  {!shouldReduceMotion && !isMapLaunching ? (
                    <span className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_0_0_rgba(253,230,138,0.65)] animate-ping" />
                  ) : null}
                </motion.button>
                <button
                  onClick={() =>
                    handleCharacterConsultClick(activeSpeaker.id, activeSpeech.prompt)
                  }
                  className="mt-3 inline-flex items-center gap-2 self-start pl-1 text-sm font-semibold text-[#8a5129] transition hover:text-[#6f3a16]"
                >
                  迷ったら案内役に相談する
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 max-w-sm">
                <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-center backdrop-blur-sm">
                  <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">
                    今週の訪問者数
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#4c2810]">
                    {summary.weeklyVisitorTotal !== null
                      ? `${summary.weeklyVisitorTotal.toLocaleString()}人`
                      : "--"}
                  </p>
                </div>
              </div>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: "easeOut" }}
            >
              <motion.div
                animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
                }
                className="rounded-[2rem] border border-white/60 bg-white/72 p-4 shadow-[0_24px_70px_rgba(102,58,20,0.12)] backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="mx-auto h-44 w-36 shrink-0 overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-amber-100 to-orange-50 sm:mx-0 sm:h-48 sm:w-40">
                      <img
                        src={activeSpeaker.image}
                        alt={activeSpeaker.name}
                        className={`h-full w-full object-cover ${activeSpeaker.imageScale}`}
                        style={{ objectPosition: activeSpeaker.imagePosition }}
                      />
                    </div>

                    <div className="min-w-0 text-center sm:text-left">
                      <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">案内役</p>
                      <h2 className="mt-3 text-2xl font-bold text-[#4c2810] sm:text-[1.9rem]">
                        {activeSpeaker.name}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-stone-700">
                        {activeSpeaker.subtitle}
                      </p>

                      <motion.div
                        key={`${activeSpeaker.id}-${activeSpeechIndex}`}
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="mt-6 rounded-[1.4rem] bg-[#fffaf4] px-4 py-4 text-left"
                      >
                        <p className="text-lg leading-8 text-stone-700">{activeSpeech.line}</p>
                      </motion.div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCharacterConsultClick(activeSpeaker.id, activeSpeech.prompt)
                        }
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8a5129] transition hover:text-[#6f3a16]"
                      >
                        この案内役に聞いてみる
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-[#fffaf4] px-3 py-4">
                    <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">
                      案内役を切り替える
                    </p>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {heroSpeeches.map((speech, index) => {
                        const speaker = CONSULT_CHARACTERS.find(
                          (character) => character.id === speech.characterId
                        );
                        if (!speaker) return null;

                        const isActive = index === activeSpeechIndex;
                        return (
                          <button
                            key={`${speech.characterId}-${index}`}
                            type="button"
                            onClick={() => setActiveSpeechIndex(index)}
                            className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition ${
                              isActive
                                ? "border-amber-300 bg-white shadow-sm"
                                : "border-transparent bg-white/70 hover:border-amber-200"
                            }`}
                          >
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-amber-100 to-orange-50">
                              <img
                                src={speaker.image}
                                alt={speaker.name}
                                className={`h-full w-full object-cover ${speaker.imageScale}`}
                                style={{ objectPosition: speaker.imagePosition }}
                              />
                            </div>
                            <p className="line-clamp-2 text-[11px] font-bold leading-4 text-[#5b3015]">
                              {speaker.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        className="bg-[#fffaf4] px-4 py-20 sm:px-6 sm:py-24 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
      >
        <div className="mx-auto max-w-5xl space-y-8">
          <motion.div className="max-w-3xl" variants={revealVariants}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">
              はじめての日曜市で
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
              迷った場面から、
              <br />
              そのまま使いはじめられる。
            </h2>
            <p className="mt-4 text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
              気になる項目をひらくと、
              <br />
              使い方と画面がまとめてわかります。
            </p>
          </motion.div>

          <motion.div className="space-y-4" variants={staggerVariants}>
            {journeyCards.map(
              ({ problem, icon: Icon, title, body, mediaSrc, mediaAlt, actionLabel, actionType }, index) => (
              <motion.article
                key={title}
                variants={revealVariants}
                className={`overflow-hidden rounded-[2rem] border bg-white shadow-[0_20px_60px_rgba(102,58,20,0.06)] transition ${
                  activeJourneyIndex === index
                    ? "border-[#ddb88f] shadow-[0_24px_64px_rgba(102,58,20,0.1)]"
                    : "border-[#ecd8bf]"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveJourneyIndex((prev) => (prev === index ? null : index))
                  }
                  aria-expanded={activeJourneyIndex === index}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-[#fffaf4] md:px-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7e0c1] text-[#a24f1c]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#b85c22]">
                      こんなとき
                    </p>
                    <p className="mt-1 text-lg font-semibold leading-8 text-stone-800 md:text-xl">
                      {problem}
                    </p>
                    {activeJourneyIndex !== index ? (
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        {title}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 shrink-0 text-[#8a5129] transition-transform duration-300 ${
                      activeJourneyIndex === index ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {activeJourneyIndex === index ? (
                  <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="border-t border-[#f0dfca] bg-[linear-gradient(180deg,#fffdfa_0%,#fff8ef_100%)] px-5 py-5 md:px-6"
                  >
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
                      <div className="pt-1">
                        <p className="text-sm font-semibold tracking-[0.14em] text-[#9a5a2e]">
                          {title}
                        </p>
                        <p className="mt-3 max-w-xl text-lg leading-8 text-stone-700 md:text-xl md:leading-9">
                          {body}
                        </p>
                      </div>

                      <div className="mx-auto w-full max-w-[320px]">
                        <div className="overflow-hidden rounded-[1.6rem] bg-[#eadcc9] shadow-[0_16px_40px_rgba(102,58,20,0.12)]">
                          <video
                            src={mediaSrc}
                            aria-label={mediaAlt}
                            className="aspect-[2/3] h-full w-full object-cover"
                            autoPlay={!shouldReduceMotion}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          controls={shouldReduceMotion}
                        />
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              actionType === "map"
                                ? handleMapClick()
                                : actionType === "search"
                                  ? router.push("/search")
                                  : handleCharacterConsultClick(activeSpeaker.id, activeSpeech.prompt)
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#8a5129] shadow-[0_8px_24px_rgba(64,35,14,0.14)] ring-1 ring-[#ead8c0] transition hover:-translate-y-0.5 hover:bg-[#fffaf4]"
                          >
                            {actionLabel}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </motion.article>
            )
            )}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
      >
        <motion.div
          variants={revealVariants}
          className="rounded-[2rem] border border-[#ead8c0] bg-white p-6 shadow-[0_18px_48px_rgba(102,58,20,0.08)]"
        >
          <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">相談相手をえらぶ</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[#40230e] md:text-4xl">
            話しやすそうな相手を、
            <br />
            ひとり選べばいい。
          </h2>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            それぞれ話し方がちがいます。
          </p>

          <motion.div className="mt-8 grid gap-3 md:grid-cols-2" variants={staggerVariants}>
            {CONSULT_CHARACTERS.map((character) => (
              <motion.button
                key={character.id}
                variants={revealVariants}
                type="button"
                onClick={() => handleCharacterConsultClick(character.id)}
                className="group flex items-center gap-4 rounded-[1.5rem] border border-[#f0e0cb] bg-[#fffaf4] p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#e1c8a8] hover:bg-white"
              >
                <CharacterPortrait
                  image={character.image}
                  name={character.name}
                  imageScale={character.imageScale}
                  imagePosition={character.imagePosition}
                  className="h-24 w-24 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-[#5b3015]">{character.name}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {characterCardDescriptions[character.id] ?? character.subtitle}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-amber-700 transition duration-300 group-hover:translate-x-1" />
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        className="bg-[#efe1ce] px-4 py-20 sm:px-6 sm:py-24 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className="mx-auto max-w-5xl space-y-8">
          <motion.div variants={revealVariants}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#8d4e22]">nicchyoについて</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
              効率化ではない。
              <br />
              日曜市の楽しさを
              <br />
              最大化する。
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
              はじめての人が、
              <br />
              安心して歩き出せるように。
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-xl md:leading-9">
              この考え方を机上のアイデアで終わらせず、
              <br />
              現地調査や対話を重ねながら育てています。
            </p>
          </motion.div>

          <motion.div variants={revealVariants} className="rounded-[2rem] border border-white/60 bg-white/75 p-6 backdrop-blur-sm">
            <p className="text-sm font-semibold tracking-[0.14em] text-[#9a5a2e]">
              考え方を支えている実際の動き
            </p>
            <p className="text-lg font-bold text-[#5b3015]">直近の取り組み</p>
            {latestTrustPoint ? (
              <motion.div
                key="trust-top"
                className="mt-5 space-y-4"
                variants={staggerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={revealVariants}>
                  <Link
                    href={`/activities/${latestTrustPoint.slug}`}
                    className="group block overflow-hidden rounded-[1.75rem] border border-[#ead8c3] bg-[#fff8f1] transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_45px_rgba(91,48,21,0.08)]"
                  >
                    {latestTrustPoint.image ? (
                      <div className="aspect-[16/9] overflow-hidden bg-[#eadcc9]">
                        <img
                          src={latestTrustPoint.image}
                          alt={latestTrustPoint.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-3 px-5 py-5 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#5b3015] px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white">
                              最新
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${activityCategoryStyles[latestTrustPoint.category] ?? "bg-[#efe1ce] text-[#7b4721]"}`}
                            >
                              {latestTrustPoint.category}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9a5a2e]">
                            {latestTrustPoint.date}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#8a5129] transition duration-300 group-hover:translate-x-1" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold leading-8 text-stone-800 sm:text-xl">
                          {latestTrustPoint.title}
                        </p>
                        <p className="text-sm leading-7 text-stone-600 sm:text-[15px]">
                          {latestTrustPoint.summary}
                        </p>
                        {latestTrustPoint.note ? (
                          <p className="text-sm font-medium text-stone-500">
                            {latestTrustPoint.note}
                          </p>
                        ) : null}
                      </div>
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a5129]">
                        くわしく見る
                        <ChevronRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                      </p>
                    </div>
                  </Link>
                </motion.div>

                {remainingTrustPoints.length > 0 ? (
                  <div className="space-y-3">
                    {remainingTrustPoints.map((item) => (
                      <motion.div
                        key={`${item.date}-${item.title}`}
                        variants={revealVariants}
                        className="rounded-2xl"
                      >
                        <Link
                          href={`/activities/${item.slug}`}
                          className="group flex items-center gap-4 rounded-2xl border border-[#efe0cf] bg-[#fffaf4] p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_30px_rgba(91,48,21,0.06)]"
                        >
                          {item.image ? (
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#eadcc9]">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#f1e1cf] px-3 text-center text-xs font-bold leading-5 tracking-[0.12em] text-[#8a5129]">
                              {item.category}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${activityCategoryStyles[item.category] ?? "bg-[#efe1ce] text-[#7b4721]"}`}
                              >
                                {item.category}
                              </span>
                              <span className="text-[11px] font-semibold tracking-[0.12em] text-[#9a5a2e]">
                                {item.date}
                              </span>
                            </div>
                            <p className="mt-2 text-base font-semibold leading-7 text-stone-800">
                              {item.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">
                              {item.summary}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 shrink-0 text-[#8a5129] transition duration-300 group-hover:translate-x-1" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/activities")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#8a5129]"
            >
              これまでの活動を見る
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="px-4 py-20 sm:px-6 sm:py-24 md:px-10"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-[#4b2a13] px-6 py-12 text-white shadow-[0_35px_100px_rgba(75,42,19,0.28)] md:px-8 md:py-14">
          <div className="space-y-8 text-center">
            <div className="mx-auto w-full max-w-xs">
              <motion.div
                animate={shouldReduceMotion ? undefined : { rotate: [0, -1.2, 0, 1.2, 0] }}
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { duration: 7, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <CharacterPortrait
                  image={primaryCharacter.image}
                  name={primaryCharacter.name}
                  imageScale={primaryCharacter.imageScale}
                  imagePosition={primaryCharacter.imagePosition}
                  className="h-72 border border-white/10 bg-white/10"
                />
              </motion.div>
            </div>

            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-[#f0c694]">
                日曜市へ出かける前に
              </p>
              <h2 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
                まずは、マップを開く。
                <br />
                それでも迷ったら、相談する。
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/80 md:text-2xl md:leading-10">
                ひとりで迷い続けなくていい。
                <br />
                nicchyoが入口になります。
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={handleMapClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9772b] px-7 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#c46a25] active:scale-[0.98]"
                >
                  マップを見る
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={handleConsultClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15"
                >
                  AIキャラに相談する
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
