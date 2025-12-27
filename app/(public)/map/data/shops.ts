/**
 * 日曜市の店舗データ（300店舗）
 *
 * 【データ構造の変更】
 * - Shop型は ../types/shopData.ts で定義
 * - 出店者編集機能を前提とした構造に変更
 * - 編集可能/システム/表示設定の3層に分離
 *
 * 【将来の移行】
 * このファイルの静的データは将来的にDBやAPIに置き換わります
 * - getAllShops() を使ってデータ取得
 * - UI側はこのファイルを直接importしない
 */

// 新しい型定義をインポート・エクスポート
import type { Shop as ShopType } from '../types/shopData';
export type { Shop } from '../types/shopData';

// ローカルで使用する型エイリアス
type Shop = ShopType;

// 商品カテゴリーとアイコン（吹き出しのアイコンと対応）
const categories = [
  {
    name: "食材",
    icon: "\uD83E\uDD55",
    products: [
      "レタス",
      "トマト",
      "にんじん",
      "みかん",
      "りんご",
      "バナナ",
      "ぶどう",
      "梨",
      "なす",
      "きゅうり",
      "じゃがいも",
      "玉ねぎ",
      "しょうゆ",
      "味噌",
      "塩",
      "酢",
      "油",
      "だし"
    ]
  },
  {
    name: "食べ物",
    icon: "\uD83C\uDF59",
    products: [
      "おにぎり",
      "お弁当",
      "パン",
      "お餅",
      "お菓子",
      "焼き芋",
      "たこ焼き",
      "団子",
      "おはぎ",
      "アイスクリーム",
      "いも天"
    ]
  },
  {
    name: "道具・工具",
    icon: "\uD83D\uDD2A",
    products: ["包丁", "はさみ", "鎌", "のこぎり", "ナイフ", "砥石", "彫刻刀", "ドライバー", "スコップ", "剪定鋏"]
  },
  {
    name: "生活雑貨",
    icon: "\uD83E\uDDF6",
    products: ["ざる", "かご", "ほうき", "タオル", "石鹸", "食器", "お箸", "弁当箱", "竹製品", "布巾"]
  },
  {
    name: "植物・苗",
    icon: "\uD83C\uDF31",
    products: ["トマト苗", "ハーブ", "花の苗", "観葉植物", "多肉植物", "苗木", "種", "球根", "肥料", "植木鉢"]
  },
  {
    name: "アクセサリー",
    icon: "\uD83D\uDC8D",
    products: ["アクセサリー", "ピアス", "ネックレス", "ブレスレット", "指輪", "ヘアピン", "かんざし", "ブローチ", "イヤリング", "チャーム"]
  },
  {
    name: "手作り・工芸",
    icon: "\uD83C\uDFA8",
    products: ["陶器", "木工品", "染物", "編み物", "革製品", "刺繍", "絵画", "和紙", "竹細工", "ガラス細工"]
  },
];

// 店主の名前のサンプル
const ownerNames = [
  '田中 花子', '山田 太郎', '佐藤 美咲', '鈴木 健太',
  '高橋 由美', '伊藤 誠', '渡辺 さくら', '中村 勇',
  '小林 あかね', '加藤 大輔', '吉田 真理', '山本 隆',
  '松本 麻衣', '井上 翔', '木村 美穂', '林 浩二',
  '斎藤 千鶴', '清水 大地', '森 優子', '池田 健一',
  '前田 梨花', '藤田 修', '岡田 恵', '長谷川 昇',
  '石川 春香', '近藤 剛', '後藤 菜々', '坂本 誠也',
];

// 出店予定のパターン
const schedules = [
  '毎週日曜日',
  '第1・3日曜日',
  '第2・4日曜日',
  '毎週日曜日（雨天休み）',
  '月2回程度（SNSで告知）',
  '毎週日曜日 7:00-14:00',
  '不定期（月3回程度）',
  '毎週日曜日（8月休業）',
];

