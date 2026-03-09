import type { Post, Store } from "../_types";

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
