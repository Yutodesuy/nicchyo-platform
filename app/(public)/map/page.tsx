import { Metadata } from 'next';
import { Suspense } from 'react';
import MapPageClient from './MapPageClient';

export const metadata: Metadata = {
  title: "nicchyo マップ | 高知・日曜市",
  description: "高知・日曜市を歩いて楽しむためのマップ。おすすめ、出店情報、食材からレシピへの導線まで。",
};

export default function MapPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">読み込み中...</div>}>
      <MapPageClient />
    </Suspense>
  );
}
