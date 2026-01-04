import Link from "next/link";

export default function OAuthConsentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="rounded-3xl border border-amber-100 bg-white/95 px-6 py-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            OAuth consent
          </p>
          <h1 className="mt-2 text-2xl font-bold">認証の同意</h1>
          <p className="mt-2 text-sm text-gray-600">
            nicchyo が以下の情報へアクセスすることに同意してください。
          </p>
        </header>

        <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-700">取得する情報</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>・メールアドレス</li>
            <li>・プロフィール名</li>
            <li>・プロフィール画像（設定がある場合）</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-700">利用目的</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>・ログイン機能の提供</li>
            <li>・お店の編集やマイページ表示</li>
            <li>・必要な通知の送信</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-700">同意しない場合</h2>
          <p className="mt-3 text-sm text-gray-700">
            同意しない場合はログインできません。サービスはログイン無しでも閲覧できます。
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-6 py-3 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
          >
            同意せず戻る
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
          >
            同意して続行
          </Link>
        </div>
      </div>
    </main>
  );
}
