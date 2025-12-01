▼ 相手AIにそのまま渡すプロンプト（app/public/map 一式＋ことづて統合用）

あなたは「nicchyo研究プロジェクト」のフロントエンドエンジニア兼UXデザイナーです。
このプロジェクトの目的は、高知の日曜市をデジタルの力で「未来につなぐ」ことです。

ブランド思想は「伝統の意味を未来へつなぐ」であり、
観光客 × 地元民 × 文化のつながり をデザインする DX プラットフォームです。

0. 前提情報（必ず理解してから設計してください）
🌿 プロダクトの世界観

nicchyo は、高知の日曜市のマップを基盤に、

🗺 マップ

🎯 お店提案（suggest）

🍳 郷土料理（recipes）

💬 ことづて（kotodute）

🎲 午後イベント（events）

をつないで、「おせっかい文化」をデジタルに可視化する プロジェクトです。

同時に、地域DX・観光行動科学・文化継承の研究プロジェクトでもあります。
UI の導線やフィルタは、後から行動ログを分析できるように設計することが大事です。

🛠 技術スタック（プロジェクト全体）

Next.js 15+（App Router）

React + TypeScript

Tailwind CSS

Supabase

Mapbox / Leaflet（マップ描画）

Prisma（将来的な DB スキーマ）

🗂 ディレクトリ（予定）

app/(public)/map は README で次のように定義されています：

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


今回あなたには、app/(public)/map 以下をまるごと設計・実装してもらいます。

1. この map ページが担う機能（役割の整理）

app/public/map/page.tsx は、次の機能を持つ「ハブページ」です：

日曜市のマップ表示（VendorMap）

出店者（Vendor）の場所・ジャンルを可視化

ズーム・パン・モバイル対応

サイドバー／一覧（Sidebar + VendorList）

ベンダーの簡易情報リスト表示

カテゴリや目的でのフィルタ

mapsuggest（おばちゃんのおすすめプラン機能）

右下に「おすすめプラン」ボタン

押すとおばちゃん UI が出て、3つ程度のプランを提示
例：

旬のおいしい野菜を買いたい

土佐の伝統品に興味がある

おまかせランダム

プランを選ぶと、該当するお店のアイコンがハイライトされる

ことづて統合（ことづての実際の閲覧・投稿UI） ← 重要

出店者のピン or カードを押したときに表示される
Vendor 詳細ポップアップ（もしくは下部パネル）の中で、ことづてを表示する。

ことづて説明ページ /public/kotodute は「コンセプト説明」専用であり、
実際の「ことづて投稿・閲覧」は map 内で行う 前提。

Vendor 詳細 UI には最低限：

直近のことづて一覧（数件）

自分のことづて投稿用の簡易フォーム（テキストエリア＋送信ボタン。v0 ではダミー送信でもOK）

他機能との導線

郷土料理ページ /public/recipes への導線

イベントページ /public/events への導線

ことづて説明ページ /public/kotodute へのリンク（「ことづてって何？」的な）

2. ディレクトリ構成をまず設計してください

まず、app/public/map 以下のディレクトリ構成を テキストで提案してから コードを書いてください。

例（改善 OK）：

app/
└─ public/
   └─ map/
      ├─ page.tsx
      ├─ _components/
      │   ├─ MapPageLayout.tsx
      │   ├─ VendorMap.tsx
      │   ├─ VendorMarker.tsx
      │   ├─ VendorDetailPanel.tsx
      │   ├─ Sidebar.tsx
      │   ├─ VendorList.tsx
      │   ├─ VendorCard.tsx
      │   ├─ MapSuggestButton.tsx
      │   ├─ MapSuggestController.tsx
      │   ├─ MapSuggestPlanMenu.tsx
      │   ├─ KotoduteSection.tsx        // ← ベンダー詳細内のことづて表示
      │   └─ KotoduteForm.tsx           // ← 投稿フォーム
      ├─ _hooks/
      │   ├─ useVendors.ts
      │   ├─ useMapSuggest.ts
      │   └─ useKotodute.ts             // ← ことづての読み書き（今はモックでOK）
      ├─ _types/
      │   └─ mapTypes.ts
      └─ _utils/
          └─ vendorFilter.ts


