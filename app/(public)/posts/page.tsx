import { Metadata } from 'next';
import NavigationBar from '../../components/NavigationBar';

export const metadata: Metadata = {
  title: '投稿（ことづて）| nicchyo日曜市',
  description: '日曜市での発見や感想を気軽に投稿・共有しよう。',
};

export default function PostsPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50 p-4 pb-20 overflow-y-auto pt-4">
        <div className="max-w-2xl mx-auto">
          {/* 投稿ボックス */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <textarea
              placeholder="今日の発見や感想を共有しよう..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                投稿する
              </button>
            </div>
          </div>

          {/* 説明 */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-3 text-gray-800">
              ことづて（投稿）
            </h2>
            <p className="text-gray-600 mb-4">
              日曜市での発見や感想を気軽に共有できます。
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• 今日のおすすめ</p>
              <p>• 買ったもの・食べたもの</p>
              <p>• ちょっとした発見</p>
            </div>
          </div>

          {/* 投稿例 */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">観光客さん</p>
                  <p className="text-gray-700 text-sm">
                    初めて日曜市に来ました！活気があって楽しい！
                  </p>
                  <p className="text-gray-400 text-xs mt-2">5分前</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">地元の方</p>
                  <p className="text-gray-700 text-sm">
                    今日は野菜が新鮮でした。おすすめです！
                  </p>
                  <p className="text-gray-400 text-xs mt-2">10分前</p>
                </div>
              </div>
            </div>
          </div>

          {/* プレースホルダー */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>投稿機能は準備中です</p>
          </div>
        </div>
      </main>

      {/* ナビゲーションバー */}
      <NavigationBar />
    </div>
  );
}
