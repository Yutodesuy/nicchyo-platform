/**
 * 管理者用レイアウト
 * サイドバー付きの2カラムレイアウト
 */

"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import NavigationBar from "@/app/components/NavigationBar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = React.memo(function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-[9997] inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-slate-50"
        aria-label={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
      >
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      {/* サイドバー */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* メインコンテンツ */}
      <div className={`transition-[padding] duration-300 ${isSidebarOpen ? "lg:pl-64" : "lg:pl-0"}`}>
        <main className="min-h-screen pb-24">{children}</main>
      </div>
      <NavigationBar />
    </div>
  );
});
