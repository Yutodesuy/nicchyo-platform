"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Lock,
  LogOut,
  AlertTriangle,
} from "lucide-react";

function SectionHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <Icon size={14} />
      </div>
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
    </div>
  );
}

export default function VendorAccountPage() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isPasswordSaved, setIsPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSavingProfile || !user) return;
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), avatarUrl: user.avatarUrl });
      setIsProfileSaved(true);
      setTimeout(() => setIsProfileSaved(false), 3000);
    } catch {
      setProfileError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSavingPassword) return;
    if (newPassword.length < 8) {
      setPasswordError("パスワードは8文字以上で設定してください。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("パスワードが一致しません。");
      return;
    }
    setIsSavingPassword(true);
    setPasswordError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordSaved(true);
      setTimeout(() => setIsPasswordSaved(false), 3000);
    } catch {
      setPasswordError("パスワードの変更に失敗しました。もう一度お試しください。");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/my-shop"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">Account</p>
            <h1 className="text-xl font-bold text-slate-900">アカウント設定</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {/* プロフィール */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={User} title="表示名" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：山田 太郎"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Mail} title="メールアドレス" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例：example@email.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
            />
            <p className="mt-1.5 text-[10px] text-slate-400">
              メールアドレスを変更すると確認メールが送信されます
            </p>
          </div>

          {profileError && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              {profileError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSavingProfile}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow transition ${
              isSavingProfile
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : isProfileSaved
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white hover:bg-amber-400"
            }`}
          >
            {isSavingProfile ? (
              <><Loader2 size={18} className="animate-spin" />保存中...</>
            ) : isProfileSaved ? (
              <><CheckCircle2 size={18} />保存しました！</>
            ) : (
              <><Save size={18} />プロフィールを保存</>
            )}
          </button>
        </form>

        {/* パスワード変更 */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Lock} title="パスワード変更" />
            <div className="space-y-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード（8文字以上）"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワード（確認）"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>

          {passwordError && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              {passwordError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSavingPassword || (!newPassword && !confirmPassword)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow transition ${
              isSavingPassword
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : !newPassword && !confirmPassword
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : isPasswordSaved
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white hover:bg-amber-400"
            }`}
          >
            {isSavingPassword ? (
              <><Loader2 size={18} className="animate-spin" />変更中...</>
            ) : isPasswordSaved ? (
              <><CheckCircle2 size={18} />変更しました！</>
            ) : (
              <><Lock size={18} />パスワードを変更する</>
            )}
          </button>
        </form>

        {/* ログアウト */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader icon={LogOut} title="ログアウト" />
          <p className="mb-3 text-xs text-slate-500">
            ログアウトすると出店者メニューにアクセスできなくなります
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingOut ? (
              <><Loader2 size={16} className="animate-spin" />ログアウト中...</>
            ) : (
              <><LogOut size={16} />ログアウト</>
            )}
          </button>
        </div>

      </div>
      <NavigationBar />
    </div>
  );
}
