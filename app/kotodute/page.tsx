import { Suspense } from "react";
import KotoduteClient from "./KotoduteClient";

export const metadata = {
  title: "ことづて | nicchyo",
  description: "日曜市のことづて投稿・閲覧ページ。#店番号でお店宛、#allで全体宛に投稿できます。",
};

export default function KotodutePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-700">?????...</div>}>
      <KotoduteClient />
    </Suspense>
  );
}
