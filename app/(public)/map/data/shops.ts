// 日曜市の店舗データ（300店舗）

export interface Shop {
  id: number;
  name: string;
  side: 'north' | 'south'; // 北側（左）or 南側（右）
  position: number; // 0-149の位置
  lat: number;
  lng: number;
  category: string;
  products: string[];
  description: string;
  icon: string;
}

// 商品カテゴリーとアイコン
const categories = [
  { name: '野菜', icon: '🥬', products: ['大根', 'にんじん', 'キャベツ'] },
  { name: '魚介', icon: '🐟', products: ['鯛', '鰹', '伊勢海老'] },
  { name: '果物', icon: '🍊', products: ['みかん', 'りんご', 'バナナ'] },
  { name: '花', icon: '🌸', products: ['バラ', 'ひまわり', 'チューリップ'] },
  { name: '主食', icon: '🍚', products: ['お米', 'パン', 'うどん'] },
  { name: '乳製品', icon: '🧀', products: ['チーズ', '牛乳', 'ヨーグルト'] },
  { name: '飲料', icon: '🍵', products: ['お茶', 'コーヒー', 'ジュース'] },
  { name: '工芸品', icon: '🎨', products: ['陶器', '木工品', 'アクセサリー'] },
  { name: '衣類', icon: '👕', products: ['Tシャツ', '帽子', 'バッグ'] },
  { name: '加工品', icon: '🥔', products: ['漬物', '干物', '味噌'] },
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

  shops.push({
    id: shopId++,
    name: `${category.name}のお店 ${i + 1}`,
    side: 'north',
    position: i,
    lat,
    lng,
    category: category.name,
    products: category.products,
    description: `${category.name}を扱う老舗のお店です。新鮮な商品を取り揃えています。`,
    icon: category.icon,
  });
}

// 南側（右側）の150店舗
for (let i = 0; i < 150; i++) {
  const category = categories[i % categories.length];
  const lat = startLat - (i * latStep);
  const lng = centerLng + lngOffsetSouth;

  shops.push({
    id: shopId++,
    name: `${category.name}のお店 ${i + 151}`,
    side: 'south',
    position: i,
    lat,
    lng,
    category: category.name,
    products: category.products,
    description: `${category.name}を扱う老舗のお店です。新鮮な商品を取り揃えています。`,
    icon: category.icon,
  });
}
