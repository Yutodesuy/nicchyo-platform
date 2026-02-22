"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { User, PermissionCheck } from "./types";
import { createClient } from "@/utils/supabase/client";
import { canAccessVendorShop, mapSupabaseUser } from "./authorization";

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loginWithCredentials: (
    identifier: string,
    password: string,
    captchaToken?: string
  ) => Promise<boolean>;
  updateProfile: (updates: Pick<User, "name" | "email" | "avatarUrl">) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  permissions: PermissionCheck;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!supabaseRef.current) {
        try {
          supabaseRef.current = createClient();
        } catch {
          setIsLoading(false);
          return;
        }
      }

      const supabase = supabaseRef.current;
      if (!supabase) return;

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
        subscription.subscription.unsubscribe();
      };
    };

    const cleanupPromise = init();
    return () => {
      active = false;
      if (cleanupPromise && typeof cleanupPromise.then === "function") {
        cleanupPromise.then((cleanup) => cleanup?.());
      }
    };
  }, []);

  const permissions: PermissionCheck = {
    isSuperAdmin: user?.role === "super_admin",
    isModerator: user?.role === "moderator",
    isVendor: user?.role === "vendor",
    isGeneralUser: user?.role === "general_user",

    canEditShop: (shopId: number) => {
      if (user?.role === "super_admin") return true;
      if (canAccessVendorShop(user, shopId)) return true;
      return false;
    },

    canManageAllShops: user?.role === "super_admin",
    canModerateContent: user?.role === "super_admin" || user?.role === "moderator",
  };

  const loginWithCredentials = async (
    identifier: string,
    password: string,
    captchaToken?: string
  ) => {
    const email = identifier.trim();
    const supabase = supabaseRef.current ?? createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
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
    const supabase = supabaseRef.current ?? createClient();
    const { data, error } = await supabase.auth.updateUser(payload);
    if (error || !data.user) return;
    setUser(mapSupabaseUser(data.user));
  };

  const logout = async () => {
    const supabase = supabaseRef.current ?? createClient();
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
