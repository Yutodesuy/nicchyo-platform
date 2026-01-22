import Link from "next/link";
import NavigationBar from "../../components/NavigationBar";
import MapLink from "../../components/MapLink";
import FaqClient from "./FaqClient";

export const metadata = {
  title: "よくある質問 | nicchyo",
  description: "日曜市マップの使い方や、よくあるご質問をまとめました。",
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-24 text-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-amber-100/50 to-transparent pb-6 pt-safe-top">
        <div className="mx-auto flex max-w-lg flex-col px-4 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              よくある質問
            </h1>
            <MapLink
              href="/map"
              className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold text-amber-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              マップへ戻る
            </MapLink>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm leading-relaxed text-gray-600">
              日曜市マップの使い方や、困ったときの解決方法をまとめました。キーワード検索もご利用いただけます。
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-lg px-4">
        <FaqClient />
      </div>

      <NavigationBar />
    </main>
  );
}
