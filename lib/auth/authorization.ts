import type { User as SupabaseUser } from "@supabase/supabase-js";

import type { User, UserRole } from "./types";

const SHOP_CODE_PATH_PATTERN = /^\/shops(\d{3})$/;

export function normalizeRole(value?: string | null): UserRole {
  if (value === "super_admin") return "super_admin";
  if (value === "moderator") return "moderator";
  if (value === "vendor") return "vendor";
  return "general_user";
}

export function getVendorId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function mapSupabaseUser(user: SupabaseUser): User {
  const appMeta = user.app_metadata as { role?: string } | undefined;
  const userMeta = user.user_metadata as {
    role?: string;
    vendorId?: unknown;
    name?: string;
    full_name?: string;
    avatarUrl?: string;
    avatar_url?: string;
  } | undefined;

  const role = normalizeRole(appMeta?.role ?? userMeta?.role);
  const vendorId = getVendorId(userMeta?.vendorId);
  const name = userMeta?.name ?? userMeta?.full_name ?? (user.email ? user.email.split("@")[0] : "user");
  const avatarUrl = userMeta?.avatarUrl ?? userMeta?.avatar_url;

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    avatarUrl,
    role,
    vendorId,
  };
}

export function canAccessVendorShop(user: Pick<User, "role" | "vendorId"> | null, shopId: number): boolean {
  return user?.role === "vendor" && user.vendorId === shopId;
}

export function getShopCodeFromPathname(pathname: string): string | null {
  const compactMatch = pathname.match(SHOP_CODE_PATH_PATTERN);
  if (compactMatch) {
    return compactMatch[1];
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "shops" && /^\d{3}$/.test(parts[1])) {
    return parts[1];
  }

  return null;
}

