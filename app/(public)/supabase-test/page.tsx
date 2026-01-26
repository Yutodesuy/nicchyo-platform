import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function SupabaseTestPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from("todos").select();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Supabase接続テスト</h1>
      {error && (
        <pre className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
      {!error && (
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-800">取得件数: {data?.length ?? 0}</p>
          <ul className="mt-3 space-y-2">
            {data?.map((item: { id: string; todo?: string; title?: string; is_done?: boolean }) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-amber-700">ID</span>
                  <span className="text-xs text-slate-600">{item.id}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {(item.title ?? item.todo ?? "").trim()}
                </span>
              </li>
            ))}
          </ul>
          {!data?.length && (
            <p className="mt-3 text-sm text-slate-500">データがありません。</p>
          )}
        </div>
      )}
    </main>
  );
}
