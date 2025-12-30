import Link from "next/link";
import NavigationBar from "../../components/NavigationBar";
import MapLink from "../../components/MapLink";

export const metadata = {
  title: "Contact | nicchyo",
  description: "nicchyo へのお問い合わせ",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16 pt-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
  <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
    <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Contact</p>
    <h1 className="mt-1 text-4xl font-bold text-gray-900">お問い合わせ</h1>
    <p className="mt-1 text-xl text-gray-700">ご意見や取材依頼などはこちらからお知らせください。</p>
  </div>
  <div className="flex justify-center">
    <MapLink
      href="/map"
      className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
    >
      マップへ戻る
    </MapLink>
  </div>
</div>

      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">メールで連絡</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            返信までに数日いただく場合があります。ご了承ください。
          </p>
          <div className="mt-3">
            <Link
              href="mailto:info@nicchyo.local"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
            >
              info@nicchyo.local
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">よくある質問</h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            まずは FAQ によくある質問をまとめています。
          </p>
          <div className="mt-3">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
            >
              FAQ を見る
            </Link>
          </div>
        </section>
      </div>
      <NavigationBar />
    </main>
  );
}

