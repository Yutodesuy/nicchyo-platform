import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { MenuProvider } from "@/lib/ui/MenuContext";
import { BagProvider } from "@/lib/storage/BagContext";
import AppHeader from "./components/AppHeader";
import MapLoadingProvider from "./components/MapLoadingProvider";
import PageVisitTracker from "./components/PageVisitTracker";
import ViewportHeightUpdater from "./components/ViewportHeightUpdater";
import { Toaster } from "@/components/admin";

export const metadata: Metadata = {
  title: "nicchyo | 高知の日曜市を、未来へつなぐ",
  description:
    "高知の日曜市を舞台に、観光客・地元・市場がつながるデジタルプラットフォーム。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const GOOGLE_ANALYTICS_ID = "G-3EWZTBGT46";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-nicchyo-base text-nicchyo-ink">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
        <ViewportHeightUpdater />
        <AuthProvider>
          <BagProvider>
            <MenuProvider>
              <MapLoadingProvider>
                <AppHeader />
                <Suspense fallback={null}>
                  <PageVisitTracker />
                </Suspense>
                {children}
                <Toaster />
              </MapLoadingProvider>
            </MenuProvider>
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
