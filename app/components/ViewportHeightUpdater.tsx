'use client';

import { useEffect } from 'react';

/**
 * モバイルブラウザのviewport高さを動的に更新
 *
 * アドレスバーの表示/非表示に対応するため、
 * window.innerHeightを監視して --vh CSS変数を更新
 */
export default function ViewportHeightUpdater() {
  useEffect(() => {
    const updateVH = () => {
      // window.innerHeight の 1% を --vh として設定
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 初回実行
    updateVH();

    // リサイズ時に更新
    window.addEventListener('resize', updateVH);

    // iOS Safari: orientationchange にも対応
    window.addEventListener('orientationchange', () => {
      // orientationchange後、少し遅延させて実行（iOS Safari対策）
      setTimeout(updateVH, 100);
    });

    return () => {
      window.removeEventListener('resize', updateVH);
      window.removeEventListener('orientationchange', updateVH);
    };
  }, []);

  return null; // UIを持たないコンポーネント
}
