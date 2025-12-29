/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { grandmaCommentPool, pickNextComment } from '../services/grandmaCommentService';

const AUTO_ROTATE_MS = 60000;
const PLACEHOLDER_IMAGE = '/images/obaasan.webp';

type PriorityMessage = {
  text: string;
  badgeTitle?: string;
  badgeIcon?: string;
};

type GrandmaChatterProps = {
  onOpenAgent?: () => void;
  comments?: typeof grandmaCommentPool;
  titleLabel?: string;
  priorityMessage?: PriorityMessage | null;
  onPriorityClick?: () => void;
  onPriorityDismiss?: () => void;
  fullWidth?: boolean;
};

export default function GrandmaChatter({
  onOpenAgent,
  comments,
  titleLabel = 'おせっかいばあちゃん',
  priorityMessage,
  onPriorityClick,
  onPriorityDismiss,
  fullWidth = false,
}: GrandmaChatterProps) {
  const pool = comments && comments.length > 0 ? comments : grandmaCommentPool;
  const [currentId, setCurrentId] = useState<string | undefined>(() => pool[0]?.id);
  const current = useMemo(
    () => pool.find((c) => c.id === currentId) ?? pool[0],
    [pool, currentId]
  );
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [avatarOffset, setAvatarOffset] = useState(0);
  const dragStateRef = useRef<{
    startX: number;
    startOffset: number;
    min: number;
    max: number;
    moved: boolean;
    pointerId: number | null;
  }>({
    startX: 0,
    startOffset: 0,
    min: 0,
    max: 0,
    moved: false,
    pointerId: null,
  });

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
  const handleAvatarClick = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    handleImageClick();
  };
  const handleAskSubmit = () => {
    if (!askText.trim()) return;
    // TODO: Wire to AI API
    setAskText('');
  };
  const handleAvatarPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const min = avatarOffset - rect.left;
    const max = avatarOffset + (window.innerWidth - rect.right);
    dragStateRef.current = {
      startX: event.clientX,
      startOffset: avatarOffset,
      min,
      max,
      moved: false,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleAvatarPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragStateRef.current.startX;
    const next = Math.max(
      dragStateRef.current.min,
      Math.min(dragStateRef.current.max, dragStateRef.current.startOffset + delta)
    );
    if (Math.abs(delta) > 4) {
      dragStateRef.current.moved = true;
    }
    setAvatarOffset(next);
  };
  const handleAvatarPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    dragStateRef.current.pointerId = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const shellClassName = fullWidth
    ? 'fixed bottom-20 left-0 right-0 z-[1400]'
    : 'fixed bottom-20 left-3 z-[1400] sm:left-4';
  const containerClassName = fullWidth
    ? 'relative flex w-full flex-col items-center gap-2'
    : 'relative flex items-end gap-2 sm:gap-3';
  const avatarClassName = fullWidth
    ? 'relative h-28 w-28 shrink-0 sm:h-32 sm:w-32'
    : 'relative h-44 w-44 shrink-0 sm:h-52 sm:w-52';
  const bubbleClassName = fullWidth
    ? 'group relative z-[1000] w-full rounded-2xl border-2 border-amber-400 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl'
    : 'group relative z-[1000] max-w-[280px] rounded-2xl border-2 border-amber-400 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl sm:max-w-sm';
  const labelClassName = 'absolute top-full left-1/2 -translate-x-1/2';
  const actionMenuClassName = fullWidth
    ? 'absolute -top-2 left-1/2 z-[1450] mb-3 w-[min(420px,92vw)] -translate-x-1/2 translate-y-[-100%] rounded-2xl border-2 border-amber-400 bg-white/95 p-3 shadow-2xl'
    : 'absolute -top-2 left-0 z-[1450] mb-3 w-[min(340px,80vw)] translate-y-[-100%] rounded-2xl border-2 border-amber-400 bg-white/95 p-3 shadow-2xl';

  return (
    <div className={shellClassName}>
      <div className={containerClassName}>
    <div
      className="relative shrink-0 z-[2000]"
      style={{ transform: `translateX(${avatarOffset}px)` }}
    >
          <div className={labelClassName}>
        <span className="relative -top-[4px] z-[2001] inline-flex items-center whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
          {titleLabel}
        </span>
          </div>
        <button
          type="button"
          onClick={handleAvatarClick}
          onPointerDown={handleAvatarPointerDown}
          onPointerMove={handleAvatarPointerMove}
          onPointerUp={handleAvatarPointerUp}
          onPointerCancel={handleAvatarPointerUp}
          className={`${avatarClassName} relative z-0`}
          style={{ touchAction: 'none' }}
          aria-label="おばあちゃんメニューを開く"
        >
          <div className="absolute inset-0 rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 shadow-lg" />
          <div className="absolute inset-1 overflow-hidden rounded-xl border border-white bg-white shadow-inner">
            <img
              src={PLACEHOLDER_IMAGE}
              alt="おせっかいばあちゃん"
              className="h-full w-full scale-110 object-cover object-center"
            />
          </div>
        </button>
        </div>

        <button
          type="button"
          onClick={priorityMessage ? onPriorityClick : handleNext}
          className={bubbleClassName}
          aria-label="ばあちゃんのコメントを開く"
        >
          {!fullWidth && (
            <>
              <div className="absolute -left-3 bottom-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-amber-400" />
              <div className="absolute -left-2 bottom-6 h-0 w-0 border-y-7 border-y-transparent border-r-7 border-r-white" />
            </>
          )}

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
                {priorityMessage ? '最優先のイベントだよ' : 'タップすると次のコメントを見るよ'}
              </p>
              {priorityMessage && onPriorityDismiss && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPriorityDismiss();
                  }}
                  className="text-[11px] font-semibold text-amber-700 underline"
                >
                  通知を閉じる
                </button>
              )}
            </div>
          </div>
        </button>

        {isActionOpen && (
          <div className={actionMenuClassName}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-amber-900">おせっかいメニュー</p>
              <button
                type="button"
                className="text-xs text-amber-700 underline"
                onClick={() => setIsActionOpen(false)}
              >
                とじる
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 shadow-inner">
              <p className="text-xs font-semibold text-amber-800">AIに相談（見た目のみ）</p>
              <textarea
                value={askText}
                onChange={(e) => setAskText(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="食べたいものや困りごとを書いてね"
                rows={2}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-amber-700/80">送信するとAIに届く想定です</p>
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
                description="おすすめをまとめて教えるよ"
                icon="🧭"
                onClick={handleAgent}
              />
            </div>
          </div>
        )}
      </div>
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
      className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-amber-300"
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
      return '🔔';
    case 'notice':
      return '📢';
    case 'tutorial':
      return '🧭';
    case 'monologue':
    default:
      return '💬';
  }
}
