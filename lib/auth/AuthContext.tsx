/**
 * 認証コンテキスト（ダミー実装）
 *
 * 【現在の実装】
 * - ローカルストレージを使った仮のログイン状態管理
 * - 実際の認証処理は行わない
 * - isLoggedIn（boolean）で状態を管理
 *
 * 【将来の実装：Firebase Authentication への移行】
 * このファイルを以下のように置き換えることで、Firebase Auth に移行できます：
 *
 * ```typescript
 * import {
 *   getAuth,
 *   signInWithEmailAndPassword,
 *   signOut,
 *   onAuthStateChanged,
 *   User,
 * } from 'firebase/auth';
 * import { app } from '@/lib/firebase/config';
 *
 * const auth = getAuth(app);
 *
 * // ログイン処理
 * const login = async (email: string, password: string) => {
 *   await signInWithEmailAndPassword(auth, email, password);
 * };
 *
 * // ログアウト処理
 * const logout = async () => {
 *   await signOut(auth);
 * };
 *
 * // 認証状態の監視
 * useEffect(() => {
 *   const unsubscribe = onAuthStateChanged(auth, (user) => {
 *     setUser(user);
 *     setIsLoggedIn(!!user);
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 *
 * 【移行時の変更点】
 * 1. login() の引数を email, password に変更
 * 2. logout() を非同期関数に変更
 * 3. user オブジェクトに Firebase User 型を使用
 * 4. onAuthStateChanged で自動的にログイン状態を監視
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * ユーザー情報（ダミー）
 *
 * 【将来の実装】
 * Firebase User 型に置き換え
 */
export interface DummyUser {
  id: string;
  name: string;
  email: string;
  role?: 'owner' | 'admin' | 'visitor'; // 将来の権限管理用
}

/**
 * 認証コンテキストの型定義
 */
interface AuthContextType {
  /** ログイン状態 */
  isLoggedIn: boolean;

  /** ユーザー情報（ダミー） */
  user: DummyUser | null;

  /** ログイン処理（ダミー） */
  login: (userName?: string) => void;

  /** ログアウト処理（ダミー） */
  logout: () => void;

  /** ローディング状態 */
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'nicchyo-auth-dummy';

/**
 * 認証プロバイダー
 *
 * アプリ全体で認証状態を共有
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<DummyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: ローカルストレージからログイン状態を復元
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setUser(data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ログイン処理（ダミー）
   *
   * 【現在】
   * - ユーザー名を受け取り、ダミーのユーザーオブジェクトを作成
   * - ローカルストレージに保存
   *
   * 【将来：Firebase Auth への移行】
   * ```typescript
   * const login = async (email: string, password: string) => {
   *   setIsLoading(true);
   *   try {
   *     const credential = await signInWithEmailAndPassword(auth, email, password);
   *     // onAuthStateChanged で自動的に user が更新される
   *   } catch (error) {
   *     console.error('Login failed:', error);
   *     throw error;
   *   } finally {
   *     setIsLoading(false);
   *   }
   * };
   * ```
   */
  const login = (userName: string = 'テストユーザー') => {
    const dummyUser: DummyUser = {
      id: 'dummy-' + Date.now(),
      name: userName,
      email: 'dummy@example.com',
      role: 'visitor',
    };

    setUser(dummyUser);
    setIsLoggedIn(true);

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: dummyUser }));
      } catch (error) {
        console.error('Failed to save auth state:', error);
      }
    }
  };

  /**
   * ログアウト処理（ダミー）
   *
   * 【現在】
   * - ローカルストレージから削除
   *
   * 【将来：Firebase Auth への移行】
   * ```typescript
   * const logout = async () => {
   *   setIsLoading(true);
   *   try {
   *     await signOut(auth);
   *     // onAuthStateChanged で自動的に user が null になる
   *   } catch (error) {
   *     console.error('Logout failed:', error);
   *     throw error;
   *   } finally {
   *     setIsLoading(false);
   *   }
   * };
   * ```
   */
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);

    // ローカルストレージから削除
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear auth state:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証フック
 *
 * コンポーネント内で認証状態を取得
 *
 * @example
 * ```typescript
 * const { isLoggedIn, user, login, logout } = useAuth();
 *
 * if (isLoggedIn) {
 *   return <div>こんにちは、{user?.name}さん</div>;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
