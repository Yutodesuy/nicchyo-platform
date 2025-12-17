'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import { shops } from "../map/data/shops";

type BagItem = {
  id: string;
  name: string;
  fromShopId?: number;
  qty?: string;
  note?: string;
  photo?: string;
  createdAt: number;
};

const STORAGE_KEY = "nicchyo-fridge-items";

function loadBagItems(): BagItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BagItem[];
  } catch {
    return [];
  }
}

export default function BagPage() {
  const [items, setItems] = useState<BagItem[]>([]);

  useEffect(() => {
    setItems(loadBagItems());
  }, []);

  const shopLookup = useMemo(() => {
    return new Map(shops.map((shop) => [shop.id, shop]));
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.createdAt - a.createdAt);
  }, [items]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="border-b border-amber-100/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              bag
            </p>
            <h1 className="text-2xl font-bold">買い物リスト</h1>
            <p className="text-sm text-gray-700">
              食べ物以外もまとめて確認できます。
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            マップへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">登録済み</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
              {sortedItems.length}件
            </span>
          </div>

          {sortedItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-center text-sm text-amber-800">
              まだ登録がありません。マップで買ったものを追加してください。
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {sortedItems.map((item) => {
                const shop = item.fromShopId
                  ? shopLookup.get(item.fromShopId)
                  : undefined;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {shop && (
                          <p className="text-xs text-gray-600">
                            {shop.name} / #{shop.id}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    {(item.qty || item.note) && (
                      <div className="mt-2 text-xs text-gray-700 space-y-1">
                        {item.qty && <p>数量: {item.qty}</p>}
                        {item.note && <p>メモ: {item.note}</p>}
                      </div>
                    )}
                    {item.fromShopId && (
                      <Link
                        href={`/map?shop=${item.fromShopId}`}
                        className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                      >
                        マップで見る
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <NavigationBar />
    </main>
  );
}
