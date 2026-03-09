import type { Post, Store, VendorAnalytics, ProductSale, HourlyData, MarketTrend } from "../_types";

const now = new Date();

function hoursFromNow(h: number): string {
  const d = new Date(now.getTime() + h * 60 * 60 * 1000);
  return d.toISOString();
}

function daysAgo(d: number): string {
  const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

export const MOCK_POSTS: Post[] = [
  {
    id: "post-1",
    vendor_id: "vendor-1",
    text: "本日は朝採れのトマトが大量入荷！甘くて瑞々しい高知産ミニトマトを特別価格でご提供しています。ぜひお越しください🍅",
    image_url: "/images/shops/retasu.webp",
    created_at: now.toISOString(),
    expiration_time: hoursFromNow(5),
    status: "active",
  },
  {
    id: "post-2",
    vendor_id: "vendor-1",
    text: "残り少なくなってきました！手作りジャムの試食できます。数量限定なのでお早めに〜",
    created_at: hoursFromNow(-1),
    expiration_time: hoursFromNow(3),
    status: "active",
  },
  {
    id: "post-3",
    vendor_id: "vendor-1",
    text: "先週大好評だった山椒の実が再入荷しました！今シーズン最後の入荷になりますのでぜひ。",
    image_url: "/images/shops/seed.webp",
    created_at: daysAgo(7),
    expiration_time: daysAgo(6),
    status: "expired",
  },
  {
    id: "post-4",
    vendor_id: "vendor-1",
    text: "今週日曜日も出店します！天気が良ければ早めに開店予定です。",
    created_at: daysAgo(14),
    expiration_time: daysAgo(7),
    status: "expired",
  },
  {
    id: "post-5",
    vendor_id: "vendor-1",
    text: "本日は数量限定でかつおのたたきセット販売します！高知名物をぜひ！",
    image_url: "/images/shops/dish.webp",
    created_at: daysAgo(21),
    expiration_time: daysAgo(20),
    status: "expired",
  },
];

export const MOCK_STORE: Store = {
  id: "store-1",
  vendor_id: "vendor-1",
  name: "山田農園",
  style: "午前中心に出店",
  main_products: ["野菜", "果物", "手作りジャム"],
  payment_methods: ["cash", "paypay"],
  rain_policy: "tent",
  schedule: ["毎週日曜日", "第2・第4土曜日"],
};

export const MOCK_STATS = {
  activePosts: MOCK_POSTS.filter((p) => p.status === "active").length,
  todayViews: 42,
  totalPosts: MOCK_POSTS.length,
};

// ── アナリティクス ────────────────────────────────────────────

export const MOCK_ANALYTICS: VendorAnalytics = {
  thisWeek: { views: 312, clicks: 87, searchImpressions: 524 },
  lastWeek: { views: 278, clicks: 71, searchImpressions: 441 },
  rank: 3,
  totalVendors: 18,
};

export const MOCK_HOURLY: HourlyData[] = [
  { hour: "6時", views: 8 },
  { hour: "7時", views: 24 },
  { hour: "8時", views: 67 },
  { hour: "9時", views: 98 },
  { hour: "10時", views: 72 },
  { hour: "11時", views: 55 },
  { hour: "12時", views: 41 },
  { hour: "13時", views: 28 },
  { hour: "14時", views: 18 },
];

export const MOCK_PRODUCT_SALES: ProductSale[] = [
  { id: "ps-1", vendor_id: "vendor-1", product_name: "芋天", quantity: 40, date: new Date().toISOString() },
  { id: "ps-2", vendor_id: "vendor-1", product_name: "文旦", quantity: 25, date: new Date().toISOString() },
  { id: "ps-3", vendor_id: "vendor-1", product_name: "しょうが", quantity: 15, date: new Date().toISOString() },
  { id: "ps-4", vendor_id: "vendor-1", product_name: "手作りジャム", quantity: 12, date: new Date().toISOString() },
  { id: "ps-5", vendor_id: "vendor-1", product_name: "トマト", quantity: 8, date: new Date().toISOString() },
];

export const MOCK_MARKET_TRENDS: MarketTrend[] = [
  { rank: 1, product_name: "芋天", total_quantity: 210, vendor_count: 3 },
  { rank: 2, product_name: "文旦", total_quantity: 185, vendor_count: 5 },
  { rank: 3, product_name: "しょうが", total_quantity: 142, vendor_count: 4 },
  { rank: 4, product_name: "手作りジャム", total_quantity: 98, vendor_count: 6 },
  { rank: 5, product_name: "トマト", total_quantity: 76, vendor_count: 7 },
];
