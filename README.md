nichyo | Kochi Sunday Market DX Platform
=========================================

nicchyo は高知・日曜市の「見つける・歩く・交流する」をつなぐコミュニティ型プロダクトです。マップを中心に、買い物リスト、レシピ、ことづて（掲示板）を用意し、現地体験をデジタルで補助します。

提供中の主な機能
------------------
- マップ: 出店位置の表示、ズーム別の店表示、ショップ詳細バナー、AIアシスタント
- 検索: カテゴリ・キーワード・ブロック番号で店舗検索
- 買い物リスト: バッグ追加、カテゴリ別表示、店舗タグ、削除・リセット
- レシピ: 買い物リスト連動のおすすめ、詳細ページ
- ことづて: 全体/店舗宛の投稿・一覧
- おすすめ/投稿一覧ページ

先送り中
---------
- 午後イベント機能（現時点では未実装）

主要技術
--------
- Next.js 16 (App Router, Turbopack)
- React / TypeScript
- Tailwind CSS
- Leaflet (地図)

ディレクトリ
------------
- app/(public)/map: マップ UI
- app/(public)/search: 店舗検索
- app/(public)/bag: 買い物リスト
- app/(public)/recipes: レシピ
- app/kotodute: ことづて
- lib/: 共通データ・ユーティリティ
- public/: 画像・静的アセット

セットアップ
------------
1) 依存関係  
`npm install`

2) 環境変数 (`.env` など)  
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MAPBOX_TOKEN=
```

3) 開発サーバ  
`npm run dev`

4) ビルド  
`npm run build`

備考
----
- `node_modules/` と `.next/` はコミット対象外。
- イベント機能は未提供のため README では「先送り」に記載。
