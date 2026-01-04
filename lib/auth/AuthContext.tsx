"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { User, UserRole, PermissionCheck } from "./types";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loginWithCredentials: (identifier: string, password: string) => Promise<boolean>;
  updateProfile: (updates: Pick<User, "name" | "email" | "avatarUrl">) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  permissions: PermissionCheck;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(value?: string | null): UserRole {
  if (value === "super_admin") return "super_admin";
  if (value === "moderator") return "moderator";
  if (value === "vendor") return "vendor";
  return "general_user";
}

function getVendorId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapSupabaseUser(user: SupabaseUser): User {
  const appMeta = user.app_metadata as { role?: string } | undefined;
  const userMeta = user.user_metadata as {
    role?: string;
    vendorId?: unknown;
    name?: string;
    full_name?: string;
    avatarUrl?: string;
    avatar_url?: string;
  } | undefined;

  const role = normalizeRole(appMeta?.role ?? userMeta?.role);
  const vendorId = getVendorId(userMeta?.vendorId);
  const name = userMeta?.name ?? userMeta?.full_name ?? (user.email ? user.email.split("@")[0] : "user");
  const avatarUrl = userMeta?.avatarUrl ?? userMeta?.avatar_url;

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    avatarUrl,
    role,
    vendorId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        setUser(mapSupabaseUser(data.session.user));
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    hydrate();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const permissions: PermissionCheck = {
    isSuperAdmin: user?.role === "super_admin",
    isModerator: user?.role === "moderator",
    isVendor: user?.role === "vendor",
    isGeneralUser: user?.role === "general_user",

    canEditShop: (shopId: number) => {
      if (user?.role === "super_admin") return true;
      if (user?.role === "vendor" && user.vendorId === shopId) return true;
      return false;
    },

    canManageAllShops: user?.role === "super_admin",
    canModerateContent: user?.role === "super_admin" || user?.role === "moderator",
  };

  const loginWithCredentials = async (identifier: string, password: string) => {
    const email = identifier.trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;
    setUser(mapSupabaseUser(data.user));
    setIsLoggedIn(true);
    return true;
  };

  const updateProfile = async (updates: Pick<User, "name" | "email" | "avatarUrl">) => {
    if (!user) return;
    const payload: { data?: Record<string, string>; email?: string } = {
      data: {
        name: updates.name,
        avatarUrl: updates.avatarUrl ?? "",
      },
    };
    if (updates.email && updates.email !== user.email) {
      payload.email = updates.email;
    }
    const { data, error } = await supabase.auth.updateUser(payload);
    if (error || !data.user) return;
    setUser(mapSupabaseUser(data.user));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loginWithCredentials,
        updateProfile,
        logout,
        isLoading,
        permissions,
      }}
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
