"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import {
  ingredientCatalog,
  ingredientIcons,
  recipes,
  seasonalCollections,
  type Ingredient,
  type Recipe,
} from "../../../lib/recipes";

type Contributor = {
  id: string;
  name: string;
  profile: string;
  icon: string;
  repRecipes: string[];
};

type FridgeItem = {
  id: string;
  name: string;
  qty?: string;
  note?: string;
  photo?: string;
  createdAt: number;
};

const STORAGE_KEY = "nicchyo-fridge-items";

const contributors: Contributor[] = [
  {
    id: "sayuri",
    name: "市場の台所 さゆりさん",
    profile: "菜の花エリアで40年、旬野菜の食べ方を教える料理家。",
    icon: "👩‍🍳",
    repRecipes: ["焼きなすの生姜ぽん酢", "菜の花の辛子和え"],
  },
  {
    id: "katsuo",
    name: "かつお屋さん",
    profile: "城下でタタキ専門店を営む。薬味合わせが得意。",
    icon: "🧑‍🍳",
    repRecipes: ["かつおのタタキ丼", "冷やしタタキ茶漬け"],
  },
  {
    id: "obaachan",
    name: "四丁目のばあちゃん",
    profile: "郷土汁と保存食を作り続けて60年。日持ちレシピが十八番。",
    icon: "👵",
    repRecipes: ["生姜たっぷり根菜スープ", "鯖の味噌鍋"],
  },
];

