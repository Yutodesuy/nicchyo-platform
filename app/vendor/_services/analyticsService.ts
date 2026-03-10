import { createClient } from "@/utils/supabase/client";
import type { ProductSale, VendorAnalytics, HourlyData, MarketTrend } from "../_types";

// ─── ページビュー ───────────────────────────────────────────

export async function recordPageView(
  vendorId: string,
  source: "map" | "search" | "direct" = "direct"
): Promise<void> {
  const supabase = createClient();
  await supabase.from("shop_page_views").insert({ vendor_id: vendorId, source });
}

export async function fetchVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
  const supabase = createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [thisWeekRes, lastWeekRes, allVendorsRes] = await Promise.all([
    supabase
      .from("shop_page_views")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .gte("viewed_at", weekAgo),
    supabase
      .from("shop_page_views")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .gte("viewed_at", twoWeeksAgo)
      .lt("viewed_at", weekAgo),
    supabase
      .from("shop_page_views")
      .select("vendor_id")
      .gte("viewed_at", weekAgo),
  ]);

  const thisWeekViews = thisWeekRes.count ?? 0;
  const lastWeekViews = lastWeekRes.count ?? 0;

  // 注目度ランク算出
  const viewsByVendor = new Map<string, number>();
  for (const row of allVendorsRes.data ?? []) {
    viewsByVendor.set(row.vendor_id, (viewsByVendor.get(row.vendor_id) ?? 0) + 1);
  }
  const sorted = [...viewsByVendor.entries()].sort((a, b) => b[1] - a[1]);
  const rankIdx = sorted.findIndex(([id]) => id === vendorId);

  return {
    thisWeek: {
      views: thisWeekViews,
      clicks: Math.round(thisWeekViews * 0.28),
      searchImpressions: Math.round(thisWeekViews * 1.68),
    },
    lastWeek: {
      views: lastWeekViews,
      clicks: Math.round(lastWeekViews * 0.28),
      searchImpressions: Math.round(lastWeekViews * 1.68),
    },
    rank: rankIdx >= 0 ? rankIdx + 1 : sorted.length + 1,
    totalVendors: Math.max(viewsByVendor.size, 1),
  };
}

export async function fetchHourlyData(vendorId: string): Promise<HourlyData[]> {
  const supabase = createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("shop_page_views")
    .select("viewed_at")
    .eq("vendor_id", vendorId)
    .gte("viewed_at", weekAgo);

  const hourMap = new Map<number, number>();
  for (const row of data ?? []) {
    const h = new Date(row.viewed_at).getHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }

  return Array.from({ length: 9 }, (_, i) => {
    const h = i + 6;
    return { hour: `${h}時`, views: hourMap.get(h) ?? 0 };
  });
}

// ─── 商品販売 ───────────────────────────────────────────────

export async function fetchTodayProductSales(vendorId: string): Promise<ProductSale[]> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("product_sales")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("sale_date", today)
    .order("quantity", { ascending: false });
  return (data as ProductSale[]) ?? [];
}

export async function fetchAllProductSales(vendorId: string): Promise<ProductSale[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("product_sales")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("quantity", { ascending: false });
  return (data as ProductSale[]) ?? [];
}

export async function saveTodayProductSales(
  vendorId: string,
  sales: Pick<ProductSale, "product_name" | "quantity">[]
): Promise<void> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // 今日のレコードを削除して再挿入（upsert よりシンプル）
  await supabase
    .from("product_sales")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("sale_date", today);

  if (sales.length === 0) return;

  const { error } = await supabase.from("product_sales").insert(
    sales.map((s) => ({
      vendor_id: vendorId,
      product_name: s.product_name,
      quantity: s.quantity,
      sale_date: today,
    }))
  );
  if (error) throw error;
}

export async function fetchMarketTrends(): Promise<MarketTrend[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("product_sales")
    .select("product_name, quantity, vendor_id");

  if (!data) return [];

  const map = new Map<string, { total: number; vendors: Set<string> }>();
  for (const row of data) {
    const entry = map.get(row.product_name) ?? { total: 0, vendors: new Set<string>() };
    entry.total += row.quantity;
    entry.vendors.add(row.vendor_id);
    map.set(row.product_name, entry);
  }

  return [...map.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, { total, vendors }], i) => ({
      rank: i + 1,
      product_name: name,
      total_quantity: total,
      vendor_count: vendors.size,
    }));
}
