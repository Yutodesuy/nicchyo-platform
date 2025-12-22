/**
 * アプリケーションヘッダー
 *
 * ハンバーガーメニューを含むヘッダーコンポーネント
 *
 * 【動的テーマ対応】
 * - ログイン中のユーザーの role に応じて背景色が自動変更される
 * - super_admin: 赤系（公的管理者、落ち着いたトーン）
 * - vendor: 青系（信頼感と親しみやすさ）
 * - general_user: アンバー系（デフォルト）
 * - 未ログイン: アンバー系（デフォルト）
 */

'use client';

import HamburgerMenu from './HamburgerMenu';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRoleTheme } from '@/lib/theme/useRoleTheme';

export default function AppHeader() {
  const { isLoggedIn, user } = useAuth();
  const theme = useRoleTheme();

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 px-4 py-3 shadow-md transition-colors duration-300 ${theme.headerBg} ${theme.headerText}`}>
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
