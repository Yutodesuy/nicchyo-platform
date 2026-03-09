"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import { createPost } from "../../_services/postsService";
import type { ExpirationPreset } from "../../_types";
import {
  ArrowLeft,
  Image as ImageIcon,
  Clock,
  Calendar,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type ExpirationOption = { preset: ExpirationPreset; label: string; desc: string; icon: typeof Clock };

const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { preset: "1h",     label: "1時間",  desc: "今すぐ来てほしい情報に", icon: Clock },
  { preset: "today",  label: "本日",   desc: "当日限りの情報に",       icon: Calendar },
  { preset: "custom", label: "カスタム",desc: "時間を自分で設定",       icon: Clock },
];

function calcExpirationTime(preset: ExpirationPreset, customDateTime: string): Date {
  const now = new Date();
  if (preset === "1h") return new Date(now.getTime() + 60 * 60 * 1000);
  if (preset === "today") { const eod = new Date(now); eod.setHours(23, 59, 59, 999); return eod; }
  return customDateTime ? new Date(customDateTime) : new Date(now.getTime() + 2 * 60 * 60 * 1000);
}

function formatExpirationLabel(preset: ExpirationPreset, customDateTime: string): string {
  const exp = calcExpirationTime(preset, customDateTime);
  if (preset === "1h") return "あと1時間";
  if (preset === "today") return "本日限定";
  const h = exp.getHours().toString().padStart(2, "0");
  const m = exp.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}まで`;
}

export default function VendorPostNewPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText]                       = useState("");
  const [imageFile, setImageFile]             = useState<File | null>(null);
  const [imagePreview, setImagePreview]       = useState<string | null>(null);
  const [expirationPreset, setExpirationPreset] = useState<ExpirationPreset>("today");
  const [customDateTime, setCustomDateTime]   = useState("");
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [isSubmitted, setIsSubmitted]         = useState(false);
  const [showPreview, setShowPreview]         = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const isValid = text.trim().length > 0;
  const MAX_CHARS = 300;

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting || !user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const expiresAt = calcExpirationTime(expirationPreset, customDateTime);
      await createPost(user.id, text, expiresAt, imageFile ?? undefined);
      setIsSubmitted(true);
    } catch {
      setError("投稿に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] pb-24">
        <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900">投稿しました！</h2>
          <p className="mt-2 text-sm text-slate-500">
            {formatExpirationLabel(expirationPreset, customDateTime)}の間、マップ上に表示されます
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href="/my-shop" className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-amber-400">
              出店者メニューへ
            </Link>
            <button
              onClick={() => { setIsSubmitted(false); setText(""); setImageFile(null); setImagePreview(null); setExpirationPreset("today"); setCustomDateTime(""); }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
            >
              続けて投稿する
            </button>
          </div>
        </div>
        <NavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/my-shop" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">New Post</p>
            <h1 className="text-xl font-bold text-slate-900">最新情報を発信</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={14} />{error}
          </div>
        )}

        {/* テキスト入力 */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 pt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">投稿内容</label>
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="今日のおすすめ情報・残り数量・特別メニューなど..."
              maxLength={MAX_CHARS} rows={5}
              className="w-full resize-none rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-3">
            <span className={`text-xs ${text.length > MAX_CHARS * 0.9 ? "text-red-500" : "text-slate-400"}`}>
              {text.length} / {MAX_CHARS}
            </span>
            {text.length === 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <AlertCircle size={11} />テキストを入力してください
              </span>
            )}
          </div>
        </div>

        {/* 画像アップロード */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">画像（任意）</label>
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="プレビュー" className="h-48 w-full rounded-xl object-cover" />
              <button type="button" onClick={handleRemoveImage}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500"
            >
              <ImageIcon size={24} />
              <span className="text-sm font-medium">タップして画像を追加</span>
              <span className="text-xs text-slate-400">JPG / PNG / WEBP（5MB以内）</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* 表示期間 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">表示期間</label>
          <div className="grid grid-cols-3 gap-2">
            {EXPIRATION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = expirationPreset === opt.preset;
              return (
                <button key={opt.preset} type="button" onClick={() => setExpirationPreset(opt.preset)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition ${isSelected ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/50"}`}
                >
                  <Icon size={18} />
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] leading-tight text-slate-400">{opt.desc}</span>
                </button>
              );
            })}
          </div>
          {expirationPreset === "custom" && (
            <div className="mt-3">
              <label className="mb-1.5 block text-xs text-slate-500">終了日時を選択</label>
              <input type="datetime-local" value={customDateTime} onChange={(e) => setCustomDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          )}
          {(expirationPreset !== "custom" || customDateTime) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
              <Clock size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700">
                表示ラベル：<span className="font-semibold">「{formatExpirationLabel(expirationPreset, customDateTime)}」</span>
              </span>
            </div>
          )}
        </div>

        {/* プレビュー */}
        {text.trim().length > 0 && (
          <div>
            <button type="button" onClick={() => setShowPreview(!showPreview)}
              className="mb-2 text-sm font-medium text-amber-600 hover:underline"
            >
              {showPreview ? "プレビューを閉じる" : "投稿プレビューを確認"}
            </button>
            {showPreview && (
              <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">出</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">あなたの店舗</p>
                    <p className="text-[10px] text-slate-400">{formatExpirationLabel(expirationPreset, customDateTime)}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">公開中</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{text}</p>
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="投稿画像" className="mt-3 w-full rounded-xl object-cover" style={{ maxHeight: "200px" }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* 送信ボタン */}
        <button type="submit" disabled={!isValid || isSubmitting}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow transition ${
            isValid && !isSubmitting ? "bg-amber-500 text-white hover:bg-amber-400" : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin" />投稿中...</> : <><Send size={18} />投稿する</>}
        </button>

      </form>
      <NavigationBar />
    </div>
  );
}
