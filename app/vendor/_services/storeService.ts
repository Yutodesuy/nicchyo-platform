import { createClient } from "@/utils/supabase/client";
import type { Store, PaymentMethod, RainPolicy } from "../_types";

export type Category = { id: string; name: string };

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data } = await supabase.from("categories").select("id, name").order("name");
  return (data as Category[]) ?? [];
}

export async function fetchVendorStore(vendorId: string): Promise<Store | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, shop_name, category_id, style, style_tags, main_products, main_product_prices, payment_methods, rain_policy, schedule")
    .eq("id", vendorId)
    .single();

  if (error || !data) return null;

  let mainProducts = (data.main_products as string[]) ?? [];

  // main_products が未設定の場合は products テーブルからフォールバック取得
  if (mainProducts.length === 0) {
    const { data: productsData } = await supabase
      .from("products")
      .select("name")
      .eq("vendor_id", vendorId);
    if (productsData && productsData.length > 0) {
      mainProducts = productsData.map((p: { name: string }) => p.name).filter(Boolean);
    }
  }

  return {
    id: data.id,
    vendor_id: data.id,
    name: data.shop_name ?? "",
    category_id: (data.category_id as string) ?? "",
    style: (data.style as string) ?? "",
    style_tags: (data.style_tags as string[]) ?? [],
    main_products: mainProducts,
    main_product_prices: (data.main_product_prices as Record<string, number | null>) ?? {},
    payment_methods: ((data.payment_methods as string[]) ?? []) as PaymentMethod[],
    rain_policy: ((data.rain_policy as string) ?? "undecided") as RainPolicy,
    schedule: (data.schedule as string[]) ?? [],
  };
}

export async function saveVendorStore(
  vendorId: string,
  store: Omit<Store, "id" | "vendor_id">
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      shop_name: store.name,
      category_id: store.category_id || null,
      style: store.style,
      style_tags: store.style_tags,
      main_products: store.main_products,
      main_product_prices: store.main_product_prices,
      payment_methods: store.payment_methods,
      rain_policy: store.rain_policy,
      schedule: store.schedule,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId);

  if (error) throw error;
}
