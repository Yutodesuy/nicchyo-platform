'use client';

/**
 * MapCharacterConsult
 *
 * マップ上で AI と会話するコンポーネント。
 *
 * UX:
 * - キャラクターは入力バー直上の左端に固定表示
 * - 回答は非ストリーミングで、全体が揃ってから再生
 * - 2人のキャラクターが3秒ごとに交代しながら話す
 * - 紹介店舗があれば、同じ3秒周期で1店舗ずつフォーカスする
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import {
  CONSULT_CHARACTER_BY_ID,
  pickConsultCharacters,
  type ConsultCharacter,
} from '../../consult/data/consultCharacters';
import type { ConsultAskResponse, ConsultTurn } from '../../consult/types/consultConversation';
import type { Shop } from '../data/shops';
import { getOrCreateConsultVisitorKey } from '../../../../lib/consultVisitorKey';

const RESPONSE_STEP_MS = 3000;
const CHAR_W = 60;
const CHAR_H = 96;

type Status = 'idle' | 'loading' | 'playing' | 'error';

type CharacterBubbleState = {
  text: string | null;
  isThinking: boolean;
  isError: boolean;
};

type AskPayload = {
  reply?: string;
  errorMessage?: string;
  turns?: ConsultAskResponse['turns'];
  shopIds?: number[];
};

function CharacterSprite({
  character,
  text,
  isThinking,
  isError,
}: {
  character: ConsultCharacter;
  text: string | null;
  isThinking: boolean;
  isError?: boolean;
}) {
  const showBubble = isThinking || !!text;

  return (
    <div className="pointer-events-none relative" style={{ width: CHAR_W }}>
      {showBubble && (
        <div className="absolute bottom-full left-0 mb-3 w-56">
          <div
            className={`relative rounded-2xl px-3.5 py-2.5 shadow-xl ring-1 backdrop-blur transition-colors duration-300 ${
              isError
                ? 'bg-red-50/96 ring-red-200'
                : 'bg-white/96 ring-slate-900/8'
            }`}
          >
            {isThinking ? (
              <div className="flex items-center gap-1.5 py-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block h-2 w-2 rounded-full bg-amber-400"
                    style={{ animation: `dot-pulse 0.75s ease-in-out ${i * 0.18}s infinite` }}
                  />
                ))}
              </div>
            ) : (
              <p className={`text-[12px] leading-snug ${isError ? 'text-red-700' : 'text-slate-800'}`}>
                {text}
              </p>
            )}
            <p className={`mt-1.5 text-[10px] font-bold ${isError ? 'text-red-500' : 'text-amber-600'}`}>
              {character.name}
            </p>
            <div
              className={`absolute -bottom-[7px] left-5 h-3.5 w-3.5 rotate-45 ${
                isError ? 'bg-red-50/96' : 'bg-white/96'
              }`}
              style={{ boxShadow: '1px 1px 3px rgba(0,0,0,0.06)' }}
            />
          </div>
        </div>
      )}

      <div
        className="relative overflow-hidden"
        style={{ height: CHAR_H, width: CHAR_W, animation: 'character-idle 3s ease-in-out infinite' }}
      >
        <img
          src={character.image}
          alt={character.name}
          className={`h-full w-full object-cover ${character.imageScale}`}
          style={{ objectPosition: character.imagePosition }}
          draggable={false}
        />
      </div>
      <div className="mx-auto mt-0.5 h-2 w-8 rounded-full bg-black/10 blur-sm" />
    </div>
  );
}

function getStatusLabel(status: Status, elapsed: number): string | null {
  if (status === 'loading') {
    if (elapsed < 2) return '相談を送信中…';
    if (elapsed < 5) return '考え中…';
    if (elapsed < 10) return 'もう少し待ってね…';
    return 'まだかかりそう、もうちょっとだけ！';
  }
  if (status === 'playing') return '案内中…';
  if (status === 'error') return 'もう一度試してね';
  return null;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

export default function MapCharacterConsult({
  map,
  shops,
  onShopsRecommended,
  onClose,
}: {
  map: LeafletMap | null;
  shops: Shop[];
  onShopsRecommended: (shopIds: number[]) => void;
  onClose: () => void;
}) {
  const [characters] = useState(() => pickConsultCharacters());
  const [activeCharacter, setActiveCharacter] = useState<ConsultCharacter | null>(null);
  const [bubble, setBubble] = useState<CharacterBubbleState>({
    text: null,
    isThinking: false,
    isError: false,
  });
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  const shopMap = useRef(new Map(shops.map((shop) => [shop.id, shop])));
  const abortRef = useRef<AbortController | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackSequenceRef = useRef(0);

  const isBusy = status === 'loading' || status === 'playing';

  const clearPlayback = useCallback(() => {
    playbackSequenceRef.current += 1;
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const resolveCharacter = useCallback(
    (speakerId?: ConsultTurn['speakerId'] | null) => {
      if (speakerId) {
        const matchingSelected = characters.find((character) => character.id === speakerId);
        if (matchingSelected) return matchingSelected;
        const knownCharacter = CONSULT_CHARACTER_BY_ID.get(speakerId);
        if (knownCharacter) return knownCharacter;
      }
      return characters[0] ?? null;
    },
    [characters]
  );

  const focusShopById = useCallback(
    (shopId: number | null) => {
      if (!shopId || !map) return;
      const shop = shopMap.current.get(shopId);
      if (!shop) return;
      map.flyTo([shop.lat, shop.lng], map.getMaxZoom() ?? 19, {
        animate: true,
        duration: 0.9,
        easeLinearity: 0.25,
      });
    },
    [map]
  );

  const playResponseSequence = useCallback(
    (turns: ConsultTurn[], shopIds: number[], isError = false) => {
      clearPlayback();

      const fallbackCharacter = resolveCharacter(null);
      const normalizedTurns =
        turns.length > 0
          ? turns
          : fallbackCharacter
            ? [
                {
                  speakerId: fallbackCharacter.id,
                  speakerName: fallbackCharacter.name,
                  text: isError
                    ? 'うまく聞こえんかった…通信状況を確認してからもう一度試してみてね。'
                    : '',
                } satisfies ConsultTurn,
              ]
            : [];

      if (normalizedTurns.length === 0) {
        setStatus(isError ? 'error' : 'idle');
        return false;
      }

      const sequenceId = playbackSequenceRef.current;
      setStatus(isError ? 'error' : 'playing');

      const showStep = (index: number) => {
        if (playbackSequenceRef.current !== sequenceId) return;

        const turn = normalizedTurns[index];
        const character = resolveCharacter(turn.speakerId);
        if (character) {
          setActiveCharacter(character);
        }
        setBubble({
          text: turn.text,
          isThinking: false,
          isError,
        });

        if (shopIds.length > 0) {
          const shopId = shopIds[index % shopIds.length] ?? null;
          focusShopById(shopId);
        }

        if (index >= normalizedTurns.length - 1) {
          if (!isError) {
            playbackTimerRef.current = setTimeout(() => {
              if (playbackSequenceRef.current !== sequenceId) return;
              playbackTimerRef.current = null;
              setStatus('idle');
            }, RESPONSE_STEP_MS);
          }
          return;
        }

        playbackTimerRef.current = setTimeout(() => {
          showStep(index + 1);
        }, RESPONSE_STEP_MS);
      };

      showStep(0);
      return true;
    },
    [clearPlayback, focusShopById, resolveCharacter]
  );

  useEffect(() => {
    const firstCharacter = resolveCharacter(null);
    if (!firstCharacter) return;
    setActiveCharacter(firstCharacter);
    const timer = setTimeout(() => {
      setBubble({
        text: 'こんにちは！何でも聞いてね〜！',
        isThinking: false,
        isError: false,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [resolveCharacter]);

  useEffect(() => {
    shopMap.current = new Map(shops.map((shop) => [shop.id, shop]));
  }, [shops]);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (tickerRef.current) clearInterval(tickerRef.current);
    clearPlayback();
  }, [clearPlayback]);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || isBusy) return;

      abortRef.current?.abort();
      if (tickerRef.current) clearInterval(tickerRef.current);
      clearPlayback();

      const controller = new AbortController();
      abortRef.current = controller;
      const visitorKey = getOrCreateConsultVisitorKey();

      setInputText('');
      setStatus('loading');
      setElapsedSeconds(0);
      setActiveCharacter(resolveCharacter(null));
      setBubble({ text: null, isThinking: true, isError: false });

      let hadError = false;
      let playbackStarted = false;

      const startTime = Date.now();
      const ticker = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      tickerRef.current = ticker;

      const userMsg = { role: 'user' as const, text };
      const nextHistory = [...history, userMsg];
      setHistory(nextHistory);

      try {
        const res = await fetch('/api/grandma/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            location: null,
            history: nextHistory.slice(-6),
            visitorKey,
            stream: false,
          }),
          signal: controller.signal,
        });

        const payload = (await res.json().catch(() => null)) as AskPayload | null;
        const turns = (payload?.turns ?? []).filter(
          (turn): turn is ConsultTurn => !!turn && typeof turn.text === 'string' && turn.text.trim().length > 0
        );

        if (!res.ok) {
          hadError = true;
          playResponseSequence(
            turns.length > 0
              ? turns
              : [
                  {
                    speakerId: resolveCharacter(null)?.id ?? 'nichiyosan',
                    speakerName: resolveCharacter(null)?.name ?? 'にちよさん',
                    text: payload?.reply ?? payload?.errorMessage ?? `HTTP ${res.status}`,
                  },
                ],
            [],
            true
          );
          return;
        }

        const finalReply =
          payload?.reply ??
          turns.map((turn) => turn.text).filter(Boolean).join(' ') ??
          '';
        const finalShopIds = payload?.shopIds ?? [];

        if (finalShopIds.length > 0) {
          onShopsRecommended(finalShopIds);
        }

        playbackStarted = playResponseSequence(turns, finalShopIds, false);
        setHistory([...nextHistory, { role: 'assistant', text: finalReply }]);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;

        hadError = true;
        setStatus('error');
        setActiveCharacter(resolveCharacter(null));
        setBubble({
          text: 'うまく聞こえんかった…通信状況を確認してからもう一度試してみてね。',
          isThinking: false,
          isError: true,
        });
      } finally {
        clearInterval(ticker);
        if (tickerRef.current === ticker) {
          tickerRef.current = null;
        }
        if (abortRef.current === controller) {
          abortRef.current = null;
          if (!hadError && !playbackStarted) {
            setStatus('idle');
          }
        }
      }
    },
    [clearPlayback, history, inputText, isBusy, onShopsRecommended, playResponseSequence, resolveCharacter]
  );

  const lastUserMsg = history.findLast?.((message) => message.role === 'user')?.text ?? null;
  const handleRetry = useCallback(() => {
    if (!lastUserMsg) return;
    setStatus('idle');
    setBubble({ text: null, isThinking: false, isError: false });
    clearPlayback();
    setTimeout(() => handleSend(lastUserMsg), 100);
  }, [clearPlayback, handleSend, lastUserMsg]);

  const statusLabel = getStatusLabel(status, elapsedSeconds);

  return (
    <div className="pointer-events-none absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] left-4 right-4 z-[1300]">
      <div className="mb-3 flex justify-start">
        {activeCharacter && (
          <CharacterSprite
            character={activeCharacter}
            text={bubble.text}
            isThinking={bubble.isThinking}
            isError={bubble.isError}
          />
        )}
      </div>

      <div
        className="pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {statusLabel && (
          <div className="mb-1.5 flex items-center justify-center">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                status === 'error'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {statusLabel}
            </span>
          </div>
        )}

        <div
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-3 shadow-2xl ring-1 backdrop-blur transition-all duration-300 ${
            status === 'error'
              ? 'bg-red-50/95 ring-red-300'
              : isBusy
                ? 'bg-white/95 ring-amber-400 animate-pulse-border'
                : 'bg-white/95 ring-amber-200/80'
          }`}
        >
          <div className="shrink-0">
            {activeCharacter ? (
              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-sm">
                <img
                  src={activeCharacter.image}
                  alt={activeCharacter.name}
                  className={`h-full w-full object-cover ${activeCharacter.imageScale}`}
                  style={{ objectPosition: activeCharacter.imagePosition }}
                  draggable={false}
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full border-2 border-white bg-amber-50 shadow-sm" />
            )}
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            placeholder={isBusy ? '返答を待っています…' : '何でも聞いてね…'}
            className={`min-w-0 flex-1 bg-transparent text-[14px] placeholder-slate-400 outline-none transition-colors ${
              status === 'error' ? 'text-red-700' : 'text-slate-800'
            }`}
            disabled={isBusy}
          />

          {status === 'error' && lastUserMsg && (
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 rounded-full bg-red-100 px-3 py-1.5 text-[11px] font-bold text-red-600 active:scale-90 transition-transform"
            >
              再試行
            </button>
          )}

          <button
            type="button"
            onClick={() => (isBusy ? undefined : handleSend())}
            disabled={!isBusy && !inputText.trim()}
            className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-all ${
              isBusy
                ? 'bg-amber-400 cursor-default'
                : status === 'error'
                  ? 'bg-red-400 opacity-40'
                  : 'bg-amber-500 disabled:opacity-40 active:scale-90'
            }`}
            aria-label={isBusy ? '送信中' : '送信'}
          >
            {status === 'loading' ? (
              <Spinner />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 transition-transform"
            aria-label="相談を終わる"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
