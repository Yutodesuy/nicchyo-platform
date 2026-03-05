## 概要
ShopManageUI を中心に、出店者向けの管理UIと関連データ基盤を追加・改善しました。あわせて、マップ/検索/導線周辺の店舗データ参照を整理し、分析ページとホーム訪問計測APIを追加しています。

## 主な変更点
- 出店者向けUIの拡張
- `app/(public)/my-shop` の画面を再構成（トップ、詳細、コンテンツ、スケジュール）
- `app/(public)/shops/[shopCode]/page.tsx` を追加し、店舗コードベースの導線を追加
- 出店者ログイン周辺の導線/表示を調整

- データモデル・API・マイグレーション追加
- `vendors` / `categories` / `products` / `seasons` / `product_seasons` / `market_locations` などのテーブル追加
- RLS 有効化マイグレーションを追加
- `app/api/shops/route.ts` 追加
- 店舗データ取得ロジック（`shopDb.ts`、`lib/hooks/useShops.ts` など）を追加

- 分析機能の追加
- `app/analysis/page.tsx` と `VisitorTrendSwitcher` を追加
- `app/api/analytics/home-summary/route.ts` / `home-visit/route.ts` を追加

- 既存画面の連携調整
- マップ・検索・ホーム・ことづて・相談周辺で、店舗情報参照と表示を調整
- `next.config.js` など関連設定を更新

## 影響範囲
- 出店者向け画面（`my-shop`、`shops/[shopCode]`）
- 店舗データ参照（map/search/home/kotodute/consult）
- Supabase マイグレーション
- 分析ページと分析API

## 確認観点
- 出店者画面にログイン後、対象店舗情報が正しく表示・編集できること
- マップ/検索/ホームで店舗情報表示に欠損がないこと
- `supabase db push` 適用後に新規テーブル・RLS が想定通り反映されること
- 分析ページでホーム訪問統計が取得・表示されること

## テスト
- [ ] `npm run build`
- [ ] 主要画面の手動確認（my-shop / map / search / home）
- [ ] Supabase マイグレーション適用確認

## 補足
差分が大きいため、レビューは以下順でお願いします。
1. `my-shop` 系UIと導線
2. DBマイグレーション（新規テーブル・RLS）
3. マップ/検索/ホームのデータ参照変更
4. 分析ページ・分析API
