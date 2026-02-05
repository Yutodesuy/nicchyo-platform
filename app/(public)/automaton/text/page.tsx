"use client";

import Link from "next/link";
import { BookOpen, Download, Printer, ChevronRight } from "lucide-react";

export default function AutomatonTextPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur print:static print:border-0 print:bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Automaton Text</p>
              <h1 className="text-lg font-bold">オートマトン問題集のための教科書</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
            >
              <Printer className="h-4 w-4" />
              印刷 / PDF保存
            </button>
            <a
              href="/docs/automaton-textbook.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              PDFをダウンロード
            </a>
            <a
              href="/docs/automaton-textbook.md"
              download
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300"
            >
              <Download className="h-4 w-4" />
              MDをダウンロード
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 print:px-0 print:py-0">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">学習ガイド</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                本ページは「/automaton」問題集の出題範囲を、要点整理・定義・典型手順・ミニ例題の形でまとめた教科書です。
                各章を読んでから問題に戻ると、解法の型が見つけやすくなります。印刷してノートに追記できるよう、余白を多めに設計しています。
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">対応する問題</h3>
                  <p className="text-xs text-slate-600">1. 基礎数理 / 2. 言語とオートマトン / 3. 計算可能性 / 4. 複雑さ / 5. 総合演習</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">印刷のコツ</h3>
                  <p className="text-xs text-slate-600">「印刷 / PDF保存」から余白やヘッダー/フッターを調整してください。</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-900">
              <h3 className="mb-3 text-sm font-semibold">学習の進め方</h3>
              <ol className="space-y-2 text-xs leading-relaxed">
                <li className="flex gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600">1</span>
                  <span>章の「定義」と「解法の型」を読む。</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600">2</span>
                  <span>ミニ例題で手順を確認。</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600">3</span>
                  <span>問題集に戻って同じ手順を適用。</span>
                </li>
              </ol>
              <Link href="/automaton" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-700">
                問題集に戻る
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section id="basic-math" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold">第1章 基礎数理（対応: 1.1〜1.25）</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              集合・関数・グラフ・証明の基礎は、計算理論の土台です。ここでは「定義 → 典型定理 → 証明の型」の順で整理します。
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">集合と関数</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• ド・モルガンの法則：否定の配り方を暗記。</li>
                  <li>• 単射・全射・全単射：定義域と終域を常に確認。</li>
                  <li>• 鳩の巣原理：要素数の比較で背理法。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">グラフ理論</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 握手補題：次数の総和は必ず偶数。</li>
                  <li>• オイラー閉路：全頂点が偶数次数。</li>
                  <li>• 奇数次数の頂点数は偶数個。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">証明技法</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 背理法：否定を仮定し矛盾を導く。</li>
                  <li>• 対偶：含意を扱いやすい形に変形。</li>
                  <li>• 0で割らない：式変形の条件を確認。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">ミニ例題</h3>
                <p className="mt-2 text-xs text-slate-700">
                  「5頂点の次数 3,3,3,2,2 のグラフは存在するか？」
                  → 次数の総和が奇数になるため存在しない。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="languages" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold">第2章 言語とオートマトン（対応: 2.1〜2.x）</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              文字列を扱うための「言語」と、その言語を認識する「機械（オートマトン）」を整理します。
              設計問題では、必要な情報を保持する「状態」を正しく定義することが最重要です。
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">正規言語の基礎</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• アルファベット Σ と言語 L ⊆ Σ*。</li>
                  <li>• DFA/NFA：状態遷移図を必ず描く。</li>
                  <li>• 閉包性：連結・和集合・反復で正規言語は保たれる。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">典型設計パターン</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 最初の文字と長さの偶奇を分解して状態にする。</li>
                  <li>• 「開始記号を見たか」「終了記号を見たか」を分ける。</li>
                  <li>• コメント認識などは状態の直列連結で表現。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">文脈自由言語の入口</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• プッシュダウンオートマトンは「スタック」で記憶。</li>
                  <li>• {"0^n 1^n"} のように数を数える言語が代表例。</li>
                  <li>• 生成規則（文法）で表現できる。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">ミニ例題</h3>
                <p className="mt-2 text-xs text-slate-700">
                  「0で始まり長さ偶数、または1で始まり長さ奇数」
                  → 開始文字(0/1)と長さ偶奇(偶/奇)を状態で保持する。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="computability" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold">第3章 計算可能性（対応: 3.x）</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              「解ける問題」と「解けない問題」の境界を扱います。ここではチューリング機械や停止問題が中心となります。
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">主要概念</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 判定可能（decidable）：必ず停止して答える。</li>
                  <li>• 半判定可能（recognizable）：答えが「Yes」の時だけ停止。</li>
                  <li>• チャーチ＝チューリングのテーゼ：計算可能性の統一。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">証明の型</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 対角線論法：自己参照で矛盾を作る。</li>
                  <li>• 既知の非計算可能問題からの帰着。</li>
                  <li>• 「万能な判定器があると仮定して矛盾」。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">代表テーマ</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 停止問題（Halting Problem）。</li>
                  <li>• レンジの空性、言語等価性。</li>
                  <li>• 万能チューリング機械と符号化。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">ミニ例題</h3>
                <p className="mt-2 text-xs text-slate-700">
                  「停止問題が判定可能と仮定すると、自分自身を否定する機械が作れて矛盾」
                  → 背理法 + 対角線論法。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="complexity" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold">第4章 複雑さの階層（対応: 4.1〜4.2）</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              計算量は「時間」と「空間」に分けて整理します。特に P, NP, NP完全性の理解が重要です。
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">時間計算量</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• ビッグオー記法で上界を表す。</li>
                  <li>• P：多項式時間で解ける問題群。</li>
                  <li>• NP：多項式時間で「検証」できる問題群。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">NP完全性</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• NP困難 + NPに属する → NP完全。</li>
                  <li>• 帰着（多項式時間変換）が鍵。</li>
                  <li>• SAT → 3SAT → CLIQUE の流れを確認。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">空間計算量</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• L, NL：対数空間で解けるか。</li>
                  <li>• PSPACE：多項式空間で解ける問題群。</li>
                  <li>• 時間と空間のトレードオフを意識。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">ミニ例題</h3>
                <p className="mt-2 text-xs text-slate-700">
                  「ある問題 X が NP完全と示したい」
                  → 既知のNP完全問題からXへ多項式時間帰着。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="integration" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold">第5章 総合演習（対応: 5.x）</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              複数の概念を組み合わせる問題が増えます。まずは「何を求められているか」を分類し、適切な道具を選びましょう。
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">解法チェックリスト</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 問題は「設計」か「証明」か。</li>
                  <li>• 必要な状態数 / 記憶構造は何か。</li>
                  <li>• 既知問題からの帰着が使えるか。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold">よくある落とし穴</h3>
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  <li>• 定義域・終域の取り違え。</li>
                  <li>• 「閉包性がある」=「自動的に構成できる」と誤解。</li>
                  <li>• 帰着で入力と出力の対応を曖昧にする。</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <h3 className="text-sm font-semibold">仕上げ演習の提案</h3>
                <p className="mt-2 text-xs text-slate-700">
                  章末の問題を解いたら、同じテーマの問題を自分で作ってみましょう。
                  例: 「偶数長の回文を認識する言語」や「NP完全問題の簡易変種」を設計してみる。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm print:border-0 print:shadow-none">
          <h2 className="text-lg font-semibold text-slate-800">補足: 記法と約束</h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed">
            <li>• Σ* は「Σ上の全ての有限長文字列」の集合。</li>
            <li>• L ⊆ Σ* は「言語」を表す。</li>
            <li>• O(f(n)) は計算量の上界を表す。</li>
            <li>• 問題番号は /automaton の問題集に合わせています。</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
