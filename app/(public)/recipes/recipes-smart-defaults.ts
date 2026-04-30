/**
 * レシピ検索のプレースホルダーに使用するスマートなデフォルト値を生成します。
 * 現在の日時（月、時間）に基づいて、季節の食材や食事のコンテキストを提案します。
 *
 * @param date - 基準となる日時（デフォルトは現在日時）
 * @returns プレースホルダー文字列
 */
export function getSmartRecipePlaceholder(date: Date = new Date()): string {
  const hour = date.getHours();
  const month = date.getMonth() + 1; // 1-12

  // 季節の食材の提案
  let ingredient = "野菜";
  if (month >= 3 && month <= 5) {
    ingredient = "トマト"; // 春
  } else if (month >= 6 && month <= 8) {
    ingredient = "ナス"; // 夏
  } else if (month >= 9 && month <= 11) {
    ingredient = "生姜"; // 秋
  } else {
    ingredient = "文旦"; // 冬 (12, 1, 2)
  }

  // 時間帯によるコンテキストの提案
  let context = "人気レシピ";
  if (hour >= 5 && hour < 10) {
    context = "朝ごはん";
  } else if (hour >= 10 && hour < 14) {
    context = "お弁当";
  } else if (hour >= 14 && hour < 17) {
    context = "おやつ";
  } else if (hour >= 17 && hour < 22) {
    context = "おつまみ";
  } else {
    // 深夜・早朝
    context = "作り置き";
  }

  return `料理・食材名で検索（例：${ingredient}、${context}）`;
}
