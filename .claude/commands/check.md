# /check

ビルド・型・Lintをまとめて確認する。

```bash
cd /c/Users/miyuk/nicchyo-platform
npx tsc --noEmit --skipLibCheck && npm run lint
```

エラーがあれば内容を報告し、修正案を提示すること。
