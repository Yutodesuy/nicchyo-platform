import Link from "next/link";
import { ArrowLeft, Megaphone, Store, BarChart2, Sparkles, User, ChevronRight } from "lucide-react";
import NavigationBar from "@/app/components/NavigationBar";

const GUIDE_SECTIONS = [
  {
    icon: Megaphone,
    color: "bg-amber-100 text-amber-600",
    title: "最新情報の投稿",
    href: "/vendor/post/new",
    description: "今日のおすすめ商品・残り数量・出店場所の変更など、お客さんに伝えたい情報をリアルタイムで発信できます。",
    tips: [
      "投稿には期限を設定できます（1時間・本日・カスタム日時）",
      "期限が切れた投稿は自動で非表示になります",
      "過去の投稿は「投稿履歴」からそのまま再投稿できます",
      "画像を添付すると目を引きやすくなります",
    ],
  },
  {
    icon: Store,
    color: "bg-emerald-100 text-emerald-600",
    title: "店舗情報の更新",
    href: "/vendor/store",
    description: "商品ラインナップ・価格・決済方法・出店予定日・営業時間・SNSリンクを管理します。",
    tips: [
      "商品と価格を登録するとマップ上で表示されます",
      "出店予定日を設定するとお客さんが来店計画を立てやすくなります",
      "決済方法（現金・カード・PayPayなど）は必ず設定しましょう",
      "InstagramやXのリンクを追加すると集客につながります",
    ],
  },
  {
    icon: BarChart2,
    color: "bg-violet-100 text-violet-600",
    title: "お店の分析",
    href: "/vendor/analytics",
    description: "店舗の閲覧数・クリック数を先週と比較できます。時間帯別・商品別の分析も確認できます。",
    tips: [
      "閲覧数が多い時間帯に合わせて投稿するのが効果的です",
      "商品分析では販売数量を自分で入力して管理できます",
      "AIばあちゃんに何回紹介されたかも確認できます",
      "データは毎日更新されます",
    ],
  },
  {
    icon: Sparkles,
    color: "bg-rose-100 text-rose-600",
    title: "AIばあちゃんに教える",
    href: "/vendor/ai-knowledge",
    description: "お店のこだわり・おすすめの食べ方・よくある質問への回答などを自由に書くと、AIばあちゃんがお客さんに紹介してくれます。",
    tips: [
      "詳しく書くほどAIの紹介精度が上がります",
      "「午前中が一番おいしい」「試食できます」など具体的な情報が効果的です",
      "内容はいつでも更新できます",
      "保存後にAIが自動で学習します（数分かかる場合があります）",
    ],
  },
  {
    icon: User,
    color: "bg-slate-100 text-slate-600",
    title: "アカウント設定",
    href: "/vendor/account",
    description: "名前・メールアドレス・パスワードの変更ができます。",
    tips: [
      "表示名はお客さんには見えません",
      "Googleログインの場合、パスワード変更はGoogleアカウント側で行います",
    ],
  },
];

export default function VendorHelpPage() {
  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/my-shop"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">使い方ガイド</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        {/* イントロ */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            各機能の使い方をまとめています。タップするとそのページに移動します。
          </p>
        </div>

        {/* 各セクション */}
        {GUIDE_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.href} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* セクションヘッダー（リンク） */}
              <Link
                href={section.href}
                className="flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${section.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{section.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{section.description}</p>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
              </Link>

              {/* Tips */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <ul className="space-y-1.5">
                  {section.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-0.5 flex-shrink-0 text-amber-400">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <NavigationBar />
    </div>
  );
}
