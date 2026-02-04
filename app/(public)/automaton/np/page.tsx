"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, Network, Scale } from "lucide-react";
import Link from "next/link";
import { ComplexityEuler, ComplexityHierarchy } from "./ComplexityVis";

export default function NPPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/automaton" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BrainCircuit className="text-indigo-600 w-6 h-6" />
            Complexity Theory Guide
          </h1>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white py-16 px-4 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">P vs NP と計算複雑性</h2>
          <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl mx-auto">
            「解くのが難しい問題」と「答え合わせが簡単な問題」。<br/>
            計算機科学における最大の未解決問題であり、現代暗号技術の根幹をなす理論を視覚的に解説します。
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 space-y-12">

        {/* Section 1: P vs NP */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Network className="w-6 h-6 text-indigo-500" />
              P, NP, そして NP完全
            </h3>
            <p className="mt-2 text-gray-600">
              問題の難しさを分類する最も基本的なクラスの関係性です。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="flex flex-col justify-center">
               <ComplexityEuler />
               <p className="text-center text-xs text-gray-400 mt-4">
                 ※ P ≠ NP と仮定した場合の包含関係図
               </p>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-2 border-l-4 border-emerald-500 pl-3">P (Polynomial Time)</h4>
                <p className="text-gray-600 leading-relaxed text-sm">
                  「多項式時間」で解ける問題。コンピュータで現実的な時間内に解ける問題です。
                  <br/><span className="text-xs text-gray-400">例: ソート、最短経路問題、最大公約数</span>
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-2 border-l-4 border-blue-500 pl-3">NP (Nondeterministic Polynomial)</h4>
                <p className="text-gray-600 leading-relaxed text-sm">
                  「答え」が与えられたら、それが正しいかどうかを多項式時間で「検算」できる問題。
                  <br/><span className="text-xs text-gray-400">例: 数独、ジグソーパズル、ハミルトン閉路</span>
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                 <h4 className="font-bold text-purple-800 mb-1">NP完全 (NP-Complete)</h4>
                 <p className="text-purple-700 text-sm">
                   NPの中で最も難しい問題たち。もしこれが一つでも多項式時間で解けたら、すべてのNP問題が解けることになります（P=NP問題）。
                   <br/>代表例: 3-SAT, 巡回セールスマン問題(判定版)
                 </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Hierarchy */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
             <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Scale className="w-6 h-6 text-amber-500" />
              時間と空間の階層
            </h3>
            <p className="mt-2 text-gray-600">
              計算に必要な「時間」だけでなく、「メモリ（空間）」による分類もあります。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8 items-start">
             <div className="order-2 md:order-1 space-y-6">
                <div className="prose prose-sm text-gray-600">
                    <p>
                        計算複雑性クラスは、包含関係による階層構造をなしています。
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong className="text-cyan-600">L (Log Space)</strong>:
                            指数の位置を覚える程度のわずかなメモリで解ける問題。
                        </li>
                        <li>
                            <strong className="text-emerald-600">P</strong>:
                            多項式時間で解ける問題。Lを含みます (L ⊆ P)。
                        </li>
                        <li>
                            <strong className="text-amber-600">PSPACE</strong>:
                            使えるメモリが多項式量であれば、時間はいくらかかっても良いクラス。NPを含みます (NP ⊆ PSPACE)。
                        </li>
                    </ul>
                    <div className="mt-4 text-xs bg-gray-100 p-3 rounded border border-gray-200">
                        <strong className="block mb-1">包含関係の定理:</strong>
                        <span className="font-mono text-indigo-700">L ⊆ NL ⊆ P ⊆ NP ⊆ PSPACE ⊆ EXPTIME</span>
                        <br/>
                        <span className="text-gray-500 mt-1 block">
                            これらが真部分集合かどうか（＝ではないか）は、L ≠ PSPACE など一部を除き、多くが未解決です。
                        </span>
                    </div>
                </div>
             </div>
             <div className="order-1 md:order-2">
                <ComplexityHierarchy />
             </div>
          </div>
        </section>

        {/* Section 3: Details */}
        <section className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 pl-4 border-l-4 border-indigo-500">
                教科書的な定義と直感
            </h3>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    多項式時間 (Polynomial Time) とは？
                </h4>
                <p className="text-gray-700 leading-7 text-sm">
                    入力サイズを <span className="font-mono bg-gray-100 px-1 rounded">n</span> としたとき、計算ステップ数が <span className="font-mono bg-gray-100 px-1 rounded">n²</span> や <span className="font-mono bg-gray-100 px-1 rounded">n³</span> のような多項式 <span className="font-mono bg-gray-100 px-1 rounded">O(nᵏ)</span> で抑えられるアルゴリズムを指します。<br/>
                    対して、<span className="font-mono bg-gray-100 px-1 rounded">2ⁿ</span> のような指数時間は、入力が少し増えるだけで計算時間が爆発的に増えるため、大規模なデータに対しては現実的ではありません。<br/>
                    <strong>「多項式時間 ＝ 現実的に計算可能」</strong>という合意が理論計算機科学の基礎にあります。
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    対数空間 (Logarithmic Space) とは？
                </h4>
                <p className="text-gray-700 leading-7 text-sm">
                    入力テープ（読み込み専用）とは別に、作業用テープとして <span className="font-mono bg-gray-100 px-1 rounded">log n</span> 程度の領域しか使えない制限です。<br/>
                    <span className="font-mono bg-gray-100 px-1 rounded">log n</span> ビットあれば、<span className="font-mono bg-gray-100 px-1 rounded">0</span> から <span className="font-mono bg-gray-100 px-1 rounded">n</span> までの数値を表現できるため、「入力のどこを見ているか（ポインタ）」や「少数のカウンタ」程度しか記憶できません。<br/>
                    この極めて厳しい制約の中でも、足し算や掛け算、グラフの到達可能性判定（無向グラフ）などが可能であることが知られています。
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    NP困難 (NP-Hard) と NP完全 (NP-Complete)
                </h4>
                <p className="text-gray-700 leading-7 text-sm mb-4">
                    よく混同される概念ですが、明確な違いがあります。
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <strong className="text-rose-700 block mb-2">NP困難</strong>
                        <p className="text-xs text-rose-800 leading-relaxed">
                            「少なくともNP問題と同じくらい難しい」問題です。NP問題のすべてを、この問題に帰着（変換）できます。<br/>
                            ただし、この問題自体がNPに属するかどうか（検算できるか）は問いません。
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <strong className="text-purple-700 block mb-2">NP完全</strong>
                        <p className="text-xs text-purple-800 leading-relaxed">
                            NP困難であり、かつNPに属する問題です。<br/>
                            「一番難しいNP問題」であり、計算理論における「王様」のような存在です。
                        </p>
                    </div>
                </div>
            </div>
        </section>

      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 mt-12 text-center text-gray-400 text-sm">
        <p>&copy; 2024 Nicchyo Platform - Complexity Theory Guide</p>
      </footer>
    </div>
  );
}
