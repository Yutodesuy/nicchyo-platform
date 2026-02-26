import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shop } from "../types/shopData";

type VendorRow = {
  id: string;
  shop_name: string | null;
  owner_name: string | null;
  strength: string | null;
  style: string | null;
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string | null;
};

type ProductRow = {
  vendor_id: string | null;
  name: string | null;
};

type LocationRow = {
  id: string;
  store_number: number | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
};

type AssignmentRow = {
  vendor_id: string | null;
  location_id: string | null;
  market_date: string | null;
};

const CHOME_VALUES = new Set([
  "一丁目",
  "二丁目",
  "三丁目",
  "四丁目",
  "五丁目",
  "六丁目",
  "七丁目",
]);

function normalizeChome(value: string | null): Shop["chome"] {
  if (value && CHOME_VALUES.has(value)) {
    return value as Shop["chome"];
  }
  return undefined;
}

export async function fetchShopsFromDb(
  supabase: SupabaseClient
): Promise<Shop[]> {
  const [
    { data: vendorsData },
    { data: categoriesData },
    { data: productsData },
    { data: locationsData },
    { data: assignmentsData },
  ] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, shop_name, owner_name, strength, style, category_id"),
    supabase.from("categories").select("id, name"),
    supabase.from("products").select("vendor_id, name"),
    supabase
      .from("market_locations")
      .select("id, store_number, latitude, longitude, district"),
    supabase.from("location_assignments").select("vendor_id, location_id, market_date"),
  ]);

  const vendors = Array.isArray(vendorsData)
    ? (vendorsData as VendorRow[])
    : [];
  const categories = Array.isArray(categoriesData)
    ? (categoriesData as CategoryRow[])
    : [];
  const products = Array.isArray(productsData)
    ? (productsData as ProductRow[])
    : [];
  const locations = Array.isArray(locationsData)
    ? (locationsData as LocationRow[])
    : [];
  const assignments = Array.isArray(assignmentsData)
    ? (assignmentsData as AssignmentRow[])
    : [];

  const categoryNameById = new Map<string, string>();
  categories.forEach((row) => {
    if (row.id && row.name) {
      categoryNameById.set(row.id, row.name);
    }
  });

  const productsByVendor = new Map<string, string[]>();
  products.forEach((row) => {
    if (!row.vendor_id || !row.name) return;
    const list = productsByVendor.get(row.vendor_id) ?? [];
    list.push(row.name);
    productsByVendor.set(row.vendor_id, list);
  });

  const locationById = new Map<string, LocationRow>();
  locations.forEach((row) => {
    if (row.id) {
      locationById.set(row.id, row);
    }
  });

  const latestAssignmentByVendor = new Map<string, AssignmentRow>();
  assignments.forEach((row) => {
    if (!row.vendor_id || !row.location_id) return;
    const current = latestAssignmentByVendor.get(row.vendor_id);
    if (!current) {
      latestAssignmentByVendor.set(row.vendor_id, row);
      return;
    }
    const currentDate = current.market_date ? new Date(current.market_date) : null;
    const nextDate = row.market_date ? new Date(row.market_date) : null;
    if (!currentDate || (nextDate && nextDate > currentDate)) {
      latestAssignmentByVendor.set(row.vendor_id, row);
    }
  });

  const shops = vendors
    .map((vendor): Shop | null => {
      const assignment = latestAssignmentByVendor.get(vendor.id);
      if (!assignment?.location_id) return null;
      const location = locationById.get(assignment.location_id);
      if (!location) return null;

      const storeNumber = Number(location.store_number ?? 0);
      if (!Number.isFinite(storeNumber) || storeNumber <= 0) return null;

      const categoryName =
        (vendor.category_id && categoryNameById.get(vendor.category_id)) || "";

      return {
        id: storeNumber,
        name: vendor.shop_name ?? "",
        ownerName: vendor.owner_name ?? "",
        category: categoryName,
        products: productsByVendor.get(vendor.id) ?? [],
        description: "",
        stallStyle: vendor.style ?? undefined,
        schedule: "",
        message: undefined,
        shopStrength: vendor.strength ?? undefined,
        position: storeNumber,
        lat: Number(location.latitude ?? 0),
        lng: Number(location.longitude ?? 0),
        chome: normalizeChome(location.district),
      };
    })
    .filter((row): row is Shop => row !== null)
    .sort((a, b) => a.id - b.id);

  return shops;
}
