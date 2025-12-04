# 手書きマップ - 要素追加ガイド

このガイドでは、手書きマップに店舗、人、商品、建物などの要素を追加する方法を説明します。

## 📁 ディレクトリ構造

```
app/(public)/map/
├── page.tsx                           # マップページ
├── components/
│   ├── MapView.tsx                    # メインマップコンポーネント
│   └── MapElementMarker.tsx           # 要素マーカーコンポーネント
├── types/
│   └── mapElements.ts                 # 要素の型定義
├── data/
│   └── sampleElements.ts              # 要素データ（ここを編集）
└── README.md                          # このファイル

public/images/maps/
├── placeholder-map.svg                # プレースホルダー手書きマップ
└── elements/                          # 要素画像（ここに追加）
    ├── shops/                         # 店舗画像
    ├── people/                        # 人物画像
    ├── products/                      # 商品画像
    └── buildings/                     # 建物画像
```

## 🎨 手書きマップの追加手順

### 1. 手書きマップ画像を準備

- 手書きマップを描いて、スキャンまたは撮影
- PNG、JPG、SVG形式で保存
- 推奨サイズ：2000px × 2000px 以上

### 2. 画像を配置

```bash
public/images/maps/nicchyo-handdrawn-map.png
```

### 3. MapView.tsx を更新

`app/(public)/map/components/MapView.tsx` の以下の行を変更：

```typescript
// 変更前
const HANDDRAWN_MAP_IMAGE = '/images/maps/placeholder-map.svg';

// 変更後
const HANDDRAWN_MAP_IMAGE = '/images/maps/nicchyo-handdrawn-map.png';
```

### 4. 表示範囲を調整

実際の地図の範囲に合わせて `MAP_BOUNDS` を調整：

```typescript
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [33.5615, 133.5335], // 北東の座標
  [33.5570, 133.5290], // 南西の座標
];
```

### 5. ベースマップを非表示（オプション）

手書きマップが完成したら、ベースマップを非表示にできます：

```typescript
<TileLayer
  // ... 他のプロパティ
  opacity={0}  // 0 に変更して非表示
/>
```

## 🏪 要素（店舗・人・商品・建物）の追加手順

### 1. 要素画像を準備

各要素のイラストを描いて、画像として保存：

- 推奨形式：PNG（透過背景）またはSVG
- 推奨サイズ：50px × 50px ～ 100px × 100px

### 2. 画像をカテゴリ別に配置

```bash
# 店舗
public/images/maps/elements/shops/yasai-shop.png
public/images/maps/elements/shops/fruit-shop.png

# 人物
public/images/maps/elements/people/tourist-01.png
public/images/maps/elements/people/local-01.png

# 商品
public/images/maps/elements/products/vegetables-basket.png
public/images/maps/elements/products/fruits-box.png

# 建物
public/images/maps/elements/buildings/kochi-castle.png
```

### 3. 座標を測定

手書きマップ上の各要素の位置（緯度・経度）を測定：

- ベースマップを参考にして座標を特定
- または、既知の地点からの相対位置で計算

### 4. データファイルを更新

`app/map/data/sampleElements.ts` を編集：

```typescript
export const sampleMapElements: MapElementsCollection = {
  shops: [
    {
      id: 'shop-001',
      category: 'shop',
      name: '〇〇野菜店',
      description: '新鮮な地元野菜',
      coordinates: {
        lat: 33.5593,  // 実際の緯度
        lng: 133.5312, // 実際の経度
      },
      imagePath: '/images/maps/elements/shops/yasai-shop.png',
      size: { width: 60, height: 60 },
      zIndex: 20,
      shopType: '野菜',
      openingHours: '日曜 6:00-15:00',
    },
    // ... 他の店舗
  ],

  people: [
    {
      id: 'person-001',
      category: 'person',
      name: '観光客',
      coordinates: {
        lat: 33.5592,
        lng: 133.5311,
      },
      imagePath: '/images/maps/elements/people/tourist-01.png',
      size: { width: 40, height: 60 },
      zIndex: 30,
      role: '観光客',
    },
    // ... 他の人物
  ],

  products: [
    // ... 商品データ
  ],

  buildings: [
    // ... 建物データ
  ],
};
```

## 📊 要素のプロパティ説明

### 共通プロパティ

| プロパティ | 型 | 必須 | 説明 |
|----------|-------|------|------|
| `id` | string | ✓ | 一意の識別子 |
| `category` | string | ✓ | 'shop' / 'person' / 'product' / 'building' |
| `name` | string | ✓ | 要素の名前 |
| `description` | string | - | 説明文（ポップアップに表示） |
| `coordinates` | object | ✓ | { lat: 緯度, lng: 経度 } |
| `imagePath` | string | ✓ | 画像のパス |
| `size` | object | - | { width: 幅, height: 高さ } |
| `rotation` | number | - | 回転角度（度）|
| `zIndex` | number | - | 重なり順（大きいほど前面） |
| `opacity` | number | - | 透明度（0-1） |

### カテゴリ別の追加プロパティ

**店舗（shop）:**
- `shopType`: 店舗タイプ（'野菜', '果物', 'スイーツ'など）
- `openingHours`: 営業時間

**人物（person）:**
- `role`: 役割（'観光客', '地元民', '店主'など）

**商品（product）:**
- `productType`: 商品タイプ（'野菜', '果物', '加工品'など）
- `price`: 価格

**建物（building）:**
- `buildingType`: 建物タイプ（'城', '公共施設', '店舗'など）

## 🎯 zIndex の推奨値

要素の重なり順を制御するための推奨値：

- **背景マップ**: 10
- **建物**: 15
- **店舗**: 20
- **商品**: 25
- **人物**: 30

## 💡 ヒント

1. **座標の精度**: 小数点以下4桁まで指定すると約10m単位で配置できます
2. **画像サイズ**: 大きすぎると重なってしまうので、適度なサイズに調整
3. **透過PNG**: 背景を透過することで、地図に自然に溶け込みます
4. **段階的追加**: 一度に全部追加せず、少しずつテストしながら追加
5. **Git管理**: 要素を追加するたびにコミットすることで、変更履歴を管理

## 🚀 確認方法

```bash
npm run dev
```

ブラウザで http://localhost:3000/map にアクセスして、要素が正しく表示されるか確認してください。

## 📝 今後の拡張案

- データベースからの動的読み込み
- 管理画面での要素追加・編集機能
- カテゴリフィルター機能
- 要素の検索機能
- アニメーション効果
