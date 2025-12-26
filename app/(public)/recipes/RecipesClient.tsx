"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import {
  ingredientCatalog,
  ingredientIcons,
  recipes,
  seasonalCollections,
  type Recipe,
} from "../../../lib/recipes";
import GrandmaChatter from "../map/components/GrandmaChatter";
import { grandmaRecipeComments } from "../map/data/grandmaCommentsRecipes";

// Local storage key
const STORAGE_KEY = "nicchyo-fridge-items";

type FridgeItem = {
  id: string;
  name: string;
  createdAt: number;
};

type SearchMode = "ingredient" | "dish";

type RankedRecipe = {
  recipe: Recipe;
  match: number;
};

function loadFridge(): FridgeItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FridgeItem[];
  } catch {
    return [];
  }
}

function saveFridge(items: FridgeItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const difficultyLabel = (difficulty: Recipe["difficulty"]) => {
  if (difficulty === "easy") return "かんたん";
  if (difficulty === "normal") return "ふつう";
  return "むずかしい";
};

export default function RecipesClient() {
  const [fridge, setFridge] = useState<FridgeItem[]>([]);
  const [addQuery, setAddQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("ingredient");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setFridge(loadFridge());
  }, []);

  const fridgeIngredientIds = useMemo(() => {
    return fridge
      .map((item) => {
        const lower = item.name.trim().toLowerCase();
        const hit = ingredientCatalog.find(
          (ing) =>
            ing.name.toLowerCase().includes(lower) ||
            ing.id.toLowerCase() === lower ||
            ing.aliases?.some((a) => a.toLowerCase().includes(lower))
        );
        return hit?.id;
      })
      .filter(Boolean) as string[];
  }, [fridge]);

  const ranked: RankedRecipe[] = useMemo(() => {
    return recipes
      .map((r) => ({
        recipe: r,
        match: r.ingredientIds.filter((id) => fridgeIngredientIds.includes(id)).length,
      }))
      .filter((r) => r.match > 0)
      .sort((a, b) => b.match - a.match);
  }, [fridgeIngredientIds]);

  const matchedIngredientIds = useMemo(() => {
    if (searchMode !== "ingredient" || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return ingredientCatalog
      .filter(
        (ing) =>
          ing.name.toLowerCase().includes(q) ||
          ing.id.toLowerCase().includes(q) ||
          ing.aliases?.some((a) => a.toLowerCase().includes(q))
      )
      .map((ing) => ing.id);
  }, [query, searchMode]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Recipe[];
    if (searchMode === "ingredient") {
      if (matchedIngredientIds.length === 0) return [];
      return recipes.filter((r) => r.ingredientIds.some((id) => matchedIngredientIds.includes(id)));
    }
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.steps.some((s) => s.toLowerCase().includes(q))
    );
  }, [query, matchedIngredientIds, searchMode]);

  const seasonalPick = (() => {
    const m = new Date().getMonth() + 1;
    const season = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
    return seasonalCollections.find((c) => c.id === season) ?? seasonalCollections[0];
  })();

  const handleAdd = (value?: string) => {
    const v = (value ?? addQuery).trim();
    if (!v) return;
    setFridge((prev) => {
      if (prev.some((i) => i.name.toLowerCase() === v.toLowerCase())) return prev;
      const next: FridgeItem[] = [{ id: crypto.randomUUID(), name: v, createdAt: Date.now() }, ...prev];
      saveFridge(next);
      return next;
    });
    setAddQuery("");
    setAddOpen(false);
  };

  const handleRemove = (id: string) => {
    setFridge((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveFridge(next);
      return next;
    });
  };

  const headingByFridge = (() => {
    if (fridge.length === 0) return "まずはbagに食材を入れてみよう";
    if (fridge.length === 1) return `${fridge[0].name}を買ったあなたにおすすめ`;
    return `${fridge.slice(0, 2).map((f) => f.name).join("と")}を買ったあなたにおすすめ`;
  })();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 text-lg">
      <main className="flex-1 pb-32 pt-4">
        <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
          <header className="relative overflow-hidden rounded-3xl border border-amber-100 bg-white/95 px-6 py-5 shadow-sm text-center">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 blur-3xl opacity-50" aria-hidden />
            <div className="absolute -left-10 -bottom-6 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 blur-3xl opacity-50" aria-hidden />
            <div className="relative">
              <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Recipes</p>
              <h1 className="mt-1 text-4xl font-bold text-gray-900">レシピ</h1>
              <p className="mt-1 text-xl text-gray-700">日曜市の食材で作るおすすめ料理集</p>
            </div>
          </header>

          {/* 冷蔵庫リスト */}
          <div className="rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">冷蔵庫リスト</p>
                <h2 className="text-xl font-bold text-gray-900">登録済み {fridge.length} 件</h2>
                <p className="text-sm text-gray-700">レシピに使いたい食材を bag に入れておくと、おすすめレシピが見つけやすくなります。</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-start gap-3">
              {addOpen ? (
                <div className="flex flex-col gap-2 rounded-xl border-2 border-amber-300 bg-white px-3 py-3 text-base text-gray-900 shadow-sm min-w-[260px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdd()}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white text-xl font-bold shadow-sm transition hover:bg-amber-500"
                      aria-label="食材を追加"
                    >
                      ＋
                    </button>
                    <input
                      value={addQuery}
                      onChange={(e) => setAddQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                      }}
                      className="w-full min-w-[140px] rounded-lg border border-amber-200 px-3 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="例：にんじん、なす、きゅうり"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAddOpen(false);
                        setAddQuery("");
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-white text-sm font-bold text-amber-700 transition hover:bg-amber-50"
                      aria-label="追加を閉じる"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-amber-300 bg-white px-4 py-2 text-base font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                >
                  <span className="text-xl leading-none">＋</span>
                  食材を追加
                </button>
              )}

              {fridge.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-amber-300 bg-white/80 px-4 py-6 text-center text-base text-gray-800">
                  まだ登録がありません。マーケットで買った食材を bag に入れると、ここに表示されます。
                </div>
              ) : (
                fridge.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-2 text-base text-gray-900 shadow-sm"
                    title={new Date(item.createdAt).toLocaleString()}
                  >
                    <span aria-hidden className="text-xl">🧺</span>
                    <span className="font-semibold">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-white/90 text-base font-bold text-amber-700 transition hover:bg-white"
                      aria-label={`${item.name}を削除`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 冷蔵庫からのおすすめ */}
          <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">冷蔵庫からのおすすめ</p>
                <h2 className="text-xl font-bold text-gray-900">{headingByFridge}</h2>
                <p className="text-sm text-gray-700">冷蔵庫にある食材と一致するレシピだけを表示します。</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 border border-amber-100">
                優先度: 最上位
              </span>
            </div>

            {fridgeIngredientIds.length > 0 && ranked.length > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {ranked.map(({ recipe }) => (
                  <article
                    key={recipe.id}
                    className="flex flex-col gap-3 rounded-xl border-2 border-orange-300 bg-amber-50/60 px-4 py-4 text-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900">{recipe.title}</h3>
                        <p className="text-lg text-gray-800">{recipe.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-lg text-gray-800">
                        <span className="rounded-full bg-white px-4 py-2 text-base border border-amber-100">⏱ {recipe.cookTime}</span>
                        <span className="rounded-full bg-white px-4 py-2 text-base border border-amber-100">難易度: {difficultyLabel(recipe.difficulty)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-lg">
                      {recipe.ingredients.map((ing) => {
                        const owned = fridgeIngredientIds.includes(ing.id);
                        return (
                          <span
                            key={`${recipe.id}-${ing.id}`}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${
                              owned
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                                : "border-amber-100 bg-white text-gray-800"
                            }`}
                          >
                            <span aria-hidden>{ingredientIcons[ing.id] ?? "🧺"}</span>
                            {ing.name}
                            {ing.seasonal ? " (旬)" : ""}
                            {owned ? " / bagにあり" : ""}
                          </span>
                        );
                      })}
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-white/80 px-5 py-4 text-xl text-gray-900">
                      <p className="font-semibold text-amber-800">作り方（抜粋）</p>
                      <ul className="mt-3 list-disc pl-6 space-y-3">
                        {recipe.steps.slice(0, 3).map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="w-full rounded-lg bg-amber-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 text-center"
                      >
                        レシピ詳細へ
                      </Link>
                      <Link
                        href={`/map?recipe=${recipe.id}`}
                        className="w-full rounded-lg border border-amber-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 text-center"
                      >
                        食材をマップで探す
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border-2 border-dashed border-amber-300 bg-white/80 px-4 py-6 text-center text-base text-gray-800">
                冷蔵庫に食材がないか、一致するレシピが見つかりません。食材を追加してください。
              </div>
            )}
          </div>

          {/* 検索ボード */}
          <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">食材・料理名で検索</p>
            <div className="mt-3 flex gap-2 text-lg">
              <button
                type="button"
                onClick={() => setSearchMode("ingredient")}
                className={`flex-1 rounded-lg px-3 py-2 font-semibold ${
                  searchMode === "ingredient"
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-200/70"
                    : "bg-white text-gray-800 border border-orange-100"
                }`}
              >
                食材で探す
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("dish")}
                className={`flex-1 rounded-lg px-3 py-2 font-semibold ${
                  searchMode === "dish"
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-200/70"
                    : "bg-white text-gray-800 border border-orange-100"
                }`}
              >
                料理名で探す
              </button>
            </div>

            <div className="mt-3 relative">
              <form className="flex flex-col gap-2 md:flex-row md:items-center" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchMode === "ingredient" ? "例：なす、にんじん、しめじ" : "例：なすのたたき、田舎寿司"}
                  className="w-full rounded-lg border border-orange-100 px-3 py-2 text-base text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-600 px-4 py-2 text-base font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 md:w-auto"
                >
                  検索
                </button>
              </form>
              {matchedIngredientIds.length > 0 && searchMode === "ingredient" && (
                <p className="mt-2 text-sm text-gray-600">一致した食材ID: {matchedIngredientIds.join(", ")}</p>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 rounded-xl border-2 border-orange-300 bg-amber-50/60 p-4 text-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold text-gray-900">検索結果</p>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-800 border border-amber-100">{searchResults.length}件</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {searchResults.map((recipe) => (
                    <div key={`${recipe.id}-search`} className="rounded-lg border-2 border-amber-200 bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xl font-semibold text-gray-900">{recipe.title}</p>
                        <span className="rounded-full bg-amber-50 px-3 py-[4px] text-sm border border-amber-100">{recipe.cookTime}</span>
                      </div>
                      <p className="mt-1 text-base text-gray-700">{recipe.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-base">
                        {recipe.ingredients.slice(0, 6).map((ing) => {
                          const owned = fridgeIngredientIds.includes(ing.id);
                          return (
                            <span
                              key={`${recipe.id}-${ing.id}-search`}
                              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 ${
                                owned
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                                  : "border-amber-100 bg-white text-gray-800"
                              }`}
                            >
                              <span aria-hidden>{ingredientIcons[ing.id] ?? "🧺"}</span>
                              {ing.name}
                              {ing.seasonal ? " (旬)" : ""}
                              {owned ? " / bagにあり" : ""}
                            </span>
                          );
                        })}
                      </div>
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="mt-3 inline-block w-full rounded-lg bg-amber-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 text-center"
                      >
                        レシピ詳細へ
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 投稿した人たち */}
          <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">このレシピを教えてくれた人</p>
                <h3 className="text-xl font-bold text-gray-900">土佐の台所の先生たち</h3>
                <p className="text-base text-gray-700">冷蔵庫に合わせて代表レシピをピックアップしました。</p>
              </div>
              <Link
                href="/recipes/contributors"
                className="w-full rounded-lg bg-amber-600 px-4 py-2 text-base font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 md:w-auto text-center"
              >
                投稿者一覧へ
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {/* 簡易プレースホルダー */}
              <div className="rounded-xl border-2 border-orange-200 bg-amber-50/60 px-4 py-3">
                <p className="text-lg font-semibold">市場の台所 さゆりさん</p>
                <p className="text-base text-gray-700 mt-1">旬野菜の食べ方に詳しい料理家。優しい味付けが得意。</p>
              </div>
              <div className="rounded-xl border-2 border-orange-200 bg-amber-50/60 px-4 py-3">
                <p className="text-lg font-semibold">かつお屋さん</p>
                <p className="text-base text-gray-700 mt-1">タタキの薬味合わせが得意な海の人。</p>
              </div>
            </div>
          </div>

          {/* 季節セレクト */}
          <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">季節セレクト</p>
                <h3 className="text-xl font-bold text-gray-900">{seasonalPick.title}</h3>
                <p className="text-base text-gray-700">{seasonalPick.description}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 border border-amber-100">{seasonalPick.recipeIds.length}件ピック</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {seasonalPick.recipeIds.map((id) => {
                const recipe = recipes.find((r) => r.id === id);
                if (!recipe) return null;
                return (
                  <div key={`seasonal-${id}`} className="rounded-xl border-2 border-orange-200 bg-amber-50/60 px-4 py-3 text-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xl font-semibold text-gray-900">{recipe.title}</p>
                        <p className="text-base text-gray-700">{recipe.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-[4px] text-sm font-semibold text-amber-800 border border-amber-100">{recipe.cookTime}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-base">
                      {recipe.ingredients.map((ing) => {
                        const owned = fridgeIngredientIds.includes(ing.id);
                        return (
                          <span
                            key={`${recipe.id}-${ing.id}-season`}
                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 ${
                              owned
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                                : "border-amber-100 bg-white text-gray-800"
                            }`}
                          >
                            <span aria-hidden>{ingredientIcons[ing.id] ?? "🧺"}</span>
                            {ing.name}
                            {ing.seasonal ? " (旬)" : ""}
                            {owned ? " / bagにあり" : ""}
                          </span>
                        );
                      })}
                    </div>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="mt-3 inline-block w-full rounded-lg bg-amber-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 text-center"
                    >
                      レシピ詳細へ
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <NavigationBar />
      <GrandmaChatter comments={grandmaRecipeComments} titleLabel="料理ばあちゃん" fullWidth />
    </div>
  );
}
