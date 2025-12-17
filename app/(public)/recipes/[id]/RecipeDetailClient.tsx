"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ingredientIcons, recipes, type Recipe } from "../../../../lib/recipes";
import NavigationBar from "../../../components/NavigationBar";

type Props = { id: string };

type BagItem = {
  id: string;
  name: string;
  createdAt: number;
};

const difficultyLabel: Record<Recipe["difficulty"], string> = {
  easy: "かんたん",
  normal: "ふつう",
  hard: "むずかしい",
};

const STORAGE_KEY = "nicchyo-fridge-items";

function loadFridge(): BagItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BagItem[];
  } catch {
    return [];
  }
}

export default function RecipeDetailClient({ id }: Props) {
  const recipe = recipes.find((r) => r.id === id);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);

  useEffect(() => {
    setBagItems(loadFridge());
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setBagItems(loadFridge());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const bagIngredientIds = useMemo(() => {
    return bagItems.map((item) => item.name.trim().toLowerCase());
  }, [bagItems]);

  if (!recipe) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-gray-800">
        <p className="text-lg font-semibold">レシピが見つかりませんでした。</p>
        <Link href="/recipes" className="mt-4 inline-block text-amber-700 underline">
          レシピ一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-gradient-to-b from-amber-50 via-orange-50 to-white min-h-screen pb-24">
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white shadow-md">
        <div className="relative mx-auto flex max-w-5xl flex-col gap-2 px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-100">
                nicchyo recipes
              </p>
              <h1 className="text-2xl font-bold">{recipe.title}</h1>
              <p className="text-sm text-amber-100">{recipe.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {recipe.ingredients.map((ing) => (
                  <span
                    key={ing.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-amber-900 border border-amber-100 shadow-sm"
                  >
                    <span aria-hidden>{ingredientIcons[ing.id] ?? "🧺"}</span>
                    {ing.name}
                    {ing.seasonal ? " (旬)" : ""}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-white/90 px-3 py-1 text-amber-800 shadow-sm">
                ⏱ {recipe.cookTime}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-amber-800 shadow-sm">
                難易度: {difficultyLabel[recipe.difficulty]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="overflow-hidden rounded-2xl border-4 border-white/80 shadow-2xl">
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-amber-100 via-orange-50 to-white">
            {recipe.heroImage && (
              <Image
                src={recipe.heroImage}
                alt={recipe.title}
                fill
                sizes="(max-width: 768px) 100vw, 960px"
                className="object-cover"
                priority
              />
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">材料</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recipe.ingredients.map((ing) => (
              <div
                key={`${recipe.id}-ing-${ing.id}`}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                  bagIngredientIds.includes(ing.name.toLowerCase())
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-amber-100 bg-amber-50/50"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>{ingredientIcons[ing.id] ?? "🧺"}</span>
                  <span>{ing.name}</span>
                  {bagIngredientIds.includes(ing.name.toLowerCase()) && (
                    <span className="rounded-full bg-white px-2 py-[2px] text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      バッグにあり
                    </span>
                  )}
                </div>
                <Link
                  href={`/map?ingredient=${encodeURIComponent(ing.name)}`}
                  className="text-[11px] font-semibold text-amber-700 underline"
                >
                  市場で探す
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">作り方</h2>
          <ol className="mt-3 space-y-3">
            {recipe.steps.map((step, idx) => (
              <li
                key={`${recipe.id}-step-${idx}`}
                className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-3 text-sm text-gray-900"
              >
                <span className="h-7 w-7 flex-shrink-0 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/recipes"
            className="flex-1 rounded-xl border border-amber-200 bg-white px-4 py-3 text-center text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
          >
            レシピ一覧へ戻る
          </Link>
          <Link
            href={`/map?recipe=${recipe.id}`}
            className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            市場で材料を探す
          </Link>
        </section>
      </main>

      <NavigationBar />
    </div>
  );
}
