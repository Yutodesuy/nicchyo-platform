import Link from "next/link";
import NavigationBar from "../../components/NavigationBar";

export const metadata = {
  title: "FAQ | nicchyo",
  description: "nicchyo のよくある質問",
};

const faqs = [
  {
    q: "マップは無料で使えますか？",
    a: "はい、無料で利用できます。",
  },
  {
    q: "お気に入りや買い物リストは保存されますか？",
    a: "この端末のブラウザに保存されます。別端末には引き継がれません。",
  },
  {
    q: "位置情報は必須ですか？",
    a: "必須ではありません。許可すると現在地が表示されます。",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-amber-100/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              faq
            </p>
            <h1 className="text-2xl font-bold">よくある質問</h1>
            <p className="text-sm text-gray-700">
              日曜市マップの使い方や仕様についてまとめました。
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            マップへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        {faqs.map((item) => (
          <section
            key={item.q}
            className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-gray-900">{item.q}</h2>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{item.a}</p>
          </section>
        ))}
      </div>
      <NavigationBar />
    </main>
  );
}