// 出店者の思い（一部の店舗のみ）
const messages = [
  '新鮮な地元野菜を毎朝仕入れています。ぜひお声がけください！',
  '30年以上この場所で商いをしております。品質には自信があります。',
  '手作りにこだわった商品ばかりです。一つ一つ心を込めて作っています。',
  '家族で営んでいる小さなお店です。いつも応援ありがとうございます！',
  '高知の美味しいものをたくさんの方に知ってもらいたいです。',
  '朝採れの新鮮な食材をお届けします。季節の味をお楽しみください。',
  '昔ながらの製法を守り続けています。伝統の味をぜひご賞味ください。',
  'お客様との会話が何より楽しみです。気軽にお立ち寄りください！',
  '地元で愛されて50年。変わらぬ味を提供し続けます。',
  '無農薬・有機栽培にこだわっています。安心安全な野菜をどうぞ。',
];

// 300店舗を生成（実測1.3kmに基づく正確な配置）
export const shops: Shop[] = [];

// 実際の日曜市の範囲（1.3km）
const startLat = 33.56500;  // 高知城前（西側）
const endLat = 33.55330;    // 追手筋東端（東側）
const latRange = startLat - endLat;
const latStep = latRange / 150;

const centerLng = 133.53100;    // 道の中心の経度
const lngOffsetNorth = -0.0006; // 北側（左）のオフセット（道幅約50m）
const lngOffsetSouth = 0.0006;  // 南側（右）のオフセット

let shopId = 1;

/**
 * 位置から丁目セクションを取得
 * PDFの日曜市マップに基づいて7つのセクションに分割
 */
function getChomeFromPosition(position: number): '一丁目' | '二丁目' | '三丁目' | '四丁目' | '五丁目' | '六丁目' | '七丁目' {
  // 150店舗を7セクションに分割
  // 北西端（高知城前）が六丁目、南東端（はりまや橋方面）が七丁目
  if (position <= 21) return '六丁目';      // 0-21: 22店舗
  if (position <= 42) return '五丁目';      // 22-42: 21店舗
  if (position <= 64) return '四丁目';      // 43-64: 22店舗
  if (position <= 85) return '三丁目';      // 65-85: 21店舗
  if (position <= 107) return '二丁目';     // 86-107: 22店舗
  if (position <= 128) return '一丁目';     // 108-128: 21店舗
  return '七丁目';                          // 129-149: 21店舗
}

// 北側（左側）の150店舗
for (let i = 0; i < 150; i++) {
  const category = categories[i % categories.length];
  const lat = startLat - (i * latStep);
  const lng = centerLng + lngOffsetNorth;
  const ownerName = ownerNames[i % ownerNames.length];
  const schedule = schedules[i % schedules.length];
  // 30%の確率でメッセージを追加
  const message = Math.random() > 0.7 ? messages[i % messages.length] : undefined;

  shops.push({
    id: shopId++,
    name: `${category.name}のお店 ${i + 1}`,
    ownerName,
    side: 'north',
    position: i,
    lat,
    lng,
    chome: getChomeFromPosition(i),
    category: category.name,
    products: category.products,
    description: `${category.name}を扱う老舗のお店です。新鮮な商品を取り揃えています。`,
    icon: category.icon,
    schedule,
    message,
  });
}

// 南側（右側）の150店舗
for (let i = 0; i < 150; i++) {
  const category = categories[i % categories.length];
  const lat = startLat - (i * latStep);
  const lng = centerLng + lngOffsetSouth;
  const ownerName = ownerNames[(i + 14) % ownerNames.length]; // 少しずらす
  const schedule = schedules[(i + 3) % schedules.length];
  // 30%の確率でメッセージを追加
  const message = Math.random() > 0.7 ? messages[(i + 5) % messages.length] : undefined;

  shops.push({
    id: shopId++,
    name: `${category.name}のお店 ${i + 151}`,
    ownerName,
    side: 'south',
    position: i,
    lat,
    lng,
    chome: getChomeFromPosition(i),
    category: category.name,
    products: category.products,
    description: `${category.name}を扱う老舗のお店です。新鮮な商品を取り揃えています。`,
    icon: category.icon,
    schedule,
    message,
  });
}





