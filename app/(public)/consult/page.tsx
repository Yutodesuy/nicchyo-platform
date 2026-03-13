import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import ConsultClient from "./ConsultClient";
import type { Shop } from "../map/data/shops";
import { fetchShopsFromDb } from "../map/services/shopDb";

async function loadShops(): Promise<Shop[]> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    return await fetchShopsFromDb(supabase);
  } catch {
    return [];
  }
}

export default async function ConsultPage() {
  const shops = await loadShops();
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--consult-bg)]" />}>
      <ConsultClient shops={shops} />
    </Suspense>
  );
}
