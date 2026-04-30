import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function getWhitelistEmails(): Promise<string[]> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createServiceClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from("report_readers").select("email");
  return (data ?? []).map((r: { email: string }) => r.email.toLowerCase());
}

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/reports");
  }

  const whitelist = await getWhitelistEmails();
  const userEmail = user.email?.toLowerCase() ?? "";

  if (!whitelist.includes(userEmail)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-nicchyo-base px-6">
        <div className="max-w-sm text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-xl font-bold text-nicchyo-ink">アクセス権限がありません</h1>
          <p className="mt-2 text-sm text-nicchyo-ink/60">
            このページは閲覧権限が付与されたアカウントのみアクセスできます。
          </p>
          <p className="mt-1 text-xs text-nicchyo-ink/40">ログイン中: {user.email}</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
