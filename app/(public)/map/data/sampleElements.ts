import type { MapElementsCollection } from '../types/mapElements';

/**
 * マップ要素のサンプルデータ
 *
 * 実際の要素データが揃うまでのプレースホルダーです。
 * 手書きマップと実際の要素画像が完成したら、このファイルを更新してください。
 *
 * 更新手順：
 * 1. 要素画像を public/images/maps/elements/{category}/ に配置
 * 2. 手書きマップ上の実際の座標を測定
 * 3. 以下のデータを実際の値に更新
 */

export const sampleMapElements: MapElementsCollection = {
  // 店舗要素 - 追手筋の道路両側に配置
  shops: [
    // 道の西側（左側）の店舗
    {
      id: 'shop-west-001',
      category: 'shop',
      name: '野菜屋さん（西側）',
      description: '新鮮な地元野菜',
      coordinates: {
        lat: 33.5600,
        lng: 133.5308, // 西側（道の左）
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '野菜',
    },
    {
      id: 'shop-west-002',
      category: 'shop',
      name: '果物屋さん（西側）',
      description: '季節のフルーツ',
      coordinates: {
        lat: 33.5595,
        lng: 133.5308,
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '果物',
    },
    {
      id: 'shop-west-003',
      category: 'shop',
      name: '漬物屋さん（西側）',
      description: '土佐の漬物',
      coordinates: {
        lat: 33.5590,
        lng: 133.5308,
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '加工品',
    },
    {
      id: 'shop-west-004',
      category: 'shop',
      name: '花屋さん（西側）',
      description: '季節の花',
      coordinates: {
        lat: 33.5585,
        lng: 133.5308,
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '花',
    },

    // 道の東側（右側）の店舗
    {
      id: 'shop-east-001',
      category: 'shop',
      name: 'スイーツ屋さん（東側）',
      description: '手作りスイーツ',
      coordinates: {
        lat: 33.5600,
        lng: 133.5314, // 東側（道の右）
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: 'スイーツ',
    },
    {
      id: 'shop-east-002',
      category: 'shop',
      name: '魚屋さん（東側）',
      description: '新鮮な鮮魚',
      coordinates: {
        lat: 33.5595,
        lng: 133.5314,
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '魚',
    },
    {
      id: 'shop-east-003',
      category: 'shop',
      name: 'お茶屋さん（東側）',
      description: '土佐茶',
      coordinates: {
        lat: 33.5590,
        lng: 133.5314,
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: 'お茶',
    },
    {
      id: 'shop-east-004',
      category: 'shop',
      name: '雑貨屋さん（東側）',
      description: '手作り雑貨',
      coordinates: {
        lat: 33.5585,
        lng: 133.5314,
      },
      imagePath: '/images/maps/elements/shops/placeholder-shop.svg',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '雑貨',
    },
  ],

  // 人物要素 - 道を歩く人々
  people: [
    {
      id: 'person-001',
      category: 'person',
      name: '観光客（サンプル）',
      coordinates: {
        lat: 33.5592,
        lng: 133.5311, // 道の中央
      },
      imagePath: '/images/maps/elements/people/placeholder-person.svg',
      size: { width: 40, height: 60 },
      zIndex: 30,
      role: '観光客',
    },
    {
      id: 'person-002',
      category: 'person',
      name: '地元の方（サンプル）',
      coordinates: {
        lat: 33.5588,
        lng: 133.5311, // 道の中央
      },
      imagePath: '/images/maps/elements/people/placeholder-person.svg',
      size: { width: 40, height: 60 },
      zIndex: 30,
      role: '地元民',
    },
    {
      id: 'person-003',
      category: 'person',
      name: '買い物客（サンプル）',
      coordinates: {
        lat: 33.5597,
        lng: 133.5309, // 西側の店舗前
      },
      imagePath: '/images/maps/elements/people/placeholder-person.svg',
      size: { width: 40, height: 60 },
      zIndex: 30,
      role: '観光客',
    },
  ],

  // 商品要素 - 店舗の前に配置
  products: [
    {
      id: 'product-001',
      category: 'product',
      name: '野菜バスケット（サンプル）',
      description: '新鮮野菜の詰め合わせ',
      coordinates: {
        lat: 33.5600,
        lng: 133.5309, // 西側野菜屋の前
      },
      imagePath: '/images/maps/elements/products/placeholder-product.svg',
      size: { width: 50, height: 50 },
      zIndex: 25,
      productType: '野菜',
    },
    {
      id: 'product-002',
      category: 'product',
      name: 'フルーツバスケット（サンプル）',
      description: '季節のフルーツ',
      coordinates: {
        lat: 33.5595,
        lng: 133.5309, // 西側果物屋の前
      },
      imagePath: '/images/maps/elements/products/placeholder-product.svg',
      size: { width: 50, height: 50 },
      zIndex: 25,
      productType: '果物',
    },
  ],

  // 建物要素
  buildings: [
    {
      id: 'building-001',
      category: 'building',
      name: '高知城（サンプル）',
      description: '日曜市のシンボル',
      coordinates: {
        lat: 33.5595,
        lng: 133.5315,
      },
      imagePath: '/images/maps/elements/buildings/placeholder-building.svg',
      size: { width: 60, height: 80 },
      zIndex: 15,
      buildingType: '城',
    },
  ],
};

/**
 * すべての要素を1つの配列にまとめて返す
 */
export const getAllElements = (): Array<any> => {
  return [
    ...sampleMapElements.shops,
    ...sampleMapElements.people,
    ...sampleMapElements.products,
    ...sampleMapElements.buildings,
  ];
};
