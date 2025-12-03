// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nicchyo | 高知の日曜市を、未来へつなぐ",
  description: "高知の日曜市を舞台に、「観光客 × 地元民 × 市場文化」がつながるデジタルプラットフォーム。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-nicchyo-base text-nicchyo-ink">
        {children}
      </body>
    </html>
  );
}
