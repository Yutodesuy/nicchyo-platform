import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { fetchShopsFromDb } from "@/app/(public)/map/services/shopDb";
import { fetchLandmarksFromDb } from "@/app/(public)/map/services/landmarksDb";
import type { Landmark as EditableLandmark } from "@/app/(public)/map/types/landmark";

type EditableShop = {
  locationId: string;
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

async function loadEditableShops(supabase: ReturnType<typeof createServerClient>): Promise<EditableShop[]> {
  const [shops, assignmentsResult, locationsResult] = await Promise.all([
    fetchShopsFromDb(supabase),
    supabase.from("location_assignments").select("vendor_id, location_id, market_date"),
    supabase.from("market_locations").select("id, store_number"),
  ]);

  if (assignmentsResult.error || locationsResult.error) {
    throw new Error("Failed to load shop location mappings");
  }

  const assignmentsData = assignmentsResult.data ?? [];
  const locationsData = locationsResult.data ?? [];

  const locationIdByStoreNumber = new Map<number, string>();
  for (const row of locationsData) {
    if (row.id && row.store_number != null) {
      locationIdByStoreNumber.set(Number(row.store_number), row.id as string);
    }
  }

  const latestAssignmentByVendor = new Map<string, { location_id: string; market_date: string | null }>();
  for (const row of assignmentsData) {
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

  return shops.flatMap((shop) => {
    const locationId =
      (shop.vendorId ? latestAssignmentByVendor.get(shop.vendorId)?.location_id : undefined) ??
      locationIdByStoreNumber.get(shop.id);

    if (!locationId) {
      return [];
    }

    return [
      {
        locationId,
        id: shop.id,
        vendorId: shop.vendorId,
        name: shop.name,
        lat: shop.lat,
        lng: shop.lng,
        position: shop.position,
      },
    ];
  });
}

function createAdminWriteClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role env vars are missing.");
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

    const [editableShops, landmarks] = await Promise.all([
      loadEditableShops(supabase),
      fetchLandmarksFromDb(supabase),
    ]);

    return NextResponse.json({ shops: editableShops, landmarks });
  } catch {
    return NextResponse.json({ error: "Failed to load map layout" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const adminWriteClient = createAdminWriteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminRole(getRole(user))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      shops?: {
        updated?: EditableShop[];
        deletedLocationIds?: string[];
      };
      landmarks?: {
        upsert?: EditableLandmark[];
        deletedKeys?: string[];
      };
    };

    if (
      !body.shops ||
      !body.landmarks ||
      !Array.isArray(body.shops.updated) ||
      !Array.isArray(body.shops.deletedLocationIds) ||
      !Array.isArray(body.landmarks.upsert) ||
      !Array.isArray(body.landmarks.deletedKeys)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (body.shops.updated.length > 0) {
      const { error } = await adminWriteClient
        .from("market_locations")
        .upsert(
          body.shops.updated.map((shop) => ({
            id: shop.locationId,
            latitude: shop.lat,
            longitude: shop.lng,
            store_number: shop.position,
          })),
          { onConflict: "id" }
        );

      if (error) {
        return NextResponse.json({ error: "Failed to update shop locations" }, { status: 500 });
      }
    }

    if (body.shops.deletedLocationIds.length > 0) {
      const { error } = await adminWriteClient
        .from("market_locations")
        .delete()
        .in("id", body.shops.deletedLocationIds);

      if (error) {
        return NextResponse.json({ error: "Failed to delete shop locations" }, { status: 500 });
      }
    }

    if (body.landmarks.deletedKeys.length > 0) {
      const { error } = await adminWriteClient
        .from("map_landmarks")
        .delete()
        .in("key", body.landmarks.deletedKeys);

      if (error) {
        return NextResponse.json({ error: "Failed to delete landmarks" }, { status: 500 });
      }
    }

    if (body.landmarks.upsert.length > 0) {
      const { error: landmarksError } = await adminWriteClient.from("map_landmarks").upsert(
        body.landmarks.upsert.map((landmark) => ({
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
