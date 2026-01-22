import Link from "next/link";
import NavigationBar from "../components/NavigationBar";
import MapLink from "../components/MapLink";

export const metadata = {
  title: "about | nicchyo",
  description:
    "nicchyo は高知高専のプロジェクトとして日曜市のデジタル体験を探求しています。",
};

const pillars = [
  {
    title: "マップ",
    icon: "map",
    desc: "屋台の位置やおすすめを地図で直感的に確認できます。",
    href: "/map",
  },
  {
    title: "おすすめ",
    icon: "spark",
    desc: "お目当ての商品やお店を素早く検索して見つけられます。",
    href: "/search",
  },
  {
    title: "ことづて",
    icon: "chat",
    desc: "出店者と来場者の声をつなぐ短いメッセージボードです。",
    href: "/kotodute",
  },
  {
    title: "土佐の料理レシピ",
    icon: "recipe",
    desc: "季節の食材を使った土佐料理のレシピを紹介します。",
    href: "/recipes",
  },
  {
    title: "午後のイベント",
    icon: "event",
    desc: "市場が終わった後も楽しめる地域イベントやワークショップを掲載。",
    href: "/events",
  },
] as const;

const audiences = [
  {
    title: "はじめての来訪",
    subtitle: "どこを回ればいいか知りたい",
    icon: "route",
    points: [
      "目安ルート提案で迷わず回れる",
      "定番スポットと旬の見どころを表示",
      "徒歩時間と距離の目安を把握",
    ],
  },
  {
    title: "リピーター",
    subtitle: "新しい発見を探したい",
    icon: "discover",
    points: [
      "その日だけの限定品をピックアップ",
      "お気に入り店をブックマーク",
      "ことづてで交流や質問ができる",
    ],
  },
  {
    title: "出店者",
    subtitle: "お客さんに見つけてもらいたい",
    icon: "store",
    points: [
      "出店位置と商品をシンプルに掲示",
      "おすすめ欄で季節の推しを告知",
      "簡単なアンケートで声を集める",
    ],
  },
] as const;

const coreValues = [
  "日曜市の空気感を壊さずにデジタルで補助する",
  "出店者と来訪者の双方向コミュニケーションを尊重する",
  "実験的なUIを小さく素早く試し、フィードバックを受けて改善する",
];

const teamNotes = [
  "高知工業高等専門学校の学生・教員による研究プロジェクトです。",
  "高知市の協力を得て、現地での聞き取りとフィールドテストを実施しています。",
  "成果は段階的に公開し、OSSとして共有できる部分は積極的に開いていきます。",
];

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
  <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
    <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">About</p>
    <h1 className="mt-1 text-4xl font-bold text-gray-900">高知高専発・日曜市の実験プロジェクト</h1>
    <p className="mt-1 text-xl text-gray-700">日曜市をもっと歩きやすく、もっと知りやすくするための小さなデジタル実験です。</p>
  </div>
