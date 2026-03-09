"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchVendorStore, saveVendorStore } from "../_services/storeService";
import type { PaymentMethod, RainPolicy, Store } from "../_types";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  X,
  Store as StoreIcon,
  CreditCard,
  CloudRain,
  CalendarDays,
  Loader2,
  Tent,
} from "lucide-react";

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; emoji: string }[] = [
  { key: "cash",   label: "現金",      emoji: "💴" },
  { key: "card",   label: "カード",    emoji: "💳" },
  { key: "paypay", label: "PayPay",   emoji: "📱" },
  { key: "ic",     label: "交通系IC", emoji: "🚃" },
];

const RAIN_OPTIONS: { key: RainPolicy; label: string; desc: string }[] = [
  { key: "outdoor",  label: "屋外（雨天決行）", desc: "雨でも通常通り出店" },
  { key: "tent",     label: "テント設置",       desc: "テントで対応" },
  { key: "cancel",   label: "雨天中止",         desc: "雨天時は出店しない" },
  { key: "undecided",label: "当日判断",          desc: "SNSで告知" },
];

const WEEKDAY_OPTIONS = [
  "毎週日曜日", "毎週土曜日",
  "第1日曜日", "第2日曜日", "第3日曜日", "第4日曜日",
  "第2・第4土曜日", "不定期",
];

const STYLE_PRESETS = [
  "午前中心に出店",
  "午後中心に出店",
  "終日出店",
  "雑談歓迎",
  "試食あり",
  "常設ブース",
];

const EMPTY_STORE: Store = {
  id: "", vendor_id: "",
  name: "", style: "", style_tags: [], main_products: [],
  payment_methods: [], rain_policy: "undecided", schedule: [],
};

function SectionHeader({ icon: Icon, title }: { icon: typeof StoreIcon; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <Icon size={14} />
      </div>
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
    </div>
  );
}

