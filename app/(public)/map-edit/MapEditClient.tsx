"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import type { Landmark as EditableLandmark } from "../map/types/landmark";

type EditableShop = {
  locationId: string;
  id: number;
  vendorId?: string;
  name: string;
  lat: number;
  lng: number;
  position: number;
};

const MapLayoutEditor = dynamic(() => import("./MapLayoutEditor"), { ssr: false });

function cloneShops(shops: EditableShop[]) {
  return shops.map((shop) => ({ ...shop }));
}

function cloneLandmarks(landmarks: EditableLandmark[]) {
  return landmarks.map((landmark) => ({ ...landmark }));
}

export default function MapEditClient() {
  const [shops, setShops] = useState<EditableShop[]>([]);
  const [landmarks, setLandmarks] = useState<EditableLandmark[]>([]);
  const [initialShops, setInitialShops] = useState<EditableShop[]>([]);
  const [initialLandmarks, setInitialLandmarks] = useState<EditableLandmark[]>([]);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [selectedKind, setSelectedKind] = useState<"shop" | "landmark">("shop");
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shopQuery, setShopQuery] = useState("");
  const [landmarkQuery, setLandmarkQuery] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/map-layout")
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const nextShops = Array.isArray(data.shops) ? (data.shops as EditableShop[]) : [];
        const nextLandmarks = Array.isArray(data.landmarks)
          ? (data.landmarks as EditableLandmark[])
          : [];
        setShops(nextShops);
        setLandmarks(nextLandmarks);
        setInitialShops(cloneShops(nextShops));
        setInitialLandmarks(cloneLandmarks(nextLandmarks));
      })
      .catch(() => {
        if (!active) return;
        setMessage("マップ編集データの取得に失敗しました。");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedShop = useMemo(
    () => shops.find((shop) => String(shop.id) === selectedId) ?? null,
    [selectedId, shops]
  );
  const selectedLandmark = useMemo(
    () => landmarks.find((landmark) => landmark.key === selectedId) ?? null,
    [landmarks, selectedId]
  );
  const normalizedShopQuery = shopQuery.trim().toLowerCase();
  const normalizedLandmarkQuery = landmarkQuery.trim().toLowerCase();
  const filteredShops = useMemo(
    () =>
      shops.filter((shop) => {
        if (!normalizedShopQuery) return true;
        return (
          shop.name.toLowerCase().includes(normalizedShopQuery) ||
          String(shop.id).includes(normalizedShopQuery)
        );
      }),
    [normalizedShopQuery, shops]
  );
  const filteredLandmarks = useMemo(
    () =>
      landmarks.filter((landmark) => {
        if (!normalizedLandmarkQuery) return true;
        return landmark.name.toLowerCase().includes(normalizedLandmarkQuery);
      }),
    [landmarks, normalizedLandmarkQuery]
  );

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const initialShopMap = new Map(initialShops.map((shop) => [shop.locationId, shop]));
      const currentShopMap = new Map(shops.map((shop) => [shop.locationId, shop]));
      const updatedShops = shops.filter((shop) => {
        const initial = initialShopMap.get(shop.locationId);
        if (!initial) return true;
        return (
          initial.lat !== shop.lat ||
          initial.lng !== shop.lng ||
          initial.position !== shop.position
        );
      });
      const deletedLocationIds = initialShops
        .filter((shop) => !currentShopMap.has(shop.locationId))
        .map((shop) => shop.locationId);

      const initialLandmarkMap = new Map(initialLandmarks.map((landmark) => [landmark.key, landmark]));
      const currentLandmarkMap = new Map(landmarks.map((landmark) => [landmark.key, landmark]));
      const upsertLandmarks = landmarks.filter((landmark) => {
        const initial = initialLandmarkMap.get(landmark.key);
        if (!initial) return true;
        return (
          initial.name !== landmark.name ||
          initial.description !== landmark.description ||
          initial.url !== landmark.url ||
          initial.lat !== landmark.lat ||
          initial.lng !== landmark.lng ||
          initial.widthPx !== landmark.widthPx ||
          initial.heightPx !== landmark.heightPx ||
          initial.showAtMinZoom !== landmark.showAtMinZoom
        );
      });
      const deletedLandmarkKeys = initialLandmarks
        .filter((landmark) => !currentLandmarkMap.has(landmark.key))
        .map((landmark) => landmark.key);

      if (
        updatedShops.length === 0 &&
        deletedLocationIds.length === 0 &&
        upsertLandmarks.length === 0 &&
        deletedLandmarkKeys.length === 0
      ) {
        setMessage("変更はありません。");
        setIsSaving(false);
        return;
      }

      const response = await fetch("/api/admin/map-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shops: {
            updated: updatedShops,
            deletedLocationIds,
          },
          landmarks: {
            upsert: upsertLandmarks,
            deletedKeys: deletedLandmarkKeys,
          },
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setInitialShops(cloneShops(shops));
      setInitialLandmarks(cloneLandmarks(landmarks));
      setMessage("保存しました。店舗マーカと建物オブジェクトをDBへ反映しました。");
    } catch {
      setMessage("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShop = (shopId: number) => {
    setShops((prev) => {
      const next = prev.filter((shop) => shop.id !== shopId);
      if (selectedKind === "shop" && selectedId === String(shopId)) {
        setSelectedId(next[0] ? String(next[0].id) : "");
      }
      return next;
    });
  };

  const handleDeleteLandmark = (key: string) => {
    setLandmarks((prev) => {
      const next = prev.filter((item) => item.key !== key);
      if (selectedKind === "landmark" && selectedId === key) {
        setSelectedId(next[0]?.key ?? "");
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="pl-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">Map Admin</p>
            <h1 className="text-2xl font-bold text-slate-900">マップ管理</h1>
          </div>
          <div className="ml-auto flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              プレビュー
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedKind("shop")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedKind === "shop" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              店舗マーカ
            </button>
            <button
              type="button"
              onClick={() => setSelectedKind("landmark")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedKind === "landmark" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              建物オブジェクト
            </button>
          </div>

          {selectedKind === "shop" ? (
            <div className="mt-4">
              <input
                type="search"
                value={shopQuery}
                onChange={(event) => setShopQuery(event.target.value)}
                placeholder="店舗マーカを検索"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <div className="mt-3 max-h-[336px] space-y-2 overflow-y-auto pr-1">
                {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedId === String(shop.id)
                      ? "border-sky-400 bg-sky-50 shadow-sm ring-2 ring-sky-200"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(String(shop.id))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{shop.name}</span>
                      <span className="block text-xs text-slate-500">#{shop.id}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteShop(shop.id)}
                    className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label={`${shop.name} を削除`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                ))}
                {filteredShops.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    該当する店舗マーカはありません。
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  const key = `landmark-${Date.now()}`;
                  const next: EditableLandmark = {
                    key,
                    name: "新しい建物",
                    description: "",
                    url: "/images/maps/elements/buildings/Ohtepia.png",
                    lat: 33.56145,
                    lng: 133.5383,
                    widthPx: 128,
                    heightPx: 96,
                    showAtMinZoom: false,
                  };
                  setLandmarks((prev) => [...prev, next]);
                  setSelectedId(key);
                }}
                className="w-full rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700"
              >
                ＋建物を追加
              </button>
              <input
                type="search"
                value={landmarkQuery}
                onChange={(event) => setLandmarkQuery(event.target.value)}
                placeholder="建物オブジェクトを検索"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <div className="mt-3 max-h-[336px] space-y-2 overflow-y-auto pr-1">
              {filteredLandmarks.map((landmark) => (
                <div
                  key={landmark.key}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedId === landmark.key
                      ? "border-sky-400 bg-sky-50 shadow-sm ring-2 ring-sky-200"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(landmark.key)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-sm font-semibold text-slate-900">{landmark.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLandmark(landmark.key)}
                    className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label={`${landmark.name} を削除`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filteredLandmarks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  該当する建物オブジェクトはありません。
                </div>
              )}
              </div>
            </div>
          )}

          {selectedShop && selectedKind === "shop" && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{selectedShop.name}</p>
              <p className="mt-2 text-xs text-slate-500">ドラッグで位置変更できます。店舗は DB に保存されます。</p>
            </div>
          )}

          {selectedLandmark && selectedKind === "landmark" && (
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
              <input
                value={selectedLandmark.name}
                onChange={(event) =>
                  setLandmarks((prev) =>
                    prev.map((item) =>
                      item.key === selectedLandmark.key ? { ...item, name: event.target.value } : item
                    )
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={selectedLandmark.description}
                onChange={(event) =>
                  setLandmarks((prev) =>
                    prev.map((item) =>
                      item.key === selectedLandmark.key ? { ...item, description: event.target.value } : item
                    )
                  )
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => handleDeleteLandmark(selectedLandmark.key)}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                建物を削除
              </button>
              <p className="text-xs text-slate-500">建物オブジェクトはDBに保存され、マップ表示へ反映されます。</p>
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {message}
            </div>
          )}
        </aside>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <MapLayoutEditor
            mode={mode}
            shops={shops}
            landmarks={landmarks}
            selectedKind={selectedKind}
            selectedId={selectedId}
            onSelect={(kind, id) => {
              setSelectedKind(kind);
              setSelectedId(id);
            }}
            onClearSelection={() => setSelectedId("")}
            onMoveShop={(id, lat, lng) =>
              setShops((prev) => prev.map((shop) => (shop.id === id ? { ...shop, lat, lng } : shop)))
            }
            onMoveLandmark={(key, lat, lng) =>
              setLandmarks((prev) => prev.map((item) => (item.key === key ? { ...item, lat, lng } : item)))
            }
            onDeleteShop={handleDeleteShop}
            onDeleteLandmark={handleDeleteLandmark}
          />
        </div>
      </div>
    </div>
  );
}
