// 日曜市の店舗データ（300店舗）

export interface Shop {
  id: number;
  name: string;
  ownerName: string; // 店主の名前
  side: 'north' | 'south'; // 北側（左）or 南側（右）
  position: number; // 0-149の位置
  lat: number;
  lng: number;
  category: string;
  products: string[];
  description: string;
  icon: string;
  schedule: string; // 出店予定
  message?: string; // 出店者の思い（任意）
}

// 商品カテゴリーとアイコン（吹き出しのアイコンと対応）
const categories = [
  { name: '野菜', icon: '🥬', products: ['レタス', 'トマト', 'にんじん', 'キャベツ', '白菜'] },
  { name: '魚介', icon: '🐟', products: ['鮮魚', 'エビ', 'イカ', '貝類', '干物'] },
  { name: '果物', icon: '🍊', products: ['みかん', 'りんご', 'バナナ', '梨', 'ぶどう'] },
  { name: '花', icon: '🌸', products: ['桜', 'ハイビスカス', 'ひまわり', 'バラ', 'チューリップ'] },
  { name: '主食', icon: '🍚', products: ['お米', 'パン', 'バゲット', 'うどん', 'もち'] },
  { name: '乳製品', icon: '🧀', products: ['チーズ', '牛乳', '卵', 'ヨーグルト', 'バター'] },
  { name: '飲料', icon: '🍵', products: ['お茶', 'コーヒー', 'ジュース', '甘酒', '豆乳'] },
  { name: '工芸品', icon: '🎨', products: ['陶器', '絵画', 'アクセサリー', '木工品', '染物'] },
  { name: '衣類', icon: '👕', products: ['Tシャツ', '帽子', 'ワンピース', 'バッグ', 'エプロン'] },
  { name: '加工品', icon: '🥔', products: ['じゃがいも', '玉ねぎ', 'とうもろこし', '漬物', '味噌'] },
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
    category: category.name,
    products: category.products,
    description: `${category.name}を扱う老舗のお店です。新鮮な商品を取り揃えています。`,
    icon: category.icon,
    schedule,
    message,
  });
}
