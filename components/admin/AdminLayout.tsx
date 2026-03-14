/**
 * 管理者用レイアウト
 * 管理画面共通レイアウト
 */

"use client";

import React from "react";
import NavigationBar from "@/app/components/NavigationBar";

interface AdminLayoutProps {
  children: React.ReactNode;
  withBottomPadding?: boolean;
  showNavigationBar?: boolean;
}

export const AdminLayout = React.memo(function AdminLayout({
  children,
  withBottomPadding = true,
  showNavigationBar = true,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className={`min-h-screen ${withBottomPadding ? "pb-24" : ""}`}>{children}</main>
      {showNavigationBar ? <NavigationBar /> : null}
    </div>
  );
});
