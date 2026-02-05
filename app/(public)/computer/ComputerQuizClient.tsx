"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { computerQuizItems, type ComputerQuizItem } from "./computerProblemData";

type QuizHistoryEntry = {
  id: string;
  correct: boolean;
  timestamp: number;
};

type QuizStats = {
  correctCounts: Record<string, number>;
  history: QuizHistoryEntry[];
};

const STORAGE_KEY = "computer-quiz-stats";

const DEFAULT_STATS: QuizStats = {
  correctCounts: {},
  history: [],
};

const QUIZ_SIZES = [10, 20, 30] as const;

const getStoredStats = (): QuizStats => {
  if (typeof window === "undefined") {
    return DEFAULT_STATS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATS;
    }
    const parsed = JSON.parse(raw) as QuizStats;
    return {
      correctCounts: parsed.correctCounts ?? {},
      history: parsed.history ?? [],
    };
  } catch (error) {
    console.warn("Failed to load quiz stats.", error);
    return DEFAULT_STATS;
  }
};

const storeStats = (stats: QuizStats) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

const getCorrectCount = (stats: QuizStats, id: string) =>
  stats.correctCounts[id] ?? 0;

const selectWeightedQuestions = (
  items: ComputerQuizItem[],
  total: number,
  stats: QuizStats
) => {
  const pool = [...items];
  const selected: ComputerQuizItem[] = [];

  while (selected.length < total && pool.length > 0) {
    const weights = pool.map((item) => 1 / (getCorrectCount(stats, item.id) + 1));
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    let target = Math.random() * weightSum;
    let index = 0;
    for (let i = 0; i < pool.length; i += 1) {
      target -= weights[i];
      if (target <= 0) {
        index = i;
        break;
      }
    }
    selected.push(pool[index]);
    pool.splice(index, 1);
  }

  return selected;
};

export default function ComputerQuizClient() {
  const [stats, setStats] = useState<QuizStats>(DEFAULT_STATS);
  const [quizSize, setQuizSize] = useState<(typeof QUIZ_SIZES)[number]>(10);
  const [quizItems, setQuizItems] = useState<ComputerQuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [batchResults, setBatchResults] = useState<
    { id: string; correct: boolean; explanation: string; isTrue: boolean }[]
  >([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const stored = getStoredStats();
    setStats(stored);
  }, []);

  const accuracy = useMemo(() => {
    if (stats.history.length === 0) {
      return 0;
    }
    const recent = stats.history.slice(-100);
    const correctCount = recent.filter((entry) => entry.correct).length;
    return Math.round((correctCount / recent.length) * 100);
  }, [stats.history]);

  const achievementRate = useMemo(() => {
    const eligible = computerQuizItems.filter(
      (item) => getCorrectCount(stats, item.id) <= 1
    );
    if (eligible.length === 0) {
      return 0;
    }
    const achieved = eligible.filter(
      (item) => getCorrectCount(stats, item.id) === 1
    );
    return Math.round((achieved.length / eligible.length) * 100);
  }, [stats]);

  const currentBatch = useMemo(
    () => quizItems.slice(currentIndex, currentIndex + 4),
    [quizItems, currentIndex]
  );

  const totalAnswered = useMemo(
    () => Math.min(currentIndex, quizItems.length),
    [currentIndex, quizItems.length]
  );

  const handleStart = useCallback(() => {
    const selected = selectWeightedQuestions(
      computerQuizItems,
      quizSize,
      stats
    );
    setQuizItems(selected);
    setCurrentIndex(0);
    setSelectedIds(new Set());
    setSubmitted(false);
    setBatchResults([]);
    setScore(0);
  }, [quizSize, stats]);

  const toggleSelection = (id: string) => {
    if (submitted) {
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted || currentBatch.length === 0) {
      return;
    }

    const updatedStats: QuizStats = {
      correctCounts: { ...stats.correctCounts },
      history: [...stats.history],
    };

    let batchScore = 0;
    const results = currentBatch.map((item) => {
      const selected = selectedIds.has(item.id);
      const correct = item.isTrue ? selected : !selected;
      if (correct) {
        batchScore += 1;
        updatedStats.correctCounts[item.id] =
          getCorrectCount(updatedStats, item.id) + 1;
      }
      updatedStats.history.push({
        id: item.id,
        correct,
        timestamp: Date.now(),
      });
      return {
        id: item.id,
        correct,
        explanation: item.explanation,
        isTrue: item.isTrue,
      };
    });

    updatedStats.history = updatedStats.history.slice(-100);
    setStats(updatedStats);
    storeStats(updatedStats);

    setScore((prev) => prev + batchScore);
    setBatchResults(results);
    setSubmitted(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 4);
    setSelectedIds(new Set());
    setSubmitted(false);
    setBatchResults([]);
  };

  const isFinished = quizItems.length > 0 && currentIndex >= quizItems.length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              学習ステータス
            </p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              直近100問の正解率: {accuracy}%
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              正解数が0〜1の問題で、正解数が1になっている割合: {achievementRate}%
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUIZ_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setQuizSize(size)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  quizSize === size
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                {size}問
              </button>
            ))}
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              問題を解く
            </button>
          </div>
        </div>
      </section>

      {quizItems.length > 0 && !isFinished && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {totalAnswered + 1} -{" "}
              {Math.min(currentIndex + currentBatch.length, quizItems.length)} /
              {quizItems.length}
            </span>
            <span>現在の正解数: {score}</span>
          </div>
          <div className="space-y-4">
            {currentBatch.map((item) => {
              const selected = selectedIds.has(item.id);
              const result = batchResults.find((entry) => entry.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition ${
                    submitted
                      ? result?.correct
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      checked={selected}
                      onChange={() => toggleSelection(item.id)}
                      disabled={submitted}
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900">{item.statement}</p>
                      {submitted && result && (
                        <div className="text-xs text-gray-700">
                          <p>
                            {result.correct ? "✅ 正解" : "❌ 不正解"}（この問題は{" "}
                            {result.isTrue ? "正しい記述" : "誤った記述"}）
                          </p>
                          <p className="mt-1">{result.explanation}</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-500"
              >
                答え合わせ
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                次の4問へ
              </button>
            )}
          </div>
        </section>
      )}

      {isFinished && (
        <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-bold text-gray-900">クイズ終了！</h3>
          <p className="mt-2 text-sm text-gray-600">
            正解数: {score} / {quizItems.length}
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-4 rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-500"
          >
            もう一度解く
          </button>
        </section>
      )}
    </div>
  );
}
