import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'nicchyo日曜市マップ | 高知市日曜市',
  description:
    '高知市日曜市のインタラクティブマップ。出店位置を確認して、お気に入りのお店を見つけよう。',
};

// ★ ここがポイント：MapView を ssr: false で読み込む
const MapView = dynamic(() => import('./components/MapView'), {
  ssr: false,
});

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-slate-800 text-white px-4 py-3 shadow-md z-10">
        <h1 className="text-lg font-semibold tracking-wide text-center">
          nicchyo日曜市マップ
        </h1>
      </header>

      {/* マップエリア */}
      <main className="flex-1 relative">
        <MapView />
      </main>
    </div>
  );
}
