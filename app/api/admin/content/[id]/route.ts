import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRole(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const r = user as { app_metadata?: { role?: string }; user_metadata?: { role?: string } };
  return r.app_metadata?.role ?? r.user_metadata?.role ?? null;
}
function isAdminRole(role: string | null) {
  return role === "super_admin" || role === "admin";
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminRole(getRole(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dc = createAdminClient() ?? supabase;
  const { error } = await dc.from("vendor_contents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
