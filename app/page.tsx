"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

const primaryCharacter = CONSULT_CHARACTERS[0];

const supportCharacters = CONSULT_CHARACTERS.slice(1);

const heroSpeeches = [
  {
    characterId: "nichiyosan",
    line: "迷ったら、まず一緒に見てみようかね。",
  },
  {
    characterId: "yoichisan",
    line: "見どころも、おすすめも、ゆっくり案内するよ。",
  },
  {
    characterId: "miraikun",
    line: "食べたいものがあるなら、検索からでOK。",
  },
  {
    characterId: "yosakochan",
    line: "なんとなく気になるだけでも、相談してみよっ。",
  },
] as const;

const problemCards = [
  "どこから歩けばいいかわからない",
  "気になるお店の探し方がわからない",
  "聞きたいけど、ちょっと緊張する",
];

const valueCards = [
  {
    icon: MapPin,
    title: "まず、全体を見る",
    body: "市の広さと位置が、すぐわかる。",
  },
  {
    icon: Search,
    title: "気になるものを探す",
    body: "食べたいものから、すぐ探せる。",
  },
  {
    icon: MessageCircle,
    title: "迷ったら相談する",
    body: "言葉にしにくくても、大丈夫。",
  },
];

const flowSteps = [
  {
    icon: Search,
    title: "検索する",
    body: "店やカテゴリから探す。",
  },
  {
    icon: Sparkles,
    title: "相談する",
    body: "迷いを、ひとこと話す。",
  },
  {
    icon: Store,
    title: "現地で会話する",
    body: "気になった店で、立ち止まる。",
  },
];

