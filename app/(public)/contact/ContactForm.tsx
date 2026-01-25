"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, CheckCircle2, AlertCircle, HelpCircle, Bug, MessageSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("メールアドレスの形式に誤りがあるようです。半角英数字で、@が含まれているかご確認ください").min(1, "メールアドレスは必須です"),
  category: z.enum(["question", "feedback", "bug", "other"], {
    errorMap: () => ({ message: "お問い合わせの種類をお選びください。適切な担当者が対応いたします" }),
  }),
  message: z.string().min(10, "恐れ入りますが、的確なサポートのため、内容は10文字以上で具体的にご記入いただけますでしょうか").max(1000, "内容は1000文字以内で入力してください"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const CATEGORIES = [
  { id: "question", label: "ご質問", icon: HelpCircle, desc: "使い方やサービスについて" },
  { id: "feedback", label: "ご意見", icon: MessageSquare, desc: "機能のご要望や感想" },
  { id: "bug", label: "不具合", icon: Bug, desc: "エラーや動作不良の報告" },
  { id: "other", label: "その他", icon: Mail, desc: "取材やその他のご連絡" },
] as const;

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      category: "question",
    },
  });

  const selectedCategory = watch("category");
  const messageContent = watch("message", "");
  const messageLength = messageContent?.length || 0;

  const onSubmit = async (data: ContactFormData) => {
    // 実際の実装ではAPIルートなどを呼び出します。
    // ここではデモとして、mailtoリンクを生成してユーザーのメーラーを起動するか、
    // 送信完了状態を表示します。
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // NOTE: バックエンドAPIがない場合、mailtoで代用するパターン
    // const subject = `[nicchyo] お問い合わせ: ${CATEGORIES.find(c => c.id === data.category)?.label}`;
    // const body = `
    // お名前: ${data.name || '未入力'}
    // メールアドレス: ${data.email}
    // カテゴリ: ${CATEGORIES.find(c => c.id === data.category)?.label}
    //
    // 内容:
    // ${data.message}
    // `;
    // window.location.href = `mailto:info@nicchyo.local?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // 今回はUI改善のデモなので、成功状態へ遷移させます
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-green-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur-sm"
      >
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">お問い合わせを受け付けました</h3>
        <p className="max-w-xs text-sm text-gray-600">
          お問い合わせありがとうございます。<br />
          内容を確認し、折り返しご連絡いたします。
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 underline underline-offset-4"
        >
          続けて送る
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Category Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">お問い合わせの種類</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setValue("category", cat.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-200",
                  isSelected
                    ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500"
                    : "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/50"
                )}
              >
                <Icon className={cn("h-5 w-5", isSelected ? "text-amber-600" : "text-gray-400")} />
                <span className="text-xs font-bold">{cat.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 ml-1">
          {CATEGORIES.find(c => c.id === selectedCategory)?.desc}
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold text-gray-700">
            お名前 <span className="text-xs font-normal text-gray-400">(任意)</span>
          </label>
          <input
            {...register("name")}
            id="name"
            type="text"
            placeholder="日曜 市子"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-gray-700">
            メールアドレス <span className="text-xs font-medium text-red-500">*</span>
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="info@nicchyo.com"
            className={cn(
              "w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2",
              errors.email
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
            )}
          />
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="message" className="text-sm font-semibold text-gray-700">
            お問い合わせ内容 <span className="text-xs font-medium text-red-500">*</span>
          </label>
          <textarea
            {...register("message")}
            id="message"
            rows={5}
            placeholder="できるだけ詳しくご記入いただけると助かります。"
            className={cn(
              "w-full resize-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2",
              errors.message
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
            )}
          />
          <div className="flex justify-end px-1">
             <span className={cn("text-xs transition-colors", messageLength < 10 ? "text-gray-400" : "text-amber-600 font-medium")}>
               現在 {messageLength} 文字 / 1000
             </span>
          </div>
          {errors.message && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.message.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all hover:shadow-lg hover:shadow-orange-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        )}
        {isSubmitting ? "送っています..." : "メッセージを送る"}
      </button>

      <p className="text-center text-xs text-gray-500">
        お問い合わせ内容は<span className="font-medium text-gray-700">プライバシーポリシー</span>に基づき管理されます。
      </p>
    </form>
  );
}
