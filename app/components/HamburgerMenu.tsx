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
import type { UserRole } from '@/lib/auth/types';

export default function HamburgerMenu() {
  const { isMenuOpen, toggleMenu, closeMenu } = useMenu();
  const { isLoggedIn, user, login, logout, permissions } = useAuth();

  const handleLogin = (role: UserRole) => {
    login(role);
    closeMenu();
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      {/* ハンバーガーボタン（固定位置・オーバーレイ） */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-[10002] flex h-12 w-12 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:shadow-lg"
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
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white text-xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 border border-amber-100">
                      <span aria-hidden>👤</span>一般ユーザー
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
              </div>
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
                            <span aria-hidden>⚙️</span>
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
                          <span className="text-xl">🏪</span>
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
                          <span className="text-xl">👥</span>
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
                          <span className="text-xl">🛡️</span>
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
                        <span className="text-xl">🏪</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">マイ店舗</p>
                          <p className="text-xs text-gray-500">Coming Soon</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Coming Soon
                        </span>
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
                          <span className="text-xl">👜</span>
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
                          <span className="text-xl">🏅</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">バッジ</p>
                            <p className="text-xs text-gray-500">獲得した来訪バッジを見る</p>
                          </div>
                        </Link>
                      </li>
                    </>
                  )}

                  <li>
                    <Link
                      href="/my-profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                    >
                      <span className="text-xl">🙍‍♂️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">プロフィール</p>
                        <p className="text-xs text-gray-500">Coming Soon</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Coming Soon
                      </span>
                    </Link>
                  </li>

                  <li>
                    <div className="my-3 border-t border-gray-200" />
                  </li>

                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <span className="text-xl">🚪</span>
                      <p className="text-sm font-medium">ログアウト</p>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <div className="rounded-lg bg-gray-50 p-4 mb-3 text-sm text-gray-700 leading-relaxed">
                      デモ用ログインです。ロールを選んで機能を試せます。
                    </div>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLogin('super_admin')}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-gray-700 transition hover:bg-red-100"
                    >
                      <span className="text-xl">⚙️</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">管理者としてログイン</p>
                        <p className="text-xs text-gray-600">店舗・ユーザー管理</p>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLogin('vendor')}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 text-gray-700 transition hover:bg-blue-100"
                    >
                      <span className="text-xl">🏪</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">出店者としてログイン</p>
                        <p className="text-xs text-gray-600">デモIDで表示</p>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLogin('general_user')}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 transition hover:bg-gray-100"
                    >
                      <span className="text-xl">👤</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">一般ユーザーでログイン</p>
                        <p className="text-xs text-gray-600">bag・バッジを体験</p>
                      </div>
                    </button>
                  </li>
                  <li>
                    <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                      本番環境では Firebase Auth 等に置き換えてください。
                    </div>
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
                  <span className="text-xl">ℹ️</span>
                  <p className="text-sm font-medium">このサービスについて</p>
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="text-xl">❓</span>
                  <p className="text-sm font-medium">よくある質問</p>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="text-xl">✉️</span>
                  <p className="text-sm font-medium">お問い合わせ</p>
                </Link>
              </li>
            </ul>
          </nav>

          {/* フッター */}
          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-xs text-gray-500 text-center">© 2025 nicchyo</p>
          </div>
        </div>
      </div>
    </>
  );
}
