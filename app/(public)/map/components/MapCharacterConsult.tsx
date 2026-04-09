'use client';

/**
 * MapCharacterConsult
 *
 * マップ上の任意の lat/lng にキャラクターを配置し、
 * その場で AI と会話できるコンポーネント。
 *
 * UX 改善:
 * - ストリーミング対応: キャラ1がトークン単位でリアルタイムに喋り始める
 * - 接続状態の段階的フィードバック: 接続中 → 考え中 → もう少し...
 * - 入力バーのアニメーション: スピナー・アンバー脈動
 * - エラー時: 視覚的に区別してリトライボタンを表示
 * - AbortController でキャンセル対応
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { pickConsultCharacters } from '../../consult/data/consultCharacters';
import type { ConsultCharacter } from '../../consult/data/consultCharacters';
import type { ConsultAskStreamEvent } from '../../consult/types/consultConversation';
import type { Shop } from '../data/shops';

// ── 日曜市の市場中央付近のデフォルト配置位置 ──────────────────────────────
const DEFAULT_POSITIONS: [[number, number], [number, number]] = [
  [33.5622, 133.5316],
  [33.5608, 133.5310],
];

type Status = 'idle' | 'connecting' | 'streaming' | 'error';

// ── lat/lng → コンテナ内ピクセル変換フック ────────────────────────────────
function useLatLngToPixel(
  map: LeafletMap | null,
  latlng: [number, number] | null,
): { x: number; y: number } | null {
  const [pixel, setPixel] = useState<{ x: number; y: number } | null>(null);
  const lat = latlng?.[0];
  const lng = latlng?.[1];

  useEffect(() => {
    if (!map || lat == null || lng == null) { setPixel(null); return; }
    const update = () => {
      try {
        const pt = map.latLngToContainerPoint([lat, lng] as [number, number]);
        setPixel({ x: pt.x, y: pt.y });
      } catch { setPixel(null); }
    };
    update();
    map.on('move', update);
    map.on('zoom', update);
    return () => { map.off('move', update); map.off('zoom', update); };
  }, [map, lat, lng]);

  return pixel;
}

// ── キャラクタースプライト ─────────────────────────────────────────────────
const CHAR_W = 60;
const CHAR_H = 96;

function CharacterSprite({
  character,
  pixel,
  text,
  isThinking,
  isError,
  flip,
}: {
  character: ConsultCharacter;
  pixel: { x: number; y: number } | null;
  text: string | null;
  isThinking: boolean;
  isError?: boolean;
  flip?: boolean;
}) {
  if (!pixel) return null;
  const showBubble = isThinking || !!text;

  return (
    <div
      className="pointer-events-none absolute transition-[left,top] duration-700 ease-out"
      style={{ left: pixel.x - CHAR_W / 2, top: pixel.y - CHAR_H, zIndex: 1050, width: CHAR_W }}
    >
      {showBubble && (
        <div className={`absolute bottom-full mb-3 w-52 ${flip ? 'right-0' : 'left-0'}`}>
          <div className={`relative rounded-2xl px-3.5 py-2.5 shadow-xl ring-1 backdrop-blur transition-colors duration-300 ${
            isError
              ? 'bg-red-50/96 ring-red-200'
              : 'bg-white/96 ring-slate-900/8'
          }`}>
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
              <p className={`text-[12px] leading-snug ${isError ? 'text-red-700' : 'text-slate-800'}`}>{text}</p>
            )}
            <p className={`mt-1.5 text-[10px] font-bold ${isError ? 'text-red-500' : 'text-amber-600'}`}>{character.name}</p>
            <div
              className={`absolute -bottom-[7px] ${flip ? 'right-5' : 'left-5'} h-3.5 w-3.5 rotate-45 ${isError ? 'bg-red-50/96' : 'bg-white/96'}`}
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

// ── ステータスラベル ──────────────────────────────────────────────────────
function getStatusLabel(status: Status, elapsed: number): string | null {
  if (status === 'connecting') return '接続中…';
  if (status === 'streaming') {
    if (elapsed < 5) return '考え中…';
    if (elapsed < 10) return 'もう少し待ってね…';
    return 'まだかかりそう、もうちょっとだけ！';
  }
  if (status === 'error') return 'もう一度試してね';
  return null;
}

// ── スピナー ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ── メインコンポーネント ───────────────────────────────────────────────────
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
  const [positions, setPositions] = useState<[[number, number], [number, number]]>(DEFAULT_POSITIONS);
  const [char1, setChar1] = useState<{ text: string | null; isThinking: boolean; isError: boolean }>({ text: null, isThinking: false, isError: false });
  const [char2, setChar2] = useState<{ text: string | null; isThinking: boolean; isError: boolean }>({ text: null, isThinking: false, isError: false });
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const shopMap = useRef(new Map(shops.map((s) => [s.id, s])));
  const abortRef = useRef<AbortController | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pixel1 = useLatLngToPixel(map, positions[0]);
  const pixel2 = useLatLngToPixel(map, positions[1]);

  const isLoading = status === 'connecting' || status === 'streaming';

  // 初期挨拶
  useEffect(() => {
    const t = setTimeout(() => {
      setChar1({ text: 'こんにちは！何でも聞いてね〜！', isThinking: false, isError: false });
      setChar2({ text: 'お気軽にどうぞ！', isThinking: false, isError: false });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // クリーンアップ
  useEffect(() => () => {
    abortRef.current?.abort();
    if (tickerRef.current) clearInterval(tickerRef.current);
  }, []);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isLoading) return;

    // 前のリクエストをキャンセル
    abortRef.current?.abort();
    if (tickerRef.current) clearInterval(tickerRef.current);

    const controller = new AbortController();
    abortRef.current = controller;

    setInputText('');
    setStatus('connecting');
    setElapsedSeconds(0);

    // 経過時間カウンター
    const startTime = Date.now();
    tickerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const userMsg = { role: 'user' as const, text };
    const nextHistory = [...history, userMsg];
    setHistory(nextHistory);

    setChar1({ text: null, isThinking: true, isError: false });
    setChar2({ text: null, isThinking: false, isError: false });
    setPositions(DEFAULT_POSITIONS);

    try {
      const res = await fetch('/api/grandma/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          location: null,
          history: nextHistory.slice(-6),
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      setStatus('streaming');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';
      let finalShopIds: number[] = [];
      let finalReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed) as ConsultAskStreamEvent;

            if (event.type === 'first_turn_start') {
              // キャラ1が喋り始める
              setChar1({ text: '', isThinking: false, isError: false });
              streamedText = '';
            } else if (event.type === 'first_turn_delta') {
              streamedText += event.delta;
              setChar1({ text: streamedText, isThinking: false, isError: false });
            } else if (event.type === 'final') {
              const { turns, shopIds } = event.response ?? {};
              finalShopIds = shopIds ?? [];
              finalReply = turns?.map((t) => t.text).join(' ') ?? event.response?.reply ?? '';

              // キャラ1の最終テキスト（ストリーム済みより優先）
              const turn1Text = turns?.[0]?.text ?? streamedText;
              const turn2Text = turns?.[1]?.text ?? null;

              setChar1({ text: turn1Text, isThinking: false, isError: false });
              setChar2({ text: turn2Text, isThinking: false, isError: false });
            }
          } catch { /* skip malformed */ }
        }
      }

      // 店舗推薦があればキャラをその店舗近くへ移動
      if (finalShopIds.length > 0) {
        onShopsRecommended(finalShopIds);
        const s1 = shopMap.current.get(finalShopIds[0]);
        const s2 = shopMap.current.get(finalShopIds[1] ?? finalShopIds[0]);
        const newPositions: [[number, number], [number, number]] = [
          s1 ? [s1.lat + 0.00006, s1.lng + 0.00005] : DEFAULT_POSITIONS[0],
          s2 && s2.id !== s1?.id
            ? [s2.lat + 0.00006, s2.lng - 0.00005]
            : s1
              ? [s1.lat - 0.00006, s1.lng - 0.00005]
              : DEFAULT_POSITIONS[1],
        ];
        setPositions(newPositions);

        if (map && s1) {
          const L = (await import('leaflet')).default;
          const bounds = L.latLngBounds([s1.lat, s1.lng], s2 ? [s2.lat, s2.lng] : [s1.lat, s1.lng]).pad(0.45);
          map.flyToBounds(bounds, { animate: true, duration: 1.0 });
        }
      }

      setHistory([...nextHistory, { role: 'assistant', text: finalReply }]);
      setStatus('idle');

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      setStatus('error');
      setChar1({
        text: 'うまく聞こえんかった…通信状況を確認してからもう一度試してみてね。',
        isThinking: false,
        isError: true,
      });
      setChar2({ text: null, isThinking: false, isError: false });
    } finally {
      if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
      abortRef.current = null;
      if (status !== 'error') setStatus('idle');
    }
  }, [inputText, isLoading, history, map, onShopsRecommended, status]);

  // リトライ
  const lastUserMsg = history.findLast?.((m) => m.role === 'user')?.text ?? null;
  const handleRetry = useCallback(() => {
    if (!lastUserMsg) return;
    setStatus('idle');
    setChar1({ text: null, isThinking: false, isError: false });
    setChar2({ text: null, isThinking: false, isError: false });
    // 短い遅延後に再送
    setTimeout(() => handleSend(lastUserMsg), 100);
  }, [lastUserMsg, handleSend]);

  const statusLabel = getStatusLabel(status, elapsedSeconds);
  const char0 = characters[0];
  const char1Char = characters[1];

  return (
    <>
      {/* キャラクター 1 */}
      {char0 && (
        <CharacterSprite
          character={char0}
          pixel={pixel1}
          text={char1.text}
          isThinking={char1.isThinking}
          isError={char1.isError}
          flip={false}
        />
      )}

      {/* キャラクター 2 */}
      {char1Char && (
        <CharacterSprite
          character={char1Char}
          pixel={pixel2}
          text={char2.text}
          isThinking={char2.isThinking}
          isError={char2.isError}
          flip
        />
      )}

      {/* チャット入力バー */}
      <div
        className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] left-4 right-4 z-[1300] pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* ステータスラベル */}
        {statusLabel && (
          <div className="mb-1.5 flex items-center justify-center">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              status === 'error'
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {statusLabel}
            </span>
          </div>
        )}

        <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-3 shadow-2xl ring-1 backdrop-blur transition-all duration-300 ${
          status === 'error'
            ? 'bg-red-50/95 ring-red-300'
            : isLoading
              ? 'bg-white/95 ring-amber-400 animate-pulse-border'
              : 'bg-white/95 ring-amber-200/80'
        }`}>
          {/* キャラアイコン */}
          <div className="shrink-0 flex -space-x-2.5">
            {[char0, char1Char].filter(Boolean).map((ch) => (
              <div
                key={ch!.id}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-sm"
              >
                <img
                  src={ch!.image}
                  alt={ch!.name}
                  className={`h-full w-full object-cover ${ch!.imageScale}`}
                  style={{ objectPosition: ch!.imagePosition }}
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* テキスト入力 */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            placeholder={isLoading ? '返答を待っています…' : '何でも聞いてね…'}
            className={`min-w-0 flex-1 bg-transparent text-[14px] placeholder-slate-400 outline-none transition-colors ${
              status === 'error' ? 'text-red-700' : 'text-slate-800'
            }`}
            disabled={isLoading}
          />

          {/* エラー時: リトライボタン */}
          {status === 'error' && lastUserMsg && (
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 rounded-full bg-red-100 px-3 py-1.5 text-[11px] font-bold text-red-600 active:scale-90 transition-transform"
            >
              再試行
            </button>
          )}

          {/* 送信 / スピナーボタン */}
          <button
            type="button"
            onClick={() => isLoading ? undefined : handleSend()}
            disabled={!isLoading && !inputText.trim()}
            className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-all ${
              isLoading
                ? 'bg-amber-400 cursor-default'
                : status === 'error'
                  ? 'bg-red-400 opacity-40'
                  : 'bg-amber-500 disabled:opacity-40 active:scale-90'
            }`}
            aria-label={isLoading ? '送信中' : '送信'}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* 閉じるボタン */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 transition-transform"
            aria-label="相談を終わる"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
