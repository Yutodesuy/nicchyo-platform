'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Answers = {
  purpose?: string;
  needs?: string;
  visitCount?: string;
  favoriteFood?: string;
};

type AgentQuestion = {
  id: keyof Answers;
  prompt: string;
  placeholder: string;
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

const QUESTIONS: AgentQuestion[] = [
  {
    id: 'purpose',
    prompt: '今日の目的は？（例: 観光ついでに買い物）',
    placeholder: '観光しながら地元の味を探したい',
  },
  {
    id: 'needs',
    prompt: '何を買いたい？',
    placeholder: '野菜の詰め合わせ / ご当地おやつ など',
  },
  {
    id: 'visitCount',
    prompt: '何件くらい寄りたい？',
    placeholder: '3件 など数字で入力',
    helper: '時間がなければ2件、たっぷり回るなら4件以上がおすすめ',
  },
  {
    id: 'favoriteFood',
    prompt: '好きな料理・ジャンルは？',
    placeholder: '郷土料理 / 海鮮 / 揚げ物 など',
  },
];

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
  const [currentInput, setCurrentInput] = useState('');
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;
  const currentQuestion = useMemo(() => QUESTIONS[step], [step]);

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
        setStep(QUESTIONS.length);
        onPlanUpdate?.(parsed.order ?? parsed.plan.shops.map((s) => s.id));
      }
    } catch {
      // ignore
    }
  }, [onPlanUpdate]);

  const persistPlan = (data: PlanResult) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ plan: data, order: data.shops.map((s) => s.id) })
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || plan) return;
    const value = currentInput.trim();
    if (!value) return;

    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(nextAnswers);
    setNotes((prev) => [...prev, { id: currentQuestion.id, q: currentQuestion.prompt, a: value }]);
    setCurrentInput('');
    setPlan(null);

    const isLast = step >= QUESTIONS.length - 1;
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
      } catch (e) {
        setError('提案の生成に失敗しました。少し待ってから再度お試しください。');
        onPlanUpdate?.([]);
      } finally {
        setLoading(false);
      }
    } else {
      setStep((prev) => prev + 1);
      onPlanUpdate?.([]);
    }
  }, [answers, currentInput, currentQuestion, onPlanUpdate, plan, step, userLocation]);

  const handleEdit = useCallback(
    (id: keyof Answers) => {
      const targetIndex = QUESTIONS.findIndex((q) => q.id === id);
      if (targetIndex === -1) return;

      const newAnswers: Answers = { ...answers };
      QUESTIONS.slice(targetIndex).forEach((q) => delete newAnswers[q.id]);

      setAnswers(newAnswers);
      setNotes((prev) =>
        prev.filter((note) => QUESTIONS.findIndex((q) => q.id === note.id) < targetIndex)
      );
      setStep(targetIndex);
      setCurrentInput(answers[id] ?? '');
      setPlan(null);
      setError(null);
      setLoading(false);
      onPlanUpdate?.([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    [answers, onPlanUpdate]
  );

  const handleReset = useCallback(() => {
    setAnswers({});
    setNotes([]);
    setCurrentInput('');
    setPlan(null);
    setStep(0);
    setError(null);
    setLoading(false);
    onPlanUpdate?.([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [onPlanUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

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
                      <div className="flex flex-col gap-2">
                        <p className="font-semibold leading-snug">{currentQuestion.prompt}</p>
                        {currentQuestion.helper && (
                          <p className="text-[11px] text-amber-700/80">{currentQuestion.helper}</p>
                        )}
                        <input
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder={currentQuestion.placeholder}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSubmit}
                            className="rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500 transition"
                          >
                            この回答で進む
                          </button>
                          <span className="text-[11px] text-amber-700/70">Enter でも送信できます</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-amber-800">
                        質問完了！おすすめをまとめています…
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
                    考え中…市場のおすすめを組み立てています。
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
                      <p className="text-[11px] font-semibold text-amber-700">立ち寄り先</p>
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