const trustPoints = [
  "高知高専の学生主体で企画・改善を継続",
  "高知市や出店者との対話を重ねて設計",
  "効率化よりも、安心して歩き始められる体験を優先",
];

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
    <div className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-amber-100 via-orange-50 to-white ${className}`}>
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
      headers: {
        "Content-Type": "application/json",
      },
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
    }, 3400);
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

  const activeSpeech = heroSpeeches[activeSpeechIndex];
  const activeSpeaker =
    CONSULT_CHARACTERS.find((character) => character.id === activeSpeech.characterId) ??
    primaryCharacter;

  return (
    <main className="min-h-screen bg-[#f7f1e8] text-stone-900 selection:bg-[#f3c78f]">
      <section className="relative overflow-hidden border-b border-amber-100 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(247,241,232,0.82)_46%,_rgba(234,208,167,0.5)_100%)]">
        <div className="absolute inset-0">
          <img
            src="/images/home-hero.jpg"
            alt="高知の日曜市を歩く風景"
            className="h-full w-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(72,36,12,0.06),rgba(247,241,232,0.92))]" />
        </div>

        <div className="relative mx-auto grid min-h-[100svh] max-w-6xl gap-6 px-4 py-6 sm:px-6 md:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="order-1"
          >
            <div className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-amber-800 backdrop-blur-sm">
              AIと歩く日曜市ガイド
            </div>

            <h1 className="mt-4 text-[2.4rem] font-bold leading-tight text-[#40230e] sm:text-[3rem] md:text-7xl">
              迷っても大丈夫。
              <br />
              nicchyoが、
              <br />
              日曜市の入口になる。
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
              はじめてでも、歩き出せる。
              <br />
              迷いを、楽しさに変える。
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleMapClick}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b85c22] px-7 py-4 text-base font-bold text-white shadow-[0_18px_45px_rgba(184,92,34,0.25)] transition hover:-translate-y-0.5 hover:bg-[#a24f1c] active:scale-[0.98]"
              >
                マップを見る
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleConsultClick}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8b896] bg-white/80 px-7 py-4 text-base font-semibold text-[#6f3a16] backdrop-blur-sm transition hover:bg-white"
              >
                AIキャラに相談する
              </button>
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-white/60 bg-white/75 p-3 shadow-[0_16px_40px_rgba(102,58,20,0.1)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-100 to-orange-50">
                  <img
                    src={activeSpeaker.image}
                    alt={activeSpeaker.name}
                    className={`h-full w-full object-cover ${activeSpeaker.imageScale}`}
                    style={{ objectPosition: activeSpeaker.imagePosition }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#5b3015]">{activeSpeaker.name}</p>
                  <p className="text-sm text-stone-500">{activeSpeaker.subtitle}</p>
                </div>
              </div>
              <motion.div
                key={`${activeSpeaker.id}-${activeSpeechIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="mt-3 rounded-[1.4rem] bg-[#fffaf4] px-4 py-3"
              >
                <p className="text-lg leading-8 text-stone-700 md:text-xl">{activeSpeech.line}</p>
              </motion.div>
              <div className="mt-3 flex gap-2">
                {heroSpeeches.map((speech, index) => (
                  <button
                    key={`${speech.characterId}-${index}`}
                    type="button"
                    aria-label={`${index + 1}つ目のセリフを表示`}
                    onClick={() => setActiveSpeechIndex(index)}
                    className={`h-2.5 rounded-full transition ${
                      index === activeSpeechIndex ? "w-6 bg-amber-500" : "w-2.5 bg-amber-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">出店カテゴリ</p>
                <p className="mt-2 text-2xl font-bold text-[#4c2810]">
                  {summary.categoryCount !== null ? summary.categoryCount.toLocaleString() : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">今週の訪問者数</p>
                <p className="mt-2 text-2xl font-bold text-[#4c2810]">
                  {summary.weeklyVisitorTotal !== null
                    ? `${summary.weeklyVisitorTotal.toLocaleString()}人`
                    : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">相談導線</p>
                <p className="mt-2 text-2xl font-bold text-[#4c2810]">4人</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: "easeOut" }}
            className="order-2"
          >
            <div className="rounded-[2rem] border border-white/60 bg-white/70 p-4 shadow-[0_24px_70px_rgba(102,58,20,0.12)] backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-40 w-32 shrink-0 overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-amber-100 to-orange-50 sm:h-48 sm:w-40">
                  <img
                    src={primaryCharacter.image}
                    alt={primaryCharacter.name}
                    className={`h-full w-full object-cover ${primaryCharacter.imageScale}`}
                    style={{ objectPosition: primaryCharacter.imagePosition }}
                  />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.14em] text-amber-700">案内役</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#4c2810]">{primaryCharacter.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-stone-700">{primaryCharacter.subtitle}</p>
                  <div className="mt-4 rounded-[1.4rem] bg-[#fffaf4] px-4 py-3">
                    <p className="text-lg leading-8 text-stone-700">
                      正解はなくていいき。
                      <br />
                      まずは安心して歩こうかね。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#ead8c0] bg-white p-6 shadow-[0_18px_48px_rgba(102,58,20,0.08)]">
            <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">はじめての日曜市で</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-5xl">
              こんなふうに迷ったとき、
              <br />
              nicchyoが入口になります。
            </h2>
            <p className="mt-4 text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
              迷う前に見る。
              <br />
              緊張する前に聞く。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {problemCards.map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] border border-[#f0e0cb] bg-[#fffaf4] p-5 shadow-sm"
              >
                <ShieldCheck className="h-6 w-6 text-[#b85c22]" />
                <p className="mt-4 text-lg leading-8 text-stone-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf4] px-4 py-14 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.16em] text-[#9a5a2e]">できること</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
              AIキャラが、検索と会話の
              <br />
              あいだをつなぐ。
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {valueCards.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-[2rem] border border-[#ecd8bf] bg-white p-6 shadow-[0_20px_60px_rgba(102,58,20,0.06)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7e0c1] text-[#a24f1c]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-[#4c2810]">{title}</h3>
                <p className="mt-3 text-lg leading-8 text-stone-700">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] bg-[#4b2a13] p-6 text-white shadow-[0_28px_80px_rgba(75,42,19,0.26)] md:p-8">
            <p className="text-sm font-semibold tracking-[0.16em] text-[#f4c899]">使い方</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              検索から始めてもいい。
              <br />
              キャラから始めてもいい。
            </h2>
            <p className="mt-4 text-lg leading-8 text-white/80 md:text-2xl md:leading-10">
              探してもいい。
              <br />
              話しかけてもいい。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {flowSteps.map(({ icon: Icon, title, body }, index) => (
                <div key={title} className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[#ffd8b1]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-[#f4c899]">
                        STEP {index + 1}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold">{title}</h3>
                      <p className="mt-2 text-lg leading-7 text-white/75">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#ead8c0] bg-white p-5 shadow-[0_18px_48px_rgba(102,58,20,0.08)]">
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
            <div className="mt-5 grid grid-cols-2 gap-3">
              {CONSULT_CHARACTERS.map((character) => (
                <div
                  key={character.id}
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#efe1ce] px-4 py-14 sm:px-6 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#8d4e22]">nicchyoについて</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#40230e] md:text-6xl">
              便利さだけではなく、
              <br />
              日曜市らしさを残すために。
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700 md:text-2xl md:leading-10">
              急がせない。
              <br />
              日曜市らしさを残す。
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/75 p-6 backdrop-blur-sm">
            <p className="text-lg font-bold text-[#5b3015]">信頼できる理由</p>
            <div className="mt-5 space-y-3">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#efe0cf] bg-[#fffaf4] px-4 py-4 text-lg leading-8 text-stone-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-[#4b2a13] px-6 py-10 text-white shadow-[0_35px_100px_rgba(75,42,19,0.28)] md:px-8 md:py-12">
          <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <div className="mx-auto w-full max-w-xs">
              <CharacterPortrait
                image={primaryCharacter.image}
                name={primaryCharacter.name}
                imageScale={primaryCharacter.imageScale}
                imagePosition={primaryCharacter.imagePosition}
                className="h-72 border border-white/10 bg-white/10"
              />
            </div>

            <div className="text-center md:text-left">
              <p className="text-sm font-semibold tracking-[0.16em] text-[#f0c694]">日曜市へ出かける前に</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
                さあ、日曜市へ。
                <br />
                迷ったら、まず相談。
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/80 md:text-2xl md:leading-10">
                マップでもいい。
                <br />
                相談からでもいい。
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
      </section>
    </main>
  );
}
