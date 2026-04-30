
/**
 * Determines a smart placeholder for the user's name based on the current time and locale.
 *
 * @param date The current date object.
 * @param locale The user's locale string (e.g., 'ja-JP', 'en-US').
 * @returns A context-aware placeholder string.
 */
export function getSmartNamePlaceholder(date: Date, locale: string = 'ja'): string {
  const hour = date.getHours();
  const isJapanese = locale.startsWith('ja');

  // Time ranges
  const isEarlyMorning = hour >= 4 && hour < 9;
  const isMorningMarket = hour >= 9 && hour < 12;
  const isLunchTime = hour >= 12 && hour < 15;
  const isAfternoon = hour >= 15 && hour < 18;

  if (isJapanese) {
    if (isEarlyMorning) return "早起き 太郎";
    if (isMorningMarket) return "朝市 花子";
    if (isLunchTime) return "食べ歩き 次郎";
    if (isAfternoon) return "お土産 三郎";
    return "日曜 太郎";
  } else {
    // English / International
    if (isEarlyMorning) return "Early Bird Taro";
    if (isMorningMarket) return "Market Hanako";
    if (isLunchTime) return "Foodie Jiro";
    if (isAfternoon) return "Souvenir Saburo";
    return "Sunday Taro";
  }
}
