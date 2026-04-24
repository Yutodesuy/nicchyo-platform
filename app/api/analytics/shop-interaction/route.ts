import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createServiceClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      visitor_key?: string;
      shop_id: string;
      event_type: string;
      meta?: Record<string, unknown>;
    } | null;

    if (!body || typeof body.shop_id !== "string" || typeof body.event_type !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await serviceClient.from("shop_interactions" as any).insert({
      visitor_key: body.visitor_key ?? null,
      shop_id: body.shop_id,
      event_type: body.event_type,
      meta: body.meta ?? null,
      ip_address: ip,
    });

    if (error) {
      console.error("[shop-interaction] insert error:", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[shop-interaction] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
