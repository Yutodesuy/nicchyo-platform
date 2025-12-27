'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Answers = {
  tourist?: string;
  visitCount?: string;
  partySize?: string;
  relationship?: string;
  visitReason?: string;
  interests?: string[];
  charms?: string[];
  chat?: string;
  cook?: string;
};

type AgentQuestion = {
  id: keyof Answers;
  prompt: string;
  options: string[];
  multiple?: boolean;
  helper?: string;
};

type Note = { id: keyof Answers; q: string; a: string };

type PlanShop = {
  id: number;
  name: string;
  reason: string;
  icon: string;
};

type PlanResult = {
  title: string;
  summary: string;
  shops: PlanShop[];
  routeHint: string;
  shoppingList: string[];
};

type MapAgentAssistantProps = {
  onOpenShop?: (shopId: number) => void;
  onPlanUpdate?: (order: number[]) => void;
  userLocation?: [number, number] | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  hideLauncher?: boolean;
};

const STORAGE_KEY = 'nicchyo-map-agent-plan';
const CATEGORY_OPTIONS = ['食材', '食べ物', '道具・工具', '生活雑貨', '植物・苗', 'アクセサリー', '手作り・工芸'];

function getQuestions(answers: Answers): AgentQuestion[] {
  const questions: AgentQuestion[] = [
    {
      id: 'tourist',
      prompt: '1. 観光客ですか？',
      options: ['はい', 'いいえ'],
    },
    {
      id: 'visitCount',
      prompt: '2. 日曜市は何回目ですか？',
      options: ['0', '1', '2', '3', '4回以上'],
    },
    {
      id: 'partySize',
      prompt: '3. 今日は何人できましたか？',
      options: ['1', '2', '3', '4', '5人以上'],
    },
  ];

  if (answers.partySize && answers.partySize !== '1') {
    questions.push({
      id: 'relationship',
      prompt: '4. どういう関係ですか？',
      options: ['家族', '恋人', '友達', 'その他'],
    });
  }

  questions.push(
    {
      id: 'visitReason',
      prompt: '5. 日曜市に訪れたきっかけは？',
      options: ['事前に調べていた', 'たまたま', '習慣', 'その他'],
    },
    {
      id: 'interests',
      prompt: '6. 日曜市で購入したい、見てみたいものは？（複数選択可）',
      options: CATEGORY_OPTIONS,
      multiple: true,
    },
    {
      id: 'charms',
      prompt: '7. 日曜市の魅力は？（複数選択可）',
      options: ['ぶらぶら買い物できること', '地元のものが買えること', '出店者とのふれあい', 'わからない', 'その他'],
      multiple: true,
    },
    {
      id: 'chat',
      prompt: '8. 出店者と雑談してみたい？',
      options: ['はい', 'いいえ'],
    },
    {
      id: 'cook',
      prompt: '9. 高知の郷土料理を作ってみたい？',
      options: ['はい', 'いいえ'],
    }
  );

  return questions;
}

