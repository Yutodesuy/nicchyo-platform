'use client';

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BagItem } from "../../../../lib/storage/BagContext";
import type { DraftItem } from "../types";

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
  onDelete,
}: {
  item: BagItem | null;
  onClose: () => void;
  onSave: (draft: DraftItem) => void;
  onDelete: (item: BagItem) => void;
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
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="relative w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl"
          >
            <div className="border-b border-stone-100 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Edit</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">項目を編集</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 transition hover:text-stone-700"
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
                  placeholder="例：2個"
                  className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-700">メモ</span>
                <Textarea
                  value={draft.note}
                  onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
                  rows={3}
                  placeholder="任意でメモ"
                  className="rounded-2xl border-stone-200 bg-white text-sm text-slate-900 focus-visible:ring-amber-400"
                />
              </label>
            </div>

            <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                >
                  <Trash2 size={16} />
                  削除する
                </button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="min-h-11 rounded-2xl border-stone-200 bg-white px-4 text-sm font-bold text-slate-600"
                  >
                    閉じる
                  </Button>
                  <Button
                    onClick={() => onSave(draft)}
                    disabled={!draft.name.trim()}
                    className="min-h-11 rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-black"
                  >
                    保存
                  </Button>
                </div>
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
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
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
                  isDanger ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-black"
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
