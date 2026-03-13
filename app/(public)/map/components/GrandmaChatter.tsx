/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "../../consult/components/MessageBubble";
import {
  CONSULT_CHARACTERS,
  CONSULT_CHARACTER_BY_ID,
  type ConsultCharacterId,
} from "../../consult/data/consultCharacters";
import type {
  ConsultAskResponse,
  ConsultErrorCode,
  ConsultHistoryEntry,
} from "../../consult/types/consultConversation";
import { grandmaAiInstructorLines } from "../data/grandmaComments";
import { grandmaCommentPool, pickNextComment } from "../services/grandmaCommentService";
import type { Shop } from "../data/shops";
import ShopResultCard from "../../search/components/ShopResultCard";
import { getSmartSuggestions } from "../utils/suggestionGenerator";
import { getShopBannerImage } from "@/lib/shopImages";
const HOLD_MS = 250;
const ROTATE_MS = 6500;
const EXAMPLE_ROTATE_MS = 4500;

type PriorityMessage = {
  text: string;
  badgeTitle?: string;
  badgeIcon?: string;
};

type AskContext = { shopId?: number; shopName?: string; source?: "suggestion" | "input" };

type PendingSubmission = {
  text: string;
  imageFile?: File | null;
  imagePreview?: string | null;
  context?: AskContext;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  shopIds?: number[];
  shops?: Shop[];
  localImageUrl?: string;
  speakerId?: ConsultCharacterId;
  speakerName?: string;
  followUpQuestion?: string;
};

type GrandmaChatterProps = {
  comments?: typeof grandmaCommentPool;
  titleLabel?: string;
  priorityMessage?: PriorityMessage | null;
  onPriorityClick?: () => void;
  onPriorityDismiss?: () => void;
  onAsk?: (
    text: string,
    imageFile?: File | null,
    context?: AskContext,
    history?: ConsultHistoryEntry[],
    memorySummary?: string
  ) => Promise<ConsultAskResponse>;
  allShops?: Shop[];
  aiSuggestedShops?: Shop[];
  onSelectShop?: (shopId: number) => void;
  fullWidth?: boolean;
  onHoldChange?: (holding: boolean) => void;
  onDrop?: (position: { x: number; y: number }) => void;
  onActiveShopChange?: (shopId: number | null) => void;
  onCommentShopFocus?: (shopId: number) => void;
  onCommentShopOpen?: (shopId: number) => void;
  introImageUrl?: string | null;
  onAiImageClick?: (imageUrl: string) => void;
  initialOpen?: boolean;
  layout?: "floating" | "page";
  onClear?: () => void;
  autoAskText?: string | null;
  autoAskContext?: { shopId?: number; shopName?: string };
  currentZoom?: number;
  enableSpeechInput?: boolean;
  variant?: "default" | "consult";
};

