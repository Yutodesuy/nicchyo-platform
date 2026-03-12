import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { fetchShopsFromDb } from "@/app/(public)/map/services/shopDb";
import { fetchLandmarksFromDb } from "@/app/(public)/map/services/landmarksDb";
import type { Landmark as EditableLandmark } from "@/app/(public)/map/types/landmark";

type EditableShop = {
  id: number;
  vendorId?: string;
  name: string;
  lat: number;
  lng: number;
  position: number;
};

function getRole(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const record = user as {
    app_metadata?: { role?: string };
    user_metadata?: { role?: string };
  };
  return record.app_metadata?.role ?? record.user_metadata?.role ?? null;
}

function isAdminRole(role: string | null) {
  return role === "super_admin" || role === "admin";
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminRole(getRole(user))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [shops, landmarks] = await Promise.all([fetchShopsFromDb(supabase), fetchLandmarksFromDb(supabase)]);

    const editableShops: EditableShop[] = shops.map((shop) => ({
      id: shop.id,
      vendorId: shop.vendorId,
      name: shop.name,
      lat: shop.lat,
      lng: shop.lng,
      position: shop.position,
    }));

    return NextResponse.json({ shops: editableShops, landmarks });
  } catch {
    return NextResponse.json({ error: "Failed to load map layout" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminRole(getRole(user))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      shops?: EditableShop[];
      landmarks?: EditableLandmark[];
    };

    if (!Array.isArray(body.shops) || !Array.isArray(body.landmarks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("location_assignments")
      .select("vendor_id, location_id, market_date");
    const { data: locationsData, error: locationsError } = await supabase
      .from("market_locations")
      .select("id, store_number");

    if (assignmentsError || locationsError) {
      return NextResponse.json({ error: "Failed to load location mappings" }, { status: 500 });
    }

    const locationIdByStoreNumber = new Map<number, string>();
    for (const row of locationsData ?? []) {
      if (row.id && row.store_number != null) {
        locationIdByStoreNumber.set(Number(row.store_number), row.id as string);
      }
    }

    const latestAssignmentByVendor = new Map<string, { location_id: string; market_date: string | null }>();
    for (const row of assignmentsData ?? []) {
      const vendorId = row.vendor_id as string | null;
      const locationId = row.location_id as string | null;
      if (!vendorId || !locationId) continue;
      const current = latestAssignmentByVendor.get(vendorId);
      if (!current) {
        latestAssignmentByVendor.set(vendorId, { location_id: locationId, market_date: row.market_date as string | null });
        continue;
      }
      const currentDate = current.market_date ? new Date(current.market_date) : null;
      const nextDate = row.market_date ? new Date(row.market_date as string) : null;
      if (!currentDate || (nextDate && nextDate > currentDate)) {
        latestAssignmentByVendor.set(vendorId, { location_id: locationId, market_date: row.market_date as string | null });
      }
    }

    for (const shop of body.shops) {
      const locationId =
        (shop.vendorId ? latestAssignmentByVendor.get(shop.vendorId)?.location_id : undefined) ??
        locationIdByStoreNumber.get(shop.id);

      if (!locationId) continue;

      const { error } = await supabase
        .from("market_locations")
        .update({
          latitude: shop.lat,
          longitude: shop.lng,
          store_number: shop.position,
        })
        .eq("id", locationId);

      if (error) {
        return NextResponse.json({ error: `Failed to update shop ${shop.id}` }, { status: 500 });
      }
    }

    const currentShops = await fetchShopsFromDb(supabase);
    const incomingShopIds = new Set(body.shops.map((shop) => shop.id));
    const locationIdsToDelete = new Set<string>();

    for (const shop of currentShops) {
      if (incomingShopIds.has(shop.id)) continue;

      const locationId =
        (shop.vendorId ? latestAssignmentByVendor.get(shop.vendorId)?.location_id : undefined) ??
        locationIdByStoreNumber.get(shop.id);

      if (locationId) {
        locationIdsToDelete.add(locationId);
      }
    }

    for (const locationId of locationIdsToDelete) {
      const { error } = await supabase.from("market_locations").delete().eq("id", locationId);
      if (error) {
        return NextResponse.json({ error: `Failed to delete shop location ${locationId}` }, { status: 500 });
      }
    }

    const incomingKeys = new Set(body.landmarks.map((landmark) => landmark.key));
    const { data: existingLandmarks, error: existingLandmarksError } = await supabase
      .from("map_landmarks")
      .select("key");

    if (existingLandmarksError) {
      return NextResponse.json({ error: "Failed to load landmark mappings" }, { status: 500 });
    }

    const existingKeys = Array.isArray(existingLandmarks)
      ? existingLandmarks
          .map((row) => (typeof row.key === "string" ? row.key : null))
          .filter((key): key is string => key !== null)
      : [];

    for (const key of existingKeys) {
      if (incomingKeys.has(key)) continue;

      const { error } = await supabase.from("map_landmarks").delete().eq("key", key);
      if (error) {
        return NextResponse.json({ error: `Failed to delete landmark ${key}` }, { status: 500 });
      }
    }

    if (body.landmarks.length > 0) {
      const { error: landmarksError } = await supabase.from("map_landmarks").upsert(
        body.landmarks.map((landmark) => ({
          key: landmark.key,
          name: landmark.name,
          description: landmark.description,
          image_url: landmark.url,
          latitude: landmark.lat,
          longitude: landmark.lng,
          width_px: landmark.widthPx,
          height_px: landmark.heightPx,
          show_at_min_zoom: landmark.showAtMinZoom,
        })),
        { onConflict: "key" }
      );

      if (landmarksError) {
        return NextResponse.json({ error: "Failed to save landmarks" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save map layout" }, { status: 500 });
  }
}
