import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { requireSameOrigin } from "@/lib/security/requestGuards";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRole(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const r = user as { app_metadata?: { role?: string }; user_metadata?: { role?: string } };
  return r.app_metadata?.role ?? r.user_metadata?.role ?? null;
}
function canModerate(role: string | null) {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: Request) {
  const originCheck = requireSameOrigin(req);
  if (!originCheck.ok) return originCheck.response;

  const rateLimited = enforceRateLimit(req, {
    bucket: "admin-kotodute-bulk-post",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimited) return rateLimited;

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !canModerate(getRole(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { ids: string[]; status: string };
  const allowed = ["published", "hidden", "deleted"];
  if (!Array.isArray(body.ids) || body.ids.length === 0 || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const dc = createAdminClient() ?? supabase;
  const { error } = await dc.from("kotodutes").update({ status: body.status }).in("id", body.ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: body.ids.length });
}
