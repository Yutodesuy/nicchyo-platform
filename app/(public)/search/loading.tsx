import NavigationBar from "../../components/NavigationBar";

export default function SearchLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white pb-24">
      <main className="flex-1 pb-32 pt-4">
        <section className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6">
          {/* ヘッダー */}
          <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm lg:hidden">
            <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Find Shops</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">お店を探す</h2>
            <p className="mt-1 text-sm text-gray-700">キーワードとカテゴリから検索できます</p>
          </div>

          {/* 検索フォームスケルトン */}
          <div className="rounded-[1.75rem] border border-amber-200 bg-white/95 p-5 shadow-sm">
            {/* テキスト入力スケルトン */}
            <div className="h-12 animate-pulse rounded-2xl bg-amber-100" />
            {/* カテゴリーボタンスケルトン */}
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-full bg-amber-50"
                  style={{ width: `${60 + (i % 3) * 20}px` }}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <NavigationBar />
    </div>
  );
}
