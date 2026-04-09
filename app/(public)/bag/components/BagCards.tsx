'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Circle,
  Edit2,
  ListTodo,
  Map as MapIcon,
  Package,
  Plus,
  Receipt,
  Route,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BagItem } from "../../../../lib/storage/BagContext";
import type { DraftItem, BagGroup, Mode } from "../types";

export function SummaryChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/78 px-3 py-3 shadow-sm ring-1 ring-white/70">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        {icon}
      </div>
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

export function ModeTab({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[72px] rounded-[18px] px-3 py-3 text-left transition-all",
        active
          ? "bg-slate-950 text-white shadow-lg shadow-slate-900/10"
          : "bg-transparent text-slate-500 hover:bg-stone-100"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-white/10" : "bg-white")}>
          {icon}
        </span>
        <div>
          <div className="text-sm font-black">{label}</div>
          <div className={cn("text-[11px] font-semibold", active ? "text-white/65" : "text-slate-400")}>
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

export function RoutePreviewCard({
  mode,
  nextStops,
  totalShops,
  remainingCount,
  mapLabel,
  onOpenMap,
}: {
  mode: Mode;
  nextStops: BagGroup[];
  totalShops: number;
  remainingCount: number;
  mapLabel: string;
  onOpenMap: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-stone-200 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-600">
            <Route size={14} />
            マップ連携
          </div>
          <h3 className="mt-3 text-xl font-black text-slate-900">
            {mode === "plan"
              ? "どの店に寄るかを先に見渡せます"
              : remainingCount > 0
                ? "未購入のお店だけに集中できます"
                : "完了したルートを見返せます"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {totalShops > 0
              ? "マップを開くと、このバッグに関係するお店だけを強調表示します。"
              : "まだお店が紐づいた商品はありません。メモだけでもこのまま使えます。"}
          </p>
        </div>
        <Button
          onClick={onOpenMap}
          className="min-h-11 rounded-2xl bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-600"
        >
          <MapIcon size={16} className="mr-2" />
          開く
        </Button>
      </div>

      {nextStops.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStops.map((group) => (
            <div
              key={group.key}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700"
            >
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-amber-700">
                {typeof group.shop?.position === "number" ? group.shop.position + 1 : "・"}
              </span>
              <span>{group.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Ready</p>
          <p className="text-sm font-bold">{mapLabel}</p>
        </div>
        <ChevronRight size={18} className="text-white/70" />
      </div>
    </section>
  );
}

export function QuickAddCard({
  isOpen,
  draft,
  onOpen,
  onChange,
  onCancel,
  onSave,
}: {
  isOpen: boolean;
  draft: DraftItem;
  onOpen: () => void;
  onChange: (next: DraftItem) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-stone-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
            <Plus size={14} />
            手書きメモ
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-900">今ここで、欲しいものを追加</h3>
          <p className="mt-1 text-sm text-slate-600">
            マップやレシピにないものも、このページだけで追加できます。
          </p>
        </div>
        {!isOpen && (
          <Button
            onClick={onOpen}
            className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-bold hover:bg-black"
          >
            <Plus size={16} className="mr-2" />
            追加する
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 rounded-[24px] border border-stone-200 bg-stone-50 p-3">
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-slate-700">名前</span>
              <input
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
                placeholder="例：保冷バッグ用の氷、家の牛乳"
                className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-amber-400"
              />
            </label>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 max-sm:grid-cols-1">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-700">数量</span>
                <input
                  value={draft.qty}
                  onChange={(event) => onChange({ ...draft, qty: event.target.value })}
                  placeholder="例：2個"
                  className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-700">メモ</span>
                <Textarea
                  value={draft.note}
                  onChange={(event) => onChange({ ...draft, note: event.target.value })}
                  placeholder="例：冷蔵庫の在庫を見てから決める"
                  rows={2}
                  className="min-h-[76px] rounded-2xl border-stone-200 bg-white text-sm text-slate-900 focus-visible:ring-amber-400"
                />
              </label>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="min-h-11 rounded-2xl border-stone-200 bg-white px-4 text-sm font-bold text-slate-600"
            >
              閉じる
            </Button>
            <Button
              onClick={onSave}
              disabled={!draft.name.trim()}
              className="min-h-11 rounded-2xl bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-600"
            >
              追加する
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function BagGroupSection({
  group,
  mode,
  showCompletedItems,
  checkedIds,
  onToggleCheck,
  onEditItem,
  onRemoveItem,
}: {
  group: BagGroup;
  mode: Mode;
  showCompletedItems: boolean;
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onEditItem: (item: BagItem) => void;
  onRemoveItem: (item: BagItem) => void;
}) {
  const visibleItems =
    mode === "shop"
      ? [...group.uncheckedItems, ...(showCompletedItems ? group.checkedItems : [])]
      : group.items;

  if (visibleItems.length === 0) return null;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="overflow-hidden rounded-[28px] border border-stone-200 bg-white/90 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
    >
      <div className={cn(
        "border-b border-stone-100 px-4 py-4",
        group.isOther ? "bg-stone-50" : "bg-[linear-gradient(135deg,#fffaf2_0%,#fff5df_100%)]"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
              {group.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={group.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : group.isOther ? (
                <ShoppingBag size={18} className="text-stone-500" />
              ) : (
                <Store size={18} className="text-amber-700" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {!group.isOther && typeof group.shop?.position === "number" && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 shadow-sm">
                    Route {group.shop.position + 1}
                  </span>
                )}
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-500">
                  {group.items.length}品
                </span>
                {group.totalPrice > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    ¥{group.totalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <h2 className="mt-2 truncate text-lg font-black text-slate-900">{group.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{group.subtitle}</p>
            </div>
          </div>

          {!group.isOther && group.shop && (
            <Link
              href={`/map?shop=${group.shop.id}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-stone-50 active:scale-[0.98]"
            >
              <MapIcon size={15} />
              場所
            </Link>
          )}
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {visibleItems.map((item) => (
          <BagItemRow
            key={item.id}
            item={item}
            mode={mode}
            isChecked={checkedIds.has(item.id)}
            onToggleCheck={onToggleCheck}
            onEdit={() => onEditItem(item)}
            onRemove={() => onRemoveItem(item)}
          />
        ))}
      </div>
    </motion.section>
  );
}

function BagItemRow({
  item,
  mode,
  isChecked,
  onToggleCheck,
  onEdit,
  onRemove,
}: {
  item: BagItem;
  mode: Mode;
  isChecked: boolean;
  onToggleCheck: (id: string) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const interactive = mode === "shop";

  return (
    <motion.div layout className={cn("relative px-4 py-4", isChecked && interactive && "bg-stone-50/80")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => interactive && onToggleCheck(item.id)}
          className={cn(
            "inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl border transition",
            interactive
              ? isChecked
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-stone-200 bg-white text-stone-400 hover:border-emerald-200 hover:text-emerald-600"
              : "border-transparent bg-stone-100 text-amber-600"
          )}
          aria-label={interactive ? (isChecked ? "未完了に戻す" : "完了にする") : "項目"}
        >
          {interactive ? (
            isChecked ? <CheckCircle2 size={22} /> : <Circle size={22} />
          ) : (
            <Package size={18} />
          )}
        </button>

        <button
          type="button"
          onClick={() => interactive && onToggleCheck(item.id)}
          className={cn("flex-1 text-left", interactive && "cursor-pointer")}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn(
                "text-[15px] font-bold leading-snug text-slate-900",
                isChecked && interactive && "text-stone-500 line-through"
              )}>
                {item.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.qty && (
                  <span className="inline-flex min-h-8 items-center rounded-full bg-stone-100 px-3 text-[12px] font-bold text-stone-700">
                    数量 {item.qty}
                  </span>
                )}
                {typeof item.price === "number" && item.price > 0 && (
                  <span className="inline-flex min-h-8 items-center rounded-full bg-emerald-50 px-3 text-[12px] font-bold text-emerald-700">
                    ¥{item.price.toLocaleString()}
                  </span>
                )}
              </div>
              {item.note && (
                <p className={cn(
                  "mt-2 rounded-2xl bg-stone-50 px-3 py-2 text-[13px] leading-relaxed text-stone-600",
                  isChecked && interactive && "bg-white text-stone-500"
                )}>
                  {item.note}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 transition hover:text-slate-800 active:scale-[0.98]"
                aria-label="項目を編集"
              >
                <Edit2 size={16} />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-400 transition hover:text-red-600 active:scale-[0.98]"
                aria-label="項目を削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

export function ShoppingModeBanner({
  checkedCount,
  showCompletedGroups,
  onToggle,
}: {
  checkedCount: number;
  showCompletedGroups: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-emerald-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            現地モード
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">
            買い終わったもの {checkedCount}品
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            完了済みは下にまとめています。必要ならもう一度タップで未完了に戻せます。
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.98]"
        >
          {showCompletedGroups ? "完了済みをたたむ" : "完了済みを表示"}
          <ChevronDown size={16} className={cn("transition-transform", showCompletedGroups && "rotate-180")} />
        </button>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[34px] border border-stone-200 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
    >
      <div className="bg-[linear-gradient(135deg,#fff8eb_0%,#fff0d3_100%)] px-6 pb-6 pt-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-sm">
          <ClipboardList size={34} className="text-amber-600" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-slate-900">まだ何も入っていません</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          マップで気になったお店の商品や、レシピの食材を追加すると、ここで店ごとに整理されます。
        </p>
      </div>
      <div className="grid gap-3 px-6 py-6 sm:grid-cols-2">
        <Link
          href="/map"
          className="flex min-h-[112px] flex-col justify-between rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <MapIcon size={20} />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">マップでお店を探す</p>
            <p className="mt-1 text-sm text-slate-500">気になる店から、そのままバッグに追加できます。</p>
          </div>
        </Link>
        <Link
          href="/recipes"
          className="flex min-h-[112px] flex-col justify-between rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">レシピから食材を集める</p>
            <p className="mt-1 text-sm text-slate-500">必要な食材を見ながら買い物リストを作れます。</p>
          </div>
        </Link>
      </div>
    </motion.section>
  );
}
