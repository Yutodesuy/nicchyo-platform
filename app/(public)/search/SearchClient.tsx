"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NavigationBar from "../../components/NavigationBar";
import { shops as allShops } from "../map/data/shops";

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  cookTime: string;
  difficulty: "easy" | "normal" | "hard";
};

const recipes: Recipe[] = [
  {
    id: "eggplant-ginger",
    title: "焼きなすの生姜ぽん酢",
    ingredients: ["なす", "しょうが", "塩"],
    cookTime: "15分",
    difficulty: "easy",
  },
  {
    id: "katsuo-don",
    title: "かつおのタタキ丼",
    ingredients: ["かつお", "しょうが", "大葉", "ゆず", "ごはん"],
    cookTime: "20分",
    difficulty: "normal",
  },
  {
    id: "buntan-salad",
    title: "ぶんたんと大葉のサラダ",
    ingredients: ["ぶんたん", "大葉", "塩"],
    cookTime: "10分",
    difficulty: "easy",
  },
];

const productCatalog = [
  { name: "なす", category: "野菜", shopHint: "南側50番台" },
  { name: "にんじん", category: "野菜", shopHint: "北側20番台" },
  { name: "しょうが", category: "野菜", shopHint: "北側60番台" },
  { name: "かつお", category: "魚介", shopHint: "南側80番台" },
  { name: "ぶんたん", category: "果物", shopHint: "南側100番台" },
];

const shops = allShops.slice(0, 18); // 簡易表示のため先頭だけ利用

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredShops = useMemo(() => {
    if (!q) return [];
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.products.some((p) => p.toLowerCase().includes(q))
    );
  }, [q]);

  const filteredProducts = useMemo(() => {
    if (!q) return [];
    return productCatalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shopHint.toLowerCase().includes(q)
    );
  }, [q]);

  const filteredRecipes = useMemo(() => {
    if (!q) return [];
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((ing) => ing.toLowerCase().includes(q))
    );
  }, [q]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">nicchyo search</p>
            <h1 className="text-xl font-bold">お店・商品・料理を横断検索</h1>
            <p className="text-[11px] text-amber-100">
              マップ・レシピと連携します。気になるワードを入れてください。
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-amber-800 shadow-md border border-amber-200 hover:bg-amber-50 transition"
          >
            マップへ戻る
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <section className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">検索</p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例：なす、しょうが、かつお、タタキ"
                className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <button
                type="button"
                className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 md:w-auto"
              >
                検索
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-600">
              「なす」を検索すると、取り扱い店舗とナスを使う料理が表示されます。
            </p>
          </div>

          {q === "" ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-gray-700">
              キーワードを入力すると、お店・商品・料理の結果がここに表示されます。
            </div>
          ) : (
            <div className="space-y-6">
              {/* お店 */}
              <div className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                      お店
                    </p>
                    <h2 className="text-lg font-bold text-gray-900">取り扱い店舗</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                    {filteredShops.length}件
                  </span>
                </div>
                {filteredShops.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-700">該当する店舗がありません。</p>
                ) : (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {filteredShops.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-3 text-sm text-gray-900 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg" aria-hidden>
                              {s.icon ?? "🛒"}
                            </span>
                            <div>
                              <p className="font-semibold">{s.name}</p>
                              <p className="text-[11px] text-gray-600">{s.category}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-amber-700">#{s.id}</span>
                        </div>
                        <p className="mt-2 text-[12px] text-gray-700">
                          取り扱い: {s.products.slice(0, 3).join("・")}
                        </p>
                        <Link
                          href={`/map?shop=${s.id}`}
                          className="mt-2 inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold text-amber-800 shadow-sm hover:bg-amber-50 transition"
                        >
                          このお店をマップで見る
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 商品 */}
              <div className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                      商品
                    </p>
                    <h2 className="text-lg font-bold text-gray-900">市場の商品</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                    {filteredProducts.length}件
                  </span>
                </div>
                {filteredProducts.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-700">該当する商品がありません。</p>
                ) : (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.name}
                        className="rounded-xl border border-amber-100 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{p.name}</p>
                          <span className="text-[11px] text-amber-700">{p.category}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-gray-700">ヒント: {p.shopHint}</p>
                        <p className="mt-1 text-[11px] text-gray-600">
                          検索ワード: {q} / 商品カテゴリー: {p.category}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 料理 */}
              <div className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                      料理
                    </p>
                    <h2 className="text-lg font-bold text-gray-900">その食材を使う料理</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                    {filteredRecipes.length}件
                  </span>
                </div>
                {filteredRecipes.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-700">該当する料理がありません。</p>
                ) : (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {filteredRecipes.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-3 text-sm text-gray-900 shadow-sm"
                      >
                        <p className="font-semibold">{r.title}</p>
                        <p className="text-[11px] text-gray-700">
                          材料: {r.ingredients.join("・")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-amber-800">
                          <span className="rounded-full bg-white px-2 py-[2px] border border-amber-100">
                            ⏱ {r.cookTime}
                          </span>
                          <span className="rounded-full bg-white px-2 py-[2px] border border-amber-100">
                            難易度: {r.difficulty === "easy" ? "かんたん" : r.difficulty === "normal" ? "ふつう" : "むずかしい"}
                          </span>
                        </div>
                        <Link
                          href="/recipes"
                          className="mt-2 inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold text-amber-800 shadow-sm hover:bg-amber-50 transition"
                        >
                          レシピを見る
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <NavigationBar />
    </div>
  );
}
