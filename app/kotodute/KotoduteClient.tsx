"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavigationBar from "../components/NavigationBar";
import { loadKotodute, saveKotodute, type KotoduteNote } from "../../lib/kotoduteStorage";
import { shops } from "../(public)/map/data/shops";
import { useSearchParams } from "next/navigation";

const shopOptions = shops.map((s) => ({ id: s.id, name: s.name }));

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
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16 pt-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-100 via-yellow-50 to-white p-4 shadow-md">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-white text-3xl shadow-inner shadow-amber-200/70 border border-amber-200 flex items-center justify-center">
                ❓
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">campaign</p>
                <p className="text-lg font-bold text-amber-900">３００コメント達成で日曜市フォトスポット作成決定！！</p>
                <p className="text-[12px] text-amber-800">みんなの声でフォトスポットをつくろう。応援コメント待ってます！</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
            投稿する
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-[11px] text-gray-700">本文</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="おすすめや感想をひとこと書いてください"
                className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 min-h-[64px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-gray-700">投稿先</label>
              <select
                value={targetTag}
                onChange={(e) => setTargetTag(e.target.value)}
                className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="#all">全体</option>
                <optgroup label="お店">
                  {shopOptions.map((s) => (
                    <option key={s.id} value={`#${s.id}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              </select>
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
              <h2 className="text-lg font-bold text-gray-900">全体とお店あてのことづて</h2>
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
                            isAll ? "bg-slate-900 text-white" : "bg-amber-600 text-white"
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
                      <div className="mt-2 text-[11px] text-amber-700 underline">お店のカードを開く</div>
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
          <p className="mt-1">宛先を選んで投稿できるシンプルな一言掲示板です。</p>
        </div>
      </footer>
      <NavigationBar />
    </main>
  );
}


