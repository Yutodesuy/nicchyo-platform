// app/public/kotodute/page.tsx
import Link from "next/link";

export default function KotodutePage() {
  return (
    <main className="min-h-screen bg-[var(--base)] text-[var(--ink)]">
      <Header />

      <Hero />

      {/* 1. 全体の導線マップ */}
      <SectionWrapper>
        <FlowMap />
      </SectionWrapper>

      {/* 2. アイコン右上バッジの図解 */}
      <SectionWrapper>
        <IconBadgeDiagram />
      </SectionWrapper>

      {/* 3. 下部ことづてビュー（いいね＋コメント）の図解 */}
      <SectionWrapper>
        <KotoduteBottomSheetDiagram />
      </SectionWrapper>

      {/* 4. 利用シーンの図解 */}
      <SectionWrapper>
        <SceneDiagram />
      </SectionWrapper>

      {/* 5. ルール・安心感 */}
      <SectionWrapper>
        <RulesDiagram />
      </SectionWrapper>

      {/* 6. 未来とのつながり */}
      <SectionWrapper>
        <Research />
      </SectionWrapper>

      <Footer />
    </main>
  );
}

/* -------------------------------- */
/* Header                           */
/* -------------------------------- */
function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--soft-green)]/40 bg-[var(--base)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-[var(--primary)]">
            nicchyo
          </span>
          <span className="text-[10px] text-[var(--ink)]/60">
            日曜市DXプロジェクト
          </span>
        </Link>

        <nav className="flex gap-4 text-[11px] text-[var(--ink)]/70">
          <Link href="/public/map" className="hover:text-[var(--primary)]">
            マップ
          </Link>
          <Link href="/public/recipes" className="hover:text-[var(--primary)]">
            郷土料理
          </Link>
          <span className="text-[var(--primary)] font-semibold">ことづて</span>
          <Link href="/public/events" className="hover:text-[var(--primary)]">
            イベント
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* -------------------------------- */
/* Hero                             */
/* -------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 朝日と若芽のぼかし */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--accent)]/40 blur-3xl" />
        <div className="absolute top-20 -left-10 h-36 w-36 rounded-full bg-[var(--soft-green)]/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[var(--primary)]/30 blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-[11px] tracking-wide text-[var(--primary)] font-semibold">
          ことづて機能の導線ガイド
        </p>

        <h1 className="mt-3 text-2xl md:text-3xl font-bold leading-snug">
          「マップ上のアイコン」から、
          <br />
          <span className="text-[var(--primary)]">ことづて</span>へたどり着くまで。
        </h1>

        <p className="mt-3 text-[13px] md:text-[14px] leading-relaxed text-[var(--ink)]/80">
          ことづては、お店のアイコンの右上に出る{" "}
          <span className="font-semibold">赤い丸バッジ</span>
          と、
          画面下にひらく
          <span className="font-semibold">ことづてビュー</span>
          で使います。
          このページでは、その流れを図で説明しています。
        </p>

        <div className="mt-6 flex flex-col items-center gap-2 text-[11px] text-[var(--ink)]/60">
          <span>① 導線と図解をざっと見る</span>
          <span>② 実際にマップへ移動して触ってみる</span>
        </div>

        <Link
          href="/public/map"
          className="mt-5 inline-flex items-center rounded-full bg-[var(--primary)] px-6 py-2 text-[13px] font-medium text-white shadow-sm active:scale-[0.97]"
        >
          日曜市マップを開く
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------- */
/* Section Wrapper (SP→PC両対応)   */
/* -------------------------------- */
function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-9 border-b border-[var(--soft-green)]/30">
      {children}
    </section>
  );
}

