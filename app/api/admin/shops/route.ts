import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AdminShop = {
  id: string;
  name: string;
  category: string;
  owner: string;
  email: string;
  status: "active" | "suspended";
  registeredDate: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isAdminRole(role: string | null) {
  return role === "super_admin" || role === "admin";
}

function getRole(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const record = user as {
    app_metadata?: { role?: string };
    user_metadata?: { role?: string };
  };
  return record.app_metadata?.role ?? record.user_metadata?.role ?? null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminRole(getRole(user))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // vendors + categories を取得
    const { data: vendorsData, error: vendorsError } = await serviceClient
      .from("vendors")
      .select("id, shop_name, owner_name, created_at, categories(name)");

    if (vendorsError) {
      return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }

    const vendors = Array.isArray(vendorsData) ? vendorsData : [];

    // 全 auth ユーザーを取得（banned_until でsuspended判定）
    const allAuthUsers: Array<{
      id: string;
      email?: string;
      created_at?: string;
      banned_until?: string | null;
    }> = [];

    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
      if (error) break;
      const pageUsers = (data.users ?? []) as typeof allAuthUsers;
      allAuthUsers.push(...pageUsers);
      if (pageUsers.length < perPage) break;
      page += 1;
    }

    const authById = new Map(allAuthUsers.map((u) => [u.id, u]));

    const shops: AdminShop[] = vendors.map((vendor) => {
      const authUser = authById.get(vendor.id);
      const bannedUntil = authUser?.banned_until ? new Date(authUser.banned_until) : null;
      const isSuspended =
        bannedUntil !== null && !Number.isNaN(bannedUntil.getTime()) && bannedUntil > new Date();

      const categoryName =
        vendor.categories && typeof vendor.categories === "object" && !Array.isArray(vendor.categories)
          ? (vendor.categories as { name: string | null }).name ?? "未分類"
          : Array.isArray(vendor.categories) && vendor.categories.length > 0
          ? (vendor.categories[0] as { name: string | null }).name ?? "未分類"
          : "未分類";

      return {
        id: vendor.id,
        name: vendor.shop_name ?? "名称未設定",
        category: categoryName,
        owner: vendor.owner_name ?? authUser?.email?.split("@")[0] ?? "-",
        email: authUser?.email ?? "-",
        status: isSuspended ? "suspended" : "active",
        registeredDate: formatDate(authUser?.created_at ?? vendor.created_at),
      };
    });

    return NextResponse.json({ shops });
  } catch {
    return NextResponse.json({ error: "Failed to load shops" }, { status: 500 });
  }
}
