import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type ApplyBody = {
  shop_name: string;
  owner_name: string;
  email: string;
  phone?: string;
  category_id?: string | null;
  main_products: string[];
  message?: string;
};

export async function POST(req: Request) {
  const body = await req.json() as ApplyBody;

  if (!body.shop_name?.trim() || !body.owner_name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  if (!Array.isArray(body.main_products) || body.main_products.length === 0) {
    return NextResponse.json({ error: "販売品目を1つ以上選択してください" }, { status: 400 });
  }

  const dc = createAdminClient();
  if (!dc) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error } = await dc.from("vendor_applications").insert({
    shop_name: body.shop_name.trim(),
    owner_name: body.owner_name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone?.trim() || null,
    category_id: body.category_id || null,
    main_products: body.main_products,
    message: body.message?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
