import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { MenuProvider } from "@/lib/ui/MenuContext";
import { BagProvider } from "@/lib/storage/BagContext";
import AppHeader from "./components/AppHeader";
import HamburgerMenu from "./components/HamburgerMenu";
import MapLoadingProvider from "./components/MapLoadingProvider";
import ViewportHeightUpdater from "./components/ViewportHeightUpdater";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-nicchyo-base text-nicchyo-ink">
        <ViewportHeightUpdater />
        <AuthProvider>
          <BagProvider>
            <MenuProvider>
              <MapLoadingProvider>
                <AppHeader />
                <HamburgerMenu />
                {children}
              </MapLoadingProvider>
            </MenuProvider>
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
