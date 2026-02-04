"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ChevronLeft, Info, Layers, ArrowRight, CheckCircle2, HelpCircle, BookOpen } from "lucide-react";
import Link from "next/link";

// Hierarchy Definition
type HierarchyLevel = "REGULAR" | "CFL" | "CSL" | "RE";

const LEVELS = [
  {
    id: "RE",
    label: "Recursively Enumerable (RE)",
    japanese: "帰納的可算言語",
    desc: "チューリングマシン(TM)で認識可能な言語のクラス。計算可能なすべての問題を含みます。",
    machine: "Turing Machine (TM)",
    keyPoints: [
      "対応文法: 0型文法 (Type-0 Grammar) / 句構造文法",
      "閉包性: 和集合、積集合、連接、クリーネ閉包に対して閉じている。",
      "補集合に対しては閉じていない（補集合がREなら、それは再帰的言語になる）。",
      "停止性問題は決定不能である。",
      "「認識可能 (Recognizable)」だが「決定可能 (Decidable)」とは限らない。"
    ],
    color: "bg-rose-100 border-rose-300 text-rose-800",
    ringColor: "border-rose-400 bg-rose-50/50",
  },
  {
    id: "CSL",
    label: "Context-Sensitive (CSL)",
    japanese: "文脈依存言語",
    desc: "線形拘束オートマトン(LBA)で認識可能な言語。メモリが無制限ではなく、入力長に比例する範囲に制限されます。",
    machine: "Linear Bounded Automaton (LBA)",
    keyPoints: [
      "対応文法: 文脈依存文法 (Type-1 Grammar)",
      "制約: 生成規則 αAβ → αγβ において、生成される文字列は短くならない (|αAβ| ≦ |αγβ|)。",
      "閉包性: 和集合、積集合、補集合に対して閉じている (Immerman-Szelepcsényiの定理)。",
      "例: { a^n b^n c^n | n ≧ 1 } はCSLだがCFLではない。",
      "LBAの停止性問題は決定不能ではない（ただしPSPACE完全）。"
    ],
    color: "bg-orange-100 border-orange-300 text-orange-800",
    ringColor: "border-orange-400 bg-orange-50/50",
  },
  {
    id: "CFL",
    label: "Context-Free (CFL)",
    japanese: "文脈自由言語",
    desc: "プッシュダウンオートマトン(PDA)で認識可能。プログラミング言語の構文解析などで重要です。",
    machine: "Pushdown Automaton (PDA)",
    keyPoints: [
      "対応文法: 文脈自由文法 (Type-2 Grammar)",
      "標準形: チョムスキー標準形、グライバッハ標準形が存在する。",
      "決定性(DPDA)と非決定性(NPDA)で能力が異なる (DCFL ⊊ CFL)。",
      "閉包性: 和集合、連接、クリーネ閉包に対して閉じている。",
      "重要: 積集合、補集合に対しては閉じていない。",
      "反復補題 (Pumping Lemma) を用いてCFLでないことを証明できる。"
    ],
    color: "bg-emerald-100 border-emerald-300 text-emerald-800",
    ringColor: "border-emerald-400 bg-emerald-50/50",
    note: "注意: 非決定性PDA (PDA) と決定性PDA (DPDA) の能力は異なります (DCFL ⊊ CFL)。",
  },
  {
    id: "REGULAR",
    label: "Regular Languages",
    japanese: "正規言語",
    desc: "有限オートマトン(FA)で認識可能。最も基本的なクラスです。",
    machine: "Finite Automaton (DFA / NFA)",
    keyPoints: [
      "対応文法: 正規文法 (Type-3 Grammar)",
      "表現: 正規表現 (Regular Expression) で記述可能。",
      "決定性(DFA)と非決定性(NFA)は等価である (DFA = NFA)。",
      "閉包性: 和集合、積集合、補集合、連接、クリーネ閉包すべてに閉じている。",
      "例: パターンマッチング、字句解析。",
      "Myhill-Nerodeの定理により、状態数の最小化が一意に定まる。"
    ],
    color: "bg-indigo-100 border-indigo-300 text-indigo-800",
    ringColor: "border-indigo-500 bg-indigo-100/80",
    note: "重要: 決定性(DFA)と非決定性(NFA)の能力は等価です (DFA = NFA)。",
  }
];

