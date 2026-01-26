import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
// import MapPageClient from "../(public)/map/MapPageClient"; // Removed MapPageClient import
import KotoduteClient from "./KotoduteClient"; // Import KotoduteClient
import { shops as staticShops } from "../(public)/map/data/shops";
import type { Shop } from "../(public)/map/data/shops";

export const metadata: Metadata = {
  title: "ことづて | nicchyo",
  description: "日曜市のことづて投稿・閲覧ページ。",
};

type ShopRow = {
  id: string | null;
  legacy_id: number | null;
  name: string | null;
  owner_name: string | null;
  side: "north" | "south" | null;
  position: number | null;
  lat: number | null;
  lng: number | null;
  chome: string | null;
  category: string | null;
  products: string[] | null;
  description: string | null;
  specialty_dish: string | null;
  about_vendor: string | null;
  stall_style: string | null;
  icon: string | null;
  schedule: string | null;
  message: string | null;
  topic: string[] | null;
};

const CHOME_VALUES = new Set([
  "一丁目",
  "二丁目",
  "三丁目",
  "四丁目",
  "五丁目",
  "六丁目",
  "七丁目",
]);

function normalizeChome(value: string | null): Shop["chome"] {
  if (value && CHOME_VALUES.has(value)) {
    return value as Shop["chome"];
  }
  return undefined;
}

export default async function KotodutePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // We can keep data fetching if KotoduteClient needs it, or simplify if KotoduteClient handles it differently.
  // KotoduteClient (from my read) uses "loadKotodute" from local storage or expects props?
  // Let's check KotoduteClient again. It uses `loadKotodute` and `shops` (static import).
  // It does NOT seem to take `shops` as props in the file I edited.
  // So I can remove the complex data fetching here OR pass it if I update KotoduteClient to take it.
  // For now, I will just render KotoduteClient. The previous page was rendering MapPageClient!
  // This explains why my changes weren't showing up. The route /kotodute was serving the MAP page, not the Kotodute form page.
  // I must replace MapPageClient with KotoduteClient.

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
