import { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import SearchClient from "./SearchClient";
import type { Shop } from "../map/data/shops";
import { fetchShopsFromDb } from "../map/services/shopDb";

export const metadata: Metadata = {
  title: "店舗検索 | nicchyo",
  description: "日曜市の300店舗から、お店の名前・商品・カテゴリーで検索できます。",
};

async function loadShops(): Promise<Shop[]> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    return await fetchShopsFromDb(supabase);
  } catch {
    return [];
  }
}

export default async function SearchPage() {
  const shops = await loadShops();
  return <SearchClient shops={shops} />;
}
