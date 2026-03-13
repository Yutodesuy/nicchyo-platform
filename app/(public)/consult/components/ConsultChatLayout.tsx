import type { ReactNode } from "react";

type ConsultChatLayoutProps = {
  header: ReactNode;
  messages: ReactNode;
  composer: ReactNode;
  className?: string;
};

export default function ConsultChatLayout({
  header,
  messages,
  composer,
  className,
}: ConsultChatLayoutProps) {
  return (
    <section
      className={`grid h-full min-h-0 w-full grid-rows-[auto,1fr,auto] overflow-hidden ${className ?? ""}`.trim()}
    >
      <div>{header}</div>
      <div className="min-h-0">{messages}</div>
      <div
        className="sticky z-10 bg-[#fbf8f3]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        style={{ bottom: "env(safe-area-inset-bottom)" }}
      >
        {composer}
      </div>
    </section>
  );
}
