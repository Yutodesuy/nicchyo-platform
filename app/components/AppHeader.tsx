/**
 * アプリケーションヘッダー
 *
 * ハンバーガーメニューを含むヘッダーコンポーネント
 */

'use client';

import HamburgerMenu from './HamburgerMenu';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AppHeader() {
  const { isLoggedIn, user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold tracking-wide text-sm md:text-base">
            nicchyo 日曜市マップ
          </div>
          {isLoggedIn && user && (
            <span className="hidden md:inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {user.name}さん
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block text-xs opacity-90">
            高知の朝を、地図でもっと楽しく
          </div>
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
