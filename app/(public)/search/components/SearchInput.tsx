'use client';

import { useState, useEffect } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * テキスト検索入力コンポーネント
 * 300msデバウンス処理とクリアボタン付き
 */
export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // デバウンス処理: 300ms待ってから親にvalueを渡す
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // 親のvalueが変更された場合にローカル値を同期
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-gray-400">🔍</span>
      </div>
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || 'お店の名前や商品で検索（例：レタス、野菜）'}
        className="w-full rounded-xl border border-orange-100 py-3 pl-10 pr-10 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
        aria-label="お店を検索"
      />
      {localValue && (
        <button
          type="button"
          onClick={() => setLocalValue('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="検索をクリア"
        >
          <span className="text-lg">×</span>
        </button>
      )}
    </div>
  );
}
