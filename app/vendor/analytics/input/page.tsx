"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { MOCK_PRODUCT_SALES } from "../../_mock/data";
import type { ProductSale } from "../../_types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";

export default function SalesInputPage() {
  const [entries, setEntries] = useState<ProductSale[]>(MOCK_PRODUCT_SALES);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  function addEntry() {
    const trimmed = name.trim();
    const q = parseInt(qty, 10);
    if (!trimmed || isNaN(q) || q <= 0) return;
    const existing = entries.findIndex((e) => e.product_name === trimmed);
    if (existing >= 0) {
      setEntries((prev) =>
        prev.map((e, i) => (i === existing ? { ...e, quantity: e.quantity + q } : e))
      );
    } else {
      setEntries((prev) => [
        ...prev,
        {
          id: `ps-new-${Date.now()}`,
          vendor_id: "vendor-1",
          product_name: trimmed,
          quantity: q,
          date: new Date().toISOString(),
        },
      ]);
    }
    setName("");
    setQty("");
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  }

  const today = new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/vendor/analytics"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">
              Sales Input
            </p>
            <h1 className="text-xl font-bold text-slate-900">販売数量を入力</h1>
          </div>
          <span className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
            {today}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {/* 入力フォーム */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Plus size={14} />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">商品を追加</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addEntry(); }
              }}
              placeholder="商品名（例：芋天）"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addEntry(); }
              }}
              placeholder="数量"
              min={1}
              className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button
              type="button"
              onClick={addEntry}
              className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
            >
              <Plus size={14} />
              追加
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            同じ商品名を入力すると数量が加算されます
          </p>
        </div>

        {/* 入力済み一覧 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ShoppingBag size={14} />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">本日の販売記録</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {entries.length} 商品
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">商品を追加してください</p>
          ) : (
            <div className="space-y-2">
              {entries
                .slice()
                .sort((a, b) => b.quantity - a.quantity)
                .map((entry) => {
                  const maxQty = Math.max(...entries.map((e) => e.quantity));
                  const pct = Math.round((entry.quantity / maxQty) * 100);
                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{entry.product_name}</span>
                          <span className="text-sm font-bold text-amber-600">{entry.quantity} 個</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-amber-100">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="flex-shrink-0 text-slate-300 transition hover:text-rose-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <button
          type="submit"
          disabled={isSaving || entries.length === 0}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow transition ${
            isSaving
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : isSaved
              ? "bg-emerald-500 text-white"
              : entries.length === 0
              ? "cursor-not-allowed bg-slate-100 text-slate-300"
              : "bg-amber-500 text-white hover:bg-amber-400"
          }`}
        >
          {isSaving ? (
            <span className="animate-pulse">保存中...</span>
          ) : isSaved ? (
            <>
              <CheckCircle2 size={18} />
              保存しました！
            </>
          ) : (
            <>
              <Save size={18} />
              販売データを保存する
            </>
          )}
        </button>

      </form>
      <NavigationBar />
    </div>
  );
}