export default function GrandmaChatter({
  comments,
  titleLabel = "おせっかいばあちゃん",
  priorityMessage,
  onPriorityClick,
  onPriorityDismiss,
  onAsk,
  allShops,
  aiSuggestedShops,
  onSelectShop,
  fullWidth = false,
  onHoldChange,
  onDrop,
  onActiveShopChange,
  onCommentShopFocus,
  onCommentShopOpen,
  introImageUrl,
  onAiImageClick,
  initialOpen = false,
  layout = "floating",
  onClear,
  autoAskText,
  autoAskContext,
  currentZoom,
  enableSpeechInput = false,
  variant = "default",
}: GrandmaChatterProps) {
  const isConsultVariant = variant === "consult";
  const pool = comments && comments.length > 0 ? comments : grandmaCommentPool;
  const [currentId, setCurrentId] = useState<string | undefined>(() => pool[0]?.id);
  const current = useMemo(
    () => pool.find((c) => c.id === currentId) ?? pool[0],
    [pool, currentId]
  );
  const [askText, setAskText] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(initialOpen);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [hasUserAsked, setHasUserAsked] = useState(false);
  const [hasProcessedAutoAsk, setHasProcessedAutoAsk] = useState(false);
  const [conversationSummary, setConversationSummary] = useState("");
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [shouldShowValidation, setShouldShowValidation] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ConsultErrorCode | null>(null);
  const [errorHelperQuestions, setErrorHelperQuestions] = useState<string[]>([]);
  const [lastFailedSubmission, setLastFailedSubmission] = useState<PendingSubmission | null>(null);
  const [aiBubbleText, setAiBubbleText] = useState(
    grandmaAiInstructorLines[0] ?? "質問を入力してね。"
  );
  const [aiStatus, setAiStatus] = useState<"idle" | "thinking" | "answered" | "error">(
    "idle"
  );
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [introLockUntil, setIntroLockUntil] = useState<number | null>(null);
  const [isIntroImageOpen, setIsIntroImageOpen] = useState(false);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const [holdPhase, setHoldPhase] = useState<"idle" | "priming" | "active">("idle");
  const [keyboardShift, setKeyboardShift] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [consultExampleIndex, setConsultExampleIndex] = useState(0);
  const [consultHeroIndex, setConsultHeroIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const pendingOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const askRequestRef = useRef(0);
  const lastAvatarOffsetRef = useRef({ x: 0, y: 0 });
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const chatStorageKeyRef = useRef<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const speechStartTextRef = useRef("");
  const speechRecognitionRef = useRef<{
    start: () => void;
    stop: () => void;
    abort: () => void;
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  } | null>(null);
  const speechConstructorRef = useRef<(new () => {
    start: () => void;
    stop: () => void;
    abort: () => void;
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  }) | null>(null);
  const [smartContext, setSmartContext] = useState({
    placeholder: "おばあちゃんに質問してね",
    chip: "おすすめは？"
  });
  const consultExampleQuestions = useMemo(
    () => [
      "今の季節におすすめの食材はある？",
      "子ども連れでも楽しめる場所は？",
      "日曜市の回り方を教えて",
      "今やってるイベントある？",
      "お土産にぴったりのものは？",
      "雨の日でも楽しめる場所ある？",
      "近くで座って休める場所ある？",
      "旬の果物が買えるお店は？",
      "混雑を避けるコツってある？",
      "写真映えするスポット教えて",
    ],
    []
  );
  const router = useRouter();
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
    // 時間帯に応じたスマートなデフォルト値の設定
    const hour = new Date().getHours();
    let placeholder = "おばあちゃんに質問してね";
    let chip = "おすすめは？";

    if (hour >= 5 && hour < 11) {
      placeholder = "（例）朝ごはんのおすすめは？";
      chip = "朝ごはんのおすすめ";
    } else if (hour >= 11 && hour < 14) {
      placeholder = "（例）お昼ご飯、どこがいい？";
      chip = "ランチのおすすめ";
    } else if (hour >= 14 && hour < 17) {
      placeholder = "（例）ちょっと休憩したいな";
      chip = "おやつの時間";
    } else if (hour >= 17 && hour < 21) {
      placeholder = "（例）晩ご飯のおかずある？";
      chip = "晩ご飯の買い物";
    } else {
      placeholder = "（例）明日の日曜市は何時から？";
      chip = "日曜市の開催時間";
    }
    setSmartContext({ placeholder, chip });
  }, []);

  useEffect(() => {
    if (!enableSpeechInput) return;
    if (typeof window === "undefined") return;
    const speechConstructor =
      (window as Window & { SpeechRecognition?: typeof speechConstructorRef.current }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof speechConstructorRef.current })
        .webkitSpeechRecognition;
    if (speechConstructor) {
      speechConstructorRef.current = speechConstructor;
      setIsSpeechSupported(true);
    } else {
      setIsSpeechSupported(false);
    }
    return () => {
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
    };
  }, [enableSpeechInput]);

  const stopSpeechRecognition = () => {
    if (!isListening) return;
    speechRecognitionRef.current?.stop();
  };

  const startSpeechRecognition = () => {
    if (!speechConstructorRef.current) return;
    if (isListening) {
      stopSpeechRecognition();
      return;
    }
    const recognition = speechRecognitionRef.current ?? new speechConstructorRef.current();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;
    speechStartTextRef.current = askText;
    recognition.onresult = (event) => {
      const results = Array.from(event.results ?? []);
      const transcript = results.map((result) => result[0]?.transcript ?? "").join("");
      setAskText(`${speechStartTextRef.current}${transcript}`);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    speechRecognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  useEffect(() => {
    if (!pool.length) return;
    setCurrentId((prev) => pickNextComment(pool, prev)?.id ?? pool[0]?.id);
  }, [pool]);

  useEffect(() => {
    if (layout !== "page") return;
    if (typeof window === "undefined") return;
    const key = "nicchyo-consult-chat";
    chatStorageKeyRef.current = key;
    const saved = localStorage.getItem(key);
    if (!saved) {
      setHasLoadedHistory(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as
        | ChatMessage[]
        | {
            messages: ChatMessage[];
            hasUserAsked?: boolean;
            conversationSummary?: string;
          };
      const messages = Array.isArray(parsed) ? parsed : parsed.messages;
      if (Array.isArray(messages) && messages.length > 0) {
        setChatMessages(messages);
        setHasUserAsked(
          Array.isArray(parsed)
            ? messages.some((message) => message.role === "user")
            : !!parsed.hasUserAsked || messages.some((message) => message.role === "user")
        );
      }
      if (!Array.isArray(parsed) && parsed.conversationSummary) {
        setConversationSummary(parsed.conversationSummary);
      }
    } catch {
      // ignore malformed history
    } finally {
      setHasLoadedHistory(true);
    }
  }, [layout]);

  const isShopIntro = !isChatOpen && !priorityMessage && !!current?.shopId;
  const activeShopId = isShopIntro ? current?.shopId ?? null : null;
  const showIntroImage = isShopIntro && !!introImageUrl;
  const introImageSize = { width: 108, height: 144, gap: 12 };
  const showAvatarButton = false;
  const showBubbleAvatar = !isShopIntro;
  const shopLookup = useMemo(() => {
    const source = allShops && allShops.length > 0 ? allShops : aiSuggestedShops ?? [];
    const map = new Map<number, Shop>();
    source.forEach((shop) => map.set(shop.id, shop));
    return map;
  }, [allShops, aiSuggestedShops]);

  useEffect(() => {
    onActiveShopChange?.(activeShopId);
  }, [activeShopId, onActiveShopChange]);

  useEffect(() => {
    if (isShopIntro) {
      const nextLock = Date.now() + 3500;
      setIntroLockUntil((prev) => (prev ? Math.max(prev, nextLock) : nextLock));
    } else {
      setIntroLockUntil(null);
      setIsIntroImageOpen(false);
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
      const offset = Math.max(0, heightLoss - (viewport.offsetTop ?? 0));
      setKeyboardShift(heightLoss / 2);
      setKeyboardOffset(offset);
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
    setChatMessages((prev) => {
      if (prev.length > 0) return prev;
      if (layout === "page" && hasLoadedHistory) {
        return prev;
      }
      return [
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: nextLine,
        },
      ];
    });
  }, [hasLoadedHistory, isChatOpen, layout]);

  useEffect(() => {
    if (layout !== "page") return;
    if (!hasLoadedHistory) return;
    if (typeof window === "undefined") return;
    if (!chatStorageKeyRef.current) return;
    const serializable = chatMessages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      imageUrl: message.imageUrl,
      shopIds: message.shopIds,
      shops: message.shops,
      speakerId: message.speakerId,
      speakerName: message.speakerName,
      followUpQuestion: message.followUpQuestion,
    }));
    localStorage.setItem(
      chatStorageKeyRef.current,
      JSON.stringify({
        messages: serializable,
        hasUserAsked,
        conversationSummary,
      })
    );
  }, [chatMessages, conversationSummary, hasLoadedHistory, hasUserAsked, layout]);

  useEffect(() => {
    if (!isChatOpen) return;
    if (layout === "page") {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      return;
    }
    if (!chatScrollRef.current) return;
    const scrollContainer = chatScrollRef.current;

    // Only auto-scroll if we were already near bottom or it's a new message from user/assistant
    const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;

    if (isNearBottom || chatMessages.length > 0) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [chatMessages, isChatOpen, aiStatus, layout]);

  useEffect(() => {
    if (autoAskText && !hasProcessedAutoAsk) {
      setHasProcessedAutoAsk(true);
      // レイアウトがpageの場合は最初から開いているので即座に、
      // floatingの場合は開いてから少し待って送信するなどの制御ができるが、
      // ここではシンプルに少し遅延させて送信する
      if (!isChatOpen) setIsChatOpen(true);

      setTimeout(() => {
        handleAskSubmit(autoAskText, autoAskContext);
      }, 600);
    }
  }, [autoAskText, autoAskContext, hasProcessedAutoAsk, isChatOpen]);

  useEffect(() => {
    if (layout === "page") {
      setShowScrollToBottom(false);
      return;
    }
    const scrollContainer = chatScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isChatOpen, layout]);

  if (!current) return null;

  const handleNext = () => {
    if (isIntroImageOpen) return;
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
    const shouldRotateNormal = !isChatOpen && !isIntroImageOpen;
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
  }, [aiStatus, introLockUntil, isChatOpen, isIntroImageOpen, pool]);

  const showConsultExamples =
    layout === "page" &&
    isChatOpen &&
    !isInputFocused &&
    !askText.trim() &&
    !selectedImageFile &&
    aiStatus !== "thinking";

  useEffect(() => {
    if (!showConsultExamples || consultExampleQuestions.length <= 1) return;
    const timer = window.setInterval(() => {
      setConsultExampleIndex((prev) => (prev + 1) % consultExampleQuestions.length);
    }, EXAMPLE_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [consultExampleQuestions.length, showConsultExamples]);

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

  const shouldValidateInput = layout === "page";

  const handleAskSubmit = async (
    text?: string,
    context?: AskContext,
    openChat?: boolean,
    retrySubmission?: PendingSubmission | null
  ) => {
    if (aiStatus === "thinking") return;
    stopSpeechRecognition();
    const submission = retrySubmission ?? {
      text: (text ?? askText).trim(),
      imageFile: selectedImageFile,
      imagePreview: selectedImagePreview,
      context,
    };
    const value = submission.text;
    if (!value && !submission.imageFile) {
      if (shouldValidateInput) {
        setShouldShowValidation(true);
      }
      return;
    }
    if (openChat && !isChatOpen) {
      setIsChatOpen(true);
    }
    const imageFile = submission.imageFile ?? null;
    const imagePreview = submission.imagePreview ?? null;
    setAskText("");
    setSelectedImageName(null);
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setShouldShowValidation(false);
    setErrorNotice(null);
    setErrorCode(null);
    setErrorHelperQuestions([]);
    setLastFailedSubmission(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: value || "（画像を送信）",
        localImageUrl: imagePreview ?? undefined,
      },
    ]);
    setHasUserAsked(true);
    setAiStatus("thinking");
    setAiBubbleText("ちょっと待ってね、考えよるよ。");
    setAiImageUrl(null);
    const requestId = ++askRequestRef.current;
    const historyForRequest: ConsultHistoryEntry[] = chatMessages
      .slice(-8)
      .map((message) => ({
        role: message.role,
        text: message.text,
        speakerId: message.speakerId ?? null,
        speakerName: message.speakerName ?? null,
      }));
    try {
      const response = onAsk
        ? await onAsk(
            value,
            imageFile ?? undefined,
            submission.context,
            historyForRequest,
            conversationSummary
          )
        : { reply: "いま準備中やき、もう少し待っててね。" };
      if (requestId !== askRequestRef.current) return;
      const reply =
        response.reply || "うまく答えが出せんかった。もう一回聞いてみてね。";
      const isRetryableError = !!response.retryable;
      setAiStatus(isRetryableError ? "error" : "answered");
      setAiBubbleText(reply);
      setAiImageUrl(response.imageUrl ?? null);
      setErrorNotice(response.errorMessage ?? null);
      setErrorCode(response.errorCode ?? null);
      setErrorHelperQuestions(response.helperQuestions ?? []);
      setLastFailedSubmission(isRetryableError ? submission : null);
      if (response.memorySummary) {
        setConversationSummary(response.memorySummary);
      }
      const turns =
        response.turns && response.turns.length > 0
          ? response.turns
          : [
              {
                speakerId: "nichiyosan" as const,
                speakerName: "にちよさん",
                text: reply,
              },
            ];
      for (let index = 0; index < turns.length; index += 1) {
        const turn = turns[index];
        setChatMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}-${index}`,
            role: "assistant",
            text: turn.text,
            imageUrl: index === turns.length - 1 ? response.imageUrl : undefined,
            shopIds: index === turns.length - 1 ? response.shopIds : undefined,
            shops: index === turns.length - 1 ? response.shops : undefined,
            speakerId: turn.speakerId,
            speakerName: turn.speakerName,
            followUpQuestion:
              index === turns.length - 1 ? response.followUpQuestion : undefined,
          },
        ]);
        if (index < turns.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
          if (requestId !== askRequestRef.current) return;
        }
      }
    } catch {
      if (requestId !== askRequestRef.current) return;
      setAiStatus("error");
      setAiBubbleText("ごめんね、今は答えを出せんかった。時間をおいて試してね。");
      setAiImageUrl(null);
      setErrorNotice("接続に失敗しました。少し時間をおいて、もう一度試してください。");
      setErrorCode("system_error");
      setErrorHelperQuestions([]);
      setLastFailedSubmission(submission);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "ごめんね、今は答えを出せんかった。時間をおいて試してね。",
        },
      ]);
    }
  };

  const handleImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedImageName(null);
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
      if (shouldValidateInput && !askText.trim()) {
        setShouldShowValidation(true);
      }
      return;
    }
    setErrorNotice(null);
    setErrorCode(null);
    setErrorHelperQuestions([]);
    setLastFailedSubmission(null);
    setSelectedImageName(file.name);
    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    setShouldShowValidation(false);
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
    const reservedRight = 0;
    const max = avatarOffset.x + Math.max(0, viewWidth - rect.right - reservedRight);
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

  const shellClassName = layout === "page"
    ? "relative w-full pointer-events-auto"
    : fullWidth
      ? "fixed bottom-20 left-0 right-0 z-[1400] pointer-events-none"
      : "fixed bottom-20 left-3 z-[1400] sm:left-4 pointer-events-none";
  const containerClassName = layout === "page"
    ? "relative flex w-full flex-col items-center gap-2"
    : fullWidth
      ? isChatOpen
        ? "relative flex w-full flex-row-reverse items-end justify-center gap-3 pointer-events-none"
        : "relative flex w-full flex-col items-center gap-2 pointer-events-none"
      : "relative flex items-end gap-2 sm:gap-3 pointer-events-none";
  const avatarClassName = fullWidth
    ? "relative h-[84px] w-[84px] shrink-0 sm:h-[96px] sm:w-[96px]"
    : "relative h-[33px] w-[33px] shrink-0 sm:h-[39px] sm:w-[39px]";
  const bubbleBaseClassName = fullWidth
    ? isChatOpen
      ? "relative z-[1000] w-full max-w-none border-0 bg-transparent px-4 py-0 text-left shadow-none pointer-events-auto"
      : "group relative z-[1000] w-full max-w-3xl rounded-2xl border-2 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl pointer-events-auto"
    : "group relative z-[1000] max-w-[280px] rounded-2xl border-2 bg-white/95 px-4 py-4 text-left shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl sm:max-w-sm pointer-events-auto";
  const bubbleBorderClass = isConsultVariant
    ? "border-[var(--consult-border)]"
    : isShopIntro
      ? "border-emerald-400"
      : "border-amber-400";
  const bubbleStateClass =
    holdPhase === "active"
      ? "invisible"
      : holdPhase === "priming"
      ? "grandma-scroll-retracting"
      : "";
  const labelClassName = "absolute top-full left-1/2 -translate-x-1/2";
  const isKeyboardOpen = isInputFocused || keyboardShift > 0;
  const hasImageReply = !!aiImageUrl;
  const persistedSuggestedShops = useMemo(() => {
    for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
      const message = chatMessages[index];
      if (message.role !== "assistant") continue;
      if (message.shops && message.shops.length > 0) {
        return message.shops;
      }
      if (message.shopIds && message.shopIds.length > 0) {
        const resolved = message.shopIds
          .map((id) => shopLookup.get(id))
          .filter((shop): shop is Shop => !!shop);
        if (resolved.length > 0) {
          return resolved;
        }
      }
    }
    return [];
  }, [chatMessages, shopLookup]);
  const displayedSuggestedShops =
    persistedSuggestedShops.length > 0 ? persistedSuggestedShops : aiSuggestedShops ?? [];
  const hasSuggestedBox =
    displayedSuggestedShops.length > 0 && !isKeyboardOpen;
  const hasSupplement = hasSuggestedBox || hasImageReply;
  const chatLiftClassName = layout === "page"
    ? "translate-y-0"
    : isChatOpen
      ? isKeyboardOpen
        ? "translate-y-[-230px]"
        : hasSupplement
        ? "translate-y-[-60px]"
        : "translate-y-[-230px]"
      : "translate-y-0";
  const smartSuggestionChips = useMemo(() => {
    // ズームレベル条件: 最大(21)と最大-1(20)以外で表示
    // つまり zoom < 20 の時に表示
    // layout === "page" (相談ページ) の場合は常に表示したいかもしれないが、
    // ここではマップ上のチップとしてのロジックなので、floating時のみズーム考慮
    if (layout === "floating" && currentZoom !== undefined && currentZoom >= 20) {
      return [];
    }

    if (isShopIntro && current?.shopId) {
      const shop = shopLookup.get(current.shopId);
      return getSmartSuggestions(current.text, shop);
    }
    return getSmartSuggestions(current.text);
  }, [current, isShopIntro, shopLookup, layout, currentZoom]);

  const inputOffsetPx = isKeyboardOpen ? 0 : 0;
  const inputShiftStyle = { transform: `translateY(${inputOffsetPx}px)` };
  const chatPanelLift =
    layout === "page" ? "translate-y-0" : isChatOpen ? "translate-y-[-60px]" : "translate-y-0";
  const inputBottomOffset =
    layout === "page"
      ? isKeyboardOpen
        ? Math.max(8, keyboardOffset + 28)
        : 50
      : undefined;
  const bubbleText = isChatOpen
    ? aiBubbleText
    : priorityMessage
    ? priorityMessage.text
    : current.text;
  const bubbleIcon = isChatOpen
    ? "🤖"
    : priorityMessage?.badgeIcon ?? current.icon ?? pickCommentIcon(current);
  const activeConsultExample = consultExampleQuestions[consultExampleIndex % consultExampleQuestions.length];
  const activeConsultHero =
    CONSULT_CHARACTERS[consultHeroIndex % CONSULT_CHARACTERS.length];
  const defaultConsultSpeaker = CONSULT_CHARACTERS[0];
  const getSpeakerCharacter = (speakerId?: ConsultCharacterId) =>
    (speakerId ? CONSULT_CHARACTER_BY_ID.get(speakerId) : null) ?? defaultConsultSpeaker;

  useEffect(() => {
    if (!isConsultVariant) return;
    const timer = window.setInterval(() => {
      setConsultHeroIndex((prev) => (prev + 1) % CONSULT_CHARACTERS.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [isConsultVariant]);

  return (
    <div className={shellClassName}>
      <div className={`${containerClassName} transition-transform duration-300 ${chatLiftClassName}`}>
        {showAvatarButton && (
          <div
            className="relative shrink-0 z-[2000]"
            style={{
              transform: `translate(${avatarOffset.x}px, ${avatarOffset.y + (isChatOpen ? -15 : 0)}px)`,
            }}
          >
            <div className={labelClassName}>
              <span className={`grandma-title-label relative -top-[4px] z-[2001] inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 font-semibold text-white ${isConsultVariant ? "bg-slate-700" : "bg-amber-500 shadow-sm"}`}>
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
              aria-label="おばあちゃんに相談する"
            >
              {isHolding && <span className="grandma-hold-glow" aria-hidden="true" />}
              <div className="absolute inset-1 overflow-hidden rounded-xl bg-transparent">
                <img
                  src={defaultConsultSpeaker.image}
                  alt="おせっかいばあちゃん"
                  className="h-full w-full scale-110 object-cover object-center select-none"
                  draggable={false}
                />
              </div>
            </button>
          </div>
        )}

        {/* スマート提案チップ (チャットが閉じている時かつ吹き出しモードでない時) */}
        {!isChatOpen && !priorityMessage && smartSuggestionChips.length > 0 && layout === "floating" && (
           <div className="absolute bottom-full right-0 mb-3 flex flex-col items-end gap-2 pointer-events-auto z-[1010]">
             {smartSuggestionChips.slice(0, 1).map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const params = new URLSearchParams();
                    params.set("q", label);
                    if (current?.shopId) {
                      params.set("shopId", String(current.shopId));
                      const shopName = shopLookup.get(current.shopId)?.name;
                      if (shopName) {
                        params.set("shopName", shopName);
                      }
                    }
                    router.push(`/consult?${params.toString()}`);
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-bold backdrop-blur-sm transition ${isConsultVariant ? "border-[var(--consult-border)] bg-[var(--consult-surface)] text-slate-700 hover:bg-white" : "border-amber-200 bg-white/90 text-amber-800 shadow-md hover:bg-white hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-500"}` }
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="mr-1">💡</span>
                  {label}
                </button>
             ))}
           </div>
        )}

        {isChatOpen ? (
          <div
            className={`${bubbleBaseClassName} ${bubbleBorderClass} ${bubbleStateClass}`}
            aria-label="おばあちゃんとの会話"
          >
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className={`text-sm font-semibold ${isConsultVariant ? "text-slate-700" : "text-amber-800"}`}>
                {isConsultVariant ? "日曜市のみんな" : "にちよさんAI"}
              </div>
              <div className="flex items-center gap-3">
                {aiStatus !== "idle" && (
                  <Badge variant="secondary" className="text-[11px]">
                    {aiStatus === "thinking" ? "考え中…" : "続けて聞いてね"}
                  </Badge>
                )}
                {layout === "page" && chatMessages.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => {
                        if (window.confirm("これまでの会話を消してもいいですか？")) {
                          setChatMessages([]);
                          setHasUserAsked(false);
                          setConversationSummary("");
                          setErrorNotice(null);
                          setErrorCode(null);
                          setErrorHelperQuestions([]);
                          setLastFailedSubmission(null);
                          onClear?.();
                          if (chatStorageKeyRef.current) {
                            localStorage.removeItem(chatStorageKeyRef.current);
                        }
                      }
                    }}
                    className="h-auto rounded-full px-2 py-1 text-[10px] font-medium text-slate-500"
                  >
                    最初から話す
                  </Button>
                )}
              </div>
            </div>
              <ScrollArea
                ref={chatScrollRef}
                className={`mt-2 flex flex-col gap-4 pr-1 ${
                  layout === "page"
                    ? "overflow-visible pb-60"
                    : "max-h-[calc(100vh-240px)]"
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2 py-8 opacity-90">
                  <div
                    className={`h-32 w-32 overflow-hidden rounded-[2rem] border-4 shadow-sm transition-all duration-500 ${
                      isConsultVariant ? "border-[var(--consult-border)] bg-[var(--consult-surface)]" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <img
                      src={isConsultVariant ? activeConsultHero.image : defaultConsultSpeaker.image}
                      alt={isConsultVariant ? activeConsultHero.name : "にちよさん"}
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        isConsultVariant ? activeConsultHero.imageScale : "scale-110"
                      }`}
                      style={
                        isConsultVariant
                          ? { objectPosition: activeConsultHero.imagePosition }
                          : undefined
                      }
                      draggable={false}
                    />
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${isConsultVariant ? "text-slate-700" : "text-amber-800"}`}>
                      {isConsultVariant ? activeConsultHero.name : "にちよさん"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isConsultVariant ? activeConsultHero.subtitle : "日曜市のことをなんでも聞いてね"}
                    </div>
                  </div>
                </div>

              {chatMessages.map((message) => {
                const speakerCharacter = getSpeakerCharacter(message.speakerId);
                const speakerName = message.speakerName ?? speakerCharacter.name;
                return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start items-start gap-2"
                  }`}
                >
                  {message.role === "assistant" && isConsultVariant ? (
                    <div className="flex max-w-[min(48rem,calc(100%-1rem))] items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-11 w-11 overflow-hidden rounded-full border border-amber-200 bg-amber-50 shadow-sm ring-2 ring-white">
                          <img
                            src={speakerCharacter.image}
                            alt={speakerName}
                            className={`h-full w-full object-cover ${speakerCharacter.imageScale}`}
                            style={{ objectPosition: speakerCharacter.imagePosition }}
                            draggable={false}
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2 pl-1">
                          <span className="text-sm font-semibold text-slate-700">{speakerName}</span>
                        </div>
                        <MessageBubble
                          role={message.role}
                          variant="consult"
                          className="max-w-none shadow-sm"
                        >
                          {message.text}
                          {(() => {
                            const suggestedShops =
                              message.shops && message.shops.length > 0
                                ? message.shops
                                : (message.shopIds ?? [])
                                    .map((id) => shopLookup.get(id))
                                    .filter((shop): shop is Shop => !!shop);
                            if (suggestedShops.length === 0) return null;
                            return (
                              <div className="mt-3 rounded-[1.4rem] border border-amber-200 bg-[#fffaf3] p-3">
                                <div className="flex items-center justify-between gap-2 px-1">
                                  <span className="text-[11px] font-bold tracking-[0.08em] text-amber-800">
                                    おすすめのお店
                                  </span>
                                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                                    {suggestedShops.length}件
                                  </span>
                                </div>
                                <div className="mt-2 space-y-2">
                                  {suggestedShops.map((shop) => (
                                    <ConsultShopSuggestionCard
                                      key={shop.id}
                                      shop={shop}
                                      onSelectShop={onSelectShop}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          {message.imageUrl && (
                            <button
                              type="button"
                              onClick={() => onAiImageClick?.(message.imageUrl ?? "")}
                              className="mt-3 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:shadow-md"
                              aria-label="写真を拡大する"
                            >
                              <img
                                src={message.imageUrl}
                                alt="案内画像"
                                className="h-32 w-full object-cover"
                              />
                            </button>
                          )}
                        </MessageBubble>
                        {message.followUpQuestion && (
                          <div className="mt-2 flex flex-wrap gap-2 pl-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleAskSubmit(
                                  message.followUpQuestion,
                                  { source: "suggestion" },
                                  true
                                )
                              }
                              className="rounded-full border border-amber-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
                            >
                              {message.followUpQuestion}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 overflow-hidden rounded-full border shadow-sm ${isConsultVariant ? "border-[var(--consult-border)] bg-[var(--consult-surface)]" : "border-amber-200 bg-amber-50"}`}>
                            <img
                              src={defaultConsultSpeaker.image}
                              alt="にちよさん"
                              className="h-full w-full scale-110 object-cover object-center"
                              draggable={false}
                            />
                          </div>
                        </div>
                      )}

                      <MessageBubble role={message.role} variant={isConsultVariant ? "consult" : "default"} className="shadow-sm">
                        {message.text}
                        {message.localImageUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-amber-100 bg-white">
                            <img
                              src={message.localImageUrl}
                              alt="送信画像"
                              className="h-28 w-full object-cover"
                            />
                          </div>
                        )}
                        {message.role === "assistant" &&
                          (() => {
                            const suggestedShops =
                              message.shops && message.shops.length > 0
                                ? message.shops
                                : (message.shopIds ?? [])
                                    .map((id) => shopLookup.get(id))
                                    .filter((shop): shop is Shop => !!shop);
                            if (suggestedShops.length === 0) return null;
                            return (
                            <div className="mt-3 rounded-[1.2rem] border border-amber-200 bg-[#fffaf3] p-3">
                              <div className="flex items-center justify-between gap-2 px-1">
                                <span className="text-[11px] font-bold tracking-[0.08em] text-amber-800">
                                  おすすめのお店
                                </span>
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                                  {suggestedShops.length}件
                                </span>
                              </div>
                              <div className="mt-2 space-y-2">
                                {suggestedShops.map((shop) => (
                                  <ConsultShopSuggestionCard
                                    key={shop.id}
                                    shop={shop}
                                    onSelectShop={onSelectShop}
                                  />
                                ))}
                              </div>
                            </div>
                            );
                          })()}
                        {message.imageUrl && (
                          <button
                            type="button"
                            onClick={() => onAiImageClick?.(message.imageUrl ?? "")}
                            className="mt-3 overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm transition hover:shadow-md"
                            aria-label="写真を拡大する"
                          >
                            <img
                              src={message.imageUrl}
                              alt="案内画像"
                              className="h-32 w-full object-cover"
                            />
                          </button>
                        )}
                      </MessageBubble>
                    </>
                  )}
                </div>
              )})}
              {aiStatus === "thinking" && (
                isConsultVariant ? (
                  <div className="flex max-w-[min(48rem,calc(100%-1rem))] items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="h-11 w-11 overflow-hidden rounded-full border border-amber-200 bg-amber-50 shadow-sm ring-2 ring-white">
                        <img
                          src={activeConsultHero.image}
                          alt={activeConsultHero.name}
                          className={`h-full w-full object-cover ${activeConsultHero.imageScale}`}
                          style={{ objectPosition: activeConsultHero.imagePosition }}
                          draggable={false}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2 pl-1">
                        <span className="text-sm font-semibold text-slate-700">{activeConsultHero.name}</span>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-[#fffaf2] px-5 py-4 text-sm text-slate-800 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent"
                            aria-label="考え中"
                          />
                          <span className="text-sm text-slate-600">考え中…</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start items-start gap-2">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 overflow-hidden rounded-full border shadow-sm ${isConsultVariant ? "border-[var(--consult-border)] bg-[var(--consult-surface)]" : "border-amber-200 bg-amber-50"}`}>
                        <img
                          src={defaultConsultSpeaker.image}
                          alt="にちよさん"
                          className="h-full w-full scale-110 object-cover object-center"
                          draggable={false}
                        />
                      </div>
                    </div>
                    <div className="relative max-w-[80%] rounded-2xl rounded-tl-sm border border-amber-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent"
                          aria-label="考え中"
                        />
                        <span className="text-xs text-gray-500">考え中…</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </ScrollArea>
              {layout !== "page" && showScrollToBottom && (
                <button
                type="button"
                onClick={() => {
                  if (chatScrollRef.current) {
                    chatScrollRef.current.scrollTo({
                      top: chatScrollRef.current.scrollHeight,
                      behavior: "smooth"
                    });
                  }
                }}
                className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                aria-label="一番下へスクロール"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
          onClick={
            priorityMessage
              ? onPriorityClick
              : () => {
                    if (isShopIntro) {
                      if (current?.shopId) {
                        onCommentShopFocus?.(current.shopId);
                      }
                      return;
                    }
                    handleNext();
                  }
          }
            className={`${bubbleBaseClassName} ${bubbleBorderClass} ${bubbleStateClass}`}
            aria-label="おばあちゃんのつぶやきを見る"
          >
            {!fullWidth && (
              <>
                <div className="absolute -left-3 bottom-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-amber-400" />
                <div className="absolute -left-2 bottom-6 h-0 w-0 border-y-7 border-y-transparent border-r-7 border-r-white" />
              </>
            )}

            <div className="grandma-bubble-content flex items-center gap-3">
              {showIntroImage ? (
                <span className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-transparent" aria-hidden="true">
                  <img
                    src={introImageUrl ?? ""}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </span>
              ) : showBubbleAvatar ? (
                <span className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-transparent" aria-hidden="true">
                  <img
                    src={defaultConsultSpeaker.image}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </span>
              ) : (
                <span className="text-xl" aria-hidden>
                  {bubbleIcon}
                </span>
              )}
              <div key={current.id} className="grandma-comment-bounce space-y-1">
                {isShopIntro ? (
                  (() => {
                    const [title, ...rest] = bubbleText.split("\n");
                    return (
                      <div className="text-gray-900">
                        <div className="text-lg font-semibold">{title}</div>
                        <div className="whitespace-pre-line text-base leading-relaxed">
                          {rest.join("\n")}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="grandma-comment-text text-2xl leading-relaxed text-gray-900">
                    {bubbleText}
                  </p>
                )}
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
                    閉じる
                  </button>
                )}
              </div>
            </div>
          </button>
        )}
      </div>

      {showIntroImage && isIntroImageOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 px-4 pointer-events-auto">
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsIntroImageOpen(false);
              setIntroLockUntil(Date.now() + 3000);
            }}
          />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-200 bg-white shadow-2xl pointer-events-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setIsIntroImageOpen(false);
                setIntroLockUntil(Date.now() + 3000);
              }}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-amber-100 bg-white/90 text-lg font-bold text-amber-700 shadow-sm hover:bg-amber-50"
              aria-label="閉じる"
            >
              ×
            </button>
            <img
              src={introImageUrl ?? ""}
              alt=""
              className="h-auto w-full object-cover"
              draggable={false}
            />
            <div className="border-t border-amber-100 bg-white px-4 py-3 text-base text-gray-700">
              {bubbleText}
            </div>
            <div className="p-4">
              <button
                type="button"
                onClick={() => {
                  if (current?.shopId) {
                    onCommentShopOpen?.(current.shopId);
                  }
                  setIsIntroImageOpen(false);
                  setIntroLockUntil(Date.now() + 3000);
                }}
                className="w-full rounded-xl bg-amber-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
              >
                このお店をくわしく
              </button>
            </div>
          </div>
        </div>
      )}

        <div
          className={`w-full px-3 transition-all duration-200 ${
            layout === "page"
              ? "sticky z-[1405]"
              : chatPanelLift
          } ${
            isChatOpen
              ? "pointer-events-auto opacity-100 max-h-[320px] mt-2"
              : "pointer-events-none opacity-0 max-h-0 mt-0 overflow-hidden"
          }`}
          style={layout === "page" ? { bottom: `calc(3.5rem + var(--safe-bottom, 0px) + 0.75rem)` } : undefined}
          aria-hidden={!isChatOpen}
        >
        <div className="mx-auto w-full max-w-xl space-y-2" style={inputShiftStyle}>
          {aiImageUrl && !isChatOpen && (
            <button
              type="button"
              onClick={() => onAiImageClick?.(aiImageUrl)}
              className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:shadow-md"
              aria-label="写真を拡大する"
            >
              <img
                src={aiImageUrl}
                alt="案内画像"
                className="h-36 w-full object-cover"
              />
            </button>
          )}
          {displayedSuggestedShops.length > 0 && !isKeyboardOpen && !isChatOpen && (
            <div className={`rounded-[1.8rem] border p-3 shadow-sm translate-y-[5px] ${isConsultVariant ? "border-[var(--consult-border)] bg-[var(--consult-surface)]" : "border-orange-300 bg-white/95"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold tracking-[0.12em] ${isConsultVariant ? "text-slate-600" : "text-pink-600"}`}>AIおすすめ</span>
                  <span className="text-base font-bold text-gray-900">提案されたお店</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${isConsultVariant ? "bg-slate-100 text-slate-700 border-[var(--consult-border)]" : "bg-amber-50 text-amber-800 border-amber-100"}`}>
                  {displayedSuggestedShops.length}店
                </span>
              </div>
              {aiStatus === "thinking" ? (
                <div className="mt-6 flex items-center justify-center py-4">
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" aria-label="読み込み中" />
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {displayedSuggestedShops.map((shop) => (
                    <ConsultShopSuggestionCard
                      key={shop.id}
                      shop={shop}
                      onSelectShop={onSelectShop}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <Card
            className={`${
              isConsultVariant
                ? "rounded-[20px] border border-[var(--consult-border)] bg-white/92 p-2.5 shadow-sm"
                : "rounded-2xl border-2 border-amber-300 bg-white/95 p-3"
            } ${
              isConsultVariant ? "transition-colors duration-150" : "transition-transform duration-200"
            } ${!isConsultVariant && !isChatOpen ? "scale-95" : "scale-100"}`}
          >
              <div className={`flex flex-col ${isConsultVariant ? "gap-1.5" : "gap-2"}`}>
              <div
                className={`transition-all duration-200 ${
                  showConsultExamples ? "max-h-12 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
                aria-hidden={!showConsultExamples}
              >
                {layout === "page" && activeConsultExample && (
                  <button
                    type="button"
                    onClick={() => handleAskSubmit(activeConsultExample, { source: "suggestion" })}
                    className={`group inline-flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-left text-[11px] text-slate-500 shadow-inner transition ${isConsultVariant ? "border-[var(--consult-border)] bg-slate-50/80 hover:bg-white" : "border-amber-100 bg-white/80 hover:border-amber-200 hover:bg-amber-50/70"}` }
                    aria-label={`質問例: ${activeConsultExample}`}
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${isConsultVariant ? "text-slate-600" : "text-amber-600"}`}>質問例</Badge>
                      <span className="text-slate-600">{activeConsultExample}</span>
                    </span>
                    <Badge variant="secondary" className={`text-[11px] ${isConsultVariant ? "text-slate-500" : "text-amber-500"}`}>送信</Badge>
                  </button>
                )}
              </div>
              <div className="flex items-end gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  className={`${
                    isConsultVariant
                      ? "h-10 w-10 rounded-full border-[var(--consult-border)] bg-slate-50 text-base font-semibold text-slate-600 hover:bg-white"
                      : "border-amber-200 bg-white text-lg font-semibold text-amber-700 hover:bg-amber-50"
                  }`}
                  aria-label="写真を選ぶ"
                >
                  {isConsultVariant ? "＋" : "+"}
                </Button>
                <Textarea
                  ref={inputRef}
                  value={askText}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setAskText(nextValue);
                    if (errorNotice) {
                      setErrorNotice(null);
                      setLastFailedSubmission(null);
                    }
                    if (shouldValidateInput && nextValue.trim()) {
                      setShouldShowValidation(false);
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    setIsInputFocused(false);
                    if (shouldValidateInput && !askText.trim() && !selectedImageFile) {
                      setShouldShowValidation(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskSubmit();
                    }
                  }}
                  disabled={aiStatus === "thinking"}
                  rows={isConsultVariant ? 1 : 2}
                  className={`min-h-[44px] max-h-28 resize-none ${
                    aiStatus === "thinking"
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : isConsultVariant
                        ? "min-h-[40px] rounded-[18px] border-[var(--consult-border)] bg-white px-4 py-2 text-[14px] text-gray-900 focus-visible:ring-slate-300"
                        : "border-amber-200 bg-white text-gray-900 focus-visible:ring-amber-400"
                  }`}
                  placeholder={smartContext.placeholder}
                />
                {enableSpeechInput && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={startSpeechRecognition}
                    disabled={!isSpeechSupported || aiStatus === "thinking"}
                    className={`${
                      !isSpeechSupported || aiStatus === "thinking"
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : isListening
                        ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                      : isConsultVariant
                            ? "h-10 w-10 rounded-full border-[var(--consult-border)] bg-slate-50 text-slate-700 hover:bg-white"
                            : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                    }`}
                    aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
                  >
                    {isListening ? (
                      <span className="text-sm font-semibold">■</span>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  onClick={() => handleAskSubmit()}
                  disabled={aiStatus === "thinking"}
                  className={`${
                    aiStatus === "thinking"
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : isConsultVariant
                        ? "h-10 w-10 rounded-full border-[var(--consult-border)] bg-slate-700 text-white hover:bg-slate-600"
                        : "border-amber-200 bg-amber-600 text-white hover:bg-amber-500"
                  }`}
                  aria-label="メッセージを送る"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </Button>
              </div>
              {enableSpeechInput && !isSpeechSupported && (
                <div className="text-[11px] text-slate-500">
                  音声入力は対応ブラウザのみ
                </div>
              )}
              {enableSpeechInput && isListening && (
                <Badge variant="destructive" className="w-fit gap-2 text-[10px]">
                  <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                  音声入力中
                </Badge>
              )}
              {selectedImageName && (
                <div className="text-[11px] text-slate-600">
                  画像: {selectedImageName}
                </div>
              )}
              {errorNotice && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{errorNotice}</span>
                    {lastFailedSubmission && (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={() =>
                          handleAskSubmit(
                            lastFailedSubmission.text,
                            lastFailedSubmission.context,
                            true,
                            lastFailedSubmission
                          )
                        }
                        disabled={aiStatus === "thinking"}
                        className="h-7 rounded-full border-rose-200 bg-white px-3 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        もう一度送る
                      </Button>
                    )}
                  </div>
                  {!lastFailedSubmission && errorCode && errorCode !== "system_error" && errorHelperQuestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {errorHelperQuestions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() =>
                            handleAskSubmit(question, { source: "suggestion" }, true)
                          }
                          className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {shouldShowValidation && (
                <div className="text-[11px] font-semibold text-rose-500">
                  質問内容を入力するか写真を選んでね。
                </div>
              )}
            </div>
          </Card>
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

function ConsultShopSuggestionCard({
  shop,
  onSelectShop,
}: {
  shop: Shop;
  onSelectShop?: (shopId: number) => void;
}) {
  const previewImage =
    shop.images?.main ||
    shop.images?.thumbnail ||
    shop.images?.additional?.[0] ||
    getShopBannerImage(shop.category, shop.position ?? shop.id);

  return (
    <button
      type="button"
      onClick={() => onSelectShop?.(shop.id)}
      className="w-full rounded-2xl border border-amber-200 bg-white px-3 py-3 text-left shadow-sm transition hover:bg-amber-50/60"
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50">
          <img
            src={previewImage}
            alt={`${shop.name}の画像`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{shop.name}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{shop.ownerName}</div>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
              #{shop.id}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-amber-700">{shop.category}</div>
          <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-600">
            {shop.products.slice(0, 3).join("・")}
            {shop.products.length > 3 && " ほか"}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
            詳細を見る
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </button>
  );
}
