/**
 * 認証コンテキスト（ダミー実装）
 *
 * - ローカルストレージを使った仮のログイン状態管理
 * - 実際の認証は未実装
 */

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, UserRole, PermissionCheck } from "./types";

/**
 * ダミーアカウント定義
 */
export const DUMMY_ACCOUNTS: Record<UserRole, User> = {
  super_admin: {
    id: "dummy-super-admin",
    name: "高知市管理者",
    email: "admin@kochi-city.jp",
    role: "super_admin",
  },
  vendor: {
    id: "dummy-vendor-001",
    name: "食材のお店1",
    email: "nicchyo-owner-001@example.com",
    role: "vendor",
    vendorId: 1,
  },
  general_user: {
    id: "dummy-user-001",
    name: "観光客ユーザー",
    email: "user@example.com",
    role: "general_user",
  },
};

type DummyCredential = {
  identifier: string;
  password: string;
  user: User;
};

const DUMMY_CREDENTIALS: DummyCredential[] = [
  {
    identifier: "admin@kochi-city.jp",
    password: "admin",
    user: DUMMY_ACCOUNTS.super_admin,
  },
  {
    identifier: "食材のお店1",
    password: "001",
    user: DUMMY_ACCOUNTS.vendor,
  },
  {
    identifier: "nicchyo-owner-001@example.com",
    password: "001",
    user: DUMMY_ACCOUNTS.vendor,
  },
  {
    identifier: "user@example.com",
    password: "guest",
    user: DUMMY_ACCOUNTS.general_user,
  },
];

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (role: UserRole) => void;
  loginWithCredentials: (identifier: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  permissions: PermissionCheck;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "nicchyo-auth-dummy";

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setUser(data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const permissions: PermissionCheck = {
    isSuperAdmin: user?.role === "super_admin",
    isVendor: user?.role === "vendor",
    isGeneralUser: user?.role === "general_user",

    canEditShop: (shopId: number) => {
      if (user?.role === "super_admin") return true;
      if (user?.role === "vendor" && user.vendorId === shopId) return true;
      return false;
    },

    canManageAllShops: user?.role === "super_admin",
  };

  const persistUser = (selectedUser: User) => {
    setUser(selectedUser);
    setIsLoggedIn(true);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: selectedUser }));
      } catch (error) {
        console.error("Failed to save auth state:", error);
      }
    }
  };

  const login = (role: UserRole) => {
    const selectedUser = DUMMY_ACCOUNTS[role];
    persistUser(selectedUser);
  };

  const loginWithCredentials = (identifier: string, password: string) => {
    const normalized = normalizeIdentifier(identifier);
    const match = DUMMY_CREDENTIALS.find(
      (credential) =>
        normalizeIdentifier(credential.identifier) === normalized &&
        credential.password === password
    );
    if (!match) return false;
    persistUser(match.user);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear auth state:", error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, login, loginWithCredentials, logout, isLoading, permissions }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
