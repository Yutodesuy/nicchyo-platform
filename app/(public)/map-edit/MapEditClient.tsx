"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type VendorOption = {
  id: string;
  name: string;
};

type SnapshotItem = {
  id: string;
  created_at: string;
  created_by: string | null;
  summary?: {
    updatedShopCount?: number;
    deletedShopCount?: number;
    upsertLandmarkCount?: number;
    deletedLandmarkCount?: number;
    restoreSourceSnapshotId?: string;
  } | null;
};

const MapLayoutEditor = dynamic(() => import("./MapLayoutEditor"), { ssr: false });

function cloneShops(shops: EditableShop[]) {
  return shops.map((shop) => ({ ...shop }));
}

function cloneLandmarks(landmarks: EditableLandmark[]) {
  return landmarks.map((landmark) => ({ ...landmark }));
}

function getUnassignedPriority(shop: EditableShop) {
  if (shop.vendorId) return Number.NEGATIVE_INFINITY;
  if (shop.locationId.startsWith("new-")) {
    const createdAt = Number(shop.locationId.slice(4));
    if (Number.isFinite(createdAt)) {
      return createdAt;
    }
  }
  return 0;
}

function sortShops(items: EditableShop[]) {
  return [...items].sort((a, b) => {
    const aUnassigned = a.vendorId ? 1 : 0;
    const bUnassigned = b.vendorId ? 1 : 0;
    if (aUnassigned !== bUnassigned) {
      return aUnassigned - bUnassigned;
    }
    if (!a.vendorId && !b.vendorId) {
      const priorityDiff = getUnassignedPriority(b) - getUnassignedPriority(a);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
    }
    return a.position - b.position;
  });
}

async function fetchMapLayout() {
  const response = await fetch("/api/admin/map-layout");
  if (!response.ok) {
    throw new Error("failed");
  }
  return response.json() as Promise<{
    shops?: EditableShop[];
    landmarks?: EditableLandmark[];
    vendors?: VendorOption[];
  }>;
}

