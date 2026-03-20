"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";

type Category = { id: string; name: string };

const PRODUCT_OPTIONS = [
  "野菜・果物", "海産物・魚介", "肉・加工品", "米・穀物",
  "惣菜・弁当", "パン・菓子", "飲料・お茶", "植物・花",
  "工芸品・雑貨", "その他",
];

export default function ApplyPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    shop_name: "",
    owner_name: "",
    email: "",
    phone: "",
    category_id: "",
    main_products: [] as string[],
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    createClient()
      .from("categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  const toggleProduct = (p: string) => {
    setForm((prev) => ({
      ...prev,
      main_products: prev.main_products.includes(p)
        ? prev.main_products.filter((x) => x !== p)
        : [...prev.main_products, p],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.shop_name.trim()) e.shop_name = "店舗名は必須です";
    if (!form.owner_name.trim()) e.owner_name = "お名前は必須です";
    if (!form.email.trim()) e.email = "メールアドレスは必須です";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "正しいメールアドレスを入力してください";
    if (form.main_products.length === 0) e.main_products = "1つ以上選択してください";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category_id: form.category_id || null,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setErrors({ _: body.error ?? "送信に失敗しました。もう一度お試しください。" });
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-md">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
          <h1 className="text-2xl font-bold text-slate-800">申請を受け付けました</h1>
          <p className="mt-3 text-sm text-slate-500">
            ご申請ありがとうございます。内容を確認後、ご登録のメールアドレスにご連絡します。
            審査には数日かかる場合があります。
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-slate-700 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            トップページへ戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">出店申請</h1>
          <p className="mt-2 text-sm text-slate-500">
            にっちょマーケットへの出店をご希望の方はこちらからお申し込みください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-md">

          {errors._ && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{errors._}</div>
          )}

          {/* 店舗名 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.shop_name}
              onChange={(e) => setForm((p) => ({ ...p, shop_name: e.target.value }))}
              placeholder="例: 高知野菜の鈴木"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            {errors.shop_name && <p className="mt-1 text-xs text-red-500">{errors.shop_name}</p>}
          </div>

          {/* 代表者名 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              代表者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.owner_name}
              onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))}
              placeholder="例: 鈴木 太郎"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            {errors.owner_name && <p className="mt-1 text-xs text-red-500">{errors.owner_name}</p>}
          </div>

          {/* メールアドレス */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="example@email.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* 電話番号 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">電話番号</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="090-0000-0000"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">カテゴリ</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">選択してください（任意）</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 主な販売品目 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              主な販売品目 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProduct(p)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    form.main_products.includes(p)
                      ? "bg-green-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.main_products && <p className="mt-1 text-xs text-red-500">{errors.main_products}</p>}
          </div>

          {/* 申請理由 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              申請理由・意気込み
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="出店の目的や意気込みをお書きください（任意）"
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none resize-none"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{form.message.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            申請を送信する
          </button>
        </form>
      </div>
    </div>
  );
}
