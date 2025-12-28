# 道路の形状切り替えガイド

## 現在の状態

現在のマップは **曲線の道** を使用しています（`日曜市マップ_高知市.pdf` に基づく）。

- 7つのセグメント（六丁目、五丁目、四丁目、三丁目、二丁目、一丁目、七丁目）
- PDFの地図に基づいた実際の道の曲線を再現

## 元の直線の道に戻す方法

### 方法1: typeを変更（最も簡単）

`roadConfig.ts` の `ROAD_CONFIG.type` を変更：

```typescript
export const ROAD_CONFIG: RoadConfig = {
  type: 'placeholder',  // 'curved' → 'placeholder' に変更
  // ... その他の設定はそのまま
};
```

### 方法2: バックアップファイルから復元

```bash
cp app/(public)/map/config/roadConfig.backup.ts app/(public)/map/config/roadConfig.ts
```

## 曲線の道に戻す方法

`roadConfig.ts` の `ROAD_CONFIG.type` を `'curved'` に変更：

```typescript
export const ROAD_CONFIG: RoadConfig = {
  type: 'curved',  // 'placeholder' → 'curved' に変更
  // ... その他の設定はそのまま
  segments: [
    // セグメント定義が必要
  ],
};
```

## ファイル構成

- `roadConfig.ts` - 現在使用中の道路設定（曲線の道）
- `roadConfig.backup.ts` - 元の直線の道のバックアップ
- `ROAD_SHAPE_GUIDE.md` - このガイド

## 実装の詳細

### 曲線道路（curved）
- PDFの地図（1丁目～7丁目）に基づく
- 7つのセグメントで曲線を表現
- 各セグメントが独立した座標とcenterLineを持つ

### 直線道路（placeholder）
- シンプルな1本の直線
- 北西端から南東端まで
- 1つのバウンディングボックスで定義
