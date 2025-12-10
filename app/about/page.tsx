import Link from "next/link";

export const metadata = {
  title: "about | nicchyo",
  description: "nicchyo は高知高専のプロジェクトとして日曜市のデジタル体験を探求しています。",
};

const coreValues = [
  "日曜市の空気感を壊さずにデジタルで補助する",
  "出店者と来訪者の双方向コミュニケーションを尊重する",
  "実験的なUIを小さく素早く試し、フィードバックを受けて改善する",
];

const teamNotes = [
  "高知工業高等専門学校の学生・教員による研究プロジェクトです。",
  "高知市の協力を得て、現地での聞き取りや実地テストを実施しています。",
  "フィールドワークの結果は、OSS として公開できる部分から順次共有していきます。",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-amber-100/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              about nicchyo
            </p>
            <h1 className="text-2xl font-bold">高知高専発・日曜市の実験プロジェクト</h1>
            <p className="text-sm text-gray-700">
              日曜市をもっと歩きやすく、もっと知りやすくするための小さなデジタル実験です。
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            マップを見る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">プロジェクトの概要</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            nicchyo は、高知工業高等専門学校（高知高専）の学生と教員が中心となって進める研究・開発プロジェクトです。
            日曜市の持つ文化や人の温かさを損なわずに、マップ、レシピ、ことづてなどのデジタル機能で体験を補助することを目指しています。
          </p>
        </section>

        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
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

        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
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

        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">連携・お問い合わせ</h3>
          <p className="mt-2 text-sm text-gray-700">
            実証実験への協力、フィードバック、メディア取材などは下記フォームからご連絡ください。
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link
              href="mailto:info@nicchyo.local"
              className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
            >
              メールで連絡
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
            >
              日曜市マップへ戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
