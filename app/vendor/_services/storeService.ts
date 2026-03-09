import { createClient } from "@/utils/supabase/client";
import type { Store, PaymentMethod, RainPolicy } from "../_types";

export async function fetchVendorStore(vendorId: string): Promise<Store | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, shop_name, style, main_products, payment_methods, rain_policy, schedule")
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
    style: (data.style as string) ?? "",
    main_products: mainProducts,
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
      style: store.style,
      main_products: store.main_products,
      payment_methods: store.payment_methods,
      rain_policy: store.rain_policy,
      schedule: store.schedule,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId);

  if (error) throw error;
}
