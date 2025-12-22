/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { grandmaCommentPool, pickNextComment } from '../services/grandmaCommentService';

const AUTO_ROTATE_MS = 60000;
const PLACEHOLDER_IMAGE = '/images/obaasan.webp';

type GrandmaChatterProps = {
  onOpenAgent?: () => void;
  comments?: typeof grandmaCommentPool;
  titleLabel?: string;
  priorityMessage?: {
    text: string;
    badgeTitle?: string;
    badgeIcon?: string;
  } | null;
  onPriorityClick?: () => void;
  onPriorityDismiss?: () => void;
};

export default function GrandmaChatter({
  onOpenAgent,
  comments,
  titleLabel = 'マップばあちゃん',
  priorityMessage,
  onPriorityClick,
  onPriorityDismiss,
}: GrandmaChatterProps) {
  const pool = comments && comments.length > 0 ? comments : grandmaCommentPool;
  const [currentId, setCurrentId] = useState<string | undefined>(() => pool[0]?.id);
  const current = useMemo(
    () => pool.find((c) => c.id === currentId) ?? pool[0],
    [pool, currentId]
  );
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [askText, setAskText] = useState('');

  useEffect(() => {
    if (!pool.length) return;
    const id = window.setInterval(() => {
      setCurrentId((prev) => pickNextComment(pool, prev)?.id);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [pool]);

  if (!current) return null;

  const handleNext = () => {
    setCurrentId((prev) => pickNextComment(pool, prev)?.id);
  };

  const handleAgent = useCallback(() => {
    onOpenAgent?.();
    setIsActionOpen(false);
  }, [onOpenAgent]);

  const handleImageClick = () => setIsActionOpen((prev) => !prev);
  const handleAskSubmit = () => {
    if (!askText.trim()) return;
    // TODO: API送信を実装する
    setAskText('');
  };

  return (
    <div className="fixed bottom-20 right-3 z-[1400] sm:right-4">
      <div className="flex items-end gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleImageClick}
          className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0"
          aria-label="おばあちゃんメニューを開く"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 shadow-lg border-2 border-amber-500" />
          <div className="absolute inset-1 rounded-full overflow-hidden border border-white shadow-inner bg-white">
            <img
              src={PLACEHOLDER_IMAGE}
              alt="おばあちゃん"
              className="h-full w-full object-cover object-center scale-110"
            />
          </div>
        </button>

        <button
          type="button"
          onClick={priorityMessage ? onPriorityClick : handleNext}
          className="group relative max-w-[280px] sm:max-w-sm rounded-2xl border-2 border-amber-400 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl"
          aria-label="次のコメントを表示"
        >
          <div className="absolute -top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              {titleLabel}
            </span>
          </div>
          <div className="absolute -left-3 bottom-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-amber-400" />
          <div className="absolute -left-2 bottom-6 h-0 w-0 border-y-7 border-y-transparent border-r-7 border-r-white" />

          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden>
              {priorityMessage?.badgeIcon ?? current.icon ?? genreIcon(current.genre)}
            </span>
            <div className="space-y-1">
              <p className="text-base leading-relaxed text-gray-900">
                {priorityMessage ? priorityMessage.text : current.text}
              </p>
              {current.link && !priorityMessage && (
                <Link
                  href={current.link.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 underline decoration-amber-400 decoration-2 underline-offset-4 transition group-hover:text-amber-700"
                >
                  {current.link.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
              <p className="text-[11px] text-gray-500">
                {priorityMessage ? 'タップでバッジを見る' : 'タップすると次のひと言を見る'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {isActionOpen && (
        <div className="absolute -top-2 right-0 mb-3 w-[min(320px,80vw)] translate-y-[-100%] rounded-2xl border-2 border-amber-400 bg-white/95 p-3 shadow-2xl z-[1450]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-amber-900">おせっかいメニュー</p>
            <button
              type="button"
              className="text-xs text-amber-700 underline"
              onClick={() => setIsActionOpen(false)}
            >
              閉じる
            </button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 shadow-inner space-y-2">
            <p className="text-xs font-semibold text-amber-800">AIに相談（準備中）</p>
            <textarea
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="聞きたいことを書いてね（送信でAIに渡します）"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-amber-700/80">送信するとAIに渡します（準備中）</p>
              <button
                type="button"
                onClick={handleAskSubmit}
                className="rounded-lg bg-amber-600 px-3 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-amber-500"
              >
                送信
              </button>
            </div>
          </div>

          <div className="mt-3">
            <ActionButton
              label="お店＆料理提案"
              description="目的に合わせて立ち寄り先を考える"
              icon="💬"
              onClick={handleAgent}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left shadow-sm transition hover:border-amber-300 hover:-translate-y-[1px]"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-900">{label}</p>
          <p className="text-[11px] text-amber-800">{description}</p>
        </div>
      </div>
    </button>
  );
}

function genreIcon(genre: string) {
  switch (genre) {
    case 'event':
      return '⭐';
    case 'notice':
      return 'ℹ️';
    case 'tutorial':
      return '📖';
    case 'monologue':
    default:
      return '💭';
  }
}
