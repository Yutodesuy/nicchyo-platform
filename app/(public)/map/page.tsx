import { Metadata } from "next";
import { Suspense } from "react";
import MapPageClient from "./MapPageClient";

export const metadata: Metadata = {
  title: "nicchyo 日曜市マップ | 高知市日曜市",
  description:
    "高知市日曜市のインタラクティブマップ。出店位置を確認して、お気に入りのお店を見つけよう。",
};

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-700">読み込み中...</div>}>
      <MapPageClient />
    </Suspense>
  );
}
