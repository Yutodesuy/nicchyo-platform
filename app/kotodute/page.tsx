import { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import MapPageClient from "../(public)/map/MapPageClient";
import { shops as staticShops } from "../(public)/map/data/shops";
import type { Shop } from "../(public)/map/data/shops";

export const metadata: Metadata = {
  title: "ことづて | nicchyo",
  description: "日曜市のことづて投稿・閲覧ページ。",
};

type ShopRow = {
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

async function loadShops(): Promise<Shop[]> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from("shops")
      .select(
        [
          "legacy_id",
          "name",
          "owner_name",
          "side",
          "position",
          "lat",
          "lng",
          "chome",
          "category",
          "products",
          "description",
          "specialty_dish",
          "about_vendor",
          "stall_style",
          "icon",
          "schedule",
          "message",
        ].join(",")
      )
      .order("legacy_id", { ascending: true });

    if (error || !data) {
      return staticShops;
    }

    return (data as unknown as ShopRow[])
      .filter((row) => row.legacy_id !== null)
      .map((row) => ({
        id: row.legacy_id ?? 0,
        name: row.name ?? "",
        ownerName: row.owner_name ?? "",
        side: (row.side ?? "north") as "north" | "south",
        position: row.position ?? 0,
        lat: row.lat ?? 0,
        lng: row.lng ?? 0,
        chome: normalizeChome(row.chome),
        category: row.category ?? "",
        products: Array.isArray(row.products) ? row.products : [],
        description: row.description ?? "",
        specialtyDish: row.specialty_dish ?? undefined,
        aboutVendor: row.about_vendor ?? undefined,
        stallStyle: row.stall_style ?? undefined,
        icon: row.icon ?? "",
        schedule: row.schedule ?? "",
        message: row.message ?? undefined,
      }));
  } catch {
    return staticShops;
  }
}

export default async function KotodutePage() {
  const shops = await loadShops();
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">Loading...</div>
      }
    >
      <MapPageClient shops={shops} />
    </Suspense>
  );
}