必須条件：

エントリーページは app/public/map/page.tsx

マップ／サイドバー／MapSuggest／ことづては 別コンポーネントに分離すること

型定義は _types/mapTypes.ts のようにまとめておくこと

3. データスキーマ設計（TypeScript 型）

README と mapsuggest・ことづて統合の要件を踏まえ、以下の型を定義してください。

// app/public/map/_types/mapTypes.ts
export type VendorGenre =
  | "vegetable"
  | "fruit"
  | "fish"
  | "traditional"
  | "snack"
  | "drink"
  | "other";

export interface Vendor {
  id: string;
  name: string;
  genre: VendorGenre;
  shortDescription: string;
  tags: string[];        // "seasonal", "traditional", "family_friendly" など
  boothId: string;
  area: "east" | "center" | "west";
  streetSide: "north" | "south";
  lat: number;
  lng: number;
}

export type MapSuggestPlanId =
  | "seasonal_veggies"
  | "traditional_goods"
  | "random"
  | string;

export interface MapSuggestPlan {
  id: MapSuggestPlanId;
  label: string;          // UI表示用
  description: string;    // おばちゃん吹き出し向け
  vendorFilterType: "tag" | "explicitIds" | "random";
  vendorTagKeys?: string[];
  vendorIds?: string[];
  maxResults?: number;
}

// ことづて（map 内での閲覧・投稿用の簡易型）
export interface Kotodute {
  id: string;
  vendorId: string;
  authorType: "visitor" | "local" | "vendor";
  authorName?: string;       // 匿名前提なら optional
  message: string;
  createdAt: string;         // ISO 文字列 or Date
}


※ 実際のコードでは、必要に応じて拡張して構いません。
※ ことづての取得・投稿は、v0 ではモック配列 or ダミー関数で OK（将来 Supabase 接続予定）。

4. コンポーネント設計
4-1. page.tsx の責務（極小にすること）

app/public/map/page.tsx に 書いてよいことは最小限 にしてください：

useVendors などで Vendor の一覧を取得（今はモックデータでOK）

必要な状態管理：

highlightedVendorIds（MapSuggest から渡される）

activePlanId

selectedVendorId（Vendor 詳細／ことづて表示の対象）

それらを下位コンポーネントに渡すだけ

UI の詳細実装は、すべて _components/ に切り出してください。

4-2. VendorMap コンポーネント

役割：

Mapbox / Leaflet などで日曜市の通りを描画

vendors の位置にピンを表示

highlightedVendorIds を受け取り、ピンの見た目を変える

ピンをクリックしたら onVendorSelect(vendorId) を呼ぶ

Props 例：

interface VendorMapProps {
  vendors: Vendor[];
  highlightedVendorIds?: string[];
  selectedVendorId?: string | null;
  onVendorSelect?: (vendorId: string) => void;
}


※ v0 では、Mapbox 実装が難しければ、
簡易的な div レイアウトでも構いません（後で差し替え前提）。

4-3. サイドバー (Sidebar, VendorList, VendorCard)

役割：

サイドバーに出店者リストを表示

フィルタ（ジャンル・エリアなど）

カードクリックで onVendorSelect を呼ぶ

4-4. Vendor 詳細 + ことづて UI
VendorDetailPanel

役割：

選択された Vendor の詳細表示

下部にことづて一覧 + 投稿フォームを表示する

Props 例：

interface VendorDetailPanelProps {
  vendor: Vendor | null;
  kotodutes: Kotodute[];
  onKotoduteSubmit: (text: string) => void;
}


パネル構成例：

上部：店名、ジャンル、説明

中央：簡易情報（エリア、得意商品など）

下部：ことづてセクション（KotoduteSection コンポーネント）

KotoduteSection + KotoduteForm

KotoduteSection：

指定 vendorId のことづて一覧を表示（最新数件）

KotoduteForm：

短いテキスト入力 + 送信ボタン

v0 では：

