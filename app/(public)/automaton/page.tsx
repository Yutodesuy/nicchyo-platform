"use client";

import { useState } from "react";
import { problems, Problem } from "./data";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, CheckCircle, BrainCircuit, BookOpen, Layers, AlertTriangle, List } from "lucide-react";

// Structure definition based on Automaton2 file
interface Subsection {
  id: string;
  title: string;
  filter: (p: Problem) => boolean;
}

interface Section {
  id: string;
  title: string;
  subsections?: Subsection[];
  filter?: (p: Problem) => boolean;
}

const getProblemNumber = (id: string) => {
  const parts = id.split(".");
  if (parts.length < 2) return 0;
  return parseInt(parts[1], 10);
};

const HIERARCHY: Section[] = [
  {
    id: "1",
    title: "Section 1: Basic Mathematics (基礎数理)",
    subsections: [
      {
        id: "1.1",
        title: "1.1 Sets & Functions (集合と関数)",
        filter: (p) => {
          if (!p.id.startsWith("1.")) return false;
          const num = getProblemNumber(p.id);
          return num <= 7;
        }
      },
      {
        id: "1.2",
        title: "1.2 Graph Theory (グラフ理論)",
        filter: (p) => {
          if (!p.id.startsWith("1.")) return false;
          const num = getProblemNumber(p.id);
          return num >= 8 && num <= 21;
        }
      },
      {
        id: "1.3",
        title: "1.3 Proofs (証明)",
        filter: (p) => {
          if (!p.id.startsWith("1.")) return false;
          const num = getProblemNumber(p.id);
          return num >= 22;
        }
      }
    ]
  },
  {
    id: "2",
    title: "Section 2: Languages and Automata (言語とオートマトン)",
    subsections: [
      {
        id: "2.1",
        title: "2.1 Regular Languages (正規言語)",
        filter: (p) => {
          if (!p.id.startsWith("2.")) return false;
          const num = getProblemNumber(p.id);
          return num <= 11;
        }
      },
      {
        id: "2.2",
        title: "2.2 Context-Free Languages (文脈自由言語)",
        filter: (p) => {
          if (!p.id.startsWith("2.")) return false;
          const num = getProblemNumber(p.id);
          return num >= 12;
        }
      }
    ]
  },
  {
    id: "3",
    title: "Section 3: Computability Theory (計算可能性の理論)",
    filter: (p) => p.id.startsWith("3.")
  },
  {
    id: "4",
    title: "Section 4: Complexity Theory (複雑さの階層)",
    subsections: [
      {
        id: "4.1",
        title: "4.1 Time Complexity (時間の制限)",
        filter: (p) => {
          if (!p.id.startsWith("4.")) return false;
          const num = getProblemNumber(p.id);
          return num >= 1 && num <= 16;
        }
      },
      {
        id: "4.2",
        title: "4.2 Space Complexity (空間の制限)",
        filter: (p) => {
          if (!p.id.startsWith("4.")) return false;
          const num = getProblemNumber(p.id);
          return num >= 17 && num <= 28;
        }
      }
    ]
  }
];

export default function AutomatonPage() {
  const [openSectionId, setOpenSectionId] = useState<string | null>("1");
  const [openSubsectionId, setOpenSubsectionId] = useState<string | null>(null);
  const [openProblemId, setOpenProblemId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSectionId(openSectionId === id ? null : id);
    setOpenSubsectionId(null); // Reset subsection when changing section
  };

  const toggleSubsection = (id: string) => {
    setOpenSubsectionId(openSubsectionId === id ? null : id);
  };

  const toggleProblem = (id: string) => {
    setOpenProblemId(openProblemId === id ? null : id);
  };

  const renderProblemList = (filteredProblems: Problem[]) => (
    <div className="space-y-3">
      {filteredProblems.map((problem) => (
        <div
          key={problem.id}
          className={`bg-white rounded-xl border transition-all duration-200 ${
            openProblemId === problem.id
              ? "border-indigo-300 ring-2 ring-indigo-50 shadow-md my-4"
              : "border-gray-200 hover:border-indigo-200"
          }`}
        >
          <button
            onClick={() => toggleProblem(problem.id)}
            className="w-full flex items-start gap-4 p-4 text-left"
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              openProblemId === problem.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
            }`}>
              Q{problem.id}
            </div>
            <div className="flex-grow pt-2">
              <h3 className={`text-sm font-medium leading-relaxed transition-colors ${
                 openProblemId === problem.id ? "text-gray-900" : "text-gray-600"
              }`}>
                {problem.question}
              </h3>
            </div>
            <div className="flex-shrink-0 pt-2 text-gray-400">
               {openProblemId === problem.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          <AnimatePresence>
            {openProblemId === problem.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100 bg-gray-50/50"
              >
                <div className="p-5 pl-16 pr-6 space-y-6 text-sm">
                  {/* Content (Answer, Explanation, etc.) */}
                   {/* Short Answer */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold uppercase tracking-wider text-xs">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Answer
                        </div>
                        <p className="text-gray-800 font-medium">{problem.answer}</p>
                    </div>

                    {/* Casual Explanation */}
                    <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        Explanation
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                        {problem.explanation}
                        </p>
                    </div>

                    {/* Common Mistakes */}
                    <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <div className="flex items-center gap-2 text-amber-600 font-semibold uppercase tracking-wider text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Common Mistakes
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-900 leading-relaxed">
                        {problem.commonMistakes}
                        </div>
                    </div>

                    {/* Formal Proof */}
                    <div className="space-y-3 pt-2 border-t border-gray-200/60">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        Formal Proof
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm overflow-x-auto">
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono leading-relaxed">
                            {problem.formalProof}
                        </pre>
                        </div>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-indigo-600 w-6 h-6" />
            <h1 className="text-xl font-bold text-gray-800">Automaton Problems</h1>
          </div>
          <a
            href="/docs/AutomatonSolutions.md"
            download
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Download MD
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-indigo-600 text-white py-12 px-4 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">計算理論とオートマトン</h2>
          <p className="text-indigo-100 text-lg">
            計算複雑性、NP完全性、およびオートマトン理論に関する問題集と解答です。
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 space-y-4">
        {HIERARCHY.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 text-left">
                  {section.title}
                </h2>
              </div>
              <div className={`text-gray-400 transition-transform duration-300 ${openSectionId === section.id ? "rotate-180" : ""}`}>
                <ChevronDown className="w-6 h-6" />
              </div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {openSectionId === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                    <div className="p-4 bg-white border-t border-gray-100">
                      {section.subsections ? (
                        <div className="space-y-4">
                          {section.subsections.map((subsection) => (
                            <div key={subsection.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleSubsection(subsection.id)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <List className="w-4 h-4 text-indigo-400" />
                                        <h3 className="font-semibold text-gray-700 text-sm">
                                            {subsection.title}
                                        </h3>
                                    </div>
                                    <div className={`text-gray-400 transition-transform duration-300 ${openSubsectionId === subsection.id ? "rotate-180" : ""}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {openSubsectionId === subsection.id && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 bg-gray-50/30">
                                                {renderProblemList(problems.filter(subsection.filter))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-1">
                             {/* Direct Problems (Section 3) */}
                             {renderProblemList(problems.filter(section.filter!))}
                        </div>
                      )}
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 mt-12 text-center text-gray-400 text-sm">
        <p>&copy; 2024 Nicchyo Platform - Automaton Problem Set</p>
      </footer>
    </div>
  );
}
