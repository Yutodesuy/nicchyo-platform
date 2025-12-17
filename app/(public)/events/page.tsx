import { Metadata } from 'next';
import Link from 'next/link';
import NavigationBar from '../../components/NavigationBar';

export const metadata: Metadata = {
  title: '午後のイベント | nicchyo日曜市',
  description: '日曜市が終わった後も楽しめる、地域イベントやワークショップ情報。',
};

export default function EventsPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🎪</span>
            <div>
              <h1 className="text-xl font-bold tracking-wide">午後のイベント</h1>
              <p className="text-xs text-amber-100 mt-0.5">市場の後も、楽しみは続く</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 準備中メッセージ */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border-4 border-amber-200">
            <div className="text-6xl mb-6">🎪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              イベント情報 準備中
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              日曜市の後に楽しめる地域イベントやワークショップの情報を、現在準備しています。
              もうしばらくお待ちください。
            </p>

            {/* 他のページへのリンク */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-amber-500 transition"
              >
                <span>🗺️</span>
                マップを見る
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-600 bg-white px-6 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition"
              >
                <span>🍳</span>
                レシピを見る
              </Link>
            </div>
          </div>

          {/* 将来の機能説明 */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ワークショップ</h3>
              <p className="text-sm text-gray-700">
                地元の職人による体験型ワークショップ情報をお届けします。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
              <div className="text-3xl mb-3">🎵</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">音楽イベント</h3>
              <p className="text-sm text-gray-700">
                市場周辺で開催される音楽イベントやパフォーマンス情報。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
              <div className="text-3xl mb-3">🍺</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">グルメイベント</h3>
              <p className="text-sm text-gray-700">
                日曜市の食材を使った料理教室やフードイベント情報。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
              <div className="text-3xl mb-3">🏛️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">文化体験</h3>
              <p className="text-sm text-gray-700">
                高知の文化や歴史を学べる体験プログラム情報。
              </p>
            </div>
          </div>
        </div>
      </main>

      <NavigationBar />
    </div>
  );
}
