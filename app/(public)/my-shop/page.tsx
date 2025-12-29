"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import NavigationBar from "@/app/components/NavigationBar";
import { applyShopEdits, saveShopEdits, SHOP_EDITS_UPDATED_EVENT } from "@/lib/shopEdits";
import { shops as baseShops } from "../map/data/shops";
import type { ShopEditableData } from "../map/types/shopData";

type FormState = {
  name: string;
  ownerName: string;
  category: string;
  icon: string;
  stallStyle: string;
  schedule: string;
  productsText: string;
  description: string;
  specialtyDish: string;
  aboutVendor: string;
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

const CATEGORY_ICONS: Record<string, string[]> = {
  "食材": ["🥬", "🥕", "🍅"],
  "食べ物": ["🍙", "🍡", "🍠"],
  "道具・工具": ["🔪", "🧰", "🪚"],
  "生活雑貨": ["🧺", "🧼", "🧻"],
  "植物・苗": ["🪴", "🌱", "🌼"],
  "アクセサリー": ["💍", "🧵", "🎀"],
  "手作り・工芸": ["🧶", "🎨", "🧵"],
};

const REQUIRED_FIELDS: (keyof FormState)[] = [
  "name",
  "ownerName",
  "category",
  "icon",
  "productsText",
  "description",
  "schedule",
];

const EMPTY_FORM: FormState = {
  name: "",
  ownerName: "",
  category: "",
  icon: "",
  stallStyle: "",
  schedule: "",
  productsText: "",
  description: "",
  specialtyDish: "",
  aboutVendor: "",
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

export default function MyShopPage() {
  const { user, permissions } = useAuth();
  const vendorId = user?.vendorId ?? null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [initialized, setInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [editsVersion, setEditsVersion] = useState(0);

  const iconOptions = useMemo(() => {
    if (!form.category) return [];
    return CATEGORY_ICONS[form.category] ?? [];
  }, [form.category]);

  const vendorShop = useMemo(() => {
    if (!vendorId) return null;
    const merged = applyShopEdits(baseShops);
    return merged.find((shop) => shop.id === vendorId) ?? null;
  }, [vendorId, editsVersion]);

  useEffect(() => {
    if (!vendorShop || initialized) return;
    setForm({
      name: vendorShop.name ?? "",
      ownerName: vendorShop.ownerName ?? "",
      category: vendorShop.category ?? "",
      icon: vendorShop.icon ?? "",
      stallStyle: vendorShop.stallStyle ?? "",
      schedule: vendorShop.schedule ?? "",
      productsText: vendorShop.products?.join(", ") ?? "",
      description: vendorShop.description ?? "",
      specialtyDish: vendorShop.specialtyDish ?? "",
      aboutVendor: vendorShop.aboutVendor ?? "",
      message: vendorShop.message ?? "",
      imageMain: vendorShop.images?.main ?? "",
      imageThumb: vendorShop.images?.thumbnail ?? "",
      imageAdditional: vendorShop.images?.additional?.join(", ") ?? "",
      instagram: vendorShop.socialLinks?.instagram ?? "",
      facebook: vendorShop.socialLinks?.facebook ?? "",
      twitter: vendorShop.socialLinks?.twitter ?? "",
      website: vendorShop.socialLinks?.website ?? "",
    });
    setInitialized(true);
  }, [vendorShop, initialized]);

  useEffect(() => {
    const handleEditsUpdate = () => {
      setEditsVersion((prev) => prev + 1);
    };
    window.addEventListener(SHOP_EDITS_UPDATED_EVENT, handleEditsUpdate);
    return () => window.removeEventListener(SHOP_EDITS_UPDATED_EVENT, handleEditsUpdate);
  }, []);

  useEffect(() => {
    if (!form.category) {
      setForm((prev) => ({ ...prev, icon: "" }));
      return;
    }
    if (form.icon && !iconOptions.includes(form.icon)) {
      setForm((prev) => ({ ...prev, icon: "" }));
    }
  }, [form.category, form.icon, iconOptions]);

  const handleChange =
    (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
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
    if (Object.keys(nextErrors).length > 0) {
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
      icon: form.icon.trim(),
      products: splitCsv(form.productsText),
      description: form.description.trim(),
      specialtyDish: form.specialtyDish.trim() || undefined,
      aboutVendor: form.aboutVendor.trim() || undefined,
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
        <div className="mb-4 rounded-3xl border border-orange-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            マイ店舗
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            出店情報の入力
          </h1>
          <p className="mt-2 text-sm text-slate-600">
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
              <label className="block text-sm text-slate-700">
                アイコン{requiredMark}
                <select
                  value={form.icon}
                  onChange={handleChange("icon")}
                  className={fieldClass("icon")}
                  aria-invalid={!!errors.icon}
                  required
                  disabled={!form.category}
                >
                  <option value="">
                    {form.category ? "選択してください" : "カテゴリーを選択してください"}
                  </option>
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                {errors.icon && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.icon}
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
            <div className="mt-3 space-y-3">
              <label className="block text-sm text-slate-700">
                取扱商品{requiredMark}
                <textarea
                  value={form.productsText}
                  onChange={handleChange("productsText")}
                  placeholder="例: トマト, きゅうり, 大根"
                  rows={2}
                  className={fieldClass("productsText")}
                  aria-invalid={!!errors.productsText}
                  required
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  カンマ区切りで入力してください。
                </span>
                {errors.productsText && (
                  <span className="mt-1 block text-[11px] text-rose-600">
                    {errors.productsText}
                  </span>
                )}
              </label>
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
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  得意料理
                  <input
                    type="text"
                    value={form.specialtyDish}
                    onChange={handleChange("specialtyDish")}
                    placeholder="例: かつおのたたき"
                    className={fieldClass("specialtyDish")}
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  出店者のこだわり
                  <input
                    type="text"
                    value={form.aboutVendor}
                    onChange={handleChange("aboutVendor")}
                    placeholder="例: 無農薬にこだわっています"
                    className={fieldClass("aboutVendor")}
                  />
                </label>
              </div>
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
