'use client';

interface BlockNumberInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * ブロック番号入力コンポーネント
 * 1-300の範囲で数値入力、モバイル数字キーボード対応
 */
export default function BlockNumberInput({ value, onChange }: BlockNumberInputProps) {
  const blockNum = value.trim() ? parseInt(value, 10) : null;
  const isInvalid = blockNum !== null && (isNaN(blockNum) || blockNum < 1 || blockNum > 300);

  return (
    <div className="mt-3">
      <label htmlFor="block-number" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
        ブロック番号
      </label>
      <input
        id="block-number"
        type="number"
        min="1"
        max="300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="1-300の範囲で入力"
        inputMode="numeric"
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
          isInvalid
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-orange-100 focus:border-amber-500 focus:ring-amber-200'
        }`}
        aria-label="ブロック番号を入力"
        aria-describedby={isInvalid ? 'block-number-error' : 'block-number-help'}
        aria-invalid={isInvalid}
      />
      {isInvalid ? (
        <p id="block-number-error" className="mt-1 text-xs text-red-600" role="alert">
          1-300の範囲で入力してください
        </p>
      ) : (
        <p id="block-number-help" className="mt-1 text-xs text-gray-600">
          ブロック番号で検索すると、他の条件は無視されます
        </p>
      )}
    </div>
  );
}
