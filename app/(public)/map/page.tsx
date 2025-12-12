import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import NavigationBar from '../../components/NavigationBar';
import UserProfileButton from './components/UserProfileButton';

export const metadata: Metadata = {
  title: "nicchyo 日曜市マップ | 高知市日曜市",
  description:
    "高知市日曜市のインタラクティブマップ。出店位置を確認して、お気に入りのお店を見つけよう。",
};

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        {/* 和紙風テクスチャ */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZDk3NzA2IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')]"></div>

        {/* 装飾的な円 */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* ヘッダー */}
      <header className="relative z-10 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white px-6 py-4 shadow-lg border-b-4 border-amber-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h1 className="text-xl font-bold tracking-wide">
                nicchyo日曜市マップ
              </h1>
              <p className="text-xs text-amber-100 mt-0.5">高知城前 追手筋 約1.3km</p>
            </div>
            <span className="text-3xl">🗺️</span>
          </div>
        </div>
      </header>

      {/* マップエリア（ナビゲーションバーの高さ分の余白を確保） */}
      <main className="flex-1 relative pb-16 z-10">
        {/* ユーザーメニュー（右上） */}
        <UserProfileButton />
        <div className="h-full p-2 md:p-4">
          <div className="h-full bg-white rounded-lg md:rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-200 relative">
            {/* マップ装飾 - 四隅 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-lg z-[1500] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-lg z-[1500] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-lg z-[1500] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-lg z-[1500] pointer-events-none"></div>

            <MapView />
          </div>
        </div>
      </main>

      {/* ナビゲーションバー */}
      <NavigationBar />
    </div>
  );
}
