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

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, user, login, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  /**
   * ダミーログイン処理
   *
   * 【現在】
   * - ユーザー名を固定で設定
   *
   * 【将来】
   * - ログインフォームを表示
   * - Firebase Auth でメール/パスワード認証
   */
  const handleLogin = () => {
    login('テスト出店者'); // ダミーのユーザー名
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
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600">ログイン中</p>
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
                    <button
                      onClick={handleLogin}
                      className="flex w-full items-center gap-3 rounded-lg bg-amber-500 px-4 py-3 text-white shadow-md transition hover:bg-amber-600"
                    >
                      <span className="text-xl">🔑</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">ログイン（仮）</p>
                        <p className="text-xs opacity-90">
                          テスト用のログイン機能です
                        </p>
                      </div>
                    </button>
                  </li>

                  <li>
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        ※ 現在はテスト版のため、実際の認証は行いません。
                        <br />
                        将来的には出店者様ご自身で店舗情報を管理できるようになります。
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
