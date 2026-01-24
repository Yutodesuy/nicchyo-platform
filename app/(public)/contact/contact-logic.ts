
export function getSmartPlaceholder(category: string | undefined, hour: number): string {
  let greeting = "こんにちは";
  if (hour >= 5 && hour < 10) greeting = "おはようございます";
  else if (hour >= 18 || hour < 5) greeting = "こんばんは";

  let template = "";
  switch (category) {
    case "question":
      template = "日曜市の開催時間や、おすすめの店舗について質問があります。";
      break;
    case "feedback":
      template = "いつも楽しく利用しています。マップ機能について要望なのですが...";
      break;
    case "bug":
      template = "アプリの不具合について報告します。\n発生した画面: \n状況: ";
      break;
    case "other":
      template = "取材の依頼についてご連絡いたしました。";
      break;
    default:
      template = "できるだけ詳しくご記入いただけると助かります。";
      break;
  }

  return `${greeting}。${template}`;
}
