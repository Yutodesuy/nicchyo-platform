/**
 * ハンバーガーメニューコンポーネント
 *
 * 【機能】
 * - ログイン/ログアウト
 * - 将来の機能へのリンク（マイ店舗管理など）
 * - 高齢の出店者でも分かりやすいUI
 *
 * 【将来の拡張】
 * - マイ店舗管理ページへのリンク
 * - プロフィール編集
 * - 通知設定
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import type { UserRole } from '@/lib/auth/types';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, user, login, logout, permissions } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  /**
   * ダミーログイン処理
   *
   * 【現在】
   * - roleを選択してログイン
   *
   * 【将来】
   * - ログインフォームを表示
   * - Firebase Auth でメール/パスワード認証
   * - Custom Claims から role を取得
   */
  const handleLogin = (role: UserRole) => {
    login(role);
    closeMenu();
  };

  /**
   * ログアウト処理
   */
  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:shadow-lg"
        aria-label="メニュー"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* メニューパネル */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">メニュー</h2>
            <button
              onClick={closeMenu}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              aria-label="閉じる"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ログイン状態表示 */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            {isLoggedIn && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white text-xl font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-600">ログイン中</p>
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
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ログインすると、店舗管理などができます
                </p>
              </div>
            )}
          </div>

          {/* メニュー項目 */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-2">
              {isLoggedIn ? (
                <>
                  {/* ログイン時のメニュー */}

                  {/* スーパー管理者専用メニュー */}
                  {permissions.isSuperAdmin && (
                    <>
                      <li>
                        <div className="rounded-lg bg-red-50 px-3 py-2 mb-2">
                          <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                            <span>🔐</span>
                            管理者メニュー
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
                            <p className="text-xs text-gray-500">全店舗の閲覧・編集</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            準備中
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
                            <p className="text-xs text-gray-500">出店者アカウント管理</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            準備中
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
                            <p className="text-sm font-medium">投稿モデレーション</p>
                            <p className="text-xs text-gray-500">不適切な投稿の管理</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            準備中
                          </span>
                        </Link>
                      </li>

                      <li>
                        <div className="my-3 border-t border-gray-200" />
                      </li>
                    </>
                  )}

                  {/* 出店者メニュー */}
                  {permissions.isVendor && (
                    <li>
                      <Link
                        href="/my-shop"
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                      >
                        <span className="text-xl">🏪</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">マイ店舗管理</p>
                          <p className="text-xs text-gray-500">準備中</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Coming Soon
                        </span>
                      </Link>
                    </li>
                  )}

                  {/* 一般ユーザー用メニュー */}
                  {permissions.isGeneralUser && (
                    <li>
                      <Link
                        href="/bag"
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                      >
                        <span className="text-xl">👜</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">bag（買い物リスト）</p>
                          <p className="text-xs text-gray-500">登録した買い物リストを見る</p>
                        </div>
                      </Link>
                    </li>
                  )}

                  {/* 共通メニュー */}
                  <li>
                    <Link
                      href="/my-profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-amber-50"
                    >
                      <span className="text-xl">👤</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">プロフィール</p>
                        <p className="text-xs text-gray-500">準備中</p>
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
                  {/* 未ログイン時のメニュー */}
                  <li>
                    <div className="rounded-lg bg-gray-50 p-4 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        ログイン（テスト版）
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        開発テスト用のログイン機能です。
                        役割を選択してログインできます。
                      </p>
                    </div>
                  </li>

                  <li>
                    <button
                      onClick={() => handleLogin('super_admin')}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-gray-700 transition hover:bg-red-100"
                    >
                      <span className="text-xl">🔐</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">管理者でログイン</p>
                        <p className="text-xs text-gray-600">
                          高知市・高専（全権限）
                        </p>
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
                        <p className="text-sm font-semibold">出店者でログイン</p>
                        <p className="text-xs text-gray-600">
                          山田商店（店舗ID: 1）
                        </p>
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
                        <p className="text-xs text-gray-600">
                          観光客（閲覧のみ）
                        </p>
                      </div>
                    </button>
                  </li>

                  <li>
                    <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-semibold">💡 将来の実装：</span>
                        <br />
                        Firebase Authentication でメール/パスワード認証を行い、
                        役割（role）はカスタムクレームで管理します。
                      </p>
                    </div>
                  </li>
                </>
              )}

              {/* 共通メニュー */}
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
                  <p className="text-sm font-medium">プロジェクトについて</p>
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
            <p className="text-xs text-gray-500 text-center">
              © 2025 nicchyo - 日曜市デジタルマップ
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
