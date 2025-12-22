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
import type { User, UserRole, PermissionCheck } from './types';

/**
 * ダミーアカウント定義
 *
 * 【現在の実装】
 * - 開発・テスト用に複数のroleを持つアカウントを用意
 *
 * 【将来の実装】
 * - Firebase Authentication で実際のユーザー認証
 * - Custom Claims で role を管理
 * - Firestore でユーザープロフィールを管理
 */
export const DUMMY_ACCOUNTS: Record<UserRole, User> = {
  super_admin: {
    id: 'dummy-super-admin',
    name: '高知市管理者',
    email: 'admin@kochi-city.jp',
    role: 'super_admin',
  },
  vendor: {
    id: 'dummy-vendor-001',
    name: '山田商店',
    email: 'yamada@nicchyo-vendor.jp',
    role: 'vendor',
    vendorId: 1, // 仮に店舗ID=1に紐付け
  },
  general_user: {
    id: 'dummy-user-001',
    name: '観光客太郎',
    email: 'user@example.com',
    role: 'general_user',
  },
};

/**
 * 認証コンテキストの型定義
 */
interface AuthContextType {
  /** ログイン状態 */
  isLoggedIn: boolean;

  /** ユーザー情報 */
  user: User | null;

  /** ログイン処理（ダミー：roleを指定してログイン） */
  login: (role: UserRole) => void;

  /** ログアウト処理（ダミー） */
  logout: () => void;

  /** ローディング状態 */
  isLoading: boolean;

  /** 権限チェック用ヘルパー */
  permissions: PermissionCheck;
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
  const [user, setUser] = useState<User | null>(null);
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
   * 権限チェック用ヘルパー
   *
   * ログイン中のユーザーの権限を判定する各種メソッドを提供
   */
  const permissions: PermissionCheck = {
    isSuperAdmin: user?.role === 'super_admin',
    isVendor: user?.role === 'vendor',
    isGeneralUser: user?.role === 'general_user',

    canEditShop: (shopId: number) => {
      if (user?.role === 'super_admin') return true;
      if (user?.role === 'vendor' && user.vendorId === shopId) return true;
      return false;
    },

    canManageAllShops: user?.role === 'super_admin',
  };

  /**
   * ログイン処理（ダミー）
   *
   * 【現在】
   * - roleを受け取り、対応するダミーアカウントでログイン
   * - ローカルストレージに保存
   *
   * 【将来：Firebase Auth への移行】
   * ```typescript
   * const login = async (email: string, password: string) => {
   *   setIsLoading(true);
   *   try {
   *     const credential = await signInWithEmailAndPassword(auth, email, password);
   *     // onAuthStateChanged で自動的に user が更新される
   *     // Custom Claims から role を取得
   *     const idTokenResult = await credential.user.getIdTokenResult();
   *     const role = idTokenResult.claims.role as UserRole;
   *     // Firestore からユーザープロフィールを取得
   *     const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
   *     const userData = userDoc.data();
   *     setUser({
   *       id: credential.user.uid,
   *       email: credential.user.email!,
   *       name: userData.name,
   *       role: role,
   *       vendorId: userData.vendorId,
   *     });
   *   } catch (error) {
   *     console.error('Login failed:', error);
   *     throw error;
   *   } finally {
   *     setIsLoading(false);
   *   }
   * };
   * ```
   */
  const login = (role: UserRole) => {
    const selectedUser = DUMMY_ACCOUNTS[role];

    setUser(selectedUser);
    setIsLoggedIn(true);

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: selectedUser }));
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
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, isLoading, permissions }}>
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
