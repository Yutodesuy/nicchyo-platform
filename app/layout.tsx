// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AppHeader from "./components/AppHeader";

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
        <AuthProvider>
          <AppHeader />
          <div className="pt-14">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
