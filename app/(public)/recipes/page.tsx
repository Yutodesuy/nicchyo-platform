import { Metadata } from 'next';
import NavigationBar from '../../components/NavigationBar';

export const metadata: Metadata = {
  title: '郷土料理 | nicchyo日曜市',
  description: '日曜市で買える野菜を使った土佐料理レシピを紹介。',
};

export default function RecipesPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-slate-800 text-white px-4 py-3 shadow-md z-10">
        <h1 className="text-lg font-semibold tracking-wide text-center">
          🍳 郷土料理
        </h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50 p-4 pb-20 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* 説明 */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-3 text-gray-800">
              土佐の郷土料理
            </h2>
            <p className="text-gray-600 mb-4">
              日曜市で買える野菜を使った土佐料理のレシピを紹介します。
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• 旬の野菜を使った伝統料理</p>
              <p>• 地元の調理法を学ぶ</p>
              <p>• 帰宅後も楽しめるレシピ</p>
            </div>
          </div>

          {/* レシピカード例 */}
          <div className="grid gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-2">皿鉢料理</h3>
              <p className="text-sm text-gray-600">
                高知の伝統的なおもてなし料理
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-2">鰹のたたき</h3>
              <p className="text-sm text-gray-600">
                土佐を代表する郷土料理
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-2">りゅうきゅう</h3>
              <p className="text-sm text-gray-600">
                ハスイモの茎を使った料理
              </p>
            </div>
          </div>

          {/* プレースホルダー */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>詳細なレシピは準備中です</p>
          </div>
        </div>
      </main>

      {/* ナビゲーションバー */}
      <NavigationBar />
    </div>
  );
}
