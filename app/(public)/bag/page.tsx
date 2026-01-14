'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import { shops } from "../map/data/shops";
import { ingredientCatalog } from "../../../lib/recipes";
import { useBag, type BagItem } from "../../../lib/storage/BagContext";

export default function BagPage() {
  const { items, removeItem, clearBag } = useBag();
  const [pendingDeleteItem, setPendingDeleteItem] = useState<BagItem | null>(null);
  const [pendingReset, setPendingReset] = useState(false);

  const shopLookup = useMemo(() => {
    return new Map(shops.map((shop) => [shop.id, shop]));
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.createdAt - a.createdAt);
  }, [items]);

  const groupedItems = useMemo(() => {
    const isIngredient = (name: string) => {
      const lower = name.trim().toLowerCase();
      return ingredientCatalog.some(
        (ing) =>
          ing.name.toLowerCase().includes(lower) ||
          lower.includes(ing.name.toLowerCase()) ||
          ing.id.toLowerCase() === lower ||
          ing.id.toLowerCase().includes(lower) ||
          ing.aliases?.some(
            (alias) =>
              alias.toLowerCase().includes(lower) ||
              lower.includes(alias.toLowerCase())
          )
      );
    };

    const groups = new Map<string, BagItem[]>();
    sortedItems.forEach((item) => {
      const category =
        item.category ??
        (isIngredient(item.name) ? "食材" : undefined) ??
        (item.fromShopId ? shopLookup.get(item.fromShopId)?.category : undefined) ??
        "その他";
      const list = groups.get(category) ?? [];
      list.push(item);
      groups.set(category, list);
    });
    return Array.from(groups.entries());
  }, [sortedItems, shopLookup]);

  const handleRemove = (id: string) => {
    removeItem(id);
    setPendingDeleteItem(null);
  };

  const handleReset = () => {
    clearBag();
    setPendingReset(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16 pt-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Bag</p>
          <h1 className="mt-1 text-4xl font-bold text-gray-900">買い物リスト</h1>
          <p className="mt-1 text-xl text-gray-700">食べ物以外もまとめて確認できます。</p>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">登録済み</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
                {sortedItems.length}件
              </span>
              {sortedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPendingReset(true)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  リセット
                </button>
              )}
            </div>
          </div>

          {sortedItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-center text-sm text-amber-800">
              まだ登録がありません。マーケットで買ったものを追加してください。
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {groupedItems.map(([categoryName, categoryItems]) => (
                <div key={categoryName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{categoryName}</h3>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                      {categoryItems.length}件
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {categoryItems.map((item) => {
                      const shop = item.fromShopId ? shopLookup.get(item.fromShopId) : undefined;
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
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-[11px] text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteItem(item)}
                                className="rounded-full border border-red-100 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                                aria-label={`${item.name}を削除`}
                              >
                                削除する
                              </button>
                            </div>
                          </div>
                          {(item.qty || item.note) && (
                            <div className="mt-2 text-xs text-gray-700 space-y-1">
                              {item.qty && <p>数量: {item.qty}</p>}
                              {item.note && <p>メモ: {item.note}</p>}
                            </div>
                          )}
                          {shop && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-[6px] text-[11px] font-semibold text-amber-800 shadow-sm">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-800">
                                #{shop.id}
                              </span>
                              <span className="truncate max-w-[150px]">{shop.name}</span>
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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {pendingDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold text-gray-900">
              {`「${pendingDeleteItem.name}」を削除しますか？`}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteItem(null)}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleRemove(pendingDeleteItem.id)}
                className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold text-gray-900">
              すべてのアイテムをリセットしますか？
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingReset(false)}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}

      <NavigationBar />
    </main>
  );
}