export default function MapAgentAssistant({
  onOpenShop,
  onPlanUpdate,
  userLocation,
  isOpen,
  onToggle,
  hideLauncher = false,
}: MapAgentAssistantProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [currentSelection, setCurrentSelection] = useState<string | string[] | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;
  const questions = useMemo(() => getQuestions(answers), [answers]);
  const currentQuestion = questions[step];

  useEffect(() => {
    if (!currentSelection && currentQuestion) {
      const existing = answers[currentQuestion.id];
      if (Array.isArray(existing)) {
        setCurrentSelection(existing);
      } else if (typeof existing === 'string') {
        setCurrentSelection(existing);
      }
    }
  }, [answers, currentQuestion, currentSelection]);

  const toggle = useCallback(() => {
    const next = !open;
    onToggle?.(next);
    if (isOpen === undefined) {
      setInternalOpen(next);
    }
  }, [open, onToggle, isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { plan?: PlanResult; order?: number[] };
      if (parsed.plan) {
        setPlan(parsed.plan);
        setStep(questions.length);
        onPlanUpdate?.(parsed.order ?? parsed.plan.shops.map((s) => s.id));
      }
    } catch {
      // ignore
    }
  }, [onPlanUpdate, questions.length]);

  const persistPlan = (data: PlanResult) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ plan: data, order: data.shops.map((s) => s.id) })
    );
  };

  const toAnswerText = (value: string | string[]) => {
    if (Array.isArray(value)) return value.join('、');
    return value;
  };

  const handleSelectOption = useCallback(
    (option: string) => {
      if (!currentQuestion) return;
      if (currentQuestion.multiple) {
        const current = Array.isArray(currentSelection) ? currentSelection : [];
        const exists = current.includes(option);
        const next = exists ? current.filter((v) => v !== option) : [...current, option];
        setCurrentSelection(next);
      } else {
        setCurrentSelection(option);
      }
    },
    [currentQuestion, currentSelection]
  );

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || plan || currentSelection === null) return;
    if (Array.isArray(currentSelection) && currentSelection.length === 0) return;

    const value = currentSelection;
    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(nextAnswers);
    setNotes((prev) => [
      ...prev,
      { id: currentQuestion.id, q: currentQuestion.prompt, a: toAnswerText(value) },
    ]);
    setCurrentSelection(null);
    setPlan(null);

    const isLast = step >= questions.length - 1;
    if (isLast) {
      setStep((prev) => prev + 1);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/map-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: nextAnswers, location: userLocation }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = (await res.json()) as PlanResult;
        setPlan(data);
        persistPlan(data);
        onPlanUpdate?.(data.shops.map((s) => s.id));
      } catch {
        setError('提案の生成に失敗しました。少し待ってから再度お試しください。');
        onPlanUpdate?.([]);
      } finally {
        setLoading(false);
      }
    } else {
      setStep((prev) => prev + 1);
      onPlanUpdate?.([]);
    }
  }, [answers, currentQuestion, currentSelection, onPlanUpdate, plan, questions.length, step, userLocation]);

  const handleEdit = useCallback(
    (id: keyof Answers) => {
      const targetIndex = questions.findIndex((q) => q.id === id);
      if (targetIndex === -1) return;

      const newAnswers: Answers = { ...answers };
      questions.slice(targetIndex).forEach((q) => delete newAnswers[q.id]);

      setAnswers(newAnswers);
      setNotes((prev) =>
        prev.filter((note) => questions.findIndex((q) => q.id === note.id) < targetIndex)
      );
      setStep(targetIndex);
      setCurrentSelection(null);
      setPlan(null);
      setError(null);
      setLoading(false);
      onPlanUpdate?.([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    [answers, onPlanUpdate, questions]
  );

  const handleReset = useCallback(() => {
    setAnswers({});
    setNotes([]);
    setCurrentSelection(null);
    setPlan(null);
    setStep(0);
    setError(null);
    setLoading(false);
    onPlanUpdate?.([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [onPlanUpdate]);

  return (
    <>
      {!hideLauncher && (
        <button
          type="button"
          className="absolute left-4 bottom-4 z-[1400] group"
          onClick={toggle}
          aria-label="AI買い物エージェントを開く"
        >
          <div className="relative">
            <div className="h-14 w-14 rotate-2 rounded-md bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-100 shadow-xl border border-amber-300 flex items-center justify-center text-2xl transition-transform group-hover:scale-105">
              🗒️
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center shadow">
              !
            </div>
          </div>
        </button>
      )}

      {open && (
        <div className="absolute left-4 bottom-48 z-[2200] w-[min(420px,90vw)]">
          <div className="relative max-h-[70vh] overflow-y-auto pr-1">
            <div className="absolute -top-3 right-6 rotate-6 h-6 w-6 bg-amber-300 rounded-sm shadow-md" />
            <div className="absolute -top-5 right-16 -rotate-3 h-5 w-5 bg-amber-200 rounded-sm shadow-md" />
            <div className="rounded-lg border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 border-b border-amber-200">
                <div className="text-sm font-semibold text-amber-900">AI 市場案内</div>
                <button
                  type="button"
                  className="text-xs text-amber-700 underline"
                  onClick={toggle}
                >
                  とじる
                </button>
              </div>

              <div className="px-4 py-3 space-y-3 text-sm text-amber-900">
                {!plan && (
                  <div className="rounded-md bg-white/80 border border-amber-200 shadow-inner p-3">
                    <div className="text-xs font-semibold text-amber-700 mb-1">質問</div>
                    {currentQuestion ? (
                      <div className="flex flex-col gap-3">
                        <p className="font-semibold leading-snug">{currentQuestion.prompt}</p>
                        {currentQuestion.helper && (
                          <p className="text-[11px] text-amber-700/80">{currentQuestion.helper}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {currentQuestion.options.map((option) => {
                            const selected = Array.isArray(currentSelection)
                              ? currentSelection.includes(option)
                              : currentSelection === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleSelectOption(option)}
                                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                  selected
                                    ? 'border-amber-600 bg-amber-500 text-white shadow-sm'
                                    : 'border-amber-200 bg-white text-amber-900 hover:bg-amber-50'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                              currentSelection === null ||
                              (Array.isArray(currentSelection) && currentSelection.length === 0)
                            }
                            className="rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            次へ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-amber-800">
                        質問完了。おすすめをまとめています…
                      </div>
                    )}
                  </div>
                )}

                {notes.length > 0 && !plan && (
                  <div className="rounded-md bg-white/70 border border-dashed border-amber-300 p-3 space-y-2">
                    <div className="text-xs font-semibold text-amber-700">これまでのメモ</div>
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded bg-amber-50 px-2 py-2 shadow-inner flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-amber-700">{note.q}</p>
                          <button
                            type="button"
                            onClick={() => handleEdit(note.id)}
                            className="text-[11px] text-amber-700 underline"
                          >
                            編集
                          </button>
                        </div>
                        <p className="text-sm font-semibold">{note.a}</p>
                      </div>
                    ))}
                  </div>
                )}

                {loading && (
                  <div className="rounded-md border border-amber-300 bg-white/80 px-3 py-2 text-sm font-semibold text-amber-800">
                    市場のおすすめを組み立てています…
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {plan && (
                  <div className="rounded-md bg-white/90 border border-amber-300 p-3 space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-[0.12em]">
                          おすすめプラン
                        </p>
                        <p className="text-base font-bold text-amber-900">{plan.title}</p>
                      </div>
                      <div className="text-xl">🧭</div>
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">{plan.summary}</p>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-amber-700">立ち寄り店舗</p>
                      <div className="space-y-2">
                        {plan.shops.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onOpenShop?.(s.id)}
                            className="w-full text-left rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm hover:border-amber-300 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{s.icon}</span>
                                <span className="font-semibold text-amber-900">{s.name}</span>
                              </div>
                              <span className="text-[11px] text-amber-700 underline">マップで見る</span>
                            </div>
                            <p className="text-[12px] text-amber-800 mt-1">{s.reason}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    {plan.shoppingList.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-amber-700">買い物メモ</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {plan.shoppingList.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-[3px] font-semibold text-amber-900"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                      {plan.routeHint}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-[11px] text-amber-700 underline"
                      >
                        リセットして質問に戻る
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
