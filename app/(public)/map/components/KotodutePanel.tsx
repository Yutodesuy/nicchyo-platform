"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { MessageSquarePlus, Send } from "lucide-react";
import type { Shop } from "../data/shops";
import type { BannerTheme } from "./ShopBannerHero";
import { ShopSubviewHeader } from "./ShopBannerHero";
import {
  KOTODUTE_UPDATED_EVENT,
  loadKotodute,
  saveKotodute,
  type KotoduteNote,
} from "../../../../lib/kotoduteStorage";

const KOTODUTE_TAG_REGEX = /\s*#\d+|\s*#all/gi;

const KOTODUTE_CHARACTERS = [
  { id: "sakura", emoji: "🌸", name: "さくら" },
  { id: "kon",    emoji: "🦊", name: "こん" },
  { id: "nami",   emoji: "🌊", name: "なみ" },
  { id: "shiro",  emoji: "🏯", name: "しろ" },
] as const;
type KotoduteCharacterId = typeof KOTODUTE_CHARACTERS[number]["id"];
const CHAR_STORAGE_KEY = "nicchyo-kotodute-character";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export function KotodutePanel({
  shop,
  bannerImage,
  heroImageError,
  theme,
  onBack,
  onClose,
}: {
  shop: Shop;
  bannerImage: string;
  heroImageError: boolean;
  theme: BannerTheme;
  onBack: () => void;
  onClose?: () => void;
}) {
  const [allNotes, setAllNotes] = useState<KotoduteNote[]>([]);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<KotoduteCharacterId>(() => {
    if (typeof window === "undefined") return "sakura";
    return (localStorage.getItem(CHAR_STORAGE_KEY) as KotoduteCharacterId) ?? "sakura";
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedChar = KOTODUTE_CHARACTERS.find((c) => c.id === selectedCharId) ?? KOTODUTE_CHARACTERS[0];

  const notes = useMemo(
    () => allNotes.filter((n) => n.shopId === shop.id).sort((a, b) => b.createdAt - a.createdAt),
    [allNotes, shop.id]
  );

  useEffect(() => {
    setAllNotes(loadKotodute());
    setText("");
    setSubmitted(false);
  }, [shop.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setAllNotes(loadKotodute());
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "nicchyo-kotodute-notes") handler();
    };
    window.addEventListener(KOTODUTE_UPDATED_EVENT, handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(KOTODUTE_UPDATED_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const handleCharSelect = useCallback((id: KotoduteCharacterId) => {
    setSelectedCharId(id);
    localStorage.setItem(CHAR_STORAGE_KEY, id);
  }, []);

  const handleSubmit = useCallback(() => {
    const body = text.trim();
    if (!body) return;
    const next: KotoduteNote = {
      id: crypto.randomUUID(),
      shopId: shop.id,
      text: body,
      createdAt: Date.now(),
      authorEmoji: selectedChar.emoji,
    };
    const updated = [next, ...loadKotodute()];
    saveKotodute(updated);
    setAllNotes(updated);
    setText("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }, [text, shop.id, selectedChar]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <div className="flex h-full flex-col">
      <ShopSubviewHeader
        shop={shop}
        bannerImage={bannerImage}
        heroImageError={heroImageError}
        onImageError={() => {}}
        theme={theme}
        title="ことづて"
        onBack={onBack}
        onClose={onClose}
        rightSlot={
          notes.length > 0 ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: theme.light, color: theme.text }}
            >
              {notes.length}
            </span>
          ) : undefined
        }
      />

      <div className="border-b px-4 py-4" style={{ borderColor: theme.border }}>
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
            投稿キャラを選ぶ
          </p>
          <div className="flex gap-2">
            {KOTODUTE_CHARACTERS.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => handleCharSelect(char.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${
                  selectedCharId === char.id ? "shadow-sm ring-2" : "opacity-50 hover:opacity-80"
                }`}
                style={{
                  backgroundColor: selectedCharId === char.id ? theme.light : "transparent",
                  border: `1px solid ${theme.border}`,
                  ...(selectedCharId === char.id
                    ? { outline: `2px solid ${theme.accent}`, outlineOffset: "1px" }
                    : {}),
                }}
              >
                <span className="text-xl leading-none">{char.emoji}</span>
                <span style={{ color: theme.text }}>{char.name}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mb-2 text-xs font-semibold" style={{ color: theme.text }}>
          {shop.name}へひとことメモ
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="おすすめや感想をひとこと…"
          rows={3}
          className="w-full resize-none rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2"
          style={{
            borderColor: theme.border,
            // @ts-expect-error — CSSProperties doesn't include Tailwind custom vars
            "--tw-ring-color": theme.accent + "55",
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: submitted ? "#22c55e" : theme.accent }}
        >
          {submitted ? (
            "✓ 投稿しました！"
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              投稿する
            </>
          )}
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.light }}
          >
            <MessageSquarePlus className="h-6 w-6" style={{ color: theme.accent }} />
          </div>
          <p className="text-sm font-bold text-slate-700">まだコメントがありません</p>
          <p className="text-xs text-slate-400">最初の一言を投稿してみましょう！</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xl shadow-sm"
                style={{ backgroundColor: theme.light, border: `1.5px solid ${theme.border}` }}
              >
                {note.authorEmoji ?? "💬"}
              </div>
              <div
                className="flex-1 rounded-2xl border px-3 py-2.5 text-sm"
                style={{ borderColor: theme.border, backgroundColor: theme.bg }}
              >
                <p className="leading-relaxed text-slate-800">
                  {note.text.replace(KOTODUTE_TAG_REGEX, "").trim()}
                </p>
                <p className="mt-1.5 text-[11px]" style={{ color: theme.text, opacity: 0.6 }}>
                  {formatRelativeTime(note.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
