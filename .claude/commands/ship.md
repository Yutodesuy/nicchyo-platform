# /ship

PRを出す前の最終チェックを行う。

以下の順番で確認する：

1. `npx tsc --noEmit --skipLibCheck` — 型エラーがないか
2. `npm run lint` — Lintエラーがないか
3. `npm test` — テストが通るか
4. `git diff --stat HEAD` — 変更ファイルの確認
5. `npm run build` — 本番ビルドが成功するか

すべて通過したら「出荷OK」と報告する。失敗があれば修正してから再チェックする。