</div>

        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
          <section className="rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-2xl font-bold">日曜市を、もっと歩きやすく</h2>
            <p className="mt-3 text-sm text-gray-700 md:text-base">
              nicchyo は、高知・日曜市の「見つける」「歩く」「交流する」をまとめたガイドです。
              マップで位置を確認しながら、おすすめやイベント、ことづてをチェックできます。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <MapLink
                href="/map"
                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-300/40 transition hover:bg-amber-500"
              >
                マップを見る
              </MapLink>
              <Link
                href="/search"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-800 transition hover:border-gray-300"
              >
                お店を探す
              </Link>
            </div>
          </section>

          <section>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold md:text-3xl">nicchyo を支える 5つの柱</h2>
              <p className="mt-3 text-sm text-gray-700 md:text-base">
                マップを中心に、おすすめ、ことづて、イベントまで。日曜市をまるごと楽しめる導線を揃えました。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((item) => (
                <div
                  key={item.title}
                  className="flex h-full flex-col rounded-2xl border border-orange-100 bg-white p-5 text-sm text-gray-800 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-700">
                      <AboutIcon name={item.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold md:text-lg">{item.title}</h3>
                  </div>
                  <p className="flex-1 text-sm text-gray-700">{item.desc}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"
                  >
                    詳しくみる
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">大切にしていること</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-800">
              {coreValues.map((v) => (
                <li key={v} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-2xl font-bold md:text-3xl">それぞれの楽しみ方に寄り添う</h2>
              <p className="mt-3 max-w-3xl text-sm text-gray-700 md:text-base">
                観光客、リピーター、出店者それぞれの立場で「知りたいこと」を手早く見つけられるよう設計しました。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {audiences.map((a) => (
                <div
                  key={a.title}
                  className="flex h-full flex-col rounded-2xl border border-orange-100 bg-white p-5 text-sm text-gray-800 shadow-sm"
                >
                <div className="mb-2 flex items-center gap-2 text-base font-semibold">
                  <AboutIcon name={a.icon} className="h-4 w-4 text-amber-700" />
                  <span>{a.title}</span>
                </div>
                  <p className="mb-3 text-xs text-gray-600">{a.subtitle}</p>
                  <ul className="mt-auto space-y-1.5 text-xs text-gray-700">
                    {a.points.map((p) => (
                      <li key={p}>・{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">チームと活動</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-800">
              {teamNotes.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">連携・お問い合わせ</h3>
            <p className="mt-2 text-sm text-gray-700">
              実証実験への協力、フィードバック、メディア取材などは下記からご連絡ください。
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href="mailto:info@nicchyo.local"
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
              >
                メールで連絡
              </Link>
              <MapLink
                href="/map"
                className="rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
              >
                日曜市マップへ戻る
              </MapLink>
            </div>
          </section>
        </div>
      </main>
      <NavigationBar />
    </>
  );
}

type AboutIconName =
  | "map"
  | "spark"
  | "chat"
  | "recipe"
  | "event"
  | "route"
  | "discover"
  | "store";

type AboutIconProps = {
  name: AboutIconName;
  className?: string;
};

function AboutIcon({ name, className }: AboutIconProps) {
  const props = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "map":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75 5.25 5.25 3 6.75v11.5l3.75-1.5 6 2.25 5.25-2.25V5.25L12.75 7.5 9 6.75Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75v11.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 7.5v11.25" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m12 3 1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 16.5 6.5 18 8 19" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v6A2.25 2.25 0 0 1 17.25 15H9l-3.75 3v-3H6.75A2.25 2.25 0 0 1 4.5 12.75v-6Z"
          />
        </svg>
      );
    case "recipe":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 5.25h10.5A1.5 1.5 0 0 1 18.75 6.75v11.5A1.5 1.5 0 0 1 17.25 19.75H6.75A1.5 1.5 0 0 1 5.25 18.25V6.75A1.5 1.5 0 0 1 6.75 5.25Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9h7.5M8.25 12h7.5M8.25 15h4.5" />
        </svg>
      );
    case "event":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 4.5v3M17.25 4.5v3M4.5 8.25h15"
          />
          <rect
            x="4.5"
            y="6.75"
            width="15"
            height="12.75"
            rx="2.25"
            ry="2.25"
            stroke="currentColor"
            fill="none"
          />
        </svg>
      );
    case "route":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18a2 2 0 1 0 0.01 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 6a2 2 0 1 0 0.01 0" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 17c4-1 4-6 8-7"
          />
        </svg>
      );
    case "discover":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5 4.5 9l7.5 10.5L19.5 9 12 4.5Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 2.5 1.5 2.5-4.5" />
        </svg>
      );
    case "store":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 9.75 6 5.25h12l1.5 4.5"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.75v7.5h12v-7.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25V12h6v5.25" />
        </svg>
      );
    default:
      return null;
  }
}

