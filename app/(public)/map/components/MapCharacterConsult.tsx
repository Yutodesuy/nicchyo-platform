'use client';

/**
 * MapCharacterConsult
 *
 * マップ上の任意の lat/lng にキャラクターを配置し、
 * その場で AI と会話できるコンポーネント。
 *
 * - 2 体のキャラクターが地図上に「立って」会話する
 * - AI が店舗を推薦したとき、キャラがその店舗近くに「歩いて」移動する
 * - 吹き出しで返答を分担して喋る
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { pickConsultCharacters } from '../../consult/data/consultCharacters';
import type { ConsultCharacter } from '../../consult/data/consultCharacters';
import type { Shop } from '../data/shops';

// ── 日曜市の市場中央付近のデフォルト配置位置 ──────────────────────────────
const DEFAULT_POSITIONS: [[number, number], [number, number]] = [
  [33.5622, 133.5316],
  [33.5608, 133.5310],
];

// ── lat/lng → コンテナ内ピクセル変換フック ────────────────────────────────
function useLatLngToPixel(
  map: LeafletMap | null,
  latlng: [number, number] | null,
): { x: number; y: number } | null {
  const [pixel, setPixel] = useState<{ x: number; y: number } | null>(null);

  const lat = latlng?.[0];
  const lng = latlng?.[1];

  useEffect(() => {
    if (!map || lat == null || lng == null) {
      setPixel(null);
      return;
    }

    const update = () => {
      try {
        const pt = map.latLngToContainerPoint([lat, lng] as [number, number]);
        setPixel({ x: pt.x, y: pt.y });
      } catch {
        setPixel(null);
      }
    };

    update();
    map.on('move', update);
    map.on('zoom', update);
    return () => {
      map.off('move', update);
      map.off('zoom', update);
    };
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
  flip,
}: {
  character: ConsultCharacter;
  pixel: { x: number; y: number } | null;
  text: string | null;
  isThinking: boolean;
  flip?: boolean;
}) {
  if (!pixel) return null;

  const showBubble = isThinking || !!text;

  return (
    <div
      className="pointer-events-none absolute transition-[left,top] duration-700 ease-out"
      style={{
        left: pixel.x - CHAR_W / 2,
        top: pixel.y - CHAR_H,
        zIndex: 1050,
        width: CHAR_W,
      }}
    >
      {/* 吹き出し */}
      {showBubble && (
        <div
          className={`absolute bottom-full mb-3 w-52 ${flip ? 'right-0' : 'left-0'}`}
        >
          <div className="relative rounded-2xl bg-white/96 px-3.5 py-2.5 shadow-xl ring-1 ring-slate-900/8 backdrop-blur">
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
              <p className="text-[12px] leading-snug text-slate-800">{text}</p>
            )}
            <p className="mt-1.5 text-[10px] font-bold text-amber-600">{character.name}</p>

            {/* 吹き出しの尻尾 */}
            <div
              className={`absolute -bottom-[7px] ${flip ? 'right-5' : 'left-5'} h-3.5 w-3.5 rotate-45 bg-white/96`}
              style={{ boxShadow: '1px 1px 3px rgba(0,0,0,0.06)' }}
            />
          </div>
        </div>
      )}

      {/* キャラ画像（わずかにバウンス） */}
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

      {/* 足元の影 */}
      <div className="mx-auto mt-0.5 h-2 w-8 rounded-full bg-black/10 blur-sm" />
    </div>
  );
}

// ── メインコンポーネント ───────────────────────────────────────────────────
export type MapCharacterConsultHandle = {
  clear: () => void;
};

export default function MapCharacterConsult({
  map,
  shops,
  onAsk,
  onShopsRecommended,
  onClose,
}: {
  map: LeafletMap | null;
  shops: Shop[];
  onAsk: (
    text: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
  ) => Promise<{ reply: string; shopIds?: number[] }>;
  onShopsRecommended: (shopIds: number[]) => void;
  onClose: () => void;
}) {
  const [characters] = useState(() => pickConsultCharacters());
  const [positions, setPositions] = useState<[[number, number], [number, number]]>(DEFAULT_POSITIONS);
  const [char1, setChar1] = useState<{ text: string | null; isThinking: boolean }>({ text: null, isThinking: false });
  const [char2, setChar2] = useState<{ text: string | null; isThinking: boolean }>({ text: null, isThinking: false });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const shopMap = useRef(new Map(shops.map((s) => [s.id, s])));

  const pixel1 = useLatLngToPixel(map, positions[0]);
  const pixel2 = useLatLngToPixel(map, positions[1]);

  // 初期挨拶
  useEffect(() => {
    const t = setTimeout(() => {
      setChar1({ text: 'こんにちは！何でも聞いてね〜！', isThinking: false });
      setChar2({ text: 'お気軽にどうぞ！', isThinking: false });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);

    const userMsg = { role: 'user' as const, text };
    const nextHistory = [...history, userMsg];
    setHistory(nextHistory);

    setChar1({ text: null, isThinking: true });
    setChar2({ text: null, isThinking: true });

    try {
      const result = await onAsk(text, nextHistory);

      const rawReply = result.reply;

      // 返答を文単位で 2 人に分担
      const sentences = rawReply.split(/(?<=[。！？!?])\s*/).filter((s) => s.trim());
      const mid = Math.ceil(sentences.length / 2);
      const text1 = sentences.slice(0, mid).join('') || rawReply;
      const text2 = sentences.slice(mid).join('') || null;

      // 店舗推薦があればキャラをその店舗近くへ移動
      if (result.shopIds && result.shopIds.length > 0) {
        onShopsRecommended(result.shopIds);

        const s1 = shopMap.current.get(result.shopIds[0]);
        const s2 = shopMap.current.get(result.shopIds[1] ?? result.shopIds[0]);

        const newPositions: [[number, number], [number, number]] = [
          s1 ? [s1.lat + 0.00006, s1.lng + 0.00005] : DEFAULT_POSITIONS[0],
          s2 && s2.id !== s1?.id
            ? [s2.lat + 0.00006, s2.lng - 0.00005]
            : s1
              ? [s1.lat - 0.00006, s1.lng - 0.00005]
              : DEFAULT_POSITIONS[1],
        ];
        setPositions(newPositions);

        // マップをその店舗エリアへ移動
        if (map && s1) {
          const L = (await import('leaflet')).default;
          const bounds = L.latLngBounds(
            [s1.lat, s1.lng],
            s2 ? [s2.lat, s2.lng] : [s1.lat, s1.lng],
          ).pad(0.45);
          map.flyToBounds(bounds, { animate: true, duration: 1.0 });
        }
      }

      setHistory([...nextHistory, { role: 'assistant', text: rawReply }]);
      setChar1({ text: text1, isThinking: false });
      setChar2({ text: text2, isThinking: false });
    } catch {
      setChar1({ text: 'ごめんね、うまく聞こえんかった。もう一度試してね。', isThinking: false });
      setChar2({ text: null, isThinking: false });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, history, map, onAsk, onShopsRecommended]);

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
        <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-3 shadow-2xl ring-1 ring-amber-200/80 backdrop-blur">
          {/* キャラアイコン（2 体分の小サムネイル） */}
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            placeholder="何でも聞いてね…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-800 placeholder-slate-400 outline-none"
            disabled={isLoading}
          />

          {/* 送信ボタン */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm disabled:opacity-40 active:scale-90 transition-transform"
            aria-label="送信"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
