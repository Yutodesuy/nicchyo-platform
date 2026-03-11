"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { ArrowLeft, Save, CheckCircle2, Loader2, Sparkles, Info } from "lucide-react";

const PLACEHOLDER = `例：
この店の人気商品は芋天です。
揚げたてを提供しているので午前中が一番おいしいです。
10時〜11時ごろは行列ができることがあります。
現金のみの対応です。
試食もできます。`;

const HINTS = [
  "おすすめ商品・こだわり",
  "行列ができやすい時間帯",
  "よく聞かれる質問への回答",
  "決済方法・特記事項",
  "お店の特徴・雰囲気",
];

export default function AiKnowledgePage() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hasEmbedding, setHasEmbedding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/knowledge")
      .then((r) => r.json())
      .then((d: { knowledge?: { content: string; updated_at: string } | null }) => {
        if (d.knowledge) {
          setContent(d.knowledge.content);
          setSavedAt(d.knowledge.updated_at);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    if (isSaving || !content.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = (await res.json()) as { ok?: boolean; hasEmbedding?: boolean; error?: string };
      if (!res.ok) throw new Error(d.error ?? "保存に失敗しました");
      setSavedAt(new Date().toISOString());
      setHasEmbedding(d.hasEmbedding ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/my-shop" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">AI Knowledge</p>
            <h1 className="text-xl font-bold text-slate-900">AIばあちゃんに教えるお店の情報</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {/* 説明カード */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <img src="/images/obaasan_transparent.png" alt="AIばあちゃん" className="h-14 w-14 flex-shrink-0 opacity-80" />
          <div>
            <p className="text-sm font-semibold text-amber-800">ここに書いた内容は、AIばあちゃんがお客さんにお店を紹介するときに参考にします</p>
            <p className="mt-1 text-xs text-amber-700">商品のこだわりや行列情報など、お客さんが知りたいことを自由に書いてください。</p>
          </div>
        </div>

        {/* ヒント */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Info size={14} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500">書くと効果的な内容</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HINTS.map((hint) => (
              <span key={hint} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                {hint}
              </span>
            ))}
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">店舗説明</p>
            {savedAt && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <CheckCircle2 size={10} className="text-emerald-500" />
                {new Date(savedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} 保存済み
                {hasEmbedding && <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] text-violet-600">AI学習済み</span>}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-amber-500" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={10}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
            />
          )}

          <p className="mt-2 text-[10px] text-slate-400">
            {content.length} 文字 ／ 自由な文章で入力できます
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow transition ${
            isSaving
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "bg-amber-500 text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          }`}
        >
          {isSaving
            ? <><Loader2 size={18} className="animate-spin" />AIに学習させています...</>
            : <><Sparkles size={18} />AIばあちゃんに教える</>
          }
        </button>

        {/* 仕組み説明 */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Save size={13} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500">保存時の処理</p>
          </div>
          <ol className="space-y-1 text-[11px] text-slate-500">
            <li>1. 入力内容をAIがベクトルデータに変換</li>
            <li>2. ベクトルデータをデータベースに保存</li>
            <li>3. お客さんがAIばあちゃんに質問したとき、関連する情報を自動的に参照</li>
          </ol>
        </div>

      </div>
      <NavigationBar />
    </div>
  );
}
