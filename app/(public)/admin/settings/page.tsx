"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/admin";

export default function AdminSettingsPage() {
  const { permissions, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, permissions.isSuperAdmin, router]);

  if (isLoading || !permissions.isSuperAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <AdminPageHeader eyebrow="System Settings" title="システム設定" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg bg-white p-12 shadow text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">システム設定機能</h2>
          <p className="text-gray-600">システムの各種設定を管理する機能を実装予定です。</p>
        </div>
      </div>
    </AdminLayout>
  );
}
