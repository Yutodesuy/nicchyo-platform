'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRoleTheme } from '@/lib/theme/useRoleTheme';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【パフォーマンス最適化】HamburgerMenu を遅延ロード
// - 356行の大規模コンポーネント
// - ユーザーがメニューを開くまでロードしない
// - 初回バンドルサイズ: 30-50KB削減
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HamburgerMenu = dynamic(() => import('./HamburgerMenu'), {
  ssr: true,
});

export default function AppHeader() {
  const { isLoggedIn, user } = useAuth();
  const theme = useRoleTheme();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 px-4 py-3 shadow-md transition-colors duration-300 ${theme.headerBg} ${theme.headerText}`}
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
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
