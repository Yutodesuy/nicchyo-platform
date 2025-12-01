🌿 nicchyo – Kochi Sunday Market DX Platform

nicchyo は、高知の日曜市を舞台に
「観光客 × 地元民 × 文化のつながり」をデザインする
コミュニティ型 DX プラットフォームです。

マップを中心に、お店提案・郷土料理紹介・ことづて投稿・午後イベントなど、“おせっかい文化” をデジタルで可視化し、自然な交流を生み出します。



🎋 Features

🗺️ 1. マップ（基盤機能）
・出店位置の可視化
・カテゴリ検索・目的別フィルタ
・初めて来た観光客でも迷わない設計

🎯 2. お店提案
・「お土産」「野菜」「スイーツ」など目的からオススメ店舗を表示

🍳 3. 郷土料理提案
・日曜市で買える野菜を使った土佐料理レシピを紹介
・旅行後も利用できる“帰宅後価値”を創出

💬 4. ことづて（軽いつぶやき）
・観光客も地元民も気楽に投稿できる
・「今日のおすすめ」「買ったもの」「発見」を共有

🎲 5. 午後イベント（交流促進）
・将棋・ボードゲームなどの対戦イベント
・日曜市独自のカードゲーム開発
・絵を描くワークショップ
・“おせっかい上級地元民” がホストとして参加
・観光客と地元民の自然な交流を促す



📘 Research Background

nicchyo はプロダクトであると同時に、
地域DX・観光行動科学・文化継承をテーマにした研究プロジェクトです。

研究テーマ例：
・地元民との交流は観光満足度を高めるか
・DX による交流機会の可視化は効果的か
・郷土料理提案は帰宅後の文化愛着を促すか
・観光客の「温かさ」「歓迎感」の定量化
・アプリ利用者と非利用者の印象比較（A/Bテスト）



🛠 Tech Stack
・Next.js 15+
・React
・TypeScript
・Tailwind CSS
・Supabase
・Mapbox / Leaflet
・Prisma



🗂 Directory Structure（予定）
app/
├─ (public)/
│   ├─ map/
│   ├─ suggest/
│   ├─ recipes/
│   ├─ kotodute/
│   ├─ events/
│   └─ research/
└─ (private)/
    ├─ dashboard/
    ├─ events/
    ├─ recipes/
    ├─ kotodute/
    └─ research/



⚙️ Setup
1. Clone the repository
git clone https://github.com/YOUR_NAME/nicchyo-platform.git
cd nicchyo-platform

2. Install dependencies
npm install


3. Create .env file
プロジェクトルートに .env を作成：
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MAPBOX_TOKEN=
※ Supabase と Mapbox から取得してください。

4. Prisma の生成（必要な場合）
npx prisma generate

5. Start development server
npm run dev



アプリは以下で起動します：

👉 http://localhost:3000

🧭 Development Rules
✔ ブランチ運用

main：本番用

dev：開発統合用

feature/xxxx：機能追加用


✔ コミットメッセージ規約

feat: 新機能

fix: バグ修正

docs: ドキュメント更新

style: UI や表記の調整

refactor: リファクタリング


✔ PR（Pull Request）

main へ直接 push 禁止

必ず PR を作成しレビューを通す



🤝 Contributing

後輩や協力者が参加しやすいように
Issues / PR / Discussions を歓迎しています。

特に以下の分野は積極的に募集中：
・UI/UX
・マップ処理
・Supabase
・調査設計・データ分析
・郷土料理コンテンツ制作
・イベント設計



📄 License

This project is licensed under the MIT License.
詳しくは LICENSE ファイルをご覧ください。



🌱 Maintainers
片岡ユウト（Founder）
高知高専・後輩メンバー（Future maintainers）



✨ About nicchyo

nicchyo は「高知の日曜市を、もっと温かく、もっと楽しく。」
という想いから生まれた地域DXプロジェクトです。

人 × 市場 × 文化 × デジタル
その全部をつないで、
“おせっかいの輪” を未来へ受け継ぐことを目指しています。