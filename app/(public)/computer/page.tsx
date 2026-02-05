import NavigationBar from "../../components/NavigationBar";
import ComputerQuizClient from "./ComputerQuizClient";

export const metadata = {
  title: "コンピュータ正誤クイズ | nicchyo",
  description: "コンピュータネットワークの正誤クイズに挑戦できます。",
};

export default function ComputerPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-24 text-gray-900">
      <div className="bg-gradient-to-b from-amber-100/50 to-transparent pb-6 pt-safe-top">
        <div className="mx-auto flex max-w-lg flex-col px-4 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              コンピュータ正誤クイズ
            </h1>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm leading-relaxed text-gray-600">
              4問ずつ出題される正誤クイズです。正しい記述だけチェックし、答え合わせで解説も確認できます。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        <ComputerQuizClient />
      </div>

      <NavigationBar />
    </main>
  );
}
