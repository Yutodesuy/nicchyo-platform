/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { grandmaCommentPool, pickNextComment } from '../services/grandmaCommentService';

const AUTO_ROTATE_MS = 60000;
const PLACEHOLDER_IMAGE = '/images/grandma-placeholder.svg';

export default function GrandmaChatter() {
  const pool = grandmaCommentPool;
  const [currentId, setCurrentId] = useState<string | undefined>(() => pool[0]?.id);
  const current = useMemo(() => pool.find((c) => c.id === currentId) ?? pool[0], [pool, currentId]);

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

  return (
    <div className="fixed bottom-20 right-3 z-[1400] sm:right-4">
      <div className="flex items-end gap-2 sm:gap-3">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 shadow-lg border-2 border-amber-500" />
          <div className="absolute inset-1 rounded-full overflow-hidden border border-white shadow-inner bg-white">
            <img
              src={PLACEHOLDER_IMAGE}
              alt="おばあちゃん"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="group relative max-w-[240px] sm:max-w-xs rounded-2xl border-2 border-amber-400 bg-white/95 px-3 py-3 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl"
          aria-label="次のコメントを表示"
        >
          <div className="absolute -left-3 bottom-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-amber-400" />
          <div className="absolute -left-2 bottom-6 h-0 w-0 border-y-7 border-y-transparent border-r-7 border-r-white" />

          <div className="flex items-start gap-2">
            <span className="text-lg" aria-hidden>
              {current.icon ?? genreIcon(current.genre)}
            </span>
            <div className="space-y-1">
              <p className="text-sm leading-relaxed text-gray-900">{current.text}</p>
              {current.link && (
                <Link
                  href={current.link.href}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 underline decoration-amber-400 decoration-2 underline-offset-4 transition group-hover:text-amber-700"
                >
                  {current.link.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
              <p className="text-[10px] text-gray-500">タップすると次のひと言を見る</p>
            </div>
          </div>
        </button>
      </div>
    </div>
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
