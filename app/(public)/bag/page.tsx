'use client';

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Map as MapIcon,
  CheckCircle2,
  Circle,
  Trash2,
  ShoppingBag,
  Store,
  ChevronRight,
  ClipboardList,
  Edit2
} from "lucide-react";
import NavigationBar from "../../components/NavigationBar";
import { shops } from "../map/data/shops";
import { ingredientCatalog } from "../../../lib/recipes";
import { useBag, type BagItem } from "../../../lib/storage/BagContext";

// --- Types & Helpers ---

type Mode = 'plan' | 'shop';

function useShoppingChecklist() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nicchyo-shopping-checked');
      if (raw) {
        setCheckedIds(new Set(JSON.parse(raw)));
      }
    } catch (e) {
      console.error('Failed to load checked items', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('nicchyo-shopping-checked', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const resetChecks = () => {
    setCheckedIds(new Set());
    localStorage.removeItem('nicchyo-shopping-checked');
  };

  return { checkedIds, toggleCheck, resetChecks, isLoaded };
}

export default function BagPage() {
  const { items, removeItem, clearBag } = useBag();
  const { checkedIds, toggleCheck, resetChecks, isLoaded } = useShoppingChecklist();
  const [mode, setMode] = useState<Mode>('plan');
  const [pendingDeleteItem, setPendingDeleteItem] = useState<BagItem | null>(null);
  const [pendingReset, setPendingReset] = useState(false);

  // Shop Lookup Map
  const shopLookup = useMemo(() => {
    return new Map(shops.map((shop) => [shop.id, shop]));
  }, []);

  // Grouping Logic
  const groupedData = useMemo(() => {
    const groups = new Map<number | 'other', BagItem[]>();

    // Sort items by creation time (newest first)
    const sortedItems = [...items].sort((a, b) => b.createdAt - a.createdAt);

    sortedItems.forEach(item => {
      const key = item.fromShopId ?? 'other';
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });

    // Convert to array and sort groups
    // Shops sorted by ID (Walking Order proxy), 'other' at the end
    const result = Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return (a[0] as number) - (b[0] as number);
    });

    return result;
  }, [items]);

  const totalShops = groupedData.filter(([key]) => key !== 'other').length;
  const totalItems = items.length;
  const checkedCount = items.filter(i => checkedIds.has(i.id)).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  // Toggle Mode Handler
  const toggleMode = () => {
    setMode(prev => prev === 'plan' ? 'shop' : 'plan');
  };

  return (
    <main className="min-h-screen bg-[#faf8f3] text-gray-900 pb-24 md:pb-16">
      {/* --- Header Area --- */}
      <header className="sticky top-0 z-20 bg-[#faf8f3]/95 backdrop-blur-sm border-b border-stone-200 px-4 pt-safe-top transition-all duration-300">
        <div className="mx-auto max-w-lg py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold tracking-wider text-amber-700 uppercase mb-0.5">Shopping List</p>
              <h1 className="text-2xl font-extrabold text-stone-800 tracking-tight">お買い物リスト</h1>
            </div>
            <Link
              href="/map"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm active:scale-95 transition-transform"
              aria-label="マップに戻る"
            >
              <MapIcon size={20} className="text-stone-600" />
            </Link>
          </div>

          {/* Stats & Mode Toggle */}
          <div className="flex items-end justify-between gap-4 mt-4">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Shops</span>
                <span className="text-xl font-black text-stone-800 leading-none">{totalShops}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Items</span>
                <span className="text-xl font-black text-stone-800 leading-none">{totalItems}</span>
              </div>
              {mode === 'shop' && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Done</span>
                  <span className="text-xl font-black text-emerald-600 leading-none">{checkedCount}</span>
                </div>
              )}
            </div>

            <button
              onClick={toggleMode}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all duration-300
                ${mode === 'shop'
                  ? 'bg-emerald-500 text-white shadow-emerald-200'
                  : 'bg-white text-stone-600 border border-stone-200'}
              `}
            >
              {mode === 'shop' ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>買い物中</span>
                </>
              ) : (
                <>
                  <Edit2 size={14} />
                  <span>編集モード</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar (Visible in Shop Mode) */}
          <div className={`mt-4 h-1 w-full bg-stone-200 rounded-full overflow-hidden transition-all duration-500 ${mode === 'shop' ? 'opacity-100 max-h-1' : 'opacity-0 max-h-0 mt-0'}`}>
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout">
            {groupedData.map(([shopId, groupItems]) => {
              const shop = typeof shopId === 'number' ? shopLookup.get(shopId) : null;
              const isOther = shopId === 'other';
              const shopImage = shop?.images?.thumbnail ?? shop?.images?.main;

              return (
                <motion.section
                  layout
                  key={shopId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
                >
                  {/* Shop Header */}
                  <div className={`
                    px-4 py-3 border-b border-stone-100 flex items-center justify-between
                    ${isOther ? 'bg-stone-50' : 'bg-amber-50/50'}
                  `}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isOther ? (
                        <div className="w-8 h-8 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={16} className="text-stone-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                          {shopImage ? (
                             // eslint-disable-next-line @next/next/no-img-element
                            <img src={shopImage} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Store size={16} className="text-amber-600" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="font-bold text-stone-800 text-sm truncate">
                          {isOther ? "その他 / メモ" : shop?.name || "Unknown Shop"}
                        </h2>
                        {!isOther && (
                          <p className="text-[10px] text-stone-500 font-medium">
                            ブース番号: #{shopId}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isOther && (
                      <Link
                        href={`/map?shop=${shopId}`}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white border border-stone-200 text-[10px] font-bold text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        <MapIcon size={12} />
                        <span className="hidden xs:inline">場所</span>
                      </Link>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-stone-50">
                    {groupItems.map((item) => {
                      const isChecked = checkedIds.has(item.id);

                      return (
                        <motion.div
                          layout
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`
                            group flex items-start gap-3 p-4 transition-colors
                            ${mode === 'shop' && isChecked ? 'bg-stone-50' : 'bg-white'}
                          `}
                        >
                          {/* Left Icon (Check or Dot) */}
                          <div className="pt-0.5 flex-shrink-0">
                            {mode === 'shop' ? (
                              <button
                                onClick={() => toggleCheck(item.id)}
                                className={`
                                  transition-all duration-200 rounded-full p-0.5
                                  ${isChecked ? 'text-emerald-500 scale-110' : 'text-stone-300 hover:text-stone-400'}
                                `}
                              >
                                {isChecked ? <CheckCircle2 size={22} className="fill-emerald-50" /> : <Circle size={22} />}
                              </button>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 mx-2" />
                            )}
                          </div>

                          {/* Content */}
                          <div className={`flex-1 min-w-0 transition-opacity duration-300 ${mode === 'shop' && isChecked ? 'opacity-40' : 'opacity-100'}`}>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className={`font-bold text-sm leading-snug ${isChecked && mode === 'shop' ? 'line-through text-stone-500' : 'text-stone-800'}`}>
                                {item.name}
                              </h3>

                              {/* Delete Button (Plan Mode only) */}
                              {mode === 'plan' && (
                                <button
                                  onClick={() => setPendingDeleteItem(item)}
                                  className="text-stone-400 hover:text-red-500 p-1 -mt-1 -mr-1 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            {(item.qty || item.note) && (
                              <div className="mt-1 space-y-0.5">
                                {item.qty && <p className="text-xs text-stone-600 font-medium bg-stone-100 inline-block px-1.5 py-0.5 rounded">数量: {item.qty}</p>}
                                {item.note && <p className="text-xs text-stone-500">Note: {item.note}</p>}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </AnimatePresence>
        )}

        {/* Reset Action (Plan Mode Only) */}
        {mode === 'plan' && items.length > 0 && (
          <div className="pt-4 pb-8 flex justify-center">
            <button
              onClick={() => setPendingReset(true)}
              className="text-xs font-bold text-stone-400 hover:text-red-500 underline decoration-stone-300 underline-offset-4 transition-colors"
            >
              リストをすべて削除する
            </button>
          </div>
        )}
      </div>

      {/* --- Footer Action --- */}
      {items.length > 0 && (
        <div
          className="fixed left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#faf8f3] via-[#faf8f3]/95 to-transparent"
          style={{ bottom: "calc(3rem + var(--safe-bottom, 0px))" }}
        >
          <Link
            href="/map"
            className="flex items-center justify-center gap-2 w-full max-w-sm mx-auto bg-stone-900 text-white font-bold py-3.5 rounded-full shadow-lg active:scale-95 transition-all hover:bg-black hover:shadow-xl"
          >
            <MapIcon size={18} />
            <span>マップで場所を確認</span>
            <ChevronRight size={16} className="opacity-60" />
          </Link>
        </div>
      )}

      {/* --- Modals --- */}
      <ConfirmModal
        isOpen={!!pendingDeleteItem}
        title="アイテムを削除"
        message={`「${pendingDeleteItem?.name}」をリストから削除しますか？`}
        onConfirm={() => {
          if (pendingDeleteItem) {
            removeItem(pendingDeleteItem.id);
            setPendingDeleteItem(null);
          }
        }}
        onCancel={() => setPendingDeleteItem(null)}
        confirmLabel="削除する"
        isDanger
      />

      <ConfirmModal
        isOpen={pendingReset}
        title="リストのリセット"
        message="すべてのアイテムを削除しますか？この操作は取り消せません。"
        onConfirm={() => {
          clearBag();
          resetChecks();
          setPendingReset(false);
        }}
        onCancel={() => setPendingReset(false)}
        confirmLabel="全て削除"
        isDanger
      />

      <NavigationBar />
    </main>
  );
}

// --- Sub Components ---

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
        <ClipboardList size={40} className="text-stone-300" />
      </div>
      <h3 className="text-lg font-bold text-stone-800 mb-2">買い物リストは空です</h3>
      <p className="text-sm text-stone-500 max-w-xs mx-auto mb-8 leading-relaxed">
        マップでお店を見つけたり、レシピから食材を追加して、あなただけの買い物計画を作りましょう。
      </p>
      <Link
        href="/map"
        className="px-6 py-3 bg-amber-500 text-white font-bold rounded-full shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95"
      >
        マップでお店を探す
      </Link>
    </motion.div>
  );
}

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  isDanger
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  isDanger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden p-6 text-center"
      >
        <h3 className="font-bold text-stone-800 text-lg mb-2">{title}</h3>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`
              flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-colors
              ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-stone-900 hover:bg-black'}
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