export default function VendorStorePage() {
  const { user } = useAuth();
  const [form, setForm]           = useState<Store>(EMPTY_STORE);
  const [newProduct, setNewProduct] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isSaved, setIsSaved]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchVendorStore(user.id)
      .then((store) => {
        if (store) setForm(store);
        else setForm({ ...EMPTY_STORE, id: user.id, vendor_id: user.id });
      })
      .catch(() => setError("データの読み込みに失敗しました"))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSaving || !user) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveVendorStore(user.id, {
        name: form.name,
        style: form.style,
        style_tags: form.style_tags,
        main_products: form.main_products,
        payment_methods: form.payment_methods,
        rain_policy: form.rain_policy,
        schedule: form.schedule,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  }

  function togglePayment(method: PaymentMethod) {
    setForm((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter((m) => m !== method)
        : [...prev.payment_methods, method],
    }));
  }

  function addProduct() {
    const trimmed = newProduct.trim();
    if (!trimmed || form.main_products.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, main_products: [...prev.main_products, trimmed] }));
    setNewProduct("");
  }

  function removeProduct(name: string) {
    setForm((prev) => ({ ...prev, main_products: prev.main_products.filter((p) => p !== name) }));
  }

  function addSchedule(value: string) {
    if (!value || form.schedule.includes(value)) return;
    setForm((prev) => ({ ...prev, schedule: [...prev.schedule, value] }));
    setNewSchedule("");
  }

  function removeSchedule(s: string) {
    setForm((prev) => ({ ...prev, schedule: prev.schedule.filter((x) => x !== s) }));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
        <Loader2 size={28} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/my-shop"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">Store Info</p>
            <h1 className="text-xl font-bold text-slate-900">店舗情報の編集</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* 店舗名 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={StoreIcon} title="店舗名" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="例：山田農園"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* 出店スタイル */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={Tent} title="出店スタイル" />
          {/* 選択済みタグ */}
          <div className="mb-3 flex flex-wrap gap-2">
            {form.style_tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                {tag}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, style_tags: prev.style_tags.filter((t) => t !== tag) }))}
                  className="text-amber-400 hover:text-amber-700"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {form.style_tags.length === 0 && (
              <span className="text-xs text-slate-400">タグを選択してください</span>
            )}
          </div>
          {/* プリセット選択肢 */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {STYLE_PRESETS.filter((p) => !form.style_tags.includes(p)).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, style_tags: [...prev.style_tags, preset] }))}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              >
                + {preset}
              </button>
            ))}
          </div>
          {/* 自由記述 */}
          <textarea
            value={form.style}
            onChange={(e) => setForm((prev) => ({ ...prev, style: e.target.value }))}
            placeholder="例：午前中心に出店。試食もご用意しています。（自由記述）"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>

        {/* 主な商品 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={StoreIcon} title="主な商品" />
          <div className="mb-3 flex flex-wrap gap-2">
            {form.main_products.map((p) => (
              <span key={p} className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                {p}
                <button type="button" onClick={() => removeProduct(p)} className="text-amber-400 hover:text-amber-700">
                  <X size={12} />
                </button>
              </span>
            ))}
            {form.main_products.length === 0 && (
              <span className="text-xs text-slate-400">商品を追加してください</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProduct(); } }}
              placeholder="商品名を入力..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button type="button" onClick={addProduct} className="flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-200">
              <Plus size={14} />追加
            </button>
          </div>
        </div>

        {/* 決済方法 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={CreditCard} title="決済方法" />
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const isSelected = form.payment_methods.includes(opt.key);
              return (
                <button key={opt.key} type="button" onClick={() => togglePayment(opt.key)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${isSelected ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-200"}`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  {opt.label}
                  {isSelected && <CheckCircle2 size={14} className="ml-auto text-amber-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 雨天時対応 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={CloudRain} title="雨天時対応" />
          <div className="space-y-2">
            {RAIN_OPTIONS.map((opt) => {
              const isSelected = form.rain_policy === opt.key;
              return (
                <button key={opt.key} type="button"
                  onClick={() => setForm((prev) => ({ ...prev, rain_policy: opt.key }))}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${isSelected ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50 hover:border-amber-200"}`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? "text-amber-800" : "text-slate-700"}`}>{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="flex-shrink-0 text-amber-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 出店予定日 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={CalendarDays} title="出店予定日" />
          <div className="mb-3 flex flex-wrap gap-2">
            {form.schedule.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                {s}
                <button type="button" onClick={() => removeSchedule(s)} className="text-sky-400 hover:text-sky-700">
                  <X size={12} />
                </button>
              </span>
            ))}
            {form.schedule.length === 0 && <span className="text-xs text-slate-400">出店日を追加してください</span>}
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {WEEKDAY_OPTIONS.filter((w) => !form.schedule.includes(w)).map((w) => (
              <button key={w} type="button" onClick={() => addSchedule(w)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                + {w}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={newSchedule}
              onChange={(e) => setNewSchedule(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSchedule(newSchedule.trim()); } }}
              placeholder="その他の日程を入力..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button type="button" onClick={() => addSchedule(newSchedule.trim())}
              className="flex items-center gap-1 rounded-xl bg-sky-100 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
            >
              <Plus size={14} />追加
            </button>
          </div>
        </div>

        {/* 保存ボタン */}
        <button type="submit" disabled={isSaving}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow transition ${
            isSaving ? "cursor-not-allowed bg-slate-200 text-slate-400"
            : isSaved  ? "bg-emerald-500 text-white"
            : "bg-amber-500 text-white hover:bg-amber-400"
          }`}
        >
          {isSaving ? <><Loader2 size={18} className="animate-spin" />保存中...</>
          : isSaved  ? <><CheckCircle2 size={18} />保存しました！</>
          : <><Save size={18} />変更を保存する</>}
        </button>

      </form>
      <NavigationBar />
    </div>
  );
}
