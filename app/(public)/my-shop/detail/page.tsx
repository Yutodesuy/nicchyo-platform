"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import NavigationBar from "@/app/components/NavigationBar";
import { applyShopEdits, saveShopEdits, SHOP_EDITS_UPDATED_EVENT } from "@/lib/shopEdits";
import type { ShopEditableData } from "../../map/types/shopData";
import { useShops } from "@/lib/hooks/useShops";

type SeasonKey = "spring_summer" | "summer_autumn" | "autumn_winter" | "winter_spring";

type ProductItem = {
  name: string;
  imageUrl?: string;
  seasons: SeasonKey[];
};

type FormState = {
  name: string;
  ownerName: string;
  category: string;
  stallStyle: string;
  schedule: string;
  description: string;
  message: string;
  imageMain: string;
  imageThumb: string;
  imageAdditional: string;
  instagram: string;
  facebook: string;
  twitter: string;
  website: string;
};

const CATEGORIES = [
  "食材",
  "食べ物",
  "道具・工具",
  "生活雑貨",
  "植物・苗",
  "アクセサリー",
  "手作り・工芸",
];

const SEASON_OPTIONS: { key: SeasonKey; label: string }[] = [
  { key: "spring_summer", label: "春ー夏" },
  { key: "summer_autumn", label: "夏ー秋" },
  { key: "autumn_winter", label: "秋ー冬" },
  { key: "winter_spring", label: "冬ー春" },
];

const REQUIRED_FIELDS: (keyof FormState)[] = [
  "name",
  "ownerName",
  "category",
  "description",
  "schedule",
];