const toDifficultyLabel = (difficulty: Recipe["difficulty"]) => {
  if (difficulty === "easy") return "かんたん";
  if (difficulty === "normal") return "ふつう";
  return "むずかしい";
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

export default function RecipesClient() {
  const [fridge, setFridge] = useState<FridgeItem[]>([]);
  const [searchMode, setSearchMode] = useState<"ingredient" | "dish">("ingredient");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  useEffect(() => {
    const filtered = loadFridge().filter((item) => {
      const lower = item.name.trim().toLowerCase();
      return ingredientCatalog.some(
        (ing) =>
          ing.name === item.name ||
          ing.id === lower ||
          ing.aliases?.some((a) => a.toLowerCase() === lower)
      );
    });
    setFridge(filtered);
  }, []);

  const handleRemove = (id: string) => {
    setFridge((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveFridge(next);
      return next;
    });
  };

  const handleAdd = (raw?: string) => {
    const value = (raw ?? addQuery).trim();
    if (!value) return;
    setFridge((prev) => {
      const exists = prev.some((item) => item.name.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      const next: FridgeItem[] = [
        { id: crypto.randomUUID(), name: value, createdAt: Date.now() },
        ...prev,
      ];
      saveFridge(next);
      return next;
    });
    setAddQuery("");
    setAddOpen(false);
  };

  const fridgeIngredientIds = useMemo(() => {
    return fridge
      .map((item) => {
        const name = item.name.toLowerCase();
        const hit = ingredientCatalog.find(
          (ing) =>
            ing.name.toLowerCase().includes(name) ||
            ing.id.toLowerCase() === name ||
            ing.aliases?.some((a) => a.toLowerCase().includes(name))
        );
        return hit?.id;
      })
      .filter(Boolean) as string[];
  }, [fridge]);

  const ranked = useMemo(() => {
    return recipes
      .map((r) => ({
        recipe: r,
        match: r.ingredientIds.filter((id) => fridgeIngredientIds.includes(id)).length,
      }))
      .filter((r) => r.match >= 1)
      .sort((a, b) => b.match - a.match)
      .map((r) => r.recipe);
  }, [fridgeIngredientIds]);

  const ingredientSuggestions = ingredientCatalog
    .map((i) => i.name)
    .filter((name) => query && name.includes(query))
    .slice(0, 5);
  const dishSuggestions = recipes
    .map((r) => r.title)
    .filter((title) => query && title.includes(query))
    .slice(0, 5);
  const suggestions = searchMode === "ingredient" ? ingredientSuggestions : dishSuggestions;

  const matchedIngredientIds =
    searchMode === "ingredient" && query.trim()
      ? ingredientCatalog
          .filter((ing) => {
            const q = query.trim().toLowerCase();
            return (
              ing.name.toLowerCase().includes(q) ||
              ing.id.toLowerCase().includes(q) ||
              ing.aliases?.some((a) => a.toLowerCase().includes(q))
            );
          })
          .map((ing) => ing.id)
      : [];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
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

  const headingByFridge =
    fridge.length === 0
      ? "まずバッグに食材を入れてみよう"
      : fridge.length === 1
        ? `${fridge[0].name}を買ったあなたにおすすめ`
        : `${fridge
            .slice(0, 2)
            .map((f) => f.name)
            .join("と")}を買ったあなたにおすすめ`;

  const currentSeason = (() => {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  })();
  const seasonalPick =
    seasonalCollections.find((c) => c.id === currentSeason) ?? seasonalCollections[0];

  const fridgeBadges = useMemo(() => {
    return fridge
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => {
        const id = ingredientCatalog.find(
          (ing) =>
            ing.name === item.name ||
            ing.id === item.name.toLowerCase() ||
            ing.aliases?.includes(item.name)
        )?.id;
        const icon = (id && ingredientIcons[id]) || "🧺";
        return { ...item, icon };
      });
  }, [fridge]);

  const ingredientBadges = useMemo(() => {
    return fridge
      .filter((item) => {
        const lower = item.name.trim().toLowerCase();
        return ingredientCatalog.some(
          (ing) =>
            ing.name === item.name ||
            ing.id === lower ||
            ing.aliases?.some((a) => a.toLowerCase() === lower)
        );
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => {
        const id = ingredientCatalog.find(
          (ing) =>
            ing.name === item.name ||
            ing.id === item.name.toLowerCase() ||
            ing.aliases?.includes(item.name)
        )?.id;
        const icon = (id && ingredientIcons[id]) || "🧺";
        return { ...item, icon };
      });
  }, [fridge]);

  const addSuggestions = useMemo(() => {
    const existing = new Set(fridge.map((f) => f.name.toLowerCase()));
    const q = addQuery.trim().toLowerCase();
    return ingredientCatalog
      .filter((ing) => !existing.has(ing.name.toLowerCase()))
      .filter((ing) => {
        if (!q) return true;
        return (
          ing.name.toLowerCase().includes(q) ||
          ing.id.toLowerCase().includes(q) ||
          ing.aliases?.some((a) => a.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [addQuery, fridge]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900">
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">nicchyo recipes</p>
            <h1 className="text-xl font-bold">買い物バッグから作れる土佐ごはん</h1>
            <p className="text-xs text-amber-100">
              マップでバッグに入れた食材だけを使ってレコメンドします
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
          {/* バッグの中身 */}
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  バッグの中身
                </p>
                <h2 className="text-lg font-bold text-gray-900">登録済み {fridge.length} 件</h2>
                <p className="text-xs text-gray-600">
                  マップでバッグに入れた食材を一覧化して、ここからレシピを探します
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-start gap-2">
              {addOpen ? (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm min-w-[260px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdd()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white text-lg font-bold shadow-sm transition hover:bg-amber-500"
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
                      className="w-full min-w-[140px] rounded-lg border border-amber-100 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="例：にんじん、ナス、ゆず"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAddOpen(false);
                        setAddQuery("");
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                      aria-label="追加を閉じる"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {addSuggestions.length === 0 ? (
                      <span className="text-gray-500">候補がありません</span>
                    ) : (
                      addSuggestions.map((ing) => (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => handleAdd(ing.name)}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                          <span aria-hidden>{ingredientIcons[ing.id] ?? "🧺"}</span>
                          <span>{ing.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                >
                  <span className="text-lg leading-none">＋</span>
                  食材を追加
                </button>
              )}

              {fridge.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-gray-700">
                  まだ登録がありません。マップで買った食材をバッグに入れると、ここに表示されます
                </div>
              ) : (
                fridgeBadges.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-gray-900 shadow-sm"
                    title={new Date(item.createdAt).toLocaleString()}
                  >
                    <span aria-hidden className="text-base">
                      {item.icon}
                    </span>
                    <span className="font-semibold">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-white/90 text-xs font-bold text-amber-700 transition hover:bg-white"
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
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  冷蔵庫からのおすすめ
                </p>
                <h2 className="text-lg font-bold text-gray-900">{headingByFridge}</h2>
                <p className="text-xs text-gray-600">冷蔵庫にある食材と一致するレシピのみを表示します</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                優先度: 最上位
              </span>
            </div>

            {fridgeIngredientIds.length > 0 && ranked.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {ranked.map((recipe) => (
                  <article
                    key={recipe.id}
                    className="flex flex-col gap-2 rounded-xl border border-orange-100 bg-amber-50/40 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{recipe.title}</h3>
                        <p className="text-[11px] text-gray-700">{recipe.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[11px] text-gray-700">
                        <span className="rounded-full bg-white px-2 py-[2px] border border-amber-100">
                          ⏱ {recipe.cookTime}
                        </span>
                        <span className="rounded-full bg-white px-2 py-[2px] border border-amber-100">
                          難易度: {toDifficultyLabel(recipe.difficulty)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {recipe.ingredients.map((ing) => {
                        const owned = fridgeIngredientIds.includes(ing.id);
                        return (
                          <span
                            key={`${recipe.id}-${ing.id}`}
                            className={`rounded-full px-2 py-1 border ${
                              owned
                                ? "border-amber-500 bg-amber-100 text-amber-800 font-semibold"
                                : "border-amber-100 bg-white text-gray-700"
                            }`}
                          >
                            {ing.name}
                            {ing.seasonal ? " (旬)" : ""}
                            {owned ? " / 冷蔵庫にあり" : ""}
                          </span>
                        );
                      })}
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-white/80 px-3 py-2 text-xs text-gray-800">
                      <p className="font-semibold text-amber-800">手順イメージ</p>
                      <ul className="mt-1 list-disc pl-4 space-y-1">
                        {recipe.steps.slice(0, 3).map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500">
                        レシピ詳細へ
                      </button>
                      <button className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50">
                        足りない食材を探す
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-gray-700">
                冷蔵庫に食材がないか、一致するレシピが見つかりません。食材を追加してください。
              </div>
            )}
          </div>

          {/* 検索バー */}
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              食材・料理名で検索
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setSearchMode("ingredient")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
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
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                  searchMode === "dish"
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-200/70"
                    : "bg-white text-gray-800 border border-orange-100"
                }`}
              >
                料理名で探す
              </button>
            </div>

            <div className="mt-3 relative">
              <form
                className="flex flex-col gap-2 md:flex-row md:items-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchMode === "ingredient"
                      ? "例：なす、にんじん、しめじ"
                      : "例：なすのたたき、田舎寿司"
                  }
                  className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 md:w-auto"
                >
                  検索
                </button>
              </form>
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-amber-100 bg-white shadow-lg">
                  <ul className="max-h-48 overflow-auto text-sm text-gray-800">
                    {suggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setQuery(s)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-amber-50"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {matchedIngredientIds.length > 0 && searchMode === "ingredient" && (
                <p className="mt-2 text-[11px] text-gray-600">
                  一致した食材ID: {matchedIngredientIds.join(", ")}
                </p>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 rounded-xl border border-orange-100 bg-amber-50/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">検索結果</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                    {searchResults.length}件
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {searchResults.map((recipe) => (
                    <div
                      key={`${recipe.id}-search`}
                      className="rounded-lg border border-amber-100 bg-white px-3 py-3 text-sm text-gray-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{recipe.title}</p>
                        <span className="rounded-full bg-amber-50 px-2 py-[2px] text-[11px] border border-amber-100">
                          {recipe.cookTime}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-gray-700">{recipe.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        {recipe.ingredients.slice(0, 6).map((ing) => (
                          <span
                            key={`${recipe.id}-${ing.id}-search`}
                            className="rounded-full border border-amber-100 bg-amber-50 px-2 py-1"
                          >
                            {ing.name}
                          </span>
                        ))}
                      </div>
                      <button className="mt-3 w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500">
                        レシピ詳細へ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 投稿者紹介 */}
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  このレシピを教えてくれた人
                </p>
                <h3 className="text-lg font-bold text-gray-900">土佐の台所の先生たち</h3>
                <p className="text-sm text-gray-700">冷蔵庫に合わせて代表レシピをピックアップ。</p>
              </div>
              <Link
                href="/recipes/contributors"
                className="w-full rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500 md:w-auto text-center"
              >
                投稿者一覧へ
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {contributors.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-orange-100 bg-amber-50/40 px-3 py-3 text-sm text-gray-900"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-lg">
                      {c.icon}
                    </div>
                    <p className="text-base font-semibold">{c.name}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-gray-700">{c.profile}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {c.repRecipes.map((r) => (
                      <span
                        key={r}
                        className="rounded-lg border border-amber-100 bg-white px-2 py-1 shadow-sm"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="w-full rounded-lg bg-white px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 shadow-sm transition hover:bg-amber-50">
                      フォロー
                    </button>
                    <button className="w-full rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500">
                      レシピを見る
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 季節セレクト */}
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  季節セレクト
                </p>
                <h3 className="text-lg font-bold text-gray-900">{seasonalPick.title}</h3>
                <p className="text-sm text-gray-700">{seasonalPick.description}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                {seasonalPick.recipeIds.length}件ピック
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {seasonalPick.recipeIds.map((id) => {
                const recipe = recipes.find((r) => r.id === id);
                if (!recipe) return null;
                return (
                  <div
                    key={`seasonal-${id}`}
                    className="rounded-xl border border-orange-100 bg-amber-50/40 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{recipe.title}</p>
                        <p className="text-[12px] text-gray-700">{recipe.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-[2px] text-[11px] font-semibold text-amber-800 border border-amber-100">
                        {recipe.cookTime}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {recipe.ingredients.map((ing) => (
                        <span
                          key={`${recipe.id}-${ing.id}-season`}
                          className="rounded-full border border-amber-100 bg-white px-2 py-1"
                        >
                          {ing.name}
                          {ing.seasonal ? " (旬)" : ""}
                        </span>
                      ))}
                    </div>
                    <button className="mt-3 w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500">
                      レシピ詳細へ
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <NavigationBar />
    </div>
  );
}
