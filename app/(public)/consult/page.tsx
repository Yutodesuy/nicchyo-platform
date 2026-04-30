import type { Metadata } from "next";
import { Suspense } from "react";
import ConsultClient from "./ConsultClient";

export const metadata: Metadata = {
  title: "AIに相談する",
  description:
    "AIキャラクター「にちよさん」が高知・日曜市のお店をご案内します。食べ物・工芸品・体験など何でも聞いてみてください。",
  openGraph: {
    title: "AIに相談する | nicchyo",
    description: "AIキャラクター「にちよさん」が高知・日曜市のお店をご案内します。",
  },
};

export default async function ConsultPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--consult-bg)]" />}>
      <ConsultClient />
    </Suspense>
  );
}
