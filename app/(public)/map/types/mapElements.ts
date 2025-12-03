/**
 * マップ要素の型定義
 * 手書きマップ上に配置する店舗、人、商品、建物などの要素を管理
 */

// 要素のカテゴリー
export type ElementCategory = 'shop' | 'person' | 'product' | 'building';

// 座標（緯度・経度）
export interface Coordinates {
  lat: number;
  lng: number;
}

// マップ要素の基本インターフェース
export interface MapElement {
  id: string;
  category: ElementCategory;
  name: string;
  description?: string;
  coordinates: Coordinates;
  imagePath: string;
  size?: {
    width: number;
    height: number;
  };
  rotation?: number; // 回転角度（度）
  zIndex?: number;
  opacity?: number;
}

// 店舗要素
export interface ShopElement extends MapElement {
  category: 'shop';
  shopType?: string; // '野菜', '果物', 'スイーツ', etc.
  openingHours?: string;
}

// 人物要素
export interface PersonElement extends MapElement {
  category: 'person';
  role?: string; // '観光客', '地元民', '店主', etc.
}

// 商品要素
export interface ProductElement extends MapElement {
  category: 'product';
  productType?: string; // '野菜', '果物', '加工品', etc.
  price?: number;
}

// 建物要素
export interface BuildingElement extends MapElement {
  category: 'building';
  buildingType?: string; // '城', '公共施設', '店舗', etc.
}

// すべての要素タイプの共用型
export type AnyMapElement = ShopElement | PersonElement | ProductElement | BuildingElement;

// 要素のコレクション
export interface MapElementsCollection {
  shops: ShopElement[];
  people: PersonElement[];
  products: ProductElement[];
  buildings: BuildingElement[];
}
