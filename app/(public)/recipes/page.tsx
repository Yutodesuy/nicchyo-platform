import { Metadata } from "next";
import RecipesClient from "./RecipesClient";

export const metadata: Metadata = {
  title: "郷土料理トップ | nicchyo",
  description:
    "日曜市の購入食材からおすすめレシピをパーソナライズ。季節セレクトや投稿者紹介もまとめたレシピトップページ。",
};

export default function RecipesPage() {
  return <RecipesClient />;
}