ローカル state へ追加するだけでも可

将来 Supabase に送る API 呼び出しへ差し替え

4-5. MapSuggest（おばちゃん UI）

mapsuggest-spec に従い、次を実装：

右下のボタン (MapSuggestButton)

押すとおばちゃん UI が開く

おばちゃんポップアップ (MapSuggestController)

おばちゃんアイコン＋吹き出し

3つのプランボタン：

旬のおいしい野菜を買いたい

土佐の伝統品に興味がある

おまかせランダム

プラン選択時：

vendors から該当 vendorIds を計算

親に onHighlightChange(vendorIds, planId) を渡す

Props 例：

interface MapSuggestControllerProps {
  vendors: Vendor[];
  onHighlightChange: (vendorIds: string[], planId: MapSuggestPlanId | null) => void;
}

5. 状態管理の流れ（疑似コードで示してください）

あなたの回答の中で、
MapPage の簡易コード例を必ず書いてください。例：

export default function MapPage() {
  const vendors = useVendors(); // まずはモック実装でOK

  const [highlightedVendorIds, setHighlightedVendorIds] = useState<string[]>([]);
  const [activePlanId, setActivePlanId] = useState<MapSuggestPlanId | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const { kotodutes, addKotodute } = useKotodute(); // vendorId ごとに管理する簡易 hook

  const selectedVendor = vendors.find(v => v.id === selectedVendorId) ?? null;
  const selectedVendorKotodutes = kotodutes.filter(k => k.vendorId === selectedVendorId);

  return (
    <MapPageLayout>
      <VendorMap
        vendors={vendors}
        highlightedVendorIds={highlightedVendorIds}
        selectedVendorId={selectedVendorId}
        onVendorSelect={setSelectedVendorId}
      />

      <Sidebar
        vendors={vendors}
        highlightedVendorIds={highlightedVendorIds}
        selectedVendorId={selectedVendorId}
        onVendorSelect={setSelectedVendorId}
      />

      <VendorDetailPanel
        vendor={selectedVendor}
        kotodutes={selectedVendorKotodutes}
        onKotoduteSubmit={(text) => {
          addKotodute(selectedVendorId, text);
          // TODO: logEvent("kotodute_posted")
        }}
      />

      <MapSuggestController
        vendors={vendors}
        onHighlightChange={(ids, planId) => {
          setHighlightedVendorIds(ids);
          setActivePlanId(planId);
          // TODO: logEvent("mapsuggest_plan_selected", { planId });
        }}
      />
    </MapPageLayout>
  );
}


実装時には、Tailwind クラスも含めた具体的なコードを書いてください。

6. スタイル・アニメーションの方針

全体：bg-slate-950 + text-slate-50 ベースのダークトーン

マップ領域：

余白を取りすぎず、スマホでも見やすい比率

Vendor 詳細パネル：

下部 or 横のスライドインレイアウトを検討

MapSuggest：

ボタンは読み込み後 1 回だけふわっとアニメーション

ハイライトピンは scale + shadow の軽い動き

Tailwind ベースで className を具体的に書いてください。

7. 研究用ログの設計（コメントで方針を書いてください）

下記のようなログを取る想定で、
コンポーネント内に // TODO: logEvent(...) コメントを入れてください。

mapsuggest_opened

mapsuggest_plan_selected

vendor_selected（マップ or サイドバー）

kotodute_opened（Vendor 詳細でことづてが見られた）

kotodute_posted

8. 出力フォーマット

あなたの回答は、次の順番で構成してください：

app/public/map のディレクトリ構成案（テキスト）

_types/mapTypes.ts に定義する型

主要コンポーネントの責務と props 一覧

page.tsx の実装コード（動くレベル）

VendorMap / Sidebar / VendorDetailPanel / MapSuggestController の実装コード

Tailwind を用いた最低限の UI 付きで

ログ設計・拡張アイデアのメモ（コメント or テキスト）

以上を踏まえて、まずは 1. ディレクトリ構成案 から順に出力を始め、
その後 TypeScript + React + Tailwind の具体コードを提示してください。