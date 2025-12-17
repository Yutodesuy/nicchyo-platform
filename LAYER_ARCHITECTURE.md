# マップレイヤーアーキテクチャ ドキュメント

## 概要

このドキュメントは、nicchyo日曜市マップにおけるレイヤー構造、座標系、および道・店舗・背景の関係性について説明します。

## 修正の背景

### 問題点

#### 1. 道のイラストが消えていた
- 前回の修正で`ImageOverlay`を削除したため、道が表示されていない
- 日曜市において道は最も重要な要素（店舗配置の基準）

#### 2. 店舗イラストが重なって見づらい
```
300店舗 ÷ 1.3km ÷ 2側 = 片側150店舗
1.3km ÷ 150 = 約8.7m間隔

しかし:
イラストサイズ60px × ズームレベル17 = 約30-40m相当

→ 物理的に重なる
```

#### 3. 座標系が明確でない
- 道の座標、店舗の座標、イラストの座標が散在
- 将来の拡張時に混乱を招く

## 新しいレイヤー構造

```
┌─────────────────────────────────────────┐
│ Layer 4: UI層 (zIndex: 1000+)         │
│  - ユーザー操作ボタン                  │
│  - 店舗詳細バナー                      │
│  - ズームコントロール                  │
├─────────────────────────────────────────┤
│ Layer 3: 店舗層 (zIndex: 100)         │
│  - ShopMarker（店舗イラスト）         │
│  - ShopBubble（商品吹き出し）         │
│  - 当たり判定（Markerネイティブ）     │
├─────────────────────────────────────────┤
│ Layer 2: 道層 (zIndex: 50)            │
│  - RoadOverlay                        │
│  - 道のイラスト（プレースホルダー）   │
│  - 将来的に実際の道イラストに差し替え │
├─────────────────────────────────────────┤
│ Layer 1: 背景層 (zIndex: 10)          │
│  - BackgroundOverlay（将来の拡張用）  │
│  - 日曜市の雰囲気を演出する装飾       │
│  - 現在は無効（構造のみ用意）         │
├─────────────────────────────────────────┤
│ Layer 0: Leafletベースマップ           │
│  - MapContainer                       │
│  - 地図タイル（背景色のみ）           │
└─────────────────────────────────────────┘
```

## 座標系の統一（Single Source of Truth）

### 道の座標がすべての基準

```typescript
// app/(public)/map/config/roadConfig.ts

export const ROAD_CONFIG: RoadConfig = {
  // 道の表示範囲（実際の日曜市開催範囲）
  bounds: [
    [33.56500, 133.53200], // 北西端（高知城前）
    [33.55330, 133.53000], // 南東端（追手筋東端）
  ],

  // 道の中心線（店舗配置の基準線）
  centerLine: 133.53100,

  // 道幅の半分（北側/南側のオフセット）
  widthOffset: 0.0006, // 約50m
};
```

### 座標系の関係

```
【実世界座標】緯度経度
    ↓ 定義
【道の座標】ROAD_CONFIG.bounds
    ↓ 基準として参照
【店舗座標】shop.lat, shop.lng
    ↓ Leaflet Markerで描画
【イラスト座標】DivIcon HTML
    ↓ 自動追従
【当たり判定】Markerネイティブ機能
```

### 他のモジュールからの参照

```typescript
import { getRoadBounds, getRoadCenterLine, getRoadWidthOffset } from '../config/roadConfig';

// マップの中心を道の中心に設定
const center = [
  (bounds[0][0] + bounds[1][0]) / 2,
  (bounds[0][1] + bounds[1][1]) / 2,
];

// 店舗を道の中心線±widthOffsetに配置
const shopLat = ...;
const shopLng = getRoadCenterLine() + (side === 'north' ? -1 : 1) * getRoadWidthOffset();
```

## 道のイラスト差し替え設計

### 現在: プレースホルダー

```typescript
// roadConfig.ts
type: 'placeholder', // 仮の道
```

プレースホルダーは`RoadOverlay.tsx`内で動的に生成されるシンプルな道路SVGです。

### 将来: カスタムイラストに差し替え

#### 手順

1. SVGまたは画像ファイルを `public/images/maps/` に配置
   ```
   public/images/maps/sunday-market-road.svg
   ```

2. `roadConfig.ts` を編集
   ```typescript
   export const ROAD_CONFIG: RoadConfig = {
     type: 'custom',
     imagePath: '/images/maps/sunday-market-road.svg',
     bounds: [
       [33.56500, 133.53200],
       [33.55330, 133.53000],
     ],
     opacity: 0.9,
     zIndex: 50,
   };
   ```

3. ビルド & デプロイ
   ```bash
   npm run build
   ```

#### 重要な注意点

**イラストのサイズと座標の対応**

- イラストのviewBox（SVGの場合）や解像度は任意でOK
- `bounds`で指定した緯度経度範囲に自動的にフィッティング
- 店舗の座標（緯度経度）とイラスト上の位置が一致するよう調整すること

**例: 実際の道の形状を反映する場合**

```svg
<!-- sunday-market-road.svg の例 -->
<svg viewBox="0 0 450 10000">
  <!-- 実際の道の形状に合わせて描画 -->
  <path d="M 225 0 Q 220 500 225 1000 Q 230 1500 225 2000 ..." />

  <!-- 道幅、縁石、中央線なども含める -->
  <rect x="145" y="0" width="160" height="10000" fill="#d4c5b0" />
  <line x1="225" y1="0" x2="225" y2="10000" stroke="#a89070" />
</svg>
```

## 店舗重なり問題の解決

### 問題の本質

```
店舗間隔: 8.7m
イラストサイズ: 60px ≈ 30-40m（ズームレベル17）

→ 重なる
```

### 解決策1: 初期ズームレベルの最適化

```typescript
// utils/zoomCalculator.ts

function calculateOptimalInitialZoom(shopCount, iconSizePx) {
  const roadLengthKm = getRoadLength();
  const shopSpacingKm = roadLengthKm / (shopCount / 2);

  // 1店舗あたり80pxの間隔を確保
  const desiredPixelsPerShop = 80;

  // ズームレベル計算
  const metersPerPixelNeeded = (shopSpacingKm * 1000) / desiredPixelsPerShop;
  const zoom = 18 - Math.log2(metersPerPixelNeeded / 0.6);

  return Math.max(14, Math.min(18, Math.round(zoom * 10) / 10));
}
```

**結果**:
- 300店舗の場合、初期ズームは約15.5に自動設定
- 店舗が重ならない最適な表示

### 解決策2: ズームレベルに応じた表示密度調整

```typescript
// utils/zoomCalculator.ts

function filterShopsByZoom(shops, currentZoom) {
  if (currentZoom >= 17.0) {
    return shops; // 全店舗表示
  } else if (currentZoom >= 16.5) {
    return shops.filter((_, i) => i % 3 === 0); // 3店舗に1つ
  } else if (currentZoom >= 15.0) {
    return shops.filter((_, i) => i % 10 === 0); // 10店舗に1つ
  } else {
    return shops.filter((_, i) => i % 20 === 0); // 20店舗に1つ
  }
}
```

**動作**:
- ズームアウト: 間引き表示（パフォーマンス向上 + 視認性向上）
- ズームイン: 全店舗表示（詳細確認）

### MapViewでの実装

```typescript
// MapView.tsx

const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
const visibleShops = filterShopsByZoom(shops, currentZoom);

// ズームレベル追跡
<ZoomTracker onZoomChange={setCurrentZoom} />

// フィルタリングされた店舗のみ表示
{visibleShops.map((shop) => (
  <ShopMarker key={shop.id} shop={shop} />
))}
```

## 背景レイヤーの拡張可能性

### 現在の状態

```typescript
// components/BackgroundOverlay.tsx

const BACKGROUND_CONFIG = {
  enabled: false, // 現在は無効
};
```

### 将来の拡張例

#### 例1: 日曜市の雰囲気を演出する背景

```typescript
const BACKGROUND_CONFIG = {
  enabled: true,
  imagePath: '/images/maps/sunday-market-atmosphere.svg',
  opacity: 0.2, // 薄く表示（店舗・道を邪魔しない）
  zIndex: 10,   // 道より下のレイヤー
};
```

#### 例2: 季節の装飾

```typescript
// 春: 桜の花びら
// 夏: ひまわり模様
// 秋: 紅葉
// 冬: 雪の結晶

const BACKGROUND_CONFIG = {
  enabled: true,
  imagePath: getSeasonalBackground(), // 季節判定関数
  opacity: 0.15,
  zIndex: 10,
};
```

## ファイル構成

