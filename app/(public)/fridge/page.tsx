import FridgeClient from "./FridgeClient";

export const metadata = {
  title: "冷蔵庫メモ | nicchyo",
  description: "日曜市で買った食材や写真をメモして、レシピと連携する冷蔵庫ページ。",
};

export default function FridgePage() {
  return <FridgeClient />;
}
