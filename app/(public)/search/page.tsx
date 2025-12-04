import { Metadata } from 'next';
import NavigationBar from '../../components/NavigationBar';

export const metadata: Metadata = {
  title: '検索 | nicchyo日曜市',
  description: 'お店や商品を検索して、お気に入りを見つけよう。',
};

export default function SearchPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-slate-800 text-white px-4 py-3 shadow-md z-10">
        <h1 className="text-lg font-semibold tracking-wide text-center">
          🔍 検索
        </h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50 p-4 pb-20 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* 検索ボックス */}
          <div className="mb-6">
            <input
              type="search"
              placeholder="お店や商品を検索..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 説明 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-3 text-gray-800">
              お店・商品検索
            </h2>
            <p className="text-gray-600 mb-4">
              日曜市のお店や商品を検索できます。
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• お店の名前で検索</li>
              <li>• 商品カテゴリで絞り込み</li>
              <li>• 目的別のおすすめ表示</li>
            </ul>
          </div>

          {/* プレースホルダー */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>検索機能は準備中です</p>
          </div>
        </div>
      </main>

      {/* ナビゲーションバー */}
      <NavigationBar />
    </div>
  );
}
