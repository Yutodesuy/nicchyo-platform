import Link from "next/link";

export default function ShopsLoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#1F2937]">出店者ログイン</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
          管理画面にアクセスするため、店舗コードとパスワードを入力してください。
        </p>

        <form className="mt-6 space-y-4" aria-label="出店者ログインフォーム">
          <div>
            <label htmlFor="shopCode" className="mb-1 block text-sm font-medium text-[#374151]">
              店舗コード（3桁）
            </label>
            <input
              id="shopCode"
              name="shopCode"
              inputMode="numeric"
              maxLength={3}
              placeholder="例: 001"
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#BAE6FD]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#374151]">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="パスワードを入力"
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#BAE6FD]"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0284C7]"
          >
            ログイン
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[#6B7280]">
          テスト導線: <Link href="/shops001" className="text-[#0284C7] underline">/shops001</Link>
        </div>
      </section>
    </main>
  );
}
