"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavigationBar from "../../components/NavigationBar";

type FridgeItem = {
  id: string;
  name: string;
  qty?: string;
  note?: string;
  photo?: string; // data URL
  createdAt: number;
};

const STORAGE_KEY = "nicchyo-fridge-items";

function loadItems(): FridgeItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FridgeItem[];
    return parsed;
  } catch {
    return [];
  }
}

function saveItems(items: FridgeItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function badgeIcon(name: string) {
  const n = name.trim();
  if (!n) return "🧊";
  const first = n[0];
  const map: Record<string, string> = {
    な: "🍆",
    に: "🥕",
    し: "🫚",
    か: "🐟",
    ゆ: "🍋",
  };
  return map[first] ?? "🧊";
}

export default function FridgeClient() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  const shelves = useMemo(() => {
    const chunk = 3;
    const arr: FridgeItem[][] = [];
    for (let i = 0; i < sortedItems.length; i += chunk) {
      arr.push(sortedItems.slice(i, i + chunk));
    }
    return arr;
  }, [sortedItems]);

  const handleAdd = () => {
    if (!name.trim()) return;
    const next: FridgeItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      qty: qty.trim() || undefined,
      note: note.trim() || undefined,
      photo,
      createdAt: Date.now(),
    };
    const updated = [next, ...items];
    setItems(updated);
    saveItems(updated);
    setName("");
    setQty("");
    setNote("");
    setPhoto(undefined);
  };

  const handleRemove = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveItems(updated);
  };

  const handlePhoto = (file?: File | null) => {
    if (!file) {
      setPhoto(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900">
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">nicchyo fridge</p>
            <h1 className="text-xl font-bold">日曜市で買った食材メモ</h1>
            <p className="text-xs text-amber-100">
              写真 or テキストで「冷蔵庫」を保存。レシピページが最優先で参照します。
            </p>
          </div>
          <Link
            href="/recipes"
            className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-amber-800 shadow-md border border-amber-200 hover:bg-amber-50 transition"
          >
            レシピを見る
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              冷蔵庫に追加
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs text-gray-700">食材名</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：なす、にんじん、かつお"
                  className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                />
                <label className="block text-xs text-gray-700">量・メモ（任意）</label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="例：2本、1束、半身"
                  className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="産地や保存状態などメモ"
                  className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-gray-700">写真（任意・AI判定用）</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                  className="text-sm"
                />
                {photo && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2">
                    <p className="text-xs text-gray-700 mb-1">プレビュー</p>
                    <img src={photo} alt="fridge item" className="max-h-40 rounded-md object-contain" />
                  </div>
                )}
                <p className="text-[11px] text-gray-600">
                  写真を撮っておけば将来的にAIで自動判定できます（現状は保存のみ）。
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
              >
                冷蔵庫に入れる
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  冷蔵庫の中身
                </p>
                <h2 className="text-lg font-bold text-gray-900">登録済み {sortedItems.length} 件</h2>
              </div>
              <Link
                href="/recipes"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
              >
                この食材でレシピ提案へ
              </Link>
            </div>
            {sortedItems.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-gray-700">
                まだ登録がありません。マップに戻って食材を購入 → ここにメモしておくと、レシピページが最優先で参照します。
              </div>
            ) : (
              <div className="mt-4 rounded-[28px] border-4 border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-inner relative overflow-hidden">
                <div className="absolute inset-y-6 right-4 w-3 rounded-full bg-slate-200/70 shadow-inner" aria-hidden />
                {shelves.map((row, idx) => (
                  <div
                    key={`shelf-${idx}`}
                    className="relative flex flex-wrap items-center gap-2 px-4 py-4 border-b border-slate-200/70 last:border-b-0 bg-white/70"
                  >
                    <div className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-slate-100" aria-hidden />
                    {row.map((item) => (
                      <div
                        key={item.id}
                        className="relative z-10 flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50/70 px-3 py-2 text-sm text-gray-900 shadow-sm"
                      >
                        <span className="text-base">{badgeIcon(item.name)}</span>
                        <div className="flex flex-col leading-tight">
                          <span className="font-semibold text-[13px]">{item.name}</span>
                          <span className="text-[11px] text-gray-600">
                            {item.qty ? `量: ${item.qty}` : "追加: " + new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="ml-1 text-[11px] text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <NavigationBar />
    </div>
  );
}
