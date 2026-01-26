import { Shop } from '../data/shops';

export function getSmartSuggestions(
  commentText: string,
  shop?: Shop | null
): string[] {
  // お店紹介の場合
  if (shop) {
    const suggestions = [`${shop.name}のおすすめは？`];

    // カテゴリや商品に基づく提案
    const categories = [shop.category || "", ...(shop.products || [])].join(" ");

    if (categories.includes("野菜") || categories.includes("果物")) {
      suggestions.push("美味しい食べ方は？");
      suggestions.push("日持ちする？");
    } else if (categories.includes("刃物")) {
      suggestions.push("研ぎ直しできる？");
      suggestions.push("おすすめの包丁は？");
    } else if (categories.includes("植木") || categories.includes("花")) {
      suggestions.push("育て方は？");
      suggestions.push("今の時期の花は？");
    } else if (categories.includes("骨董") || categories.includes("雑貨")) {
      suggestions.push("掘り出し物ある？");
    } else if (categories.includes("海産物") || categories.includes("干物")) {
      suggestions.push("食べ方は？");
      suggestions.push("保存方法は？");
    } else {
      suggestions.push("人気商品は？");
    }

    suggestions.push("近くの似たお店は？");

    // 最大3つまで
    return suggestions.slice(0, 3);
  }

  // 雑談の場合：コメント内容に応じた提案
  const text = commentText || "";

  if (text.includes("休憩") || text.includes("座") || text.includes("疲れ")) {
    return ["近くのベンチは？", "トイレはどこ？", "カフェある？"];
  }

  if (text.includes("お腹") || text.includes("食べ") || text.includes("美味しい")) {
    return ["おすすめのランチは？", "食べ歩きできる？", "人気の屋台は？"];
  }

  if (text.includes("お土産") || text.includes("持って帰")) {
    return ["日持ちするお土産は？", "高知の名物は？", "配送できる？"];
  }

  if (text.includes("雨") || text.includes("天気")) {
    return ["雨でもやってる？", "アーケードはどこ？", "雨宿りできる？"];
  }

  if (text.includes("朝") || text.includes("時間")) {
    return ["何時までやってる？", "混む時間は？", "朝ごはん食べるなら？"];
  }

  if (text.includes("城") || text.includes("観光")) {
    return ["高知城への行き方は？", "近くの観光スポットは？", "歴史について教えて"];
  }

  // デフォルト
  return ["今日のランチは？", "旬の食材は？", "お土産なにがいい？"];
}
