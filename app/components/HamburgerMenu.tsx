/**
 * ハンバーガーメニュー
 *
 * - ロール別のリンクを出し分け
 * - デモ用に AuthContext の login を呼び出す簡易ログインボタンを用意
 * - MenuContext と連動してヘッダーの表示を制御
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMenu } from '@/lib/ui/MenuContext';

export default function HamburgerMenu() {
  const { isMenuOpen, toggleMenu, closeMenu } = useMenu();
  const { isLoggedIn, user, logout, permissions } = useAuth();

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      {/* ハンバーガーボタン（固定位置・オーバーレイ） */}
      <button
        onClick={toggleMenu}
        className="hamburger-button fixed top-4 right-4 z-[10002] flex h-12 w-12 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:shadow-lg"
        aria-label="メニュー"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {/* 背景オーバーレイ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm" onClick={closeMenu} />
      )}

      {/* スライドメニュー */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-[100dvh] h-[calc(var(--vh,1vh)*100)] w-80 max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          paddingTop: 'calc(4rem + var(--safe-top, 0px))', // ヘッダー高さ + safe-area
          paddingBottom: 'var(--safe-bottom, 0px)',
        }}
      >
        <div className="flex h-full flex-col">
          {/* ヘッダー */}
          <div className="flex items-center border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">メニュー</h2>
          </div>

          {/* プロフィール表示 */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            {isLoggedIn && user ? (
              <Link href="/my-profile" onClick={closeMenu} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-amber-500 text-white text-xl font-bold">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 border border-amber-100">
                      <MenuIcon name="user" className="h-3.5 w-3.5 text-amber-700" />
                      一般ユーザー
                    </span>
                    {permissions.isSuperAdmin && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        管理者
                      </span>
                    )}
                    {permissions.isVendor && (
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        出店者
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-sm text-gray-700">
                ログインすると保存やbag・バッジが利用できます。
              </div>
            )}
          </div>

          {/* メニュー本体 */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-2">
              {isLoggedIn ? (
                <>
                  {permissions.isSuperAdmin && (
                    <>
                      <li>
                        <div className="rounded-lg bg-red-50 px-3 py-2 mb-2">
                          <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                            <MenuIcon name="settings" className="h-4 w-4 text-red-700" />
                            管理メニュー
                          </p>
                        </div>
                      </li>
                      <li>
                        <Link
                          href="/admin/shops"
                          onClick={closeMenu}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-red-50"
                        >
                          <MenuIcon name="shop" className="h-5 w-5 text-red-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">店舗管理</p>
                            <p className="text-xs text-gray-500">出店情報の管理</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            管理
                          </span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/users"
                          onClick={closeMenu}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-red-50"
                        >
                          <MenuIcon name="users" className="h-5 w-5 text-red-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">ユーザー管理</p>
                            <p className="text-xs text-gray-500">権限設定など</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            管理
                          </span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/moderation"
                          onClick={closeMenu}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-red-50"
                        >
                          <MenuIcon name="shield" className="h-5 w-5 text-red-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">モデレーション</p>
                            <p className="text-xs text-gray-500">投稿の確認</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            管理
                          </span>
                        </Link>
                      </li>
                      <li>
                        <div className="my-3 border-t border-gray-200" />
                      </li>
                    </>
                  )}

                  {permissions.isVendor && (
                    <li>
                      <Link
                        href="/my-shop"
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                      >
                        <MenuIcon name="shop" className="h-5 w-5 text-amber-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">マイ店舗</p>
                        </div>
                      </Link>
                    </li>
                  )}

                  {permissions.isGeneralUser && (
                    <>
                      <li>
                        <Link
                          href="/bag"
                          onClick={closeMenu}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                        >
                          <MenuIcon name="bag" className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">bag</p>
                            <p className="text-xs text-gray-500">気になるものを保存</p>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/badges"
                          onClick={closeMenu}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                        >
                          <MenuIcon name="badge" className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">バッジ</p>
                            <p className="text-xs text-gray-500">獲得した来訪バッジを見る</p>
                          </div>
                        </Link>
                      </li>
                    </>
                  )}

                  <li>
                    <div className="my-3 border-t border-gray-200" />
                  </li>

                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <MenuIcon name="logout" className="h-5 w-5 text-red-600" />
                      <p className="text-sm font-medium">ログアウト</p>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-amber-200 bg-amber-50 px-4 py-3 text-gray-700 transition hover:bg-amber-100"
                    >
                      <MenuIcon name="user" className="h-5 w-5 text-amber-700" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">ログイン</p>
                        <p className="text-xs text-gray-600">ログイン画面へ進む</p>
                      </div>
                    </Link>
                  </li>
                </>
              )}

              <li>
                <div className="my-3 border-t border-gray-200" />
              </li>

              <li>
                <Link
                  href="/about"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  <MenuIcon name="info" className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium">このサービスについて</p>
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  <MenuIcon name="help" className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium">よくある質問</p>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  <MenuIcon name="mail" className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium">お問い合わせ</p>
                </Link>
              </li>
            </ul>
          </nav>

          {/* フッター */}
          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-xs text-gray-500 text-center">&copy; 2025 nicchyo</p>
          </div>
        </div>
      </div>
    </>
  );
}

type MenuIconName =
  | 'user'
  | 'settings'
  | 'shop'
  | 'users'
  | 'shield'
  | 'bag'
  | 'badge'
  | 'logout'
  | 'info'
  | 'help'
  | 'mail';

type MenuIconProps = {
  name: MenuIconName;
  className?: string;
};

function MenuIcon({ name, className }: MenuIconProps) {
  const props = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  } as const;

  switch (name) {
    case 'user':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 20.118a7.5 7.5 0 0 1 15 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.5-1.632Z"
          />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.9c.07.424.37.77.78.93l.845.34c.5.2 1.07.04 1.41-.3l.672-.672c.39-.39 1.04-.39 1.43 0l.774.774c.39.39.39 1.02 0 1.41l-.672.672c-.34.34-.5.91-.3 1.41l.34.845c.16.41.51.71.93.78l.9.149c.54.09.94.56.94 1.11v1.094c0 .55-.4 1.02-.94 1.11l-.9.149c-.42.07-.77.37-.93.78l-.34.845c-.2.5-.04 1.07.3 1.41l.672.672c.39.39.39 1.04 0 1.43l-.774.774c-.39.39-1.04.39-1.43 0l-.672-.672c-.34-.34-.91-.5-1.41-.3l-.845.34c-.41.16-.71.51-.78.93l-.149.9c-.09.54-.56.94-1.11.94h-1.094c-.55 0-1.02-.4-1.11-.94l-.149-.9c-.07-.42-.37-.77-.78-.93l-.845-.34c-.5-.2-1.07-.04-1.41.3l-.672.672c-.39.39-1.04.39-1.43 0l-.774-.774c-.39-.39-.39-1.04 0-1.43l.672-.672c.34-.34.5-.91.3-1.41l-.34-.845c-.16-.41-.51-.71-.93-.78l-.9-.149c-.54-.09-.94-.56-.94-1.11v-1.094c0-.55.4-1.02.94-1.11l.9-.149c.42-.07.77-.37.93-.78l.34-.845c.2-.5.04-1.07-.3-1.41l-.672-.672c-.39-.39-.39-1.02 0-1.41l.774-.774c.39-.39 1.04-.39 1.43 0l.672.672c.34.34.91.5 1.41.3l.845-.34c.41-.16.71-.51.78-.93l.149-.9Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      );
    case 'shop':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75 12 4.5l9 5.25" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 10.5V20.25A1.5 1.5 0 0 0 6 21.75h12a1.5 1.5 0 0 0 1.5-1.5V10.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 21.75V15a.75.75 0 0 1 .75-.75h4.5A.75.75 0 0 1 15 15v6.75"
          />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.09 9.09 0 0 0 3.74 1.98 9.06 9.06 0 0 1-3.74.8c-2.93 0-5.62-.7-7.88-1.9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 8.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 19.5a7.5 7.5 0 0 1 15 0"
          />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3.75 5.25 6.75v6a6.75 6.75 0 0 0 13.5 0v-6L12 3.75Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 10.5" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 7.5V6a6 6 0 1 1 12 0v1.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 7.5h15l-1.2 12.6a2.25 2.25 0 0 1-2.24 2.05H7.94a2.25 2.25 0 0 1-2.24-2.05L4.5 7.5Z"
          />
        </svg>
      );
    case 'badge':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3.75 14.09 8.26 19.06 9l-3.58 3.49.85 4.96L12 15.77 7.67 17.45l.85-4.96L4.94 9l4.97-.74L12 3.75Z"
          />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l3 3-3 3" />
        </svg>
      );
    case 'info':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9h.01M11.25 12h1.5v4.5h-1.5z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
    case 'help':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9a2.25 2.25 0 1 1 3.99 1.5c-.67.67-1.49 1.12-1.49 2.25v.25"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25h.01" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
    case 'mail':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 6.75h18v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.25V6.75Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 6.75 9 6 9-6" />
        </svg>
      );
    default:
      return null;
  }
}

