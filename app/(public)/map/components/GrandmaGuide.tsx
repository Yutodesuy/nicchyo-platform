'use client';

import { useEffect, useState } from 'react';

interface GrandmaGuideProps {
  onClose?: () => void;
}

export default function GrandmaGuide({ onClose }: GrandmaGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    // 初回訪問かチェック（localStorage使用）
    const hasVisited = localStorage.getItem('nicchyo-map-visited');

    if (!hasVisited) {
      // 初回訪問時は少し遅延してから展開状態で表示
      const timer = setTimeout(() => {
        setHasAppeared(true);
        setIsExpanded(true);
        localStorage.setItem('nicchyo-map-visited', 'true');
      }, 800);

      return () => clearTimeout(timer);
    } else {
      // 2回目以降は折りたたみ状態で表示
      setHasAppeared(true);
      setIsExpanded(false);
    }
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onClose && isExpanded) {
      onClose();
    }
  };

  if (!hasAppeared) return null;

  // 折りたたみ状態（アイコンのみ）
  if (!isExpanded) {
    return (
      <button
        onClick={handleToggle}
        className="fixed top-4 right-4 z-[2000] group animate-slide-in-right"
        aria-label="ガイドを開く"
      >
        <div className="relative">
          {/* おばあちゃんアイコン */}
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-4xl transition-all group-hover:scale-110 group-active:scale-95">
            👵
          </div>

          {/* 吹き出しヒント（ホバー時） */}
          <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg px-3 py-2 whitespace-nowrap border-2 border-amber-500">
              <p className="text-sm font-medium text-gray-800">
                使い方を見る
              </p>
              {/* 吹き出しの三角 */}
              <div className="absolute bottom-full right-4 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-b-8 border-b-white"></div>
            </div>
          </div>

          {/* パルスアニメーション */}
          <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20"></div>
        </div>
      </button>
    );
  }

  // 展開状態（フルガイド）
  return (
    <div className="fixed top-4 right-4 z-[2000] animate-slide-in-right">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm border-4 border-amber-600 overflow-hidden">
        {/* 閉じるボタン */}
        <button
          onClick={handleToggle}
          className="absolute top-3 right-3 z-10 bg-white hover:bg-gray-100 rounded-full p-1.5 shadow-md transition-all hover:scale-110"
          aria-label="折りたたむ"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* おばあちゃんのイラスト部分（後で手書きイラストに置き換え） */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 pb-4 border-b-4 border-amber-600">
          <div className="flex items-center gap-4">
            {/* プレースホルダー: 後で手書きイラストに置き換え */}
            <div className="flex-shrink-0 w-24 h-24 bg-amber-100 rounded-full border-4 border-amber-600 flex items-center justify-center text-6xl shadow-lg">
              👵
            </div>

            {/* 吹き出し風の説明 */}
            <div className="flex-1">
              <div className="bg-white rounded-xl p-3 shadow-md relative">
                {/* 吹き出しの三角 */}
                <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>

                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                  いらっしゃい！<br />
                  ここは日曜市の<br />
                  デジタルマップやき
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 説明テキスト */}
        <div className="p-5 bg-white">
          <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            使い方
          </h3>

          <ul className="space-y-2.5 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold flex-shrink-0">📍</span>
              <span>
                <strong className="text-gray-900">店舗をタップ</strong>すると<br />
                詳しい情報が見れるで
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold flex-shrink-0">🚶</span>
              <span>
                <strong className="text-gray-900">現在地マーク</strong>で<br />
                今どこにおるかわかるき
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold flex-shrink-0">🔍</span>
              <span>
                <strong className="text-gray-900">拡大・縮小</strong>して<br />
                自由に見て回ってね
              </span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-amber-200">
            <button
              onClick={handleToggle}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              わかった！マップを見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
