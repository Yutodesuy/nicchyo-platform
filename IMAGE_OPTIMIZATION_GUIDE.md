# 画像最適化ガイド

## 📊 現状分析

現在、以下の画像が最適化されていません:

### PNG画像（WebP化推奨）
- **public/images/shops/右移動前.png**: 76KB
- **public/images/shops/右移動後.png**: 80KB

### JPG画像（最適化推奨）
- **public/images/recipes/katsuo-don.jpg**: 9.9KB
- **public/images/recipes/buntan-salad.jpg**: 8.0KB
- **public/images/recipes/eggplant-ginger.jpg**: 7.0KB
- **public/images/bag_illustration.jpg**: 6.4KB

**期待される効果**: 画像転送量 **50-70%削減**

---

## 🚀 WebP変換方法

### オプション1: オンラインツール（簡単）

[Squoosh.app](https://squoosh.app/) を使用:
1. ブラウザで https://squoosh.app/ を開く
2. 画像をドラッグ＆ドロップ
3. 右側で「WebP」を選択
4. Quality: 85 に設定
5. ダウンロード

### オプション2: コマンドライン（一括変換）

#### 必要なツールのインストール

```bash
npm install -D sharp-cli
```

#### 一括変換スクリプト

```bash
# shops/ の PNG → WebP
npx sharp -i public/images/shops/*.png -o public/images/shops/ -f webp --quality 85

# recipes/ の JPG → WebP
npx sharp -i public/images/recipes/*.jpg -o public/images/recipes/ -f webp --quality 85

# bag_illustration.jpg → WebP
npx sharp -i public/images/bag_illustration.jpg -o public/images/ -f webp --quality 85
```

---

## 📝 コード変更

WebP変換後、以下のファイルで画像パスを更新:

### 1. ShopDetailBanner.tsx

```typescript
// 変更前
<Image
  src="/images/shops/右移動前.png"
  alt="Shop illustration"
  width={100}
  height={100}
/>

// 変更後
<Image
  src="/images/shops/右移動前.webp"
  alt="Shop illustration"
  width={100}
  height={100}
/>
```

### 2. next.config.js に最適化設定を追加

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

module.exports = nextConfig;
```

---

## 🔄 元の画像のバックアップ

変換前に元の画像をバックアップ:

```bash
# バックアップディレクトリを作成
mkdir -p public/images/.backup

# PNG をバックアップ
cp public/images/shops/*.png public/images/.backup/
cp public/images/bag_illustration.jpg public/images/.backup/

# レシピ画像をバックアップ
cp public/images/recipes/*.jpg public/images/.backup/
```

---

## 📈 効果測定

### 変換前後のサイズ比較

```bash
# 変換前
du -sh public/images/shops/*.png
du -sh public/images/recipes/*.jpg

# 変換後
du -sh public/images/shops/*.webp
du -sh public/images/recipes/*.webp
```

### ブラウザで確認

1. Chrome DevTools → Network タブ
2. Disable cache にチェック
3. ページをリロード
4. 画像の転送サイズを確認

**期待される結果**:
- PNG (76KB + 80KB = 156KB) → WebP (約45KB + 50KB = 95KB) : **39%削減**
- JPG (合計32KB) → WebP (約15KB) : **53%削減**

---

## 🎯 自動化（オプション）

### package.json にスクリプトを追加

```json
{
  "scripts": {
    "optimize:images": "npm run optimize:shops && npm run optimize:recipes && npm run optimize:bag",
    "optimize:shops": "npx sharp -i public/images/shops/*.png -o public/images/shops/ -f webp --quality 85",
    "optimize:recipes": "npx sharp -i public/images/recipes/*.jpg -o public/images/recipes/ -f webp --quality 85",
    "optimize:bag": "npx sharp -i public/images/bag_illustration.jpg -o public/images/ -f webp --quality 85"
  }
}
```

### 実行

```bash
npm run optimize:images
```

---

## ⚠️ 注意事項

1. **Next.js Image コンポーネントを使用**
   - `<img>` タグではなく `<Image>` を使用
   - 自動的に WebP に変換される（next.config.js の設定が必要）

2. **フォールバックを提供**
   - 古いブラウザ対応のため、元の PNG/JPG も残す
   - Next.js が自動的にフォールバック

3. **元の画像は削除しない**
   - 将来の変更に備えて元の画像を保持
   - `.backup/` ディレクトリに保存

---

## ✅ チェックリスト

- [ ] sharp-cli をインストール
- [ ] 元の画像をバックアップ
- [ ] WebP 変換を実行
- [ ] コードで画像パスを更新
- [ ] next.config.js に最適化設定を追加
- [ ] ブラウザで表示を確認
- [ ] DevTools でサイズ削減を確認

---

**作成日**: 2025年（軽量化ブランチ: feature/optimize-map-performance）
