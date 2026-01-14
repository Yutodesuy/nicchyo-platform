'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRoleTheme } from '@/lib/theme/useRoleTheme';
import { useMenu } from '@/lib/ui/MenuContext';

/**
 * アプリヘッダー（メニュー連動型）
 *
 * 【表示ロジック】
 * - メニュー閉じている: ヘッダ非表示（transform: translateY(-100%)）
 * - メニュー開いている: ヘッダ表示（transform: translateY(0)）
 *
 * 【レイアウト】
 * - position: fixed（オーバーレイ）
 * - 地図エリアを圧迫しない
 * - safe-area-inset-top 対応
 */
export default function AppHeader() {
  const { isLoggedIn, user } = useAuth();
  const theme = useRoleTheme();
  const { isMenuOpen } = useMenu();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[10001] md:z-[9999] px-4 py-3 shadow-md transition-all duration-300 ${theme.headerBg} ${theme.headerText}`}
      style={{
        transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
        paddingTop: 'calc(0.75rem + var(--safe-top, 0px))', // py-3 + safe-area
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-bold tracking-wide text-lg md:text-xl">
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
            日曜市を歩きながら使ってね
          </div>
        </div>
      </div>
    </header>
  );
}
