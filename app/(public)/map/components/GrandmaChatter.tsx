/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { grandmaAiInstructorLines } from "../data/grandmaComments";
import { grandmaCommentPool, pickNextComment } from "../services/grandmaCommentService";
import type { Shop } from "../data/shops";
import ShopResultCard from "../../search/components/ShopResultCard";

const PLACEHOLDER_IMAGE = "/images/obaasan.webp";
const HOLD_MS = 250;
const ROTATE_MS = 6500;

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
  onAsk?: (text: string) => Promise<{ reply: string; imageUrl?: string }>;
  aiSuggestedShops?: Shop[];
  onSelectShop?: (shopId: number) => void;
  fullWidth?: boolean;
  onHoldChange?: (holding: boolean) => void;
  onDrop?: (position: { x: number; y: number }) => void;
  onActiveShopChange?: (shopId: number | null) => void;
  onCommentShopFocus?: (shopId: number) => void;
};

export default function GrandmaChatter({
  comments,
  titleLabel = "おせっかいばあちゃん",
  priorityMessage,
  onPriorityClick,
  onPriorityDismiss,
  onAsk,
  aiSuggestedShops,
  onSelectShop,
  fullWidth = false,
  onHoldChange,
  onDrop,
  onActiveShopChange,
  onCommentShopFocus,
}: GrandmaChatterProps) {
  const pool = comments && comments.length > 0 ? comments : grandmaCommentPool;
  const [currentId, setCurrentId] = useState<string | undefined>(() => pool[0]?.id);
  const current = useMemo(
    () => pool.find((c) => c.id === currentId) ?? pool[0],
    [pool, currentId]
  );
  const [askText, setAskText] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [aiBubbleText, setAiBubbleText] = useState(
    grandmaAiInstructorLines[0] ?? "質問を入力してね。"
  );
  const [aiStatus, setAiStatus] = useState<"idle" | "thinking" | "answered" | "error">(
    "idle"
  );
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [introLockUntil, setIntroLockUntil] = useState<number | null>(null);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const [holdPhase, setHoldPhase] = useState<"idle" | "priming" | "active">("idle");
  const [keyboardShift, setKeyboardShift] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const askRequestRef = useRef(0);
  const lastAvatarOffsetRef = useRef({ x: 0, y: 0 });
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

  const isShopIntro = !isChatOpen && !priorityMessage && !!current?.shopId;
  const activeShopId = isShopIntro ? current?.shopId ?? null : null;

  useEffect(() => {
    onActiveShopChange?.(activeShopId);
  }, [activeShopId, onActiveShopChange]);

  useEffect(() => {
    if (isShopIntro) {
      setIntroLockUntil(Date.now() + 3500);
    } else {
      setIntroLockUntil(null);
    }
  }, [isShopIntro, current?.id]);

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
    if (!isChatOpen || !isInputFocused) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isChatOpen, isInputFocused, keyboardShift]);

  useEffect(() => {
    if (!isChatOpen) return;
    const randomIndex = Math.floor(Math.random() * grandmaAiInstructorLines.length);
    const nextLine =
      grandmaAiInstructorLines[randomIndex] ??
      grandmaAiInstructorLines[0] ??
      "質問を入力してね。";
    setAiBubbleText(nextLine);
    setAiStatus("idle");
    setAiImageUrl(null);
  }, [isChatOpen]);

  if (!current) return null;

  const handleNext = () => {
    if (introLockUntil && Date.now() < introLockUntil) return;
    setCurrentId((prev) => pickNextComment(pool, prev)?.id);
  };

  const handleInstructorNext = () => {
    const randomIndex = Math.floor(Math.random() * grandmaAiInstructorLines.length);
    const nextLine =
      grandmaAiInstructorLines[randomIndex] ??
      grandmaAiInstructorLines[0] ??
      "質問を入力してね。";
    setAiBubbleText(nextLine);
  };

  useEffect(() => {
    const shouldRotateInstructor = isChatOpen && aiStatus === "idle";
    const shouldRotateNormal = !isChatOpen;
    if (!shouldRotateInstructor && !shouldRotateNormal) return;
    const timer = window.setInterval(() => {
      if (isChatOpen) {
        if (aiStatus === "idle") {
          handleInstructorNext();
        }
      } else {
        handleNext();
      }
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [aiStatus, introLockUntil, isChatOpen, pool]);

  const handleAvatarClick = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    if (!isChatOpen) {
      if (inputRef.current) {
        try {
          inputRef.current.focus({ preventScroll: true });
        } catch {
          inputRef.current.focus();
        }
      }
      lastAvatarOffsetRef.current = avatarOffset;
      setAvatarOffset({ x: 0, y: 0 });
      setIsChatOpen(true);
    } else {
      setIsChatOpen(false);
      setAvatarOffset(lastAvatarOffsetRef.current);
      inputRef.current?.blur();
    }
  };

  const handleAskSubmit = async (text?: string) => {
    if (aiStatus === "thinking") return;
    const value = (text ?? askText).trim();
    if (!value) return;
    setAskText("");
    setAiStatus("thinking");
    setAiBubbleText("ちょっと待ってね、考えよるよ。");
    setAiImageUrl(null);
    const requestId = ++askRequestRef.current;
    try {
      const response = onAsk
        ? await onAsk(value)
        : { reply: "いま準備中やき、もう少し待っててね。" };
      if (requestId !== askRequestRef.current) return;
      setAiStatus("answered");
      setAiBubbleText(
        response.reply || "うまく答えが出せんかった。もう一回聞いてみてね。"
      );
      setAiImageUrl(response.imageUrl ?? null);
    } catch {
      if (requestId !== askRequestRef.current) return;
      setAiStatus("error");
      setAiBubbleText("ごめんね、今は答えを出せんかった。時間をおいて試してね。");
      setAiImageUrl(null);
    }
  };

  const handleAvatarPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isChatOpen) {
      return;
    }
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
    ? isChatOpen
      ? "relative flex w-full flex-row-reverse items-end justify-center gap-3 pointer-events-none"
      : "relative flex w-full flex-col items-center gap-2 pointer-events-none"
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
  const isKeyboardOpen = isInputFocused || keyboardShift > 0;
  const hasSuggestedBox =
    !!aiSuggestedShops && aiSuggestedShops.length > 0 && !isKeyboardOpen;
  const chatLiftClassName = isChatOpen
    ? isKeyboardOpen
      ? "translate-y-[-230px]"
      : hasSuggestedBox
      ? "translate-y-[-60px]"
      : "translate-y-[-230px]"
    : "translate-y-0";
  const templateChips = ["おすすめは？", "おばあちゃん何者？", "近くのお店は？"];
  const inputOffsetPx = isKeyboardOpen ? -160 : hasSuggestedBox ? -10 : -120;
  const inputShiftStyle = { transform: `translateY(${inputOffsetPx}px)` };
  const chatPanelLift = isChatOpen ? "translate-y-[-60px]" : "translate-y-0";
  const bubbleText = isChatOpen
    ? aiBubbleText
    : priorityMessage
    ? priorityMessage.text
    : current.text;
  const bubbleIcon = isChatOpen
    ? "🤖"
    : priorityMessage?.badgeIcon ?? current.icon ?? pickCommentIcon(current);

  return (
    <div className={shellClassName}>
      <div className={`${containerClassName} transition-transform duration-300 ${chatLiftClassName}`}>
        <div
          className="relative shrink-0 z-[2000]"
          style={{
            transform: `translate(${avatarOffset.x}px, ${avatarOffset.y + (isChatOpen ? -15 : 0)}px)`,
          }}
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
          onClick={
            isChatOpen
              ? aiStatus === "idle"
                ? handleInstructorNext
                : undefined
              : priorityMessage
              ? onPriorityClick
              : () => {
                  if (isShopIntro && current?.shopId) {
                    onCommentShopFocus?.(current.shopId);
                    return;
                  }
                  handleNext();
                }
          }
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
              {bubbleIcon}
            </span>
            <div className="space-y-1">
              <p className="text-base leading-relaxed text-gray-900">
                {bubbleText}
              </p>
              {current.link && !priorityMessage && !isChatOpen && (
                <Link
                  href={current.link.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 underline decoration-amber-400 decoration-2 underline-offset-4 transition group-hover:text-amber-700"
                >
                  {current.link.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
              {priorityMessage && !isChatOpen && (
                <p className="text-[11px] text-gray-500">最新バッジの情報</p>
              )}
              {priorityMessage && onPriorityDismiss && !isChatOpen && (
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
              {isChatOpen && (
                <p className="text-[11px] text-gray-500">
                  {aiStatus === "thinking"
                    ? "回答を作成中…"
                    : aiStatus === "answered"
                    ? "入力を続けてね"
                    : "入力待ち"}
                </p>
              )}
            </div>
          </div>
        </button>
      </div>

      <div
        className={`w-full px-3 transition-all duration-200 ${chatPanelLift} ${
          isChatOpen
            ? "pointer-events-auto opacity-100 max-h-[320px] mt-2"
            : "pointer-events-none opacity-0 max-h-0 mt-0 overflow-hidden"
        }`}
        aria-hidden={!isChatOpen}
      >
        <div className="mx-auto w-full max-w-xl space-y-2" style={inputShiftStyle}>
          {aiImageUrl && (
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <img
                src={aiImageUrl}
                alt="案内画像"
                className="h-36 w-full object-cover"
              />
            </div>
          )}
          {aiSuggestedShops && aiSuggestedShops.length > 0 && !isKeyboardOpen && (
            <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-4 shadow-sm translate-y-[5px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="ai-label-playful text-lg text-pink-600">AIおすすめ</span>
                  <span className="text-lg font-bold text-gray-900">提案されたお店</span>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
                  {aiSuggestedShops.length}店
                </span>
              </div>
              {aiStatus === "thinking" ? (
                <div className="mt-6 flex items-center justify-center py-4">
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" aria-label="読み込み中" />
                </div>
              ) : (
                <div
                  className={`mt-3 flex gap-3 pb-2 ${
                    aiSuggestedShops.length > 1 ? "overflow-x-auto" : ""
                  }`}
                >
                  {aiSuggestedShops.map((shop) => (
                    <div
                      key={shop.id}
                      className={aiSuggestedShops.length === 1 ? "w-full" : "shrink-0"}
                    >
                      <ShopResultCard
                        shop={shop}
                        isFavorite={false}
                        onSelectShop={() => onSelectShop?.(shop.id)}
                        compact={aiSuggestedShops.length > 1}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div
            className={`flex flex-wrap items-center justify-center gap-2 transition-all duration-200 ${
              isChatOpen ? "max-h-24" : "max-h-0 overflow-hidden"
            }`}
          >
            {templateChips.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleAskSubmit(label)}
                disabled={aiStatus === "thinking"}
                className={`rounded-full border border-amber-200 px-3 py-1.5 text-[12px] font-semibold shadow-sm transition ${
                  aiStatus === "thinking"
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-white text-amber-800 hover:bg-amber-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className={`rounded-2xl border-2 border-amber-300 bg-white/95 p-3 shadow-sm transition-transform duration-200 ${
              isChatOpen ? "scale-100" : "scale-95"
            }`}
          >
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="text"
                value={askText}
                onChange={(e) => setAskText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                disabled={aiStatus === "thinking"}
                className={`w-full rounded-xl border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 ${
                  aiStatus === "thinking"
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "border-amber-200 bg-white text-gray-900 focus:ring-amber-400"
                }`}
                placeholder="おばあちゃんに質問してね"
              />
              <button
                type="button"
                onClick={() => handleAskSubmit()}
                disabled={aiStatus === "thinking"}
                className={`w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
                  aiStatus === "thinking"
                    ? "cursor-not-allowed bg-gray-200 text-gray-400"
                    : "bg-amber-600 text-white hover:bg-amber-500"
                }`}
              >
                {aiStatus === "thinking" ? "送信中…" : "送信"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function pickCommentIcon(comment: { genre: string; text: string }) {
  const text = comment.text;
  if (comment.genre === "event") return "🎉";
  if (comment.genre === "notice") {
    if (text.includes("バッグ") || text.includes("bag")) return "👜";
    if (text.includes("ブロック")) return "🧭";
    return "⚠️";
  }
  if (comment.genre === "tutorial") {
    if (text.includes("検索") || text.includes("探")) return "🔎";
    return "👆";
  }

  if (text.includes("雨")) return "☔";
  if (text.includes("風")) return "🌬️";
  if (text.includes("夕方")) return "🌇";
  if (text.includes("朝")) return "🌅";
  if (text.includes("写真")) return "📸";
  if (text.includes("城") || text.includes("城下町")) return "🏯";
  if (text.includes("季節")) return "🍁";
  if (text.includes("果物")) return "🍊";
  if (text.includes("野菜") || text.includes("食材")) return "🥬";
  if (text.includes("飲み物")) return "🥤";
  if (text.includes("甘い")) return "🍡";
  if (text.includes("屋台") || text.includes("お腹") || text.includes("料理") || text.includes("食べ")) return "🍽️";
  if (text.includes("休") || text.includes("座") || text.includes("ベンチ")) return "🪑";
  if (text.includes("音楽")) return "🎵";
  if (text.includes("迷子") || text.includes("人が多い")) return "👥";
  if (text.includes("お土産") || text.includes("お気に入り")) return "🎁";
  if (text.includes("道") || text.includes("散歩") || text.includes("歩")) return "🚶";
  if (text.includes("時間") || text.includes("早め")) return "⏰";

  return "💬";
}
