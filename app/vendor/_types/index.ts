export type ExpirationPreset = "1h" | "today" | "custom";

export type PostStatus = "active" | "expired" | "scheduled";

export type Post = {
  id: string;
  vendor_id: string;
  text: string;
  image_url?: string;
  created_at: string;
  expiration_time: string;
  status: PostStatus;
};

export type PaymentMethod = "cash" | "card" | "paypay" | "ic";

export type RainPolicy = "outdoor" | "tent" | "cancel" | "undecided";

export type Store = {
  id: string;
  vendor_id: string;
  name: string;
  owner_name?: string;
  category_id: string;
  style: string;
  style_tags: string[];
  main_products: string[];
  main_product_prices: Record<string, number | null>;
  payment_methods: PaymentMethod[];
  rain_policy: RainPolicy;
  schedule: string[];
};

export type VendorAnalytics = {
  thisWeek: { views: number; clicks: number; searchImpressions: number };
  lastWeek: { views: number; clicks: number; searchImpressions: number };
  rank: number;
  totalVendors: number;
};

export type ProductSale = {
  id: string;
  vendor_id: string;
  product_name: string;
  quantity: number;
  date: string;
};

export type HourlyData = {
  hour: string;
  views: number;
};

export type MarketTrend = {
  rank: number;
  product_name: string;
  total_quantity: number;
  vendor_count: number;
};
