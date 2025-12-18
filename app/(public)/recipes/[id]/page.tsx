"use client";

import { use } from "react";
import RecipeDetailClient from "./RecipeDetailClient";

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RecipeDetailClient id={id} />;
}
