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
function isAdmin(role: string | null) {
  return role === "super_admin" || role === "admin";
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type AuditLogPayload = {
  action: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  details?: string;
};

export async function POST(req: Request) {
  const originCheck = requireSameOrigin(req);
  if (!originCheck.ok) return originCheck.response;

  const rateLimited = enforceRateLimit(req, {
    bucket: "admin-audit-logs-post",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimited) return rateLimited;

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const role = getRole(user);
  const canLog = role === "super_admin" || role === "admin" || role === "moderator";
  if (!user || !canLog) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as AuditLogPayload;
  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  const dc = createAdminClient();
  if (!dc) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error } = await dc.from("admin_audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    actor_role: role,
    action: body.action,
    target_type: body.target_type ?? null,
    target_id: body.target_id ?? null,
    target_name: body.target_name ?? null,
    details: body.details ?? null,
    ip_address: ip,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(getRole(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsedLimit = parseInt(url.searchParams.get("limit") ?? "500", 10);
  const limit = Math.min(Number.isNaN(parsedLimit) ? 500 : parsedLimit, 1000);

  const dc = createAdminClient() ?? supabase;
  const { data, error } = await dc
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
