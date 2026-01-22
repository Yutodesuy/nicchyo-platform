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
 * スマートなデフォルト値（時間・季節に応じたプレースホルダー）を実装
 */
export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  // Default fallback (SSR/Hydration safe)
  const defaultPlaceholder = 'お店の名前や商品で検索（例：レタス、野菜）';
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholder || defaultPlaceholder);

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

  // スマートなデフォルトプレースホルダーの設定
  useEffect(() => {
    // Propが指定されている場合はそちらを優先（上書きしない）
    if (placeholder) {
        setCurrentPlaceholder(placeholder);
        return;
    }

    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 1-12

    let timeContext = '';
    let examples = [];

    // 季節の例（高知の日曜市ならではの食材）
    let seasonalItem = '野菜';
    if (month >= 12 || month <= 2) seasonalItem = '柑橘';       // 冬：文旦など
    else if (month >= 3 && month <= 5) seasonalItem = 'トマト';    // 春：フルーツトマト
    else if (month >= 6 && month <= 8) seasonalItem = 'とうもろこし'; // 夏：人気商品
    else if (month >= 9 && month <= 11) seasonalItem = '生姜';     // 秋：新生姜

    // 時間帯によるコンテキスト切り替え
    if (hour >= 5 && hour < 11) {
      // 朝：市場の活気、生鮮食品
      timeContext = '朝市で新鮮な食材を探す';
      examples = [seasonalItem, 'コーヒー'];
    } else if (hour >= 11 && hour < 14) {
      // 昼：ランチ需要
      timeContext = 'ランチや軽食を探す';
      examples = ['弁当', '天ぷら'];
    } else if (hour >= 14 && hour < 17) {
      // 午後：おやつ、お土産、完売前
      timeContext = 'おやつやお土産を探す';
      examples = ['芋天', '餅'];
    } else {
      // 夕方・夜：次回の予習
      timeContext = '次の日曜に向けて予習';
      examples = ['刃物', '木工品'];
    }

    setCurrentPlaceholder(`${timeContext}（例：${examples.join('、')}）`);
  }, [placeholder]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-gray-400">🔍</span>
      </div>
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={currentPlaceholder}
        className="w-full rounded-lg border border-orange-100 py-2 pl-10 pr-10 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
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
