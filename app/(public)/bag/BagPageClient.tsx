'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  HelpCircle,
  ListTodo,
  Map as MapIcon,
  Receipt,
  RotateCcw,
  Route,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Undo2,
} from "lucide-react";
import NavigationBar from "../../components/NavigationBar";
import { clearSearchMapPayload, saveSearchMapPayload } from "../../../lib/searchMapStorage";
import { useShops } from "../../../lib/hooks/useShops";
import { useBag, type BagItem } from "../../../lib/storage/BagContext";
import type { BagGroup, GroupKey, DraftItem, Mode } from "./types";
import {
  BagGroupSection,
  EmptyState,
  ModeTab,
  QuickAddCard,
  RoutePreviewCard,
  ShoppingModeBanner,
  SummaryChip,
} from "./components/BagCards";
import { BagGuideModal, ConfirmModal, EditItemModal } from "./components/BagModals";

const GUIDE_STORAGE_KEY = "nicchyo-bag-guide-seen";
const CHECKED_STORAGE_KEY = "nicchyo-shopping-checked";

function useShoppingChecklist(itemIds: string[]) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKED_STORAGE_KEY);
      if (raw) {
        setCheckedIds(new Set(JSON.parse(raw)));
      }
    } catch (error) {
      console.error("Failed to load checked items", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    setCheckedIds((prev) => {
      const itemIdSet = new Set(itemIds);
      const next = new Set(Array.from(prev).filter((id) => itemIdSet.has(id)));
      if (next.size !== prev.size) {
        localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, [isLoaded, itemIds]);

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
  if (isOther) return "自由メモや追加したいもの";
  if (!shop) return "出店情報を読み込み中";
  const routeLabel =
    typeof shop.position === "number" ? `${shop.position + 1}番あたり` : "出店位置を確認";
  return shop.chome ? `${shop.chome} / ${routeLabel}` : routeLabel;
}

function getMapHighlightLabel(mode: Mode, shopCount: number, remainingCount: number) {
  if (shopCount === 0) return "マップに戻る";
  if (mode === "shop" && remainingCount > 0) return `残りの${shopCount}店舗をマップで見る`;
  return `${shopCount}店舗をマップで強調表示`;
}

function formatPrice(value: number) {
  return `¥${value.toLocaleString()}`;
}

export default function BagPageClient() {
  const router = useRouter();
  const { items, totalPrice, addItem, removeItem, updateItem, clearBag } = useBag();
  const { shops } = useShops();

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const { checkedIds, toggleCheck, resetChecks } = useShoppingChecklist(itemIds);

  const [mode, setMode] = useState<Mode>("plan");
  const [showGuide, setShowGuide] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [quickDraft, setQuickDraft] = useState<DraftItem>({ name: "", qty: "", note: "" });
  const [editingItem, setEditingItem] = useState<BagItem | null>(null);
  const [showCompletedGroups, setShowCompletedGroups] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<BagItem | null>(null);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!hasSeenGuide) setShowGuide(true);
  }, []);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const shopLookup = useMemo(() => new Map(shops.map((shop) => [shop.id, shop])), [shops]);

  const groupedData = useMemo<BagGroup[]>(() => {
    const groups = new Map<GroupKey, BagItem[]>();
    const sortedItems = [...items].sort((a, b) => b.createdAt - a.createdAt);

    sortedItems.forEach((item) => {
      const key: GroupKey = item.fromShopId ?? "other";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });

    return Array.from(groups.entries())
      .map(([key, groupItems]) => {
        const isOther = key === "other";
        const shop = typeof key === "number" ? shopLookup.get(key) ?? null : null;
        const uncheckedItems = groupItems.filter((item) => !checkedIds.has(item.id));
        const checkedItems = groupItems.filter((item) => checkedIds.has(item.id));
        return {
          key,
          shop,
          routeOrder: isOther ? Number.MAX_SAFE_INTEGER : (shop?.position ?? Number.MAX_SAFE_INTEGER),
          title: isOther ? "その他 / メモ" : shop?.name || `お店 #${key}`,
          subtitle: getGroupSubtitle(shop, isOther),
          imageUrl: shop?.images?.thumbnail ?? shop?.images?.main,
          isOther,
          items: groupItems,
          uncheckedItems,
          checkedItems,
          checkedCount: checkedItems.length,
          totalPrice: groupItems.reduce((sum, item) => sum + (item.price ?? 0), 0),
        };
      })
      .sort((a, b) => {
        if (a.isOther) return 1;
        if (b.isOther) return -1;
        if (a.routeOrder !== b.routeOrder) return a.routeOrder - b.routeOrder;
        return a.title.localeCompare(b.title, "ja");
      });
  }, [checkedIds, items, shopLookup]);

  const totalItems = items.length;
  const checkedCount = items.filter((item) => checkedIds.has(item.id)).length;
  const remainingCount = Math.max(totalItems - checkedCount, 0);
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const totalShops = groupedData.filter((group) => !group.isOther).length;
  const memoCount = groupedData.find((group) => group.isOther)?.items.length ?? 0;
  const remainingShopIds = groupedData
    .filter((group) => !group.isOther && group.uncheckedItems.length > 0)
    .map((group) => group.shop?.id)
    .filter((value): value is number => typeof value === "number");
  const allShopIds = groupedData
    .filter((group) => !group.isOther)
    .map((group) => group.shop?.id)
    .filter((value): value is number => typeof value === "number");
  const focusShopIds = mode === "shop" && remainingShopIds.length > 0 ? remainingShopIds : allShopIds;
  const mapLabel = getMapHighlightLabel(mode, focusShopIds.length, remainingCount);
  const activeGroups = mode === "shop"
    ? groupedData.filter((group) => group.uncheckedItems.length > 0 || group.isOther)
    : groupedData;
  const completedGroups = groupedData.filter(
    (group) => !group.isOther && group.checkedItems.length > 0 && group.uncheckedItems.length === 0
  );
  const nextStops = groupedData.filter((group) => !group.isOther).slice(0, 3);

  const handleCloseGuide = useCallback(() => {
    setShowGuide(false);
    localStorage.setItem(GUIDE_STORAGE_KEY, "true");
  }, []);

  const queueUndoToast = useCallback((item: BagItem) => {
    setRecentlyDeleted(item);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setRecentlyDeleted(null);
      undoTimerRef.current = null;
    }, 4500);
  }, []);

  const handleRemoveItem = useCallback((item: BagItem) => {
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
    const label = mode === "shop" && remainingCount > 0 ? "残りのお店" : "バッグのお店";
    if (focusShopIds.length > 0) {
      saveSearchMapPayload({ ids: focusShopIds, label });
      router.push(`/map?search=1&label=${encodeURIComponent(label)}`);
      return;
    }
    clearSearchMapPayload();
    router.push("/map");
  }, [focusShopIds, mode, remainingCount, router]);

  const handleSaveQuickDraft = useCallback(() => {
    const name = quickDraft.name.trim();
    if (!name) return;
    addItem({
      name,
      qty: quickDraft.qty.trim() || undefined,
      note: quickDraft.note.trim() || undefined,
      category: "メモ",
    });
    setQuickDraft({ name: "", qty: "", note: "" });
    setIsComposerOpen(false);
  }, [addItem, quickDraft]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f5ee_0%,#f3ede0_100%)] pb-28 text-slate-900 md:pb-20">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#f8f5ee]/92 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-4 pb-4 pt-safe-top">
          <div className="flex items-start justify-between gap-3 py-4">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Bag Hub</p>
              <h1 className="text-[30px] font-black tracking-tight text-slate-900">お買い物バッグ</h1>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-600">
                計画をまとめて、現地ではチェックしながら迷わず回れるようにします。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowGuide(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white/90 text-stone-500 shadow-sm transition hover:text-stone-700 active:scale-95" aria-label="使い方ガイドを開く">
                <HelpCircle size={18} />
              </button>
              <button type="button" onClick={handleOpenMap} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15 transition hover:bg-black active:scale-95" aria-label="マップで確認">
                <MapIcon size={18} />
              </button>
            </div>
          </div>

          <section className="overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,#fff8eb_0%,#fff1d8_45%,#fde2ad_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-amber-800">
                    <Sparkles size={14} />
                    {mode === "plan" ? "計画を整える" : "買い忘れを防ぐ"}
                  </div>
                  <h2 className="mt-3 text-[22px] font-black leading-tight text-slate-900">
                    {mode === "plan"
                      ? `${totalItems}品を、${totalShops}店舗に整理`
                      : remainingCount > 0
                        ? `残り${remainingCount}品。次の店へ進めます`
                        : "買い物リストを完了しました"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {mode === "plan"
                      ? "店ごとにまとまっているので、マップで強調表示して回る順番を決められます。"
                      : remainingCount > 0
                        ? "未購入のものを上に寄せています。現地では大きなタップ領域で素早く消し込みできます。"
                        : "完了済みの内容も見返せます。必要ならチェックをリセットして、次の買い物に使えます。"}
                  </p>
                </div>

                <div className="shrink-0 rounded-[24px] bg-white/85 px-4 py-3 text-right shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Progress</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{progress}%</p>
                  <p className="text-xs font-semibold text-slate-500">{checkedCount}/{totalItems || 0} 完了</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <SummaryChip icon={<ShoppingBag size={16} />} label="アイテム" value={`${totalItems}品`} />
                <SummaryChip icon={<Store size={16} />} label="寄るお店" value={`${totalShops}店`} />
                <SummaryChip icon={<Receipt size={16} />} label={totalPrice > 0 ? "合計目安" : "メモ"} value={totalPrice > 0 ? formatPrice(totalPrice) : `${memoCount}件`} />
              </div>
            </div>
          </section>

          <div className="mt-4 rounded-2xl border border-stone-200/80 bg-white/80 p-1 shadow-sm">
            <div className="grid grid-cols-2 gap-1">
              <ModeTab active={mode === "plan"} icon={<ListTodo size={16} />} label="計画する" description="編集・整理" onClick={() => setMode("plan")} />
              <ModeTab active={mode === "shop"} icon={<ShoppingCart size={16} />} label="買い物中" description="チェック" onClick={() => setMode("shop")} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-5 px-4 py-5">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <RoutePreviewCard mode={mode} nextStops={nextStops} totalShops={totalShops} remainingCount={remainingCount} mapLabel={mapLabel} onOpenMap={handleOpenMap} />
            {mode === "plan" && <QuickAddCard isOpen={isComposerOpen} draft={quickDraft} onOpen={() => setIsComposerOpen(true)} onChange={setQuickDraft} onCancel={() => { setQuickDraft({ name: "", qty: "", note: "" }); setIsComposerOpen(false); }} onSave={handleSaveQuickDraft} />}
            {mode === "shop" && checkedCount > 0 && <ShoppingModeBanner checkedCount={checkedCount} showCompletedGroups={showCompletedGroups} onToggle={() => setShowCompletedGroups((prev) => !prev)} />}

            <AnimatePresence mode="popLayout">
              {activeGroups.map((group) => (
                <BagGroupSection
                  key={group.key}
                  group={group}
                  mode={mode}
                  showCompletedItems={mode !== "shop" || showCompletedGroups}
                  checkedIds={checkedIds}
                  onToggleCheck={toggleCheck}
                  onEditItem={setEditingItem}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </AnimatePresence>

            {mode === "shop" && showCompletedGroups && completedGroups.length > 0 && (
              <section className="rounded-[26px] border border-stone-200 bg-white/85 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900">買い終わったお店</h3>
                </div>
                <div className="space-y-3">
                  {completedGroups.map((group) => (
                    <BagGroupSection
                      key={`done-${group.key}`}
                      group={group}
                      mode={mode}
                      showCompletedItems
                      checkedIds={checkedIds}
                      onToggleCheck={toggleCheck}
                      onEditItem={setEditingItem}
                      onRemoveItem={handleRemoveItem}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="flex justify-center pb-10 pt-2">
              <button type="button" onClick={() => setPendingReset(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-stone-500 transition hover:text-red-600 active:scale-[0.98]">
                <RotateCcw size={16} />
                バッグを空にする
              </button>
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed left-0 right-0 z-30 px-4" style={{ bottom: "calc(3.25rem + var(--safe-bottom, 0px))" }}>
          <div className="mx-auto max-w-xl">
            <button type="button" onClick={handleOpenMap} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[24px] bg-slate-950 px-5 py-4 text-left text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] transition hover:bg-black active:scale-[0.99]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Map Assist</p>
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

      <BagGuideModal isOpen={showGuide} onClose={handleCloseGuide} />
      <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={(draft) => { if (!editingItem) return; updateItem(editingItem.id, { name: draft.name.trim(), qty: draft.qty.trim() || undefined, note: draft.note.trim() || undefined }); setEditingItem(null); }} />
      <ConfirmModal isOpen={pendingReset} title="バッグを空にする" message="買い物リストをすべて削除します。チェック状態もリセットされます。" onConfirm={() => { clearBag(); resetChecks(); setPendingReset(false); setShowCompletedGroups(false); }} onCancel={() => setPendingReset(false)} confirmLabel="空にする" isDanger />

      <AnimatePresence>
        {recentlyDeleted && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="fixed inset-x-0 z-40 px-4" style={{ bottom: "calc(7.5rem + var(--safe-bottom, 0px))" }}>
            <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-slate-950/96 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-sm font-bold">「{recentlyDeleted.name}」をリストから外しました</p>
                <p className="text-[12px] text-white/65">元に戻すなら数秒以内に取り消せます</p>
              </div>
              <button type="button" onClick={handleUndoDelete} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-white/90 active:scale-[0.98]">
                <Undo2 size={16} />
                元に戻す
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavigationBar />
    </main>
  );
}