export default function MapEditClient() {
  const [shops, setShops] = useState<EditableShop[]>([]);
  const [landmarks, setLandmarks] = useState<EditableLandmark[]>([]);
  const [initialShops, setInitialShops] = useState<EditableShop[]>([]);
  const [initialLandmarks, setInitialLandmarks] = useState<EditableLandmark[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [selectedKind, setSelectedKind] = useState<"shop" | "landmark">("shop");
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shopQuery, setShopQuery] = useState("");
  const [landmarkQuery, setLandmarkQuery] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const shopItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const landmarkItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let active = true;
    void fetchMapLayout()
      .then((data) => {
        if (!active) return;
        const nextShops = Array.isArray(data.shops) ? (data.shops as EditableShop[]) : [];
        const nextLandmarks = Array.isArray(data.landmarks)
          ? (data.landmarks as EditableLandmark[])
          : [];
        const nextVendors = Array.isArray(data.vendors) ? (data.vendors as VendorOption[]) : [];
        setShops(sortShops(nextShops));
        setLandmarks(nextLandmarks);
        setVendorOptions(nextVendors);
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
      sortShops(
        shops.filter((shop) => {
          if (selectedKind === "shop" && selectedId === String(shop.id)) return true;
          if (!normalizedShopQuery) return true;
          return (
            shop.name.toLowerCase().includes(normalizedShopQuery) ||
            String(shop.id).includes(normalizedShopQuery)
          );
        })
      ),
    [normalizedShopQuery, selectedId, selectedKind, shops]
  );
  const filteredLandmarks = useMemo(
    () =>
      landmarks.filter((landmark) => {
        if (selectedKind === "landmark" && selectedId === landmark.key) return true;
        if (!normalizedLandmarkQuery) return true;
        return landmark.name.toLowerCase().includes(normalizedLandmarkQuery);
      }),
    [landmarks, normalizedLandmarkQuery, selectedId, selectedKind]
  );
  const hasUnsavedChanges = useMemo(() => {
    const initialShopMap = new Map(initialShops.map((shop) => [shop.locationId, shop]));
    const currentShopMap = new Map(shops.map((shop) => [shop.locationId, shop]));
    const updatedShopExists = shops.some((shop) => {
      const initial = initialShopMap.get(shop.locationId);
      if (!initial) return true;
      return (
        initial.lat !== shop.lat ||
        initial.lng !== shop.lng ||
        initial.position !== shop.position ||
        initial.vendorId !== shop.vendorId
      );
    });
    const deletedShopExists = initialShops.some((shop) => !currentShopMap.has(shop.locationId));
    const initialLandmarkMap = new Map(initialLandmarks.map((landmark) => [landmark.key, landmark]));
    const currentLandmarkMap = new Map(landmarks.map((landmark) => [landmark.key, landmark]));
    const updatedLandmarkExists = landmarks.some((landmark) => {
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
    const deletedLandmarkExists = initialLandmarks.some(
      (landmark) => !currentLandmarkMap.has(landmark.key)
    );

    return updatedShopExists || deletedShopExists || updatedLandmarkExists || deletedLandmarkExists;
  }, [initialLandmarks, initialShops, landmarks, shops]);

  const loadSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const response = await fetch("/api/admin/map-layout/snapshots");
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { snapshots?: SnapshotItem[] };
      setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : []);
    } catch {
      setMessage("バックアップ履歴の取得に失敗しました。");
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    if (!selectedId) return;

    const target =
      selectedKind === "shop"
        ? shopItemRefs.current[selectedId]
        : landmarkItemRefs.current[selectedId];

    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [filteredLandmarks, filteredShops, selectedId, selectedKind]);

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
          initial.position !== shop.position ||
          initial.vendorId !== shop.vendorId
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
      const nextData = await fetchMapLayout();
      const nextShops = Array.isArray(nextData.shops) ? nextData.shops : [];
      const nextLandmarks = Array.isArray(nextData.landmarks) ? nextData.landmarks : [];
      const nextVendors = Array.isArray(nextData.vendors) ? nextData.vendors : [];
      setShops(sortShops(nextShops));
      setLandmarks(nextLandmarks);
      setVendorOptions(nextVendors);
      setInitialShops(cloneShops(nextShops));
      setInitialLandmarks(cloneLandmarks(nextLandmarks));
      if (isHistoryOpen) {
        await loadSnapshots();
      }
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

  const handleConfirmLandmark = (key: string) => {
    setSelectedKind("landmark");
    setSelectedId("");
    setMessage(`建物オブジェクト ${key} の編集を確定しました。保存するとDBへ反映されます。`);
  };

  const handleCancelLandmark = (key: string) => {
    setLandmarks((prev) => {
      if (key.startsWith("landmark-")) {
        return prev.filter((item) => item.key !== key);
      }
      const initial = initialLandmarks.find((item) => item.key === key);
      if (!initial) return prev;
      return prev.map((item) => (item.key === key ? { ...initial } : item));
    });
    if (selectedKind === "landmark" && selectedId === key) {
      setSelectedId("");
    }
  };

  const handleAddShop = () => {
    const nextPosition = shops.reduce((max, shop) => Math.max(max, shop.position), 0) + 1;
    const fallback = selectedShop ?? shops[shops.length - 1] ?? null;
    const nextShop: EditableShop = {
      locationId: `new-${Date.now()}`,
      id: nextPosition,
      name: `未設定店舗 ${nextPosition}`,
      lat: fallback?.lat ?? 33.56145,
      lng: fallback?.lng ?? 133.5383,
      position: nextPosition,
    };
    setShops((prev) => sortShops([...prev, nextShop]));
    setSelectedKind("shop");
    setSelectedId(String(nextShop.id));
  };

  const handleConfirmNewShop = (shopId: number) => {
    setSelectedKind("shop");
    setSelectedId("");
    setMessage(`店舗マーカ #${shopId} を追加しました。保存するとDBへ反映されます。`);
  };

  const handleConfirmShop = (shopId: number) => {
    setSelectedKind("shop");
    setSelectedId("");
    setMessage(`店舗マーカ #${shopId} の編集を確定しました。保存するとDBへ反映されます。`);
  };

  const handleCancelShop = (shopId: number) => {
    setShops((prev) => {
      const target = prev.find((shop) => shop.id === shopId);
      if (!target) return prev;
      if (target.locationId.startsWith("new-")) {
        return prev.filter((shop) => shop.id !== shopId);
      }
      const initial = initialShops.find((shop) => shop.locationId === target.locationId);
      if (!initial) return prev;
      return sortShops(prev.map((shop) => (shop.id === shopId ? { ...initial } : shop)));
    });
    if (selectedKind === "shop" && selectedId === String(shopId)) {
      setSelectedId("");
    }
  };

  const toggleShopSelection = (shopId: number) => {
    if (selectedKind === "shop" && selectedId === String(shopId)) {
      setSelectedId("");
      return;
    }
    setSelectedKind("shop");
    setSelectedId(String(shopId));
  };

  const toggleLandmarkSelection = (landmarkKey: string) => {
    if (selectedKind === "landmark" && selectedId === landmarkKey) {
      setSelectedId("");
      return;
    }
    setSelectedKind("landmark");
    setSelectedId(landmarkKey);
  };

  const handleOpenHistory = async () => {
    if (!isHistoryOpen) {
      setIsHistoryOpen(true);
      await loadSnapshots();
      return;
    }
    setIsHistoryOpen(false);
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (hasUnsavedChanges) {
      setMessage("現在の変更を保存してからでないと復元できません。");
      return;
    }

    setIsRestoring(snapshotId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/map-layout/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId }),
      });
      if (!response.ok) throw new Error("restore failed");

      const nextData = await fetchMapLayout();
      const nextShops = Array.isArray(nextData.shops) ? nextData.shops : [];
      const nextLandmarks = Array.isArray(nextData.landmarks) ? nextData.landmarks : [];
      const nextVendors = Array.isArray(nextData.vendors) ? nextData.vendors : [];
      setShops(sortShops(nextShops));
      setLandmarks(nextLandmarks);
      setVendorOptions(nextVendors);
      setInitialShops(cloneShops(nextShops));
      setInitialLandmarks(cloneLandmarks(nextLandmarks));
      await loadSnapshots();
      setMessage("バックアップから復元しました。復元前の状態も自動保存しています。");
    } catch {
      setMessage("バックアップからの復元に失敗しました。");
    } finally {
      setIsRestoring(null);
    }
  };

  const formatSnapshotDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-slate-100">
      <div className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="pl-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">Map Admin</p>
            <h1 className="text-2xl font-bold text-slate-900">マップ管理</h1>
          </div>
          <div className="ml-auto mr-16 flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              履歴
            </button>
            <div className="flex rounded-full bg-slate-100 p-1">
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
      </div>

      <div
        className={`mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 overflow-hidden px-4 pt-4 ${
          isHistoryOpen
            ? "lg:grid-cols-[320px_360px_1fr]"
            : "lg:grid-cols-[360px_1fr]"
        }`}
      >
        {isHistoryOpen && (
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Backup History</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">保存履歴</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="履歴を閉じる"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              復元は、現在のマップを保存済みの状態でのみ実行できます。
            </p>
            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {isLoadingSnapshots ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  履歴を読み込み中です。
                </div>
              ) : snapshots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  保存履歴はまだありません。
                </div>
              ) : (
                snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatSnapshotDate(snapshot.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">ID: {snapshot.id}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      店舗更新 {snapshot.summary?.updatedShopCount ?? 0}件 / 店舗削除 {snapshot.summary?.deletedShopCount ?? 0}件
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      建物更新 {snapshot.summary?.upsertLandmarkCount ?? 0}件 / 建物削除 {snapshot.summary?.deletedLandmarkCount ?? 0}件
                    </p>
                    {snapshot.summary?.restoreSourceSnapshotId && (
                      <p className="mt-1 text-xs text-amber-700">
                        復元前バックアップ
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snapshot.id)}
                      disabled={hasUnsavedChanges || isRestoring !== null}
                      className="mt-3 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isRestoring === snapshot.id ? "復元中..." : "この状態に復元"}
                    </button>
                    {hasUnsavedChanges && (
                      <p className="mt-2 text-[11px] text-rose-600">
                        現在の変更を保存してから復元してください。
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <button
                type="button"
                onClick={handleAddShop}
                className="w-full rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700"
              >
                ＋店舗マーカを追加
              </button>
              <input
                type="search"
                value={shopQuery}
                onChange={(event) => setShopQuery(event.target.value)}
                placeholder="店舗マーカを検索"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredShops.map((shop) => (
                  <div
                    key={shop.id}
                    ref={(node) => {
                      shopItemRefs.current[String(shop.id)] = node;
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleShopSelection(shop.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleShopSelection(shop.id);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        selectedId === String(shop.id)
                          ? "border-sky-400 bg-sky-50 shadow-sm ring-2 ring-sky-200"
                          : "border-slate-200 bg-white"
                      } cursor-pointer`}
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{shop.name}</span>
                          <span className="block text-xs text-slate-500">#{shop.id}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteShop(shop.id);
                        }}
                        className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        aria-label={`${shop.name} を削除`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {selectedId === String(shop.id) && (
                      <div
                        className="mt-2 rounded-2xl bg-slate-50 p-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      出店者
                    </label>
                    <select
                      value={shop.vendorId ?? ""}
                      onChange={(event) =>
                        setShops((prev) =>
                          prev.map((item) => {
                            if (item.id !== shop.id) return item;
                            const vendorId = event.target.value || undefined;
                            const vendorName =
                              vendorOptions.find((vendor) => vendor.id === vendorId)?.name ??
                              `未設定店舗 ${item.position}`;
                            return {
                              ...item,
                              vendorId,
                              name: vendorId ? vendorName : `未設定店舗 ${item.position}`,
                            };
                          })
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">未割当</option>
                      {vendorOptions.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        緯度
                        <input
                          type="number"
                          step="0.000001"
                          value={shop.lat}
                          onChange={(event) =>
                            setShops((prev) =>
                              prev.map((item) =>
                                item.id === shop.id
                                  ? { ...item, lat: Number(event.target.value) }
                                  : item
                              )
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        経度
                        <input
                          type="number"
                          step="0.000001"
                          value={shop.lng}
                          onChange={(event) =>
                            setShops((prev) =>
                              prev.map((item) =>
                                item.id === shop.id
                                  ? { ...item, lng: Number(event.target.value) }
                                  : item
                              )
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancelShop(shop.id)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          shop.locationId.startsWith("new-")
                            ? handleConfirmNewShop(shop.id)
                            : handleConfirmShop(shop.id)
                        }
                        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                      >
                        確定
                      </button>
                    </div>
                      </div>
                    )}
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
            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <button
                type="button"
                onClick={() => {
                  const key = `landmark-${Date.now()}`;
                  const next: EditableLandmark = {
                    key,
                    name: "",
                    description: "",
                    url: "",
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
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredLandmarks.map((landmark) => (
                <div
                  key={landmark.key}
                  ref={(node) => {
                    landmarkItemRefs.current[landmark.key] = node;
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleLandmarkSelection(landmark.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleLandmarkSelection(landmark.key);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedId === landmark.key
                      ? "border-sky-400 bg-sky-50 shadow-sm ring-2 ring-sky-200"
                      : "border-slate-200 bg-white"
                  } cursor-pointer`}
                >
                  <div className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold text-slate-900">{landmark.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteLandmark(landmark.key);
                    }}
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
              <input
                value={selectedLandmark.url}
                onChange={(event) =>
                  setLandmarks((prev) =>
                    prev.map((item) =>
                      item.key === selectedLandmark.key ? { ...item, url: event.target.value } : item
                    )
                  )
                }
                placeholder="画像URL"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleCancelLandmark(selectedLandmark.key)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmLandmark(selectedLandmark.key)}
                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  確定
                </button>
              </div>
              <p className="text-xs text-slate-500">建物オブジェクトはDBに保存され、マップ表示へ反映されます。</p>
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {message}
            </div>
          )}
        </aside>

        <div className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <MapLayoutEditor
            mode={mode}
            shops={shops}
            landmarks={landmarks}
            selectedKind={selectedKind}
            selectedId={selectedId}
            onSelect={(kind, id) => {
              if (selectedKind === kind && selectedId === id) {
                setSelectedId("");
                return;
              }
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
