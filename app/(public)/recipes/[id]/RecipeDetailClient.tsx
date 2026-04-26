"use client";

import Link from "next/link";
import { safeJsonParse } from "@/lib/utils/safeJsonParse";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { ingredientIcons, recipes, type Recipe } from "../../../../lib/recipes";
import NavigationBar from "../../../components/NavigationBar";
import EmptyState from "@/components/EmptyState";

type Props = { id: string };

type BagItem = {
  id: string;
  name: string;
  createdAt: number;
};

const _difficultyLabel: Record<Recipe["difficulty"], string> = {
  easy: "かんたん",
  normal: "ふつう",
  hard: "むずかしい",
};

const STORAGE_KEY = "nicchyo-fridge-items";

function loadFridge(): BagItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeJsonParse<BagItem[]>(raw, []);
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
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          icon={SearchX}
          title="レシピが見つかりませんでした"
          description="指定されたレシピは存在しないか、削除された可能性があります。"
          action={
            <Link
              href="/recipes"
              className="rounded-full bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-500"
            >
              レシピ一覧に戻る
            </Link>
          }
          secondaryAction={
            <Link
              href="/map"
              className="rounded-full border border-amber-200 bg-white px-6 py-2.5 text-sm font-bold text-amber-600 shadow-sm transition hover:bg-amber-50"
            >
              マップへ戻る
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-gradient-to-b from-amber-50 via-orange-50 to-white min-h-screen pb-24 pt-4">
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
        {recipe.author && (
          <p className="text-sm font-semibold text-amber-800">
            投稿者: {recipe.author}
          </p>
        )}

        <section className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/map"
            className="flex-1 rounded-xl border border-amber-200 bg-white px-4 py-3 text-center text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
          >
            マップへもどる
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