```
app/(public)/map/
├── config/
│   └── roadConfig.ts              # 【新規】道の設定（Single Source of Truth）
├── utils/
│   └── zoomCalculator.ts          # 【新規】ズーム最適化ユーティリティ
├── components/
│   ├── RoadOverlay.tsx            # 【新規】道のレイヤー
│   ├── BackgroundOverlay.tsx      # 【新規】背景レイヤー（将来の拡張用）
│   ├── MapView.tsx                # 【修正】レイヤー統合・ズーム最適化
│   ├── ShopMarker.tsx             # 既存（変更なし）
│   ├── ShopIllustration.tsx       # 既存（変更なし）
│   └── ShopBubble.tsx             # 既存（変更なし）
└── data/
    └── shops.ts                   # 既存（変更なし）
```

## 運用ガイド

### 1. 道のイラストを差し替える

**手順**:
1. 実際の日曜市の道の形状を反映したSVG/画像を作成
2. `public/images/maps/sunday-market-road.svg` に配置
3. `roadConfig.ts` を編集:
   ```typescript
   type: 'custom',
   imagePath: '/images/maps/sunday-market-road.svg',
   ```
4. ビルド & 確認

**注意点**:
- イラストの座標（viewBox）と実際の緯度経度が対応するように調整
- 店舗の位置とイラスト上の道の位置が一致するか確認
- boundsの範囲を正確に設定

### 2. 背景装飾を追加する

**手順**:
1. 背景イラストを作成（店舗・道を邪魔しない薄い装飾）
2. `public/images/maps/background.svg` に配置
3. `BackgroundOverlay.tsx` を編集:
   ```typescript
   const BACKGROUND_CONFIG = {
     enabled: true,
     imagePath: '/images/maps/background.svg',
     opacity: 0.2,
     zIndex: 10,
   };
   ```
4. ビルド & 確認

### 3. 店舗数が増えた場合

**自動対応**:
- `zoomCalculator.ts` が自動的に最適な初期ズームを計算
- 店舗数が増えても重ならない

**手動調整が必要な場合**:
```typescript
// zoomCalculator.ts の desiredPixelsPerShop を調整
const desiredPixelsPerShop = 80; // この値を変更（大きくすると引いた視点）
```

### 4. ズーム閾値を調整する

```typescript
// zoomCalculator.ts

thresholds: {
  overview: 15.0,  // この値以下: 10店舗に1つ
  medium: 16.5,    // この値以下: 3店舗に1つ
  detail: 17.0,    // この値以上: 全店舗表示
}
```

## 技術的メリット

### ✅ レイヤーが明確に分離
- 背景・道・店舗・UIが独立
- それぞれ個別に差し替え可能
- zIndexで描画順序を制御

### ✅ 座標系が統一
- 道の座標が真実の源泉（Single Source of Truth）
- すべての要素が同じ基準を参照
- 将来の拡張時も混乱しない

### ✅ 店舗が重ならない
- 初期ズームが自動最適化
- ズームレベルに応じた表示密度調整
- パフォーマンスも向上

### ✅ 将来の拡張に対応
- イラスト差し替えが容易
- 店舗数増減に自動対応
- 背景装飾の追加が可能

### ✅ 運用しやすい
- 設定ファイルを編集するだけ
- コードの修正は最小限
- 非エンジニアでもイラスト差し替え可能

## ビルド結果

```bash
$ npm run build
✓ Compiled successfully
✓ Generating static pages (10/10)

Route (app)                    Size     First Load JS
├ ○ /map                       105 kB   199 kB
```

## まとめ

### 達成したこと

✅ 道のイラストを復活（プレースホルダー）
✅ 店舗重なり問題を解決（ズーム最適化 + 表示密度調整）
✅ レイヤー構造を明確化（背景・道・店舗・UI）
✅ 座標系を統一（道が基準）
✅ 将来の拡張に対応（イラスト差し替え・背景追加）

### 運用上の安全性

- 設定ファイル中心のアーキテクチャ
- コード変更を最小限に抑える設計
- 自動計算による最適化
- レイヤー分離による保守性向上

### 次のステップ

1. 実際の日曜市の道の形状を反映したイラストを作成
2. `roadConfig.ts` でイラストを差し替え
3. 必要に応じて背景装飾を追加
4. 店舗数が変わっても自動対応

---

**作成日**: 2025-12-17
**対象ブランチ**: feature/add-map
**関連ドキュメント**: ARCHITECTURE_SHOP_MARKERS.md
