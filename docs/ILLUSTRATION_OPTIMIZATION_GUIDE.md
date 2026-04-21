# 手書きイラスト置き換え時の最適化ガイド

**作成日**: 2025年12月28日
**対象**: 店舗マーカーのイラスト置き換え

---

## 📊 現在のパフォーマンス状況

### 軽量化の現状

| 項目 | ズーム16以下 | ズーム17以上 |
|------|-------------|-------------|
| **表示方式** | クラスタ化 | 個別イラスト |
| **DOM要素数** | 10-20個 | 300個 |
| **描画方法** | DOM（クラスタアイコン） | DOM（divIcon） |
| **パフォーマンス** | ⭐⭐⭐⭐⭐ 軽量 | ⭐⭐⭐ 中程度 |

### 完全軽量化版との比較

| 実装 | DOM要素数 | 描画方法 | パフォーマンス |
|------|----------|---------|---------------|
| **Canvas版（最軽量）** | 0個 | Canvas API | ⭐⭐⭐⭐⭐ |
| **現在（イラスト版）** | 300個（展開時） | HTML/SVG | ⭐⭐⭐ |
| **クラスタ化時** | 10-20個 | HTML | ⭐⭐⭐⭐⭐ |

---

## 🎨 手書きイラストに置き換える時の最適化

### 1. ファイル形式の選択

#### 推奨順位

1. **WebP（最推奨）**
   - サイズ: PNG比で25-35%削減
   - 透過対応
   - モダンブラウザ対応
   ```typescript
   illustration: {
     customSvg: '<img src="/illustrations/shop-001.webp" width="60" height="60" />',
   }
   ```

2. **最適化SVG**
   - ベクター形式（拡大縮小に強い）
   - SVGO で最適化
   - 複雑すぎる場合は重い
   ```bash
   # SVG最適化ツール
   npx svgo input.svg -o output.svg
   ```

3. **最適化PNG（非推奨）**
   - サイズが大きい
   - pngquant で圧縮
   ```bash
   pngquant --quality=65-80 input.png -o output.png
   ```

### 2. イラストサイズの最適化

#### サイズガイドライン

| 用途 | サイズ | ファイルサイズ目標 |
|------|--------|-------------------|
| **small** | 45×45px | < 5KB |
| **medium** | 60×60px | < 10KB |
| **large** | 80×80px | < 15KB |

#### 実装例

```typescript
// データ構造
export const shops: Shop[] = [
  {
    id: 1,
    name: "野菜のお店",
    illustration: {
      type: 'custom',
      size: 'medium',
      customSvg: '<img src="/illustrations/vegetable-shop.webp" width="60" height="60" loading="lazy" />',
    },
  },
];
```

### 3. 遅延ロード（Lazy Loading）

#### 実装方法

```typescript
// OptimizedShopLayerWithClustering.tsx の修正案

const iconMarkup = renderToStaticMarkup(
  <div className="shop-marker-container">
    <ShopBubble {...} />

    {shop.illustration?.customSvg ? (
      // カスタムイラスト（手書き）
      <img
        src={shop.illustration.imagePath}
        width={sizeConfig.width}
        height={sizeConfig.height}
        loading="lazy"  // ← ブラウザネイティブの遅延ロード
        decoding="async"  // ← 非同期デコード
        alt={shop.name}
      />
    ) : (
      // フォールバック（SVGテント）
      <ShopIllustration type="tent" size={sizeKey} />
    )}
  </div>
);
```

### 4. スプライトシート（大量の場合）

300店舗全てに異なるイラストを使う場合、スプライトシートが有効。

#### メリット
- HTTPリクエスト数: 300回 → 1回
- 読み込み時間: 大幅削減

#### 実装例

```typescript
{% raw %}
// スプライトシート定義
const SPRITE_POSITIONS = {
  'shop-001': { x: 0, y: 0, width: 60, height: 60 },
  'shop-002': { x: 60, y: 0, width: 60, height: 60 },
  // ...
};

// 使用例
<div
  className="shop-sprite"
  style={{
    backgroundImage: 'url(/illustrations/sprite-sheet.webp)',
    backgroundPosition: `-${pos.x}px -${pos.y}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
  }}
/>
{% endraw %}
```

### 5. キャッシュ戦略

#### Next.js 画像最適化

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [60, 80],  // イラストサイズに合わせる
  },
};
```

#### CDN配信

```typescript
// Vercel/Cloudflare の自動最適化を活用
<img src="/illustrations/shop-001.png" />
// ↓ 自動的に最適化される
// /_next/image?url=/illustrations/shop-001.png&w=60&q=75
```

---

## 📈 パフォーマンス計測

### 実装前にチェック

```javascript
// ブラウザDevToolsで計測
console.time('map-render');
// マップロード
console.timeEnd('map-render');

// メモリ使用量
console.log(performance.memory.usedJSHeapSize / 1024 / 1024 + ' MB');
```

### 目標値

| 指標 | 目標 |
|------|------|
| **初回ロード時間** | < 2秒 |
| **ズーム操作（60fps）** | < 16ms/frame |
| **メモリ使用量** | < 100MB |
| **画像総サイズ** | < 3MB（300店舗） |

---

## 🔄 段階的な移行プラン

### Phase 1: テスト実装（10店舗）
```typescript
// 一部の店舗だけカスタムイラストを試す
shops.slice(0, 10).forEach(shop => {
  shop.illustration = {
    type: 'custom',
    imagePath: `/illustrations/${shop.id}.webp`,
  };
});
```

### Phase 2: パフォーマンス計測
- ロード時間測定
- メモリ使用量チェック
- スクロール・ズームの滑らかさ確認

### Phase 3: 全店舗展開
- 問題なければ全300店舗に適用
- CDN配信の設定
- キャッシュ戦略の最適化

---

## ⚠️ 注意事項

### 避けるべき実装

❌ **Base64埋め込み**
```typescript
// これはNG（HTMLサイズが巨大になる）
customSvg: '<img src="data:image/png;base64,iVBORw0KGgo..." />'
```

❌ **大きすぎるイラスト**
```typescript
// これもNG（100KB超のファイル）
<img src="detailed-illustration.png" />  // 200KB
```

❌ **アニメーションGIF**
```typescript
// 重すぎる
<img src="animated-shop.gif" />  // 500KB
```

### 推奨する実装

✅ **外部ファイル + 遅延ロード**
```typescript
illustration: {
  type: 'custom',
  imagePath: '/illustrations/shop-001.webp',  // 8KB
}
```

✅ **フォールバック**
```typescript
// イラストが読み込めない場合はSVGテント表示
{shop.illustration?.imagePath ? (
  <img src={shop.illustration.imagePath} onError={(e) => {
    e.currentTarget.style.display = 'none';
  }} />
) : (
  <ShopIllustration type="tent" />
)}
```

---

## 📚 参考資料

### ツール
- **SVGO**: SVG最適化 - https://github.com/svg/svgo
- **pngquant**: PNG圧縮 - https://pngquant.org/
- **Squoosh**: 画像圧縮GUI - https://squoosh.app/

### ベンチマーク
- Lighthouse パフォーマンススコア
- Chrome DevTools Performance タブ
- React Developer Tools Profiler

---

**まとめ**: クラスタリングを活用し、画像最適化（WebP、遅延ロード、適切なサイズ）を行えば、手書きイラストでも十分なパフォーマンスを維持できます。
