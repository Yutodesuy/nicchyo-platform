// app/(public)/map/page.tsx
import { Metadata } from "next";
import MapPageClient from "./MapPageClient";

export const metadata: Metadata = {
  title: "nicchyo日曜市マップ | 高知市日曜市",
  description:
    "高知市日曜市のインタラクティブマップ。出店位置を確認して、お気に入りのお店を見つけよう。",
};

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-slate-800 text-white px-4 py-3 shadow-md z-10">
        <h1 className="text-lg font-semibold tracking-wide text-center">
          nicchyo日曜市マップ
        </h1>
      </header>

      {/* マップエリア（クライアント側で地図＋バナー制御） */}
      <main className="flex-1 relative">
        <MapPageClient />
      </main>
    </div>
  );
}
