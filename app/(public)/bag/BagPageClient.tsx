'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Map as MapIcon, ShoppingBag, Store, Undo2 } from "lucide-react";
import NavigationBar from "../../components/NavigationBar";
import { clearSearchMapPayload, saveSearchMapPayload } from "../../../lib/searchMapStorage";
import { useShops } from "../../../lib/hooks/useShops";
import { useBag, type BagItem } from "../../../lib/storage/BagContext";
import type { BagGroup, DraftItem, GroupKey } from "./types";
import { BagGroupSection, EmptyState, QuickAddPanel } from "./components/BagCards";
import { ConfirmModal, EditItemModal } from "./components/BagModals";

const CHECKED_STORAGE_KEY = "nicchyo-shopping-checked";

function useShoppingChecklist(itemIds: string[]) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKED_STORAGE_KEY);
      if (raw) {
        setCheckedIds(new Set(JSON.parse(raw)));
      }
    } catch (error) {
      console.error("Failed to load checked items", error);
    }
  }, []);

  useEffect(() => {
    setCheckedIds((prev) => {
      const validIds = new Set(itemIds);
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      if (next.size !== prev.size) {
        localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, [itemIds]);

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const resetChecks = useCallback(() => {
    setCheckedIds(new Set());
    localStorage.removeItem(CHECKED_STORAGE_KEY);
  }, []);

  return { checkedIds, toggleCheck, resetChecks };
}

function getGroupSubtitle(shop: BagGroup["shop"], isOther: boolean) {
  if (isOther) return "メモしたもの";
  if (!shop) return "出店情報を読み込み中";
  if (shop.chome) return `${shop.chome} / ${shop.position + 1}番あたり`;
  return `${shop.position + 1}番あたり`;
}

export default function BagPageClient() {
  const router = useRouter();
  const { items, addItem, removeItem, updateItem, clearBag } = useBag();
  const { shops } = useShops();
  const { checkedIds, toggleCheck, resetChecks } = useShoppingChecklist(
    useMemo(() => items.map((item) => item.id), [items])
  );

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [showAddDetails, setShowAddDetails] = useState(false);
  const [draft, setDraft] = useState<DraftItem>({ name: "", qty: "", note: "" });
  const [editingItem, setEditingItem] = useState<BagItem | null>(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<BagItem | null>(null);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const shopLookup = useMemo(() => new Map(shops.map((shop) => [shop.id, shop])), [shops]);

  const groupedData = useMemo<BagGroup[]>(() => {
    const groups = new Map<GroupKey, BagItem[]>();

    items.forEach((item) => {
      const key: GroupKey = item.fromShopId ?? "other";
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .map(([key, groupItems]) => {
        const isOther = key === "other";
        const shop = typeof key === "number" ? shopLookup.get(key) ?? null : null;
        return {
          key,
          shop,
          title: isOther ? "その他 / メモ" : shop?.name || `お店 #${key}`,
          subtitle: getGroupSubtitle(shop, isOther),
          imageUrl: shop?.images?.thumbnail ?? shop?.images?.main,
          isOther,
          items: groupItems,
        };
      })
      .sort((a, b) => {
        if (a.isOther) return 1;
        if (b.isOther) return -1;
        const aPos = a.shop?.position ?? Number.MAX_SAFE_INTEGER;
        const bPos = b.shop?.position ?? Number.MAX_SAFE_INTEGER;
        return aPos - bPos;
      });
  }, [items, shopLookup]);

  const totalItems = items.length;
  const checkedCount = items.filter((item) => checkedIds.has(item.id)).length;
  const totalShops = groupedData.filter((group) => !group.isOther).length;
  const remainingShopIds = groupedData
    .filter((group) => !group.isOther && group.items.some((item) => !checkedIds.has(item.id)))
    .map((group) => group.shop?.id)
    .filter((value): value is number => typeof value === "number");
  const allShopIds = groupedData
    .filter((group) => !group.isOther)
    .map((group) => group.shop?.id)
    .filter((value): value is number => typeof value === "number");
  const focusShopIds = remainingShopIds.length > 0 ? remainingShopIds : allShopIds;
  const mapLabel =
    remainingShopIds.length > 0
      ? "未購入のお店をマップで見る"
      : allShopIds.length > 0
        ? "バッグのお店をマップで見る"
        : "マップに戻る";

  const queueUndoToast = useCallback((item: BagItem) => {
    setRecentlyDeleted(item);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setRecentlyDeleted(null);
      undoTimerRef.current = null;
    }, 4500);
  }, []);

  const handleDelete = useCallback((item: BagItem) => {
    removeItem(item.id);
    queueUndoToast(item);
  }, [queueUndoToast, removeItem]);

  const handleUndoDelete = useCallback(() => {
    if (!recentlyDeleted) return;
    addItem({
      name: recentlyDeleted.name,
      fromShopId: recentlyDeleted.fromShopId,
      category: recentlyDeleted.category,
      qty: recentlyDeleted.qty,
      note: recentlyDeleted.note,
      photo: recentlyDeleted.photo,
      price: recentlyDeleted.price,
    });
    setRecentlyDeleted(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [addItem, recentlyDeleted]);

  const handleOpenMap = useCallback(() => {
    if (focusShopIds.length > 0) {
      saveSearchMapPayload({
        ids: focusShopIds,
        label: remainingShopIds.length > 0 ? "未購入のお店" : "バッグのお店",
      });
      router.push(`/map?search=1&label=${encodeURIComponent(remainingShopIds.length > 0 ? "未購入のお店" : "バッグのお店")}`);
      return;
    }
    clearSearchMapPayload();
    router.push("/map");
  }, [focusShopIds, remainingShopIds.length, router]);

  const handleSaveDraft = useCallback(() => {
    const name = draft.name.trim();
    if (!name) return;
    addItem({
      name,
      qty: draft.qty.trim() || undefined,
      note: draft.note.trim() || undefined,
      category: "メモ",
    });
    setDraft({ name: "", qty: "", note: "" });
    setShowAddDetails(false);
    setIsComposerOpen(false);
  }, [addItem, draft]);

  return (
    <main className="min-h-screen bg-[#f6f3ec] pb-28 text-slate-900 md:pb-20">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#f6f3ec]/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-4 pb-4 pt-safe-top">
          <div className="flex items-start justify-between gap-3 py-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Bag</p>
              <h1 className="mt-1 text-[30px] font-black tracking-tight text-slate-900">お買い物バッグ</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                買うものを確認して、必要ならそのままマップで場所を見られます。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsComposerOpen((prev) => !prev)}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-black active:scale-[0.98]"
            >
              <ShoppingBag size={16} />
              追加
            </button>
          </div>

          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-2 rounded-3xl border border-stone-200 bg-white p-3 shadow-sm">
              <SummaryCell icon={<ShoppingBag size={16} />} label="アイテム" value={`${totalItems}品`} />
              <SummaryCell icon={<Store size={16} />} label="お店" value={`${totalShops}店`} />
              <SummaryCell icon={<MapIcon size={16} />} label="完了" value={`${checkedCount}件`} />
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-4 py-5">
        <QuickAddPanel
          isOpen={isComposerOpen}
          showDetails={showAddDetails}
          draft={draft}
          onOpen={() => setIsComposerOpen(true)}
          onToggleDetails={() => setShowAddDetails((prev) => !prev)}
          onChange={setDraft}
          onCancel={() => {
            setDraft({ name: "", qty: "", note: "" });
            setShowAddDetails(false);
            setIsComposerOpen(false);
          }}
          onSave={handleSaveDraft}
        />

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {groupedData.map((group) => (
              <BagGroupSection
                key={group.key}
                group={group}
                checkedIds={checkedIds}
                onToggleCheck={toggleCheck}
                onEditItem={setEditingItem}
              />
            ))}

            <div className="flex justify-center pb-8 pt-2">
              <button
                type="button"
                onClick={() => setPendingReset(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-stone-500 transition hover:text-red-600 active:scale-[0.98]"
              >
                すべて削除
              </button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {recentlyDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            className="fixed inset-x-0 z-40 px-4"
            style={{ bottom: "calc(7.5rem + var(--safe-bottom, 0px))" }}
          >
            <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-slate-950/96 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-sm font-bold">「{recentlyDeleted.name}」を削除しました</p>
                <p className="text-[12px] text-white/65">必要なら元に戻せます</p>
              </div>
              <button
                type="button"
                onClick={handleUndoDelete}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-white/90 active:scale-[0.98]"
              >
                <Undo2 size={16} />
                元に戻す
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length > 0 && (
        <div className="fixed left-0 right-0 z-30 px-4" style={{ bottom: "calc(3.25rem + var(--safe-bottom, 0px))" }}>
          <div className="mx-auto max-w-xl">
            <button
              type="button"
              onClick={handleOpenMap}
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[24px] bg-slate-950 px-5 py-4 text-left text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] transition hover:bg-black active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <MapIcon size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Map</p>
                  <p className="text-sm font-bold">{mapLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                {focusShopIds.length > 0 ? `${focusShopIds.length}店` : "戻る"}
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>
      )}

      <EditItemModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(nextDraft) => {
          if (!editingItem) return;
          updateItem(editingItem.id, {
            name: nextDraft.name.trim(),
            qty: nextDraft.qty.trim() || undefined,
            note: nextDraft.note.trim() || undefined,
          });
          setEditingItem(null);
        }}
        onDelete={(item) => {
          setEditingItem(null);
          handleDelete(item);
        }}
      />

      <ConfirmModal
        isOpen={pendingReset}
        title="バッグを空にする"
        message="入っている項目をすべて削除します。"
        onConfirm={() => {
          clearBag();
          resetChecks();
          setPendingReset(false);
        }}
        onCancel={() => setPendingReset(false)}
        confirmLabel="削除する"
        isDanger
      />

      <NavigationBar />
    </main>
  );
}

function SummaryCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 px-3 py-3 text-center">
      <div className="mx-auto mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
        {icon}
      </div>
      <div className="text-lg font-black text-slate-900">{value}</div>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
    </div>
  );
}
