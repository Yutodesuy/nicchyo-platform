import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

function getAppRole(user: User): string | null {
  return (user.app_metadata as { role?: string } | undefined)?.role ?? null;
}

export function requireVendorRole(user: User): NextResponse | null {
  if (getAppRole(user) !== "vendor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
