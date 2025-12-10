"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import NavigationBar from "../components/NavigationBar";
import { loadKotodute, saveKotodute, KotoduteNote } from "../../lib/kotoduteStorage";
import { shops } from "../(public)/map/data/shops";
import { useSearchParams } from "next/navigation";

const shopOptions = shops.slice(0, 12).map((s) => ({ id: s.id, name: s.name }));

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function extractTarget(tag: string): number | "all" {
  const trimmed = tag.trim().replace(/^#/, "");
  if (!trimmed) return "all";
  if (trimmed.toLowerCase() === "all") return "all";
  const num = Number(trimmed);
  if (!Number.isNaN(num) && num > 0) return num;
  return "all";
}

function findShopName(id: number) {
  return shops.find((s) => s.id === id)?.name ?? `#${id}`;
}

export default function KotoduteClient() {
  const searchParams = useSearchParams();
  const prefillTarget = searchParams?.get("shopId") ?? undefined;

  const [notes, setNotes] = useState<KotoduteNote[]>([]);
  const [text, setText] = useState("");
  const [targetTag, setTargetTag] = useState(prefillTarget ? `#${prefillTarget}` : "#all");

  useEffect(() => {
    setNotes(loadKotodute());
  }, []);

  const target = extractTarget(targetTag);

  const filteredNotes = useMemo(() => {
    return notes.slice().sort((a, b) => b.createdAt - a.createdAt);
  }, [notes]);

  const handleSubmit = () => {
    const body = text.trim();
    if (!body) return;
    const next: KotoduteNote = {
      id: crypto.randomUUID(),
      shopId: target,
      text: body + (targetTag ? ` ${targetTag}` : ""),
      createdAt: Date.now(),
    };
    const updated = [next, ...notes];
    setNotes(updated);
    saveKotodute(updated);
    setText("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      <header className="sticky top-0 z-20 border-b border-amber-100/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              nicchyo kotodute
            </p>
            <h1 className="text-xl font-bold">日曜市のことづて</h1>
            <p className="text-[11px] text-gray-600">
              #店番号 でお店宛、#all で日曜市全体宛に投稿。閲覧はここか各お店のカードで。
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
          >
            マップへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
        <section className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
            投稿する
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-2">
              <label className="text-[11px] text-gray-700">本文</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例：#12 で朝どれナスが甘い！ #all は全体向け"
                className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 min-h-[96px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-gray-700">投稿先（#付き）</label>
              <input
                value={targetTag}
                onChange={(e) => setTargetTag(e.target.value)}
                className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <div className="flex flex-wrap gap-2 text-[11px] text-gray-700">
                <button
                  type="button"
                  onClick={() => setTargetTag("#all")}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-800"
                >
                  #all
                </button>
                {shopOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTargetTag(`#${s.id}`)}
                    className="rounded-full border border-orange-100 bg-white px-3 py-1 text-[11px] shadow-sm hover:bg-amber-50"
                  >
                    #{s.id} {s.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">
                #all なら全体宛。店宛は #店番号 を入れてください（例: #12）。
              </p>
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-200/70 transition hover:bg-amber-500"
            >
              投稿する
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                ことづて一覧
              </p>
              <h2 className="text-lg font-bold text-gray-900">全体と各店のことづて</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
              {filteredNotes.length}件
            </span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-gray-700">
              まだ投稿がありません。
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredNotes.map((note) => {
                const isAll = note.shopId === "all";
                const label = isAll ? "日曜市全体" : findShopName(note.shopId as number);
                const targetHref = isAll ? "/map" : `/map?shop=${note.shopId}`;

                return (
                  <Link
                    key={note.id}
                    href={targetHref}
                    className={`block rounded-xl px-3 py-3 text-sm transition ${
                      isAll
                        ? "border border-slate-200 bg-slate-50/70 hover:bg-slate-100"
                        : "border border-amber-100 bg-amber-50/40 hover:bg-amber-100/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            isAll
                              ? "bg-slate-900 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {isAll ? "#all" : `#${note.shopId}`}
                        </span>
                        <span className="text-[12px] text-gray-700">{label}</span>
                      </div>
                      <span className="text-[11px] text-gray-500">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-800">{note.text}</p>
                    {!isAll && (
                      <div className="mt-2 text-[11px] text-amber-700 underline">
                        お店のカードを開く
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-[11px] text-gray-600">
          <p className="font-medium">nicchyo ことづて</p>
          <p className="mt-1">#番号 で宛先を決めるシンプルな一言掲示板です。</p>
        </div>
      </footer>
      <NavigationBar />
    </main>
  );
}
