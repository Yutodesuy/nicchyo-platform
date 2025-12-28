// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { MenuProvider } from "@/lib/ui/MenuContext";
import { BagProvider } from "@/lib/storage/BagContext";
import AppHeader from "./components/AppHeader";
import ViewportHeightUpdater from "./components/ViewportHeightUpdater";

export const metadata: Metadata = {
  title: "nicchyo | 高知の日曜市を、未来へつなぐ",
  description: "高知の日曜市を舞台に、「観光客 × 地元民 × 市場文化」がつながるデジタルプラットフォーム。",
};

/**
 * モバイル viewport 設定
 * - viewport-fit=cover: iOS Safe Area 対応
 * - interactive-widget=resizes-content: キーボード表示時の挙動制御
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // iOS Safe Area 対応
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-nicchyo-base text-nicchyo-ink">
        <ViewportHeightUpdater />
        <AuthProvider>
          <BagProvider>
            <MenuProvider>
              {/* ヘッダ: オーバーレイ（メニュー開閉で表示/非表示） */}
              <AppHeader />

              {/* メインコンテンツ: padding なし（全画面表示） */}
              {children}
            </MenuProvider>
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