export default function AutomatonTextPage() {
  const [selectedLevel, setSelectedLevel] = useState<HierarchyLevel | null>(null);

  const currentLevelInfo = LEVELS.find((l) => l.id === selectedLevel);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Link href="/automaton" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <BrainCircuit className="text-indigo-600 w-6 h-6" />
                    <h1 className="text-xl font-bold text-gray-800">Automaton Hierarchy</h1>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Visualization Column */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex items-center justify-center min-h-[500px] relative overflow-hidden">
                 <div className="absolute top-4 left-4 text-gray-400 text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Chomsky Hierarchy
                 </div>

                 {/* Interactive Venn Diagram */}
                 <div className="relative w-full max-w-md aspect-square flex items-center justify-center">

                    {/* RE (Recursively Enumerable) */}
                    <motion.div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedLevel("RE")}
                        className={`absolute rounded-full border-2 flex items-start justify-center pt-4 transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-rose-200
                            ${selectedLevel === "RE" ? "border-rose-500 bg-rose-100/30 z-10 shadow-lg ring-4 ring-rose-50" : "border-gray-200 bg-gray-50 text-gray-400 hover:border-rose-300"}
                        `}
                        style={{ width: "100%", height: "100%" }}
                        onClick={() => setSelectedLevel("RE")}
                        whileHover={{ scale: 1.02 }}
                        animate={{ scale: selectedLevel === "RE" ? 1.05 : 1 }}
                    >
                        <span className="font-bold text-xs sm:text-sm tracking-widest uppercase mt-2">Recursively Enumerable (TM)</span>
                    </motion.div>

                    {/* CSL (Context Sensitive) */}
                    <motion.div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.stopPropagation();
                                setSelectedLevel("CSL");
                            }
                        }}
                        className={`absolute rounded-full border-2 flex items-start justify-center pt-4 transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-200
                            ${selectedLevel === "CSL" ? "border-orange-500 bg-orange-100/30 z-20 shadow-lg ring-4 ring-orange-50" : "border-gray-300 bg-white/50 text-gray-400 hover:border-orange-300"}
                        `}
                        style={{ width: "80%", height: "80%" }}
                        onClick={(e) => { e.stopPropagation(); setSelectedLevel("CSL"); }}
                        whileHover={{ scale: 1.02 }}
                         animate={{ scale: selectedLevel === "CSL" ? 1.05 : 1 }}
                    >
                         <span className="font-bold text-xs sm:text-sm tracking-widest uppercase mt-2">Context-Sensitive (LBA)</span>
                    </motion.div>

                    {/* CFL (Context Free) */}
                    <motion.div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.stopPropagation();
                                setSelectedLevel("CFL");
                            }
                        }}
                        className={`absolute rounded-full border-2 flex items-start justify-center pt-4 transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-200
                             ${selectedLevel === "CFL" ? "border-emerald-500 bg-emerald-100/30 z-30 shadow-lg ring-4 ring-emerald-50" : "border-gray-300 bg-white/80 text-gray-400 hover:border-emerald-300"}
                        `}
                        style={{ width: "60%", height: "60%" }}
                        onClick={(e) => { e.stopPropagation(); setSelectedLevel("CFL"); }}
                        whileHover={{ scale: 1.02 }}
                         animate={{ scale: selectedLevel === "CFL" ? 1.05 : 1 }}
                    >
                        <span className="font-bold text-xs sm:text-sm tracking-widest uppercase mt-2">Context-Free (PDA)</span>
                    </motion.div>

                    {/* Regular */}
                    <motion.div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.stopPropagation();
                                setSelectedLevel("REGULAR");
                            }
                        }}
                        className={`absolute rounded-full border-2 flex items-center justify-center transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-200
                             ${selectedLevel === "REGULAR" ? "border-indigo-600 bg-indigo-100 z-40 shadow-xl ring-4 ring-indigo-50" : "border-gray-400 bg-white text-gray-500 hover:border-indigo-400"}
                        `}
                        style={{ width: "35%", height: "35%" }}
                        onClick={(e) => { e.stopPropagation(); setSelectedLevel("REGULAR"); }}
                        whileHover={{ scale: 1.05 }}
                        animate={{ scale: selectedLevel === "REGULAR" ? 1.1 : 1 }}
                    >
                         <span className="font-bold text-xs sm:text-sm tracking-widest uppercase text-center px-2">Regular<br/>(DFA/NFA)</span>
                    </motion.div>
                 </div>

                 <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
                    クリックして詳細を表示 / Click layers to explore
                 </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                     <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-500" />
                        詳細解説 / Details
                     </h2>

                     <AnimatePresence mode="wait">
                        {currentLevelInfo ? (
                            <motion.div
                                key={currentLevelInfo.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${currentLevelInfo.color.split(" ")[0]} ${currentLevelInfo.color.split(" ")[2]}`}>
                                        {currentLevelInfo.label}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{currentLevelInfo.japanese}</h3>
                                    <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                                        対応マシン: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{currentLevelInfo.machine}</span>
                                    </p>
                                </div>

                                <p className="text-gray-700 leading-relaxed">
                                    {currentLevelInfo.desc}
                                </p>

                                {/* Key Points List */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-indigo-500" />
                                        Key Characteristics
                                    </h4>
                                    <ul className="space-y-2">
                                        {currentLevelInfo.keyPoints.map((point, i) => (
                                            <li key={i} className="text-sm text-gray-600 flex gap-2 items-start">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {currentLevelInfo.note && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-sm text-amber-900">
                                        <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                                        <div>
                                            {currentLevelInfo.note}
                                        </div>
                                    </div>
                                )}

                                {/* Hierarchy Context */}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Hierarchy Relationships</p>
                                    <div className="flex flex-col gap-2">
                                        {LEVELS.map((l, idx) => (
                                            <div key={l.id} className={`flex items-center gap-3 text-sm ${l.id === selectedLevel ? "text-gray-900 font-bold" : "text-gray-400"}`}>
                                                 <div className={`w-2 h-2 rounded-full ${l.id === selectedLevel ? "bg-indigo-500" : "bg-gray-200"}`} />
                                                 {l.japanese}
                                                 {idx < LEVELS.length - 1 && <span className="text-gray-300 ml-auto text-xs">⊂ includes</span>}
                                            </div>
                                        )).reverse()}
                                    </div>
                                </div>

                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-gray-400"
                            >
                                <p className="mb-2">左の図をクリックして、<br/>各階層の詳細を確認してください。</p>
                                <p className="text-xs">Select a layer to see details</p>
                            </motion.div>
                        )}
                     </AnimatePresence>
                </div>

                {/* Quick Facts / Smart Tips */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 shadow-sm border border-indigo-100">
                    <h3 className="text-indigo-900 font-bold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        覚えておきたいポイント
                    </h3>
                    <ul className="space-y-3 text-sm text-indigo-800/80">
                        <li className="flex gap-2">
                            <ArrowRight className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                            <span><strong>正規言語</strong>は、決定性(DFA)と非決定性(NFA)で能力が変わりません。(DFA = NFA)</span>
                        </li>
                        <li className="flex gap-2">
                            <ArrowRight className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                            <span><strong>文脈自由言語</strong>では、決定性(DPDA)は非決定性(PDA)よりも能力が弱いです。(DCFL ⊊ CFL)</span>
                        </li>
                        <li className="flex gap-2">
                            <ArrowRight className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                            <span>すべての正規言語は文脈自由言語であり、すべての文脈自由言語は文脈依存言語です。</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
