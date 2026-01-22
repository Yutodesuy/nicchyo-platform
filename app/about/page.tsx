import React from "react";
import AboutStory from "./AboutStory";

export const metadata = {
  title: "about | nicchyo",
  description:
    "nicchyo は高知高専のプロジェクトとして日曜市のデジタル体験を探求しています。",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-amber-50">
      <AboutStory />
    </main>
  );
}
