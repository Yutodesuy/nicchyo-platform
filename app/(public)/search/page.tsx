import { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "店舗検索 | nicchyo",
  description: "日曜市の300店舗から、お店の名前・商品・カテゴリー・ブロック番号で検索できます。",
};

export default function SearchPage() {
  return <SearchClient />;
}
