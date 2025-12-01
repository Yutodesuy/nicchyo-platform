import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nicchyo | 高知の日曜市を、未来へつなぐ",
  description:
    "nicchyo は、高知の日曜市を舞台に「観光客 × 地元民 × 市場文化」がつながる、新しいコミュニティ市場をデザインするデジタルプラットフォームです。",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
