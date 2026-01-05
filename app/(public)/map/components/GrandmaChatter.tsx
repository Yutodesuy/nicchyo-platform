/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { grandmaCommentPool, pickNextComment } from "../services/grandmaCommentService";

const PLACEHOLDER_IMAGE = "/images/obaasan.webp";
const HOLD_MS = 250;

type PriorityMessage = {
  text: string;
  badgeTitle?: string;
  badgeIcon?: string;
};

type GrandmaChatterProps = {
  comments?: typeof grandmaCommentPool;
  titleLabel?: string;
  priorityMessage?: PriorityMessage | null;
  onPriorityClick?: () => void;
  onPriorityDismiss?: () => void;
  fullWidth?: boolean;
  onHoldChange?: (holding: boolean) => void;
  onDrop?: (position: { x: number; y: number }) => void;
};

export default function GrandmaChatter({
  comments,
  titleLabel = "おせっかいばあちゃん",
  priorityMessage,
  onPriorityClick,
  onPriorityDismiss,
  fullWidth = false,
  onHoldChange,
  onDrop,
}: GrandmaChatterProps) {
  const pool = comments && comments.length > 0 ? comments : grandmaCommentPool;
  const [currentId, setCurrentId] = useState<string | undefined>(() => pool[0]?.id);
  const current = useMemo(
    () => pool.find((c) => c.id === currentId) ?? pool[0],
    [pool, currentId]
  );
  const [askText, setAskText] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const [holdPhase, setHoldPhase] = useState<"idle" | "priming" | "active">("idle");
  const [keyboardShift, setKeyboardShift] = useState(0);
  const rafRef = useRef<number | null>(null);
  const pendingOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startOffset: number;
    startOffsetY: number;
    min: number;
    max: number;
    minY: number;
    maxY: number;
    moved: boolean;
    pointerId: number | null;
    active: boolean;
  }>(
    {
      startX: 0,
      startY: 0,
      startOffset: 0,
      startOffsetY: 0,
      min: 0,
      max: 0,
      minY: 0,
      maxY: 0,
      moved: false,
      pointerId: null,
      active: false,
    }
  );

  useEffect(() => {
    if (!pool.length) return;
    setCurrentId((prev) => pickNextComment(pool, prev)?.id ?? pool[0]?.id);
  }, [pool]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("grandma-chat-open", isChatOpen);
    return () => {
      document.body.classList.remove("grandma-chat-open");
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isChatOpen) {
      setKeyboardShift(0);
      return;
    }
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const heightLoss = Math.max(0, window.innerHeight - viewport.height);
      setKeyboardShift(heightLoss / 2);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isChatOpen]);

  if (!current) return null;

  const handleNext = () => {
    setCurrentId((prev) => pickNextComment(pool, prev)?.id);
  };

  const handleAvatarClick = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    setIsChatOpen((prev) => !prev);
    if (!isChatOpen) {
      inputRef.current?.focus();
    }
  };

  const handleAskSubmit = (text?: string) => {
    const value = (text ?? askText).trim();
    if (!value) return;
    setAskText("");
  };

  const handleAvatarPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsHolding(true);
    setHoldPhase("priming");
    onHoldChange?.(true);
    const rect = event.currentTarget.getBoundingClientRect();
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = document.documentElement.clientHeight;
    const min = avatarOffset.x - rect.left;
    const max = avatarOffset.x + (viewWidth - rect.right);
    const minY = avatarOffset.y - rect.top;
    const maxY = avatarOffset.y + (viewHeight - rect.bottom);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: avatarOffset.x,
      startOffsetY: avatarOffset.y,
      min,
      max,
      minY,
      maxY,
      moved: false,
      pointerId: event.pointerId,
      active: false,
    };
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdTimerRef.current = window.setTimeout(() => {
      dragStateRef.current.active = true;
      setHoldPhase("active");
    }, HOLD_MS);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAvatarPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStateRef.current.moved = true;
    }
    if (!dragStateRef.current.active && Math.abs(deltaX) > 4) {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsHolding(false);
      setHoldPhase("idle");
      onHoldChange?.(false);
    }
    const nextX = Math.max(
      dragStateRef.current.min,
      Math.min(dragStateRef.current.max, dragStateRef.current.startOffset + deltaX)
    );
    const nextY = dragStateRef.current.active
      ? Math.max(
          dragStateRef.current.minY,
          Math.min(dragStateRef.current.maxY, dragStateRef.current.startOffsetY + deltaY)
        )
      : 0;
    pendingOffsetRef.current = { x: nextX, y: nextY };
    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(() => {
        if (pendingOffsetRef.current !== null) {
          setAvatarOffset(pendingOffsetRef.current);
        }
        rafRef.current = null;
      });
    }
  };

  const handleAvatarPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const wasActive = dragStateRef.current.active;
    dragStateRef.current.pointerId = null;
    dragStateRef.current.active = false;
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    setHoldPhase("idle");
    onHoldChange?.(false);
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingOffsetRef.current !== null) {
      setAvatarOffset(pendingOffsetRef.current);
      pendingOffsetRef.current = null;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (wasActive) {
      setAvatarOffset({ x: 0, y: 0 });
    }
    if (wasActive) {
      onDrop?.({ x: event.clientX, y: event.clientY });
    }
  };

  const handleAvatarContextMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleAvatarDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const shellClassName = fullWidth
    ? "fixed bottom-20 left-0 right-0 z-[1400] pointer-events-none"
    : "fixed bottom-20 left-3 z-[1400] sm:left-4 pointer-events-none";
  const containerClassName = fullWidth
    ? "relative flex w-full flex-col items-center gap-2 pointer-events-none"
    : "relative flex items-end gap-2 sm:gap-3 pointer-events-none";
  const avatarClassName = fullWidth
    ? "relative h-[84px] w-[84px] shrink-0 sm:h-[96px] sm:w-[96px]"
    : "relative h-[33px] w-[33px] shrink-0 sm:h-[39px] sm:w-[39px]";
  const bubbleClassName = fullWidth
    ? "group relative z-[1000] w-[min(520px,92vw)] rounded-2xl border-2 border-amber-400 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl pointer-events-auto"
    : "group relative z-[1000] max-w-[280px] rounded-2xl border-2 border-amber-400 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl sm:max-w-sm pointer-events-auto";
  const bubbleStateClass =
    holdPhase === "active"
      ? "invisible"
      : holdPhase === "priming"
      ? "grandma-scroll-retracting"
      : "";
  const labelClassName = "absolute top-full left-1/2 -translate-x-1/2";
  const chatLiftClassName = isChatOpen ? "translate-y-[-120px]" : "translate-y-0";
  const templateChips = ["おすすめは？", "おばあちゃん何者？", "近くの人気店は？"];
  const inputShiftStyle =
    keyboardShift > 0 ? { transform: `translateY(${-keyboardShift}px)` } : undefined;

  return (
    <div className={shellClassName}>
      <div className={`${containerClassName} transition-transform duration-300 ${chatLiftClassName}`}>
        <div
          className="relative shrink-0 z-[2000]"
          style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
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
            onContextMenu={handleAvatarContextMenu}
            onDragStart={handleAvatarDragStart}
            className={`${avatarClassName} relative z-0 pointer-events-auto grandma-avatar`}
            style={{ touchAction: "none", WebkitTouchCallout: "none", userSelect: "none" }}
            aria-label="おばあちゃんチャットを開く"
          >
            {isHolding && <span className="grandma-hold-glow" aria-hidden="true" />}
            <div className="absolute inset-0 rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 shadow-lg" />
            <div className="absolute inset-1 overflow-hidden rounded-xl border border-white bg-white shadow-inner">
              <img
                src={PLACEHOLDER_IMAGE}
                alt="おせっかいばあちゃん"
                className="h-full w-full scale-110 object-cover object-center select-none"
                draggable={false}
              />
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={priorityMessage ? onPriorityClick : handleNext}
          className={`${bubbleClassName} ${bubbleStateClass}`}
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
              {priorityMessage && <p className="text-[11px] text-gray-500">最新バッジの情報</p>}
              {priorityMessage && onPriorityDismiss && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPriorityDismiss();
                  }}
                  className="text-[11px] font-semibold text-amber-700 underline"
                >
                  解除する
                </button>
              )}
            </div>
          </div>
        </button>
      </div>

      {isChatOpen && (
        <div className="pointer-events-auto mt-2 w-full px-3">
          <div className="mx-auto w-full max-w-xl space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {templateChips.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleAskSubmit(label)}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="rounded-2xl border-2 border-amber-300 bg-white/95 p-3 shadow-sm"
              style={inputShiftStyle}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="おばあちゃんに質問してね"
                />
                <button
                  type="button"
                  onClick={() => handleAskSubmit()}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function genreIcon(genre: string) {
  switch (genre) {
    case "event":
      return "??";
    case "notice":
      return "??";
    case "tutorial":
      return "??";
    case "monologue":
    default:
      return "??";
  }
}
