type BadgeModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  slot: string;
  tierTitle: string;
  tierIcon: string;
  count: number;
};

export function BadgeModal({ open, onClose, title, slot, tierTitle, tierIcon, count }: BadgeModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border-2 border-amber-400 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-amber-200 bg-white px-2 py-1 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-50"
          aria-label="閉じる"
        >
          閉じる
        </button>
        <div className="text-center space-y-2">
          <div className="text-4xl">{tierIcon}</div>
          <p className="text-lg font-bold text-amber-900">{title}</p>
          <p className="text-sm text-amber-800">{slot} 来訪</p>
          <p className="text-sm text-gray-700">
            {tierTitle} / 通算 {count} 回
          </p>
        </div>
      </div>
    </div>
  );
}