/* -------------------------------- */
/* 1. Flow Map                      */
/* -------------------------------- */
function FlowMap() {
  const steps = [
    {
      label: "1",
      title: "ことづて説明ページ（ここ）",
      text: "使い方とイメージを図で把握。",
    },
    {
      label: "2",
      title: "日曜市マップ",
      text: "お店アイコンの右上に「ことづて件数」を表示。",
      cta: "マップをひらく",
      href: "/public/map",
    },
    {
      label: "3",
      title: "お店アイコンをタップ",
      text: "画面下から「屋台詳細＋ことづてビュー」がひらく。",
    },
    {
      label: "4",
      title: "ことづてを見る・いいね・書く",
      text: "ことづて一覧を読み、自分も一行メッセージを書ける。",
    },
  ];

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold">
        ことづてまでの導線マップ
      </h2>
      <p className="mt-2 text-[12px] md:text-[13px] text-[var(--ink)]/70">
        ことづては、
        <span className="font-semibold">
          「説明ページ → マップ → お店アイコン → 下部ことづてビュー」
        </span>
        という流れで使います。
      </p>

      <div className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <div key={s.label}>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-white shadow-sm">
                {s.label}
              </div>
              <div className="flex-1 rounded-xl border border-[var(--soft-green)]/60 bg-white/70 px-3 py-2.5 shadow-sm">
                <p className="text-[12px] font-semibold">{s.title}</p>
                <p className="mt-1 text-[11px] text-[var(--ink)]/70">
                  {s.text}
                </p>
                {s.href && (
                  <div className="mt-2">
                    <Link
                      href={s.href}
                      className="inline-flex items-center rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] text-white shadow-sm"
                    >
                      {s.cta}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 矢印（最後の要素以外） */}
            {i < steps.length - 1 && (
              <div className="my-1 flex justify-center">
                <div className="h-5 w-px bg-[var(--primary)]/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- */
/* 2. Icon + Badge Diagram          */
/* -------------------------------- */
function IconBadgeDiagram() {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold">
        マップ上のお店アイコンと「赤い丸バッジ」
      </h2>
      <p className="mt-2 text-[12px] md:text-[13px] text-[var(--ink)]/70">
        お店に紐づいたことづての件数は、
        <span className="font-semibold">アイコン右上の赤い丸バッジ</span>
        で表示されます。
        件数が 0 の場合は、バッジは表示されません。
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-[1.1fr,1.2fr] items-center">
        {/* 図部分 */}
        <div className="flex justify-center">
          <div className="relative h-40 w-56 rounded-2xl border border-[var(--soft-green)]/60 bg-white/80 shadow-sm">
            {/* 簡易マップ背景 */}
            <div className="absolute inset-2 rounded-xl bg-[var(--soft-green)]/15" />

            {/* 店アイコン + バッジ */}
            <div className="absolute left-10 top-8">
              <ShopIconWithBadge count={3} />
            </div>

            {/* 0件の店アイコン（バッジなし） */}
            <div className="absolute right-10 bottom-10 opacity-70">
              <ShopIconWithBadge count={0} />
            </div>

            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-[var(--ink)]/60">
              赤丸＝ことづて件数（0件の店には表示されない）
            </p>
          </div>
        </div>

        {/* 説明文 */}
        <div className="space-y-2 text-[12px] md:text-[13px] text-[var(--ink)]/75">
          <p>
            ・アイコン右上の
            <span className="font-semibold text-[#ff6b6b]">赤い丸</span>
            に、ことづての件数が白い数字で表示されます。
          </p>
          <p>・そのお店にことづてが1件以上ある場合のみ、バッジが付きます。</p>
          <p>
            ・バッジを目印に、「今日はことづてがよくついているお店」を歩きながら探せます。
          </p>
          <p>・アイコン自体をタップすると、画面下にことづてビューが開きます。</p>
        </div>
      </div>
    </div>
  );
}

function ShopIconWithBadge({ count }: { count: number }) {
  const showBadge = count > 0;

  return (
    <div className="relative">
      {/* 店アイコン本体 */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-md">
        <span className="text-[11px]">店</span>
      </div>
      {/* バッジ */}
      {showBadge && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b6b] text-[10px] font-semibold text-white shadow">
          {count}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- */
/* 3. Bottom Kotodute View Diagram  */
/* -------------------------------- */
function KotoduteBottomSheetDiagram() {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold">
        お店アイコンをタップしたあとの「下部ことづてビュー」
      </h2>
      <p className="mt-2 text-[12px] md:text-[13px] text-[var(--ink)]/70">
        お店アイコンをタップすると、画面の下側に、
        <span className="font-semibold">屋台の詳細＋ことづて一覧</span>
        が表示されます。
        ここで、ことづてを読む・いいねする・自分も書くことができます。
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr,1.2fr] items-center">
        {/* スマホ画面風ワイヤー */}
        <div className="flex justify-center">
          <div className="relative h-80 w-40 rounded-3xl border-2 border-[var(--ink)]/15 bg-white/90 p-2 shadow-md">
            {/* 上はマップ */}
            <div className="h-32 rounded-2xl bg-[var(--soft-green)]/25" />
            <p className="mt-1 text-[9px] text-[var(--ink)]/50 text-center">
              上部：日曜市マップ（お店アイコンをタップ）
            </p>

            {/* 下から出てくるシート */}
            <div className="absolute left-1 right-1 bottom-2 rounded-2xl border border-[var(--soft-green)]/60 bg-white/95 px-2 py-2 shadow-lg">
              {/* ドラッグハンドル */}
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[var(--ink)]/15" />

              {/* 屋台情報 */}
              <div className="rounded-md bg-[var(--soft-green)]/20 p-2">
                <div className="h-6 rounded bg-[var(--ink)]/5" />
                <p className="mt-1 text-[9px] text-[var(--ink)]/60">
                  屋台名・場所・一言紹介
                </p>
              </div>

              {/* タブ風 */}
              <div className="mt-2 flex rounded-full bg-[var(--ink)]/5 p-1 text-[9px]">
                <div className="flex-1 rounded-full bg-white text-center text-[var(--ink)]/60">
                  情報
                </div>
                <div className="ml-1 flex-1 rounded-full bg-[var(--primary)] text-center text-white">
                  ことづて
                </div>
              </div>

              {/* ことづてリスト + いいね */}
              <div className="mt-2 space-y-1.5">
                {[
                  "今日は新ショウガあります！ 雨の日限定のおまけもあるきね。",
                  "○○のおばあちゃんのいも天、あつあつで最高。また来たい。",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-1 rounded-md bg-[var(--soft-green)]/18 px-2 py-1.5"
                  >
                    <p className="flex-1 text-[9px] text-[var(--ink)]/80">
                      {text}
                    </p>
                    <button
                      type="button"
                      className="ml-1 mt-[2px] flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]/80 text-[8px] text-white"
                    >
                      ♥
                    </button>
                  </div>
                ))}
              </div>

              {/* 自分のコメント入力（イメージ） */}
              <div className="mt-2 flex items-center gap-1 rounded-full bg-[var(--ink)]/4 px-2 py-1.5">
                <span className="flex-1 text-[9px] text-[var(--ink)]/40">
                  一行メッセージを書く…
                </span>
                <button
                  type="button"
                  className="rounded-full bg-[var(--primary)] px-2 py-[3px] text-[8px] text-white"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 説明テキスト */}
        <div className="space-y-2 text-[12px] md:text-[13px] text-[var(--ink)]/75">
          <p>
            ・お店アイコンをタップすると、画面下から
            <span className="font-semibold">「下部シート」</span>
            がふわっと現れます。
          </p>
          <p>
            ・上半分には屋台の情報、下半分には
            <span className="font-semibold">ことづて一覧</span>
            が並びます。
          </p>
          <p>
            ・各ことづてには、小さな
            <span className="font-semibold">「♥ いいね」ボタン</span>
            が付き、共感したものに反応できます。
          </p>
          <p>
            ・下の入力欄から、自分も一行メッセージを送れます（投稿はマップ画面のみ）。
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* 4. Scene Diagram                 */
/* -------------------------------- */
function SceneDiagram() {
  const scenes = [
    {
      title: "出店者さんのひとこと",
      label: "屋台の開店前・途中で",
      text: "「今日は新ショウガあります！雨の日限定のおまけもあるきね。」",
      effect: "近くの人が「今のうちに行こう」と気づきやすくなる。",
    },
    {
      title: "観光客のひとこと",
      label: "食べ終わったあと・帰り道で",
      text: "「○○のおばあちゃんのいも天、あつあつで最高。また来たい。」",
      effect: "旅の記憶が残り、次の人の屋台選びのヒントにもなる。",
    },
    {
      title: "地元客のひとこと",
      label: "いつもの買い物のついでに",
      text: "「○丁目の○○さんは9時ごろが焼き立て。早起きの人はぜひ。」",
      effect: "常連さんの“通のコツ”を、ちょっとだけみんなに分け合える。",
    },
  ];

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold">
        どんな場面で、ことづてを開く？
      </h2>
      <p className="mt-2 text-[12px] md:text-[13px] text-[var(--ink)]/70">
        「誰が」「いつ」「どんな一言を残すか」を、カードの図でイメージできるようにしています。
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {scenes.map((s) => (
          <div
            key={s.title}
            className="rounded-xl border border-[var(--soft-green)]/60 bg-white/70 p-4 shadow-sm"
          >
            <p className="text-[12px] font-semibold text-[var(--primary)]">
              {s.title}
            </p>
            <p className="mt-1 text-[10px] text-[var(--ink)]/60">{s.label}</p>

            <div className="mt-2 rounded-lg bg-[var(--soft-green)]/20 px-3 py-2 text-[11px] italic">
              「{s.text}」
            </div>

            <div className="mt-2 flex items-start gap-2 text-[11px] text-[var(--ink)]/70">
              <span className="mt-[3px] inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
              <p>{s.effect}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- */
/* 5. Rules Diagram                 */
/* -------------------------------- */
function RulesDiagram() {
  const rules = [
    {
      title: "やさしい言葉で",
      text: "人やお店を傷つける内容は書かず、「うれしかった」「助かった」を中心に。",
    },
    {
      title: "一行メモくらいで",
      text: "ぱっと読める長さ（1〜2行）を目安に。歩きながらでも読みやすく。",
    },
    {
      title: "個人情報は書かない",
      text: "連絡先や住所など、個人が特定される情報は書かないでください。",
    },
  ];

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold">ルールと安心の仕組み</h2>
      <p className="mt-2 text-[12px] md:text-[13px] text-[var(--ink)]/70">
        ことづては「安心して歩ける日曜市」のためのひとことスペースです。
        最低限のルールを、図でコンパクトにまとめています。
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {rules.map((r) => (
          <div
            key={r.title}
            className="flex gap-2 rounded-xl bg-white/70 p-3 shadow-sm border border-[var(--soft-green)]/50"
          >
            <div className="mt-1 h-6 w-6 flex-none rounded-full bg-[var(--accent)]/90 text-[10px] flex items-center justify-center text-white">
              ✓
            </div>
            <div>
              <p className="text-[12px] font-semibold">{r.title}</p>
              <p className="mt-1 text-[11px] text-[var(--ink)]/70">{r.text}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-[var(--ink)]/60">
        運営チームも投稿を見守り、ルールに反するものは整理します。
        「ここは安心して使える場所だ」と感じてもらうことを大切にしています。
      </p>
    </div>
  );
}

/* -------------------------------- */
/* 6. Research                      */
/* -------------------------------- */
function Research() {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold">
        ことづてと、日曜市の未来
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink)]/80">
        ことづては、日曜市の “空気” を未来に残すための小さな実験でもあります。
        赤いバッジに何件のことづてが付き、下部ビューでどんな一言が交わされるのか。
      </p>
      <p className="mt-2 text-[11px] text-[var(--ink)]/60">
        この導線ページからマップへ進み、実際にことづてを使う人の動きも、
        個人が特定されない形で記録し、
        「どんなUIが日曜市の体験を良くするか」を一緒に探っていきます。
      </p>
    </div>
  );
}

/* -------------------------------- */
/* Footer                           */
/* -------------------------------- */
function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto max-w-3xl px-4 text-center text-[11px] text-[var(--ink)]/60">
        <p className="font-medium text-[var(--ink)]">nicchyo 研究プロジェクト</p>
        <p className="mt-1">伝統の意味を未来へつなぐ。</p>
      </div>
    </footer>
  );
}
