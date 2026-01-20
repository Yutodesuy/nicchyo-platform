"use client";

import { useState } from "react";
import { problems, Problem } from "./data";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, CheckCircle, BrainCircuit, BookOpen, Layers, AlertTriangle } from "lucide-react";

// Define sections map
const SECTIONS: Record<string, string> = {
  "3": "Section 3: Computability Theory (計算可能性の理論)",
  "4": "Section 4: Complexity Theory (計算複雑性の理論)"
};

export default function AutomatonPage() {
  const [openSectionId, setOpenSectionId] = useState<string | null>("3"); // Default open first section
  const [openProblemId, setOpenProblemId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSectionId(openSectionId === id ? null : id);
  };

  const toggleProblem = (id: string) => {
    setOpenProblemId(openProblemId === id ? null : id);
  };

  // Group problems by section (first char of ID)
  const groupedProblems = problems.reduce((acc, problem) => {
    const sectionKey = problem.id.split(".")[0];
    if (!acc[sectionKey]) acc[sectionKey] = [];
    acc[sectionKey].push(problem);
    return acc;
  }, {} as Record<string, Problem[]>);

  const sortedSectionKeys = Object.keys(groupedProblems).sort();

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
      <main className="max-w-3xl mx-auto px-4 space-y-6">
        {sortedSectionKeys.map((sectionKey) => (
          <div key={sectionKey} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {SECTIONS[sectionKey] || `Section ${sectionKey}`}
                </h2>
              </div>
              <div className={`text-gray-400 transition-transform duration-300 ${openSectionId === sectionKey ? "rotate-180" : ""}`}>
                <ChevronDown className="w-6 h-6" />
              </div>
            </button>

            {/* Section Content (Problem List) */}
            <AnimatePresence>
              {openSectionId === sectionKey && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-2 space-y-2 bg-gray-50/30">
                    {groupedProblems[sectionKey].map((problem) => (
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
