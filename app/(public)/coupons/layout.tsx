import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "クーポン",
  description:
    "高知・日曜市で使えるクーポンを確認・利用できます。QRコードを出店者に見せるだけで割引が適用されます。",
  openGraph: {
    title: "クーポン | nicchyo",
    description: "高知・日曜市で使えるクーポンを確認・利用できます。",
  },
};

export default function CouponsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