const EMPTY_FORM: FormState = {
  name: "",
  ownerName: "",
  category: "",
  stallStyle: "",
  schedule: "",
  description: "",
  message: "",
  imageMain: "",
  imageThumb: "",
  imageAdditional: "",
  instagram: "",
  facebook: "",
  twitter: "",
  website: "",
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeProductSeasons(products: ProductItem[], key: SeasonKey): string[] {
  return products
    .filter((product) => product.seasons.includes(key))
    .map((product) => product.name);
}

export default function MyShopDetailPage() {
  const { user, permissions } = useAuth();
  const { shops } = useShops();
  const vendorId = user?.vendorId ?? null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [productError, setProductError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [editsVersion, setEditsVersion] = useState(0);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productName, setProductName] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productSeasons, setProductSeasons] = useState<Set<SeasonKey>>(new Set());
  const [showProductOptions, setShowProductOptions] = useState(false);

  const vendorShop = useMemo(() => {
    if (!vendorId) return null;
    const merged = applyShopEdits(shops);
    return merged.find((shop) => shop.id === vendorId) ?? null;
  }, [vendorId, editsVersion, shops]);

  useEffect(() => {
    if (!vendorShop || initialized) return;
    setForm({
      name: vendorShop.name ?? "",
      ownerName: vendorShop.ownerName ?? "",
      category: vendorShop.category ?? "",
      stallStyle: vendorShop.stallStyle ?? "",
      schedule: vendorShop.schedule ?? "",
      description: vendorShop.description ?? "",
      message: vendorShop.message ?? "",
      imageMain: vendorShop.images?.main ?? "",
      imageThumb: vendorShop.images?.thumbnail ?? "",
      imageAdditional: vendorShop.images?.additional?.join(", ") ?? "",
      instagram: vendorShop.socialLinks?.instagram ?? "",
      facebook: vendorShop.socialLinks?.facebook ?? "",
      twitter: vendorShop.socialLinks?.twitter ?? "",
      website: vendorShop.socialLinks?.website ?? "",
    });

    const initialProducts: ProductItem[] =
      vendorShop.productDetails?.length
        ? vendorShop.productDetails.map((item) => ({
            name: item.name,
            imageUrl: item.imageUrl,
            seasons: item.seasons ?? [],
          }))
        : (vendorShop.products ?? []).map((name) => {
            const seasons: SeasonKey[] = [];
            if (vendorShop.seasonalProductsSpringSummer?.includes(name)) {
              seasons.push("spring_summer");
            }
            if (vendorShop.seasonalProductsSummerAutumn?.includes(name)) {
              seasons.push("summer_autumn");
            }
            if (vendorShop.seasonalProductsAutumnWinter?.includes(name)) {
              seasons.push("autumn_winter");
            }
            if (vendorShop.seasonalProductsWinterSpring?.includes(name)) {
              seasons.push("winter_spring");
            }
            return { name, seasons };
          });

    setProducts(initialProducts);
    setInitialized(true);
  }, [vendorShop, initialized]);

  useEffect(() => {
    const handleEditsUpdate = () => {
      setEditsVersion((prev) => prev + 1);
    };
    window.addEventListener(SHOP_EDITS_UPDATED_EVENT, handleEditsUpdate);
    return () => window.removeEventListener(SHOP_EDITS_UPDATED_EVENT, handleEditsUpdate);
  }, []);

  const handleChange =
    (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  const handleProductRegister = () => {
    setProductError("");
    const trimmed = productName.trim();
    if (!trimmed) {
      setProductError("商品名を入力してください。");
      return;
    }
    setShowProductOptions(true);
  };

  const toggleSeason = (key: SeasonKey) => {
    setProductSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleProductConfirm = () => {
    const trimmed = productName.trim();
    if (!trimmed) {
      setProductError("商品名を入力してください。");
      return;
    }
    const nextItem: ProductItem = {
      name: trimmed,
      imageUrl: productImageUrl.trim() || undefined,
      seasons: Array.from(productSeasons),
    };
    setProducts((prev) => [...prev, nextItem]);
    setProductName("");
    setProductImageUrl("");
    setProductSeasons(new Set());
    setShowProductOptions(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    REQUIRED_FIELDS.forEach((key) => {
      if (!form[key].trim()) {
        nextErrors[key] = "必須項目です。";
      }
    });
    if (products.length === 0) {
      setProductError("商品を1つ以上登録してください。");
    }
    if (Object.keys(nextErrors).length > 0 || products.length === 0) {
      setErrors(nextErrors);
      return;
    }

    if (!vendorId || !permissions.isVendor) {
      setStatusMessage("出店者としてログインしてください。");
      return;
    }

    const edits: Partial<ShopEditableData> = {
      name: form.name.trim(),
      ownerName: form.ownerName.trim(),
      category: form.category.trim(),
      products: products.map((product) => product.name),
      seasonalProductsSpringSummer: mergeProductSeasons(products, "spring_summer"),
      seasonalProductsSummerAutumn: mergeProductSeasons(products, "summer_autumn"),
      seasonalProductsAutumnWinter: mergeProductSeasons(products, "autumn_winter"),
      seasonalProductsWinterSpring: mergeProductSeasons(products, "winter_spring"),
      productDetails: products,
      description: form.description.trim(),
      stallStyle: form.stallStyle.trim() || undefined,
      schedule: form.schedule.trim(),
      message: form.message.trim() || undefined,
      images: {
        main: form.imageMain.trim() || undefined,
        thumbnail: form.imageThumb.trim() || undefined,
        additional: splitCsv(form.imageAdditional),
      },
      socialLinks: {
        instagram: form.instagram.trim() || undefined,
        facebook: form.facebook.trim() || undefined,
        twitter: form.twitter.trim() || undefined,
        website: form.website.trim() || undefined,
      },
      lastUpdated: Date.now(),
      updatedBy: user?.id,
    };

    saveShopEdits(vendorId, edits);
    setStatusMessage("更新内容をマップに反映しました。");
  };

  const requiredMark = (
    <span className="ml-1 text-[11px] font-semibold text-rose-600">*</span>
  );

  const fieldClass = (key: keyof FormState) =>
    `mt-1 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none ${
      errors[key]
        ? "border-rose-400 focus:border-rose-500"
        : "border-orange-200 focus:border-amber-400"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-24">
      <div className="mx-auto w-full max-w-4xl px-4 pt-6">
        <div className="mb-4 rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">
            My shop
          </p>
          <h1 className="mt-1 text-4xl font-bold text-slate-900">
            出店情報の入力
          </h1>
          <p className="mt-1 text-xl text-slate-600">
            入力内容は運営の確認後に反映されます。必須項目には * が付きます。
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <section className="rounded-3xl border border-orange-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-amber-700">基本情報</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                店舗名{requiredMark}
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="例: 旬の野菜やさん"
                  className={fieldClass("name")}
                  aria-invalid={!!errors.name}
                  required
                />
                {errors.name && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="block text-sm text-slate-700">
                店主名{requiredMark}
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={handleChange("ownerName")}
                  placeholder="例: 山田 花子"
                  className={fieldClass("ownerName")}
                  aria-invalid={!!errors.ownerName}
                  required
                />
                {errors.ownerName && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.ownerName}
                  </span>
                )}
              </label>
              <label className="block text-sm text-slate-700">
                カテゴリー{requiredMark}
                <select
                  value={form.category}
                  onChange={handleChange("category")}
                  className={fieldClass("category")}
                  aria-invalid={!!errors.category}
                  required
                >
                  <option value="">選択してください</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.category}
                  </span>
                )}
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-amber-700">出店情報</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                出店スタイル
                <input
                  type="text"
                  value={form.stallStyle}
                  onChange={handleChange("stallStyle")}
                  placeholder="例: テント出店 / ワゴン"
                  className={fieldClass("stallStyle")}
                />
              </label>
              <label className="block text-sm text-slate-700">
                出店予定・営業時間{requiredMark}
                <input
                  type="text"
                  value={form.schedule}
                  onChange={handleChange("schedule")}
                  placeholder="例: 毎週日曜 6:00-12:00"
                  className={fieldClass("schedule")}
                  aria-invalid={!!errors.schedule}
                  required
                />
                {errors.schedule && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.schedule}
                  </span>
                )}
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-amber-700">商品・紹介</h2>
            <div className="mt-3 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <label className="flex-1 text-sm text-slate-700">
                  商品名{requiredMark}
                  <input
                    type="text"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="例: トマト"
                    className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleProductRegister}
                  className="h-10 rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
                >
                  登録
                </button>
              </div>
              {productError && (
                <span className="block text-[11px] text-rose-600">{productError}</span>
              )}

              {showProductOptions && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    写真登録・季節の設定（スキップ可）
                  </p>
                  <div className="mt-3 space-y-3">
                    <label className="block text-sm text-slate-700">
                      写真URL
                      <input
                        type="url"
                        value={productImageUrl}
                        onChange={(event) => setProductImageUrl(event.target.value)}
                        placeholder="https://example.com/product.jpg"
                        className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                    <div>
                      <p className="text-sm text-slate-700">季節</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SEASON_OPTIONS.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => toggleSeason(option.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              productSeasons.has(option.key)
                                ? "border-amber-400 bg-amber-200 text-amber-900"
                                : "border-amber-200 bg-white text-amber-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleProductConfirm}
                      className="rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                    >
                      確定する
                    </button>
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">登録済みの商品</p>
                  <div className="mt-3 space-y-2">
                    {products.map((product, index) => (
                      <div
                        key={`${product.name}-${index}`}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{product.name}</span>
                          {product.imageUrl && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                              写真あり
                            </span>
                          )}
                          {product.seasons.map((season) => (
                            <span
                              key={`${product.name}-${season}`}
                              className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700"
                            >
                              {SEASON_OPTIONS.find((opt) => opt.key === season)?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="block text-sm text-slate-700">
                お店の説明{requiredMark}
                <textarea
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="例: 朝採れの野菜を中心に、季節の味をお届けします。"
                  rows={3}
                  className={fieldClass("description")}
                  aria-invalid={!!errors.description}
                  required
                />
                {errors.description && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.description}
                  </span>
                )}
              </label>
              <label className="block text-sm text-slate-700">
                メッセージ
                <textarea
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="例: いつでも気軽に声をかけてください。"
                  rows={2}
                  className={fieldClass("message")}
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-amber-700">写真</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                メイン画像URL
                <input
                  type="url"
                  value={form.imageMain}
                  onChange={handleChange("imageMain")}
                  placeholder="https://example.com/main.jpg"
                  className={fieldClass("imageMain")}
                />
              </label>
              <label className="block text-sm text-slate-700">
                サムネイルURL
                <input
                  type="url"
                  value={form.imageThumb}
                  onChange={handleChange("imageThumb")}
                  placeholder="https://example.com/thumb.jpg"
                  className={fieldClass("imageThumb")}
                />
              </label>
              <label className="block text-sm text-slate-700 md:col-span-2">
                追加画像URL
                <input
                  type="text"
                  value={form.imageAdditional}
                  onChange={handleChange("imageAdditional")}
                  placeholder="https://example.com/1.jpg, https://example.com/2.jpg"
                  className={fieldClass("imageAdditional")}
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  カンマ区切りで最大5枚まで。
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-amber-700">SNS・外部リンク</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                Instagram
                <input
                  type="url"
                  value={form.instagram}
                  onChange={handleChange("instagram")}
                  placeholder="https://instagram.com/..."
                  className={fieldClass("instagram")}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Facebook
                <input
                  type="url"
                  value={form.facebook}
                  onChange={handleChange("facebook")}
                  placeholder="https://facebook.com/..."
                  className={fieldClass("facebook")}
                />
              </label>
              <label className="block text-sm text-slate-700">
                X (Twitter)
                <input
                  type="url"
                  value={form.twitter}
                  onChange={handleChange("twitter")}
                  placeholder="https://x.com/..."
                  className={fieldClass("twitter")}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Webサイト
                <input
                  type="url"
                  value={form.website}
                  onChange={handleChange("website")}
                  placeholder="https://example.com"
                  className={fieldClass("website")}
                />
              </label>
            </div>
          </section>

          {statusMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {statusMessage}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              className="rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
            >
              下書き保存
            </button>
            <button
              type="submit"
              className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
            >
              送信する
            </button>
          </div>
        </form>
      </div>
      <NavigationBar />
    </div>
  );
}
