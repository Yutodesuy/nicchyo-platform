import { Suspense } from "react";
import ConsultClient from "./ConsultClient";

export default async function ConsultPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--consult-bg)]" />}>
      <ConsultClient />
    </Suspense>
  );
}
