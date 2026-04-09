'use client';

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, ListTodo, Map as MapIcon, ShoppingCart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BagItem } from "../../../../lib/storage/BagContext";
import type { DraftItem } from "../types";

export function BagGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            <div className="bg-[linear-gradient(135deg,#fff8eb_0%,#fff0d2_100%)] px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-amber-800">
                    <Sparkles size={14} />
                    Guide
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">お買い物バッグの使い方</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    計画を立てて、現地では消し込みながら回れるようにしています。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-stone-500 shadow-sm transition hover:text-stone-700"
                  aria-label="ガイドを閉じる"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <GuideStep
                icon={<ListTodo size={18} />}
                step="1"
                title="計画する"
                description="店ごとに欲しいものを整理しつつ、足りないものはこの画面から直接メモできます。"
              />
              <GuideStep
                icon={<ShoppingCart size={18} />}
                step="2"
                title="現地でチェックする"
                description="買い物中モードに切り替えると、未購入が上にまとまり、大きなタップ領域で消し込みできます。"
              />
              <GuideStep
                icon={<MapIcon size={18} />}
                step="3"
                title="マップで迷わない"
                description="マップを開くと、バッグに関係する店だけを強調表示するので、次に行くべき場所がすぐ分かります。"
              />
            </div>

            <div className="border-t border-stone-100 bg-stone-50 px-6 py-4">
              <Button
                onClick={onClose}
                className="min-h-12 w-full rounded-2xl bg-slate-950 text-sm font-bold text-white hover:bg-black"
              >
                はじめる
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function GuideStep({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-[24px] border border-stone-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-slate-700">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Step {step}</p>
        <h3 className="mt-1 text-base font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function getDraftFromItem(item: BagItem): DraftItem {
  return {
    name: item.name,
    qty: item.qty ?? "",
    note: item.note ?? "",
  };
}

export function EditItemModal({
  item,
  onClose,
  onSave,
}: {
  item: BagItem | null;
  onClose: () => void;
  onSave: (draft: DraftItem) => void;
}) {
  const [draft, setDraft] = useState<DraftItem>({ name: "", qty: "", note: "" });

  useEffect(() => {
    if (!item) return;
    setDraft(getDraftFromItem(item));
  }, [item]);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-2xl"
          >
            <div className="border-b border-stone-100 bg-stone-50 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Edit Item</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">バッグの内容を編集</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:text-stone-700"
                  aria-label="編集モーダルを閉じる"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-700">名前</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-700">数量</span>
                <input
                  value={draft.qty}
                  onChange={(event) => setDraft((prev) => ({ ...prev, qty: event.target.value }))}
                  placeholder="例：2個、1袋"
                  className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-700">メモ</span>
                <Textarea
                  value={draft.note}
                  onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
                  rows={3}
                  placeholder="例：冷蔵庫の在庫次第で増やす"
                  className="rounded-2xl border-stone-200 bg-white text-sm text-slate-900 focus-visible:ring-amber-400"
                />
              </label>
            </div>

            <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="min-h-12 flex-1 rounded-2xl border-stone-200 bg-white text-sm font-bold text-slate-600"
                >
                  閉じる
                </Button>
                <Button
                  onClick={() => onSave(draft)}
                  disabled={!draft.name.trim()}
                  className="min-h-12 flex-1 rounded-2xl bg-slate-950 text-sm font-bold text-white hover:bg-black"
                >
                  保存する
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  isDanger,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  isDanger?: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-stone-100 text-stone-500">
              <HelpCircle size={22} />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="min-h-12 flex-1 rounded-2xl border-stone-200 bg-stone-50 text-sm font-bold text-slate-600"
              >
                やめる
              </Button>
              <Button
                onClick={onConfirm}
                className={cn(
                  "min-h-12 flex-1 rounded-2xl text-sm font-bold text-white",
                  isDanger ? "bg-red-500 hover:bg-red-600" : "bg-slate-950 hover:bg-black"
                )}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
