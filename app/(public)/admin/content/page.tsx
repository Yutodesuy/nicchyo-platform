"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminContentPage() {
  const { permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [permissions.isSuperAdmin, router]);

  if (!permissions.isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">コンテンツ管理</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg bg-white p-12 shadow text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">コンテンツ管理機能</h2>
          <p className="text-gray-600">レシピ、お知らせ、その他コンテンツを管理する機能を実装予定です。</p>
        </div>
      </div>
    </div>
  );
}
