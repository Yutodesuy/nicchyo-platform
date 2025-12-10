import { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "検索 | nicchyo",
  description: "日曜市でお店・商品・料理を横断検索。マップやレシピと連携します。",
};

export default function SearchPage() {
  return <SearchClient />;
}
