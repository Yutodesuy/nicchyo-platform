import type { Metadata } from "next";
import { Suspense } from "react";
import KotoduteClient from "./KotoduteClient";

export const metadata: Metadata = {
  title: "ことづて | nicchyo",
  description: "日曜市のことづて投稿・閲覧ページ。",
};

export default async function KotodutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">Loading...</div>
      }
    >
      <KotoduteClient />
    </Suspense>
  );
}
