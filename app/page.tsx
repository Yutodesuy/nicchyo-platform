"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-nicchyo-base text-nicchyo-ink">
      {/* ============================== */}
      {/* Header */}
      {/* ============================== */}
      <header className="sticky top-0 z-20 border-b border-nicchyo-soft-green/40 bg-nicchyo-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="rounded-md bg-nicchyo-primary/20 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-nicchyo-primary">
              nicchyo
            </span>
            <span className="text-xs text-nicchyo-ink/60">
              Kochi Sunday Market DX
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/map" className="nav-link text-nicchyo-ink/70 hover:text-nicchyo-primary transition">
              マップ
            </Link>
            <Link href="/shops" className="nav-link text-nicchyo-ink/70 hover:text-nicchyo-primary transition">
              お店
            </Link>
            <Link href="/foods" className="nav-link text-nicchyo-ink/70 hover:text-nicchyo-primary transition">
              郷土料理
            </Link>
            <Link href="/kotodute" className="nav-link text-nicchyo-ink/70 hover:text-nicchyo-primary transition">
              ことづて
            </Link>
            <Link href="/events" className="nav-link text-nicchyo-ink/70 hover:text-nicchyo-primary transition">
              イベント
            </Link>

            <Link
              href="/vendor"
              className="rounded-full border border-nicchyo-accent bg-nicchyo-accent/20 px-3 py-1 text-xs font-semibold text-nicchyo-ink shadow-sm hover:bg-nicchyo-accent/30 transition"
            >
              出店者の方へ
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================== */}
      {/* Hero Section */}
      {/* ============================== */}
      <section className="relative overflow-hidden border-b border-nicchyo-soft-green/30">
        {/* Paint-like background */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-nicchyo-primary/40 blur-3xl" />
          <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-nicchyo-accent/40 blur-3xl" />
          <div className="absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-nicchyo-soft-green/50 blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-nicchyo-base to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 py-16 md:py-24">
          <motion.div
            className="w-full rounded-3xl border border-nicchyo-soft-green/40 bg-white/80 p-6 shadow-xl backdrop-blur md:px-10 md:py-10"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-nicchyo-primary/40 bg-nicchyo-primary/10 px-3 py-1 text-xs text-nicchyo-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-nicchyo-primary" />
                  高知・日曜市発｜観光 × 地元民 × 市場文化
                </div>

                <div className="space-y-4">
                  <motion.h1
                    className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl text-nicchyo-ink"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.6 }}
                  >
                    伝統を、
                    <span className="bg-gradient-to-r from-nicchyo-primary via-nicchyo-soft-green to-nicchyo-accent bg-clip-text text-transparent">
                      未来へつなぐ
                    </span>
                    日曜市マップ。
                  </motion.h1>

                  <motion.p
                    className="max-w-xl text-sm text-nicchyo-ink/80 md:text-base"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                  >
                    nicchyo は、高知の日曜市を舞台に、
                    「観光客 × 地元民 × 市場文化」がつながる
                    デジタルプラットフォームです。
                    マップ・おすすめ・ことづて・イベントで、
                    "歩くだけで楽しい" 市場体験をデザインします。
                  </motion.p>
                </div>

                <motion.div
                  className="flex flex-wrap items-center gap-3 pt-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                >
                  <Link
                    href="/public/map"
                    className="rounded-xl bg-nicchyo-primary text-sm font-semibold text-white shadow-lg shadow-nicchyo-primary/30 transition hover:bg-nicchyo-primary/90"
                  >
                    <span className="flex items-center gap-2 px-5 py-3">
                      日曜市マップを見る
                      <span aria-hidden>↗</span>
                    </span>
                  </Link>

                  <Link
                    href="/about"
                    className="rounded-xl border border-nicchyo-ink/20 bg-white px-4 py-2 text-xs text-nicchyo-ink transition hover:border-nicchyo-ink/40"
                  >
                    nicchyo の思想を見る
                  </Link>
                </motion.div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-nicchyo-ink/60">
                  <span className="rounded-full border border-nicchyo-soft-green/50 bg-nicchyo-soft-green/10 px-2.5 py-1">
                    # デジタル日曜市
                  </span>
                  <span className="rounded-full border border-nicchyo-soft-green/50 bg-nicchyo-soft-green/10 px-2.5 py-1">
                    # ローカル×テクノロジー
                  </span>
                  <span className="rounded-full border border-nicchyo-soft-green/50 bg-nicchyo-soft-green/10 px-2.5 py-1">
                    # 受け継ぐためにカタチを変える
                  </span>
                </div>
              </div>

              {/* 右側：ミニマップ風カード（ダミーUI） */}
              <motion.div
                className="mt-8 w-full max-w-xs self-stretch rounded-2xl border border-nicchyo-soft-green/40 bg-white p-4 shadow-xl md:mt-0"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
              >
                <div className="mb-3 flex items-center justify-between text-xs text-nicchyo-ink">
                  <span>日曜市マップ（試作）</span>
                  <span className="rounded-full bg-nicchyo-primary/15 px-2 py-0.5 text-[10px] text-nicchyo-primary font-semibold">
                    LIVE
                  </span>
                </div>
                <div className="relative h-40 rounded-xl bg-nicchyo-base">
                  {/* ピンの雰囲気だけ */}
                  <div className="absolute left-6 top-6 h-7 w-7 rounded-full border border-nicchyo-primary/60 bg-nicchyo-primary/50 shadow-lg shadow-nicchyo-primary/30" />
                  <div className="absolute left-20 top-10 h-5 w-5 rounded-full border border-nicchyo-accent/60 bg-nicchyo-accent/50 shadow-lg shadow-nicchyo-accent/30" />
                  <div className="absolute right-10 bottom-8 h-4 w-4 rounded-full border border-nicchyo-soft-green/60 bg-nicchyo-soft-green/50 shadow-lg shadow-nicchyo-soft-green/30" />
                  <div className="absolute inset-x-4 bottom-4 h-1 rounded-full bg-nicchyo-soft-green/40" />
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-nicchyo-ink/70">
                  500店舗以上の位置情報をもとに、
                  「どこを歩くか」「何を食べるか」を
                  その場でデザインできる実験中のマップです。
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================== */}
      {/* 5 Pillars Section */}
      {/* ============================== */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold tracking-wide md:text-3xl text-nicchyo-ink">
            nicchyo を支える 5つの柱
          </h2>
          <p className="max-w-2xl text-sm text-nicchyo-ink/70 md:text-base">
            マップだけじゃなく、「おすすめ・郷土料理・ことづて・午後イベント」まで。
            日曜市をまるごと楽しめる体験をデザインします。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group flex h-full flex-col rounded-2xl border border-nicchyo-soft-green/40 bg-white p-5 backdrop-blur transition hover:border-nicchyo-primary hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-nicchyo-primary/10 text-lg">
                  <span>{item.icon}</span>
                </div>
                <h3 className="text-base font-semibold md:text-lg text-nicchyo-ink">
                  {item.title}
                </h3>
              </div>
              <p className="flex-1 text-sm text-nicchyo-ink/70">{item.desc}</p>
              <Link
                href={item.href}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-nicchyo-primary opacity-0 transition group-hover:opacity-100"
              >
                もっと見る
                <span aria-hidden>↗</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================== */}
      {/* Audience Section */}
      {/* ============================== */}
      <section className="border-t border-nicchyo-soft-green/30 bg-nicchyo-soft-green/10">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mb-8 flex flex-col gap-3 text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-wide md:text-3xl text-nicchyo-ink">
              それぞれの「日曜市の楽しみ方」に、
              <span className="bg-gradient-to-r from-nicchyo-primary to-nicchyo-accent bg-clip-text text-transparent">
                {" "}
                そっと寄りそう。
              </span>
            </h2>
            <p className="max-w-3xl text-sm text-nicchyo-ink/70 md:text-base">
              観光客も、地元の人も、出店者も。
              nicchyo は、それぞれの立場から見た日曜市の景色を、
              デジタルの力で少しだけ見やすく、分かりやすくしていきます。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="flex h-full flex-col rounded-2xl border border-nicchyo-soft-green/40 bg-white p-5 text-sm text-nicchyo-ink"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{a.icon}</span>
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                </div>
                <p className="mb-3 text-xs text-nicchyo-ink/60">{a.subtitle}</p>
                <ul className="mt-auto space-y-1.5 text-xs text-nicchyo-ink/80">
                  {a.points.map((p) => (
                    <li key={p}>・{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* Philosophy / Footer */}
      {/* ============================== */}
      <section className="border-t border-nicchyo-soft-green/30 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] md:items-center">
            <div className="space-y-5">
              <h2 className="text-2xl font-bold tracking-wide md:text-3xl text-nicchyo-ink">
                「受け継ぐために、カタチを変える」
              </h2>
              <p className="text-sm leading-relaxed text-nicchyo-ink/80 md:text-base">
                nicchyo は、日曜市400年の歴史を
                "未来の世代へ残すため"に再デザインしています。
                <br />
                伝統に敬意を払いながら、デジタルの力で新しい価値を創る。
                「観光 × 日常 × 市場」が混ざり合う、次世代の市場文化を育てます。
              </p>
            </div>

            <div className="rounded-2xl border border-nicchyo-soft-green/40 bg-nicchyo-soft-green/10 p-4 text-xs text-nicchyo-ink">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-nicchyo-ink/60">
                nicchyo roadmap
              </p>
              <ul className="space-y-1.5">
                <li>・2025：日曜市マップ β版 / ことづて実験</li>
                <li>・2027：来場データを活かした出店者支援機能</li>
                <li>・2030：高知全域・他地域ローカルマーケットへの展開</li>
              </ul>
            </div>
          </div>

          <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-nicchyo-soft-green/30 pt-4 text-[11px] text-nicchyo-ink/60 md:flex-row">
            <span>© {new Date().getFullYear()} nicchyo – Kochi Sunday Market DX</span>
            <div className="flex gap-4">
              <Link href="/about" className="hover:text-nicchyo-primary transition">
                プロジェクトについて
              </Link>
              <span className="text-nicchyo-ink/40">/</span>
              <span className="text-nicchyo-ink/60">
                Made in Kochi with ❤️
              </span>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}

const pillars = [
  {
    title: "日曜市マップ",
    desc: "500店舗を位置情報で見える化。お気に入りや距離で、あなただけの市場ルートを提案します。",
    href: "/map",
    icon: "🗺️",
  },
  {
    title: "お店提案（レコメンド）",
    desc: "「朝ごはん」「お土産」「映える写真」など、目的と現在地からぴったりのお店をおすすめ。",
    href: "/recommend",
    icon: "✨",
  },
  {
    title: "郷土料理・食材ガイド",
    desc: "日曜市の野菜や魚と、土佐の郷土料理をマッチング。レシピや食べ方も一緒に紹介します。",
    href: "/foods",
    icon: "🍲",
  },
  {
    title: "ことづて（当日限定SNS）",
    desc: "「今ここにいる人」同士で、ささやかな一言を交わせる、その日限りのことづて機能。",
    href: "/kotodute",
    icon: "💬",
  },
  {
    title: "午後イベント（将棋・ボードゲーム）",
    desc: "午後の少し落ち着いた時間に、空きブースで将棋やボードゲームを。観光客と地元民が自然につながる場に。",
    href: "/events",
    icon: "♟️",
  },
];

const audiences = [
  {
    title: "観光で訪れたあなたへ",
    subtitle: "「とりあえず歩いてみる」を、ちょっとだけ賢く。",
    icon: "🧳",
    points: [
      "初めてでも、ざっくり全体の雰囲気と位置関係がわかる",
      "朝ごはん・食べ歩きスポットをマップからさっと探せる",
      "“ことづて” で、いま市にいる人の空気感を覗ける",
    ],
  },
  {
    title: "地元で通うあなたへ",
    subtitle: "いつもの日曜市に、少しだけ新しい視点を。",
    icon: "🏡",
    points: [
      "いつものお店に加えて「今日はここも行ってみよう」が見つかる",
      "お気に入りのルートを覚えておいて、家族や友人に共有できる",
      "季節ごとの野菜・食べ方のアイデアが増える",
    ],
  },
  {
    title: "お店を出すあなたへ",
    subtitle: "感覚だけに頼らない、ゆるやかなデジタル支援。",
    icon: "🛒",
    points: [
      "どこに人が滞留しているのか、ざっくり把握できる（将来実装）",
      "常連さん・新規さんの動き方を、感覚＋データで見られる",
      "他のお店とも協力しながら、市場全体を盛り上げやすくなる",
    ],
  },
];
