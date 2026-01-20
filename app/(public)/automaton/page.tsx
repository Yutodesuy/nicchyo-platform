"use client";

import { useState } from "react";
import { problems } from "./data";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, CheckCircle, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function AutomatonPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleProblem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

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

      {/* Problem List */}
      <main className="max-w-3xl mx-auto px-4 space-y-4">
        {problems.map((problem, index) => (
          <motion.div
            key={problem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-xl shadow-sm border ${
              openId === problem.id ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"
            } overflow-hidden`}
          >
            <button
              onClick={() => toggleProblem(problem.id)}
              className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                Q{problem.id}
              </div>
              <div className="flex-grow pt-1">
                <h3 className="text-gray-900 font-medium leading-relaxed">
                  {problem.question}
                </h3>
              </div>
              <div className="flex-shrink-0 pt-1 text-gray-400">
                {openId === problem.id ? <ChevronUp /> : <ChevronDown />}
              </div>
            </button>

            <AnimatePresence>
              {openId === problem.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="p-5 pl-20 pr-8 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4" />
                        Answer
                      </div>
                      <p className="text-gray-800 font-medium">{problem.answer}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200/60">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        Explanation
                      </p>
                      <p className="text-gray-600 leading-7 text-sm">
                        {problem.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 mt-12 text-center text-gray-400 text-sm">
        <p>&copy; 2024 Nicchyo Platform - Automaton Problem Set</p>
      </footer>
    </div>
  );
}
