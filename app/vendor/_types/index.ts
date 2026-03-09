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
  main_products: string[];
  payment_methods: PaymentMethod[];
  rain_policy: RainPolicy;
  schedule: string[];
};
