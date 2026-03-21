"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { useMapLoading } from "./components/MapLoadingProvider";
import { CONSULT_CHARACTERS } from "./(public)/consult/data/consultCharacters";

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

const problemCards = [
  "広くて、どこから歩けばいいかわからない",
  "気になるものはあるのに、探し方がわからない",
  "人に聞きたいけど、最初のひと声が少し緊張する",
];

const actionCards = [
  {
    icon: MapPin,
    title: "まず、マップを見る",
    body: "市の広さと現在地をつかむ。",
  },
  {
    icon: Search,
    title: "気になるものを探す",
    body: "食べたいものから、すぐ探せる。",
  },
  {
    icon: MessageCircle,
    title: "迷ったら相談する",
    body: "言葉にしにくくても大丈夫。",
  },
];

const trustPoints = [
  "高知高専の学生が、現地の声を聞きながら育てています。",
  "高知市や出店者との対話を重ねて設計しています。",
  "効率よりも、安心して歩き出せることを大切にしています。",
];

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

        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <div className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-amber-800 backdrop-blur-sm">
                高知・日曜市の入口
              </div>

              <h1 className="mt-4 text-[2.45rem] font-bold leading-tight text-[#40230e] sm:text-[3rem] md:text-[4.6rem]">
                はじめてでも、
                <br />
                迷わず歩き出せる。
                <br />
                nicchyoの日曜市マップ。
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
                地図で見つける。
                <br />
                相談して、歩き出す。
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleMapClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b85c22] px-7 py-4 text-base font-bold text-white shadow-[0_18px_45px_rgba(184,92,34,0.24)] transition hover:-translate-y-0.5 hover:bg-[#a24f1c] active:scale-[0.98]"
                >
                  マップを見る
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    handleCharacterConsultClick(activeSpeaker.id, activeSpeech.prompt)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8b896] bg-white/80 px-7 py-4 text-base font-semibold text-[#6f3a16] backdrop-blur-sm transition hover:bg-white"
                >
                  相談してみる
                </button>
              </div>

              <div className="mt-5 max-w-sm">
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                      <h2 className="mt-2 text-2xl font-bold text-[#4c2810] sm:text-[1.9rem]">
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
                        className="mt-4 rounded-[1.4rem] bg-[#fffaf4] px-4 py-3 text-left"
                      >
                        <p className="text-lg leading-8 text-stone-700">{activeSpeech.line}</p>
                      </motion.div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <button
                          type="button"
                          onClick={() =>
                            handleCharacterConsultClick(activeSpeaker.id, activeSpeech.prompt)
                          }
                          className="rounded-full bg-[#b85c22] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a24f1c]"
                        >
                          {activeSpeech.chip}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-[#fffaf4] px-3 py-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">
                      相談相手をえらぶ
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                            className={`flex items-center gap-2 rounded-2xl border px-2 py-2 text-left transition ${
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
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#5b3015]">
                                {speaker.name}
                              </p>
                              <p className="line-clamp-2 text-[11px] leading-4 text-stone-500">
                                {speech.chip}
                              </p>
                            </div>
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
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div variants={revealVariants}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">
              はじめての日曜市で
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-5xl">
              こんなふうに迷ったとき、
              <br />
              nicchyoが入口になります。
            </h2>
          </motion.div>

          <motion.div className="grid gap-3 sm:grid-cols-3" variants={staggerVariants}>
            {problemCards.map((item) => (
              <motion.div
                key={item}
                variants={revealVariants}
                className="rounded-[1.75rem] border border-[#f0e0cb] bg-[#fffaf4] p-5 shadow-sm"
              >
                <ShieldCheck className="h-6 w-6 text-[#b85c22]" />
                <p className="mt-4 text-lg leading-8 text-stone-700">{item}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="bg-[#fffaf4] px-4 py-14 sm:px-6 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
      >
        <div className="mx-auto max-w-6xl">
          <motion.div className="max-w-3xl" variants={revealVariants}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">できること</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
              見つける。
              <br />
              聞ける。
              <br />
              歩き出せる。
            </h2>
          </motion.div>

          <motion.div className="mt-8 grid gap-5 md:grid-cols-3" variants={staggerVariants}>
            {actionCards.map(({ icon: Icon, title, body }) => (
              <motion.article
                key={title}
                variants={revealVariants}
                className="rounded-[2rem] border border-[#ecd8bf] bg-white p-6 shadow-[0_20px_60px_rgba(102,58,20,0.06)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7e0c1] text-[#a24f1c]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-[#4c2810]">{title}</h3>
                <p className="mt-3 text-lg leading-8 text-stone-700">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
      >
        <motion.div
          variants={revealVariants}
          className="rounded-[2rem] border border-[#ead8c0] bg-white p-5 shadow-[0_18px_48px_rgba(102,58,20,0.08)]"
        >
          <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">相談相手をえらぶ</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[#40230e] md:text-4xl">
            キャラたちは、
            <br />
            ここで待っています。
          </h2>
          <p className="mt-3 text-lg leading-8 text-stone-700">
            気になる相手を選んで、
            <br />
            そのまま相談できます。
          </p>

          <motion.div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" variants={staggerVariants}>
            {CONSULT_CHARACTERS.map((character) => (
              <motion.div
                key={character.id}
                variants={revealVariants}
                className="rounded-[1.5rem] border border-[#f0e0cb] bg-[#fffaf4] p-3"
              >
                <CharacterPortrait
                  image={character.image}
                  name={character.name}
                  imageScale={character.imageScale}
                  imagePosition={character.imagePosition}
                  className="h-40"
                />
                <p className="mt-3 text-lg font-bold text-[#5b3015]">{character.name}</p>
                <p className="mt-1 text-sm leading-7 text-stone-600">{character.personality}</p>
                <button
                  type="button"
                  onClick={() => handleCharacterConsultClick(character.id)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-700"
                >
                  このキャラに相談する
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        className="bg-[#efe1ce] px-4 py-14 sm:px-6 md:px-10"
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
          <motion.div variants={revealVariants}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#8d4e22]">nicchyoについて</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
              急がせない。
              <br />
              日曜市らしさを残す。
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
              効率より、安心。
              <br />
              情報より、歩きやすさ。
            </p>
          </motion.div>

          <motion.div
            variants={revealVariants}
            className="rounded-[2rem] border border-white/60 bg-white/75 p-6 backdrop-blur-sm"
          >
            <p className="text-lg font-bold text-[#5b3015]">信頼できる理由</p>
            <motion.div className="mt-5 space-y-3" variants={staggerVariants}>
              {trustPoints.map((item) => (
                <motion.div
                  key={item}
                  variants={revealVariants}
                  className="rounded-2xl border border-[#efe0cf] bg-[#fffaf4] px-4 py-4 text-lg leading-8 text-stone-700"
                >
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="px-4 py-16 sm:px-6 md:px-10"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-[#4b2a13] px-6 py-10 text-white shadow-[0_35px_100px_rgba(75,42,19,0.28)] md:px-8 md:py-12">
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
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

            <div className="text-center md:text-left">
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

              <div className="mt-6 flex flex-col gap-3 sm:flex-row md:justify-start">
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
