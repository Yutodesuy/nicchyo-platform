"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapLoading } from "../components/MapLoadingProvider";
import { motion } from "framer-motion";
import {
  MapPin,
  ChevronRight,
  MessageCircle,
  ShoppingBag,
  Award,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

type HomeSummary = {
  categoryCount: number | null;
  weeklyVisitorTotal: number | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" },
  }),
};

export default function AboutPage() {
  const router = useRouter();
  const { startMapLoading } = useMapLoading();
  const [loaded, setLoaded] = useState(false);
  const [summary, setSummary] = useState<HomeSummary>({
    categoryCount: null,
    weeklyVisitorTotal: null,
  });

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
            typeof payload.weeklyVisitorTotal === "number" ? payload.weeklyVisitorTotal : null,
        });
      } catch {
        // keep fallback values
      }
    };
    void loadSummary();
    return () => { cancelled = true; };
  }, []);

  const handleMapClick = () => {
    startMapLoading();
    setTimeout(() => { router.push("/map"); }, 300);
  };

  const handleConsultClick = () => { router.push("/consult"); };
  const handleAnalysisClick = () => { router.push("/analysis"); };

  const painPoints = [
    { emoji: "🗺️", text: "広くて、どこから回ればいいかわからない" },
    { emoji: "🔍", text: "何が買えるのか、事前に調べにくい" },
    { emoji: "😶", text: "知らない人に話しかけるのが苦手" },
  ];

  const features = [
    {
      icon: <MapPin className="h-7 w-7" />,
      title: "お守りマップ",
      desc: "GPS対応のデジタルマップで現在地を把握。迷っても、すぐに戻れる安心感。",
      color: "bg-green-50 text-green-700 border-green-100",
      accent: "text-green-600",
    },
    {
      icon: <MessageCircle className="h-7 w-7" />,
      title: "4人の案内キャラ",
      desc: "親しみやすいAIキャラが、あなたの「困った」に寄り添ってそっと案内してくれます。",
      color: "bg-yellow-50 text-yellow-700 border-yellow-100",
      accent: "text-yellow-600",
    },
    {
      icon: <ShoppingBag className="h-7 w-7" />,
      title: "お買い物リスト",
      desc: "気になったお店をその場でメモ。当日も迷わず、買い忘れなし。",
      color: "bg-amber-50 text-amber-700 border-amber-100",
      accent: "text-amber-600",
    },
  ];

  const characters = [
    {
      img: "/images/obaasan_transparent.png",
      name: "にちよさん",
      role: "やさしく案内",
      desc: "おだやかな言葉で、ゆっくり教えてくれます",
      bg: "bg-orange-50",
    },
    {
      img: "/images/characters/ojichan.png",
      name: "よういちさん",
      role: "落ち着いて解説",
      desc: "歴史や豆知識もくわしく教えてくれます",
      bg: "bg-sky-50",
    },
    {
      img: "/images/characters/onisan.png",
      name: "みらいくん",
      role: "テキパキ提案",
      desc: "テンポよく、効率的な回り方を教えてくれます",
      bg: "bg-green-50",
    },
    {
      img: "/images/characters/onesan.png",
      name: "よさこちゃん",
      role: "気軽に話しかけやすい",
      desc: "フレンドリーに、楽しく一緒に探してくれます",
      bg: "bg-pink-50",
    },
  ];

  const achievements = [
    {
      icon: <Award className="h-6 w-6 text-yellow-500" />,
      label: "こうちNPOアワード2025",
      value: "ワカモノ未来賞",
      sub: "受賞",
    },
    {
      icon: <Users className="h-6 w-6 text-green-600" />,
      label: "高知市商業振興課",
      value: "公式連携",
      sub: "実施中",
    },
    {
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      label: "今週の訪問者",
      value: summary.weeklyVisitorTotal !== null
        ? `${summary.weeklyVisitorTotal.toLocaleString()}人`
        : "--",
      sub: "が利用",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FFFAF0] text-[#3A3A3A] font-sans selection:bg-yellow-200">

      {/* ═══════════════════════════════════════
          HERO — Full-screen immersive
      ═══════════════════════════════════════ */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/home-hero.jpg"
            alt="高知の日曜市"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pb-20 pt-24 w-full max-w-2xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#7ED957]/90 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white tracking-widest shadow"
          >
            <MapPin className="h-3.5 w-3.5" />
            高知・日曜市デジタルマップ
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md md:text-6xl"
          >
            日曜市が、<br />
            <span className="text-[#FFDE59]">もっとたのしく</span><br />
            なる。
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-5 text-sm leading-relaxed text-white/85 md:text-base max-w-sm"
          >
            はじめての人でも、ゆっくり歩ける。<br />
            デジタルマップ × AIキャラがそっと案内。
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-col gap-3 w-full max-w-xs"
          >
            <motion.button
              onClick={handleMapClick}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7ED957] px-6 py-4 text-base font-bold text-white shadow-xl ring-4 ring-[#7ED957]/30 transition-all hover:bg-green-500 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
            >
              <MapPin className="h-5 w-5" />
              マップを見る
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </motion.button>

            <button
              onClick={handleConsultClick}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 backdrop-blur-sm px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/40 transition-all hover:bg-white/30 hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              AIキャラに相談する
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {/* Trust note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-[10px] font-medium text-white/50 tracking-widest uppercase"
          >
            無料 · 登録不要 · すぐ使える
          </motion.p>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <div className="h-8 w-[1px] bg-white/30 animate-bounce" />
          <span className="text-[9px] text-white/40 tracking-widest">SCROLL</span>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          PAIN POINTS — Empathy
      ═══════════════════════════════════════ */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold tracking-widest text-[#7ED957] uppercase mb-3">
              こんな悩み、ありませんか？
            </p>
            <h2 className="text-2xl font-extrabold text-[#3A3A3A] leading-tight md:text-3xl">
              日曜市、<span className="text-orange-500">なんとなく</span><br />
              足が向かない理由がある。
            </h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {painPoints.map((p, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-[#FFFAF0] p-5 shadow-sm"
              >
                <span className="text-3xl">{p.emoji}</span>
                <p className="text-sm font-semibold text-[#3A3A3A] leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={4}
            className="mt-10 text-center"
          >
            <p className="text-lg font-bold text-[#3A3A3A]">
              そんなあなたへ、<span className="text-[#7ED957]">nicchyo</span> があります。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES — 3 Pillars
      ═══════════════════════════════════════ */}
      <section className="bg-[#FFFAF0] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold tracking-widest text-[#7ED957] uppercase mb-3">
              nicchyoの特徴
            </p>
            <h2 className="text-2xl font-extrabold text-[#3A3A3A] leading-tight md:text-3xl">
              効率化じゃない。<br />
              <span className="text-[#7ED957]">楽しさの最大化</span>。
            </h2>
            <p className="mt-4 text-sm text-[#3A3A3A]/60 leading-relaxed max-w-sm mx-auto">
              はじめての人が安心して歩き出せるように。
              3つの機能で、日曜市をとことん楽しもう。
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`flex flex-col gap-4 rounded-3xl border p-6 ${f.color} shadow-sm`}
              >
                <div className={f.accent}>{f.icon}</div>
                <div>
                  <p className="font-extrabold text-[#3A3A3A] text-base mb-2">{f.title}</p>
                  <p className="text-xs leading-relaxed text-[#3A3A3A]/70">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CHARACTERS — Meet the guides
      ═══════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 overflow-hidden">
        <div className="mx-auto max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold tracking-widest text-[#7ED957] uppercase mb-3">
              あなたの案内人
            </p>
            <h2 className="text-2xl font-extrabold text-[#3A3A3A] leading-tight md:text-3xl">
              4人のキャラクターが、<br />
              <span className="text-orange-500">いつでも隣に</span>います。
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {characters.map((c, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`flex flex-col items-center gap-3 rounded-3xl ${c.bg} p-5 text-center shadow-sm`}
              >
                <div className="h-20 w-20 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white">
                  <img
                    src={c.img}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-[#3A3A3A]">{c.name}</p>
                  <p className="text-[10px] font-semibold text-[#7ED957] mt-0.5">{c.role}</p>
                  <p className="text-[10px] text-[#3A3A3A]/60 leading-relaxed mt-1">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={5}
            className="mt-10 text-center"
          >
            <button
              onClick={handleConsultClick}
              className="group inline-flex items-center gap-2 rounded-full bg-[#3A3A3A] px-7 py-3.5 text-sm font-bold text-white shadow transition-all hover:bg-[#222] hover:-translate-y-0.5 active:scale-95"
            >
              キャラクターに相談してみる
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TRUST — Achievements & Stats
      ═══════════════════════════════════════ */}
      <section className="bg-[#FFFAF0] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold tracking-widest text-[#7ED957] uppercase mb-3">
              実績
            </p>
            <h2 className="text-2xl font-extrabold text-[#3A3A3A] md:text-3xl">
              高知のまちと、一緒に育てています。
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {achievements.map((a, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col items-center gap-3 rounded-3xl bg-white border border-gray-100 p-6 shadow-sm text-center"
              >
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center shadow-inner">
                  {a.icon}
                </div>
                <p className="text-[11px] font-semibold text-[#3A3A3A]/50 tracking-wide">{a.label}</p>
                <p className="text-2xl font-extrabold text-[#3A3A3A] leading-none">{a.value}</p>
                <p className="text-xs text-[#3A3A3A]/50">{a.sub}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={4}
            className="mt-10 text-center"
          >
            <button
              onClick={handleAnalysisClick}
              className="group inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/20 bg-white px-6 py-3 text-sm font-semibold text-[#3A3A3A] shadow-sm transition-all hover:bg-[#3A3A3A] hover:text-white hover:-translate-y-0.5 active:scale-95"
            >
              日曜市をデータで見る
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SHOP PREVIEW — Visual appetizer
      ═══════════════════════════════════════ */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-xs font-bold tracking-widest text-[#7ED957] uppercase mb-3">
              出店の多様さ
            </p>
            <h2 className="text-2xl font-extrabold text-[#3A3A3A] md:text-3xl">
              食べて、見て、買って。<br />
              <span className="text-orange-500">高知の全部</span>が集まる市。
            </h2>
          </motion.div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {[
              { img: "/images/shops/icecream.webp", label: "スイーツ" },
              { img: "/images/shops/ninjin.webp", label: "野菜" },
              { img: "/images/shops/tosahamono.webp", label: "土佐刃物" },
              { img: "/images/shops/kawazaiku.webp", label: "革細工" },
              { img: "/images/shops/handcraft.webp", label: "クラフト" },
              { img: "/images/shops/imotenn.webp", label: "芋天" },
            ].map((s, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2"
              >
                <div className="h-20 w-full overflow-hidden rounded-2xl shadow-sm">
                  <img
                    src={s.img}
                    alt={s.label}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <p className="text-[10px] font-semibold text-[#3A3A3A]/60">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA — Bold close
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#3A3A3A] px-6 py-24 text-center">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#7ED957]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-[#FFDE59]/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-lg">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="text-xs font-bold tracking-widest text-[#7ED957] uppercase mb-5">
              さあ、はじめよう
            </p>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3 md:text-4xl">
              日曜市ファンに、<br />
              <span className="text-[#FFDE59]">なってみませんか？</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-10">
              nicchyoは無料です。登録不要ですぐ使えます。
            </p>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <motion.button
                onClick={handleMapClick}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7ED957] px-6 py-4 text-base font-bold text-white shadow-xl ring-4 ring-[#7ED957]/20 transition-all hover:bg-green-400 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
              >
                <MapPin className="h-5 w-5" />
                マップを開く
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </motion.button>

              <button
                onClick={handleConsultClick}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-0.5 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                まず相談してみる
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <p className="mt-8 text-[10px] text-white/30 tracking-widest">
              © 2026 nicchyo — 高知の日曜市デジタルマップ
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
