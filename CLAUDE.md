# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**nicchyo（ニッチョ）** は、高知・日曜市（毎週日曜開催の大規模路上市場）を初来訪者に案内するデジタルマッププラットフォームです。インタラクティブ地図・AI案内・店舗検索・クーポンが中心機能です。

## Commands

```bash
npm run dev        # 開発サーバー起動（ポート3000、使用中なら自動選択）
npm run build      # 本番ビルド（型チェックも実行）
npm run lint       # ESLint
npm test           # Vitestテスト実行（--passWithNoTests付き）
npx vitest run lib/favoriteShops.test.ts  # 単一テストファイルの実行
```

PRを出す前は必ず `npm run build` でビルドが通ることを確認する。

**PRは小さく出す**：チーム開発のためレビューしやすさを優先する。1PRは1つの目的（機能追加・バグ修正・リファクタを混在させない）。目安は変更ファイル10件以内。大きな作業は事前にサブタスクに分割してからPRを作成する。

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 18, TypeScript 5.9
- **Styling**: Tailwind CSS（カスタムパレット: `nicchyo-base/primary/accent/ink/soft-green`）
- **DB**: Supabase（メイン）、Prismaスキーマも存在
- **Map**: Leaflet + react-leaflet（`reactStrictMode: false` ← Leafletの二重初期化防止）
- **AI**: OpenAI API（RAG構成、`app/api/grandma/` と `app/api/map-agent/`）
- **Auth**: Supabase Auth（`lib/auth/AuthContext.tsx`）

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

## Architecture

### ルーティング構造

```
app/
├── (public)/          # 一般ユーザー向けページ
│   ├── map/           # メイン地図ページ（主機能）
│   ├── search/        # 店舗検索
│   ├── bag/           # 買い物リスト
│   ├── coupons/       # クーポン一覧
│   ├── consult/       # AI「にちよさん」チャット
│   ├── shops/[code]/  # 店舗詳細（コードは3桁ゼロ埋め: 001〜300）
│   ├── my-shop/       # 出店者向けページ（QRクーポン確認など）
│   └── ...
├── private/           # 要認証ページ
├── admin/             # 管理者ページ
└── api/               # API Routes
    ├── shops/         # 店舗データ取得・編集
    ├── coupons/       # クーポン発行・確認・換金
    ├── grandma/       # AI「にちよさん」バックエンド
    ├── map-agent/     # マップAIアシスタント
    ├── analytics/     # アクセス解析
    └── vendor/        # 出店者向けAPI
```

### グローバルContext（`app/layout.tsx` で提供）

| Context | ファイル | 役割 |
|---------|---------|------|
| `AuthProvider` | `lib/auth/AuthContext.tsx` | Supabase認証状態管理 |
| `BagProvider` | `lib/storage/BagContext.tsx` | 買い物リスト（ローカルストレージ） |
| `MenuProvider` | `lib/ui/MenuContext.tsx` | ナビゲーションメニュー開閉 |
| `MapLoadingProvider` | `app/components/MapLoadingProvider` | マップ初期ローディング状態 |

### マップページ構造 (`app/(public)/map/`)

マップは最も複雑なページ。レイヤー構造：

```
Layer 4: UI（ボタン・バナー・ズームコントロール）
Layer 3: 店舗層（ShopMarker, ShopBubble）
Layer 2: 道層（RoadOverlay, zIndex: 50）
Layer 1: 背景層（BackgroundOverlay, 現在無効）
Layer 0: Leafletベースマップ
```

- **座標の基準**: `config/roadConfig.ts` がすべての基準（高知城前〜追手筋東端）
- **店舗表示の間引き**: ズームレベルに応じて `utils/zoomCalculator.ts` が密度調整
- **データ取得**: `fetch-map-data.ts` でサーバーサイド取得 → `MapPageClient.tsx` に渡す
- **店舗DBアクセス**: `services/shopDb.ts`, `services/shopDataService.ts`

### 店舗コード体系

店舗IDは1〜300の整数。URLパラメータ・QRコードでは3桁ゼロ埋め文字列（`001`〜`300`）。変換は `lib/shops/route.ts` の `normalizeShopCodeToId` / `formatShopIdToCode` を使う。

`next.config.js` に `/shops001` → `/shops/001` のリライトルールあり。

### クーポン機能 (feature/Coupon ブランチで開発中)

- 市場開催日（日曜日）にのみクーポンフィルターが表示される
- 開発中は `isMarketDay` を強制 `true` にする DEV フラグあり（コミット `c052209` 参照）
- API: `app/api/coupons/`、出店者確認: `my-shop/coupon`（カメラ権限必要）

### テスト

Vitest + jsdom + React Testing Library。テストファイルは対象ファイルと同階層か `__tests__/` に置く（例: `lib/favoriteShops.test.ts`）。カバレッジ対象は `lib/**` と `components/**`。

### Tailwindカラーパレット

```
nicchyo-base:       #FFFAF0  （背景・クリーム色）
nicchyo-primary:    #7ED957  （メイン緑）
nicchyo-accent:     #FFDE59  （アクセント黄）
nicchyo-ink:        #3A3A3A  （テキスト）
nicchyo-soft-green: #A0D7A7  （淡い緑）
```

## Coding Conventions

- ルート名: kebab-case、コンポーネント: PascalCase、変数/関数: camelCase
- クライアントコンポーネントには `"use client"` を明示
- ページ固有のコンポーネントはそのページディレクトリ内の `components/` に置く
- 共通UIコンポーネントは `components/ui/`（Radix UIベース）
- 管理画面コンポーネントは `components/admin/`
- ユーティリティ関数は `lib/utils/cn.ts`（`clsx` + `tailwind-merge` のラッパー）

## 重要な制約

- `reactStrictMode: false` は意図的（Leaflet互換性のため変更しない）
- Supabase Storageの画像URLは `*.supabase.co` ドメイン（`next.config.js` の `remotePatterns` に設定済み）
- `/my-shop/coupon` ページのみカメラ権限を許可（Permissions-Policy設定あり）
