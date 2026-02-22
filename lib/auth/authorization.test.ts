import { describe, expect, it } from "vitest";

import { canAccessVendorShop, getShopCodeFromPathname, getVendorId, normalizeRole } from "./authorization";

describe("normalizeRole", () => {
  it("既知のロールを正規化する", () => {
    expect(normalizeRole("vendor")).toBe("vendor");
    expect(normalizeRole("super_admin")).toBe("super_admin");
  });

  it("未知ロールは general_user にフォールバックする", () => {
    expect(normalizeRole("unknown")).toBe("general_user");
    expect(normalizeRole(undefined)).toBe("general_user");
  });
});

describe("getVendorId", () => {
  it("number/string の vendorId を受け取る", () => {
    expect(getVendorId(10)).toBe(10);
    expect(getVendorId("10")).toBe(10);
  });

  it("不正値は undefined を返す", () => {
    expect(getVendorId("abc")).toBeUndefined();
    expect(getVendorId(null)).toBeUndefined();
  });
});

describe("canAccessVendorShop", () => {
  it("vendor かつ vendorId 一致のみ許可する", () => {
    expect(canAccessVendorShop({ role: "vendor", vendorId: 2 }, 2)).toBe(true);
    expect(canAccessVendorShop({ role: "vendor", vendorId: 3 }, 2)).toBe(false);
    expect(canAccessVendorShop({ role: "super_admin", vendorId: 2 }, 2)).toBe(false);
  });
});

describe("getShopCodeFromPathname", () => {
  it("/shops001 と /shops/001 の両方から shopCode を取得する", () => {
    expect(getShopCodeFromPathname("/shops001")).toBe("001");
    expect(getShopCodeFromPathname("/shops/001")).toBe("001");
  });

  it("対象外パスは null を返す", () => {
    expect(getShopCodeFromPathname("/shopslogin")).toBeNull();
    expect(getShopCodeFromPathname("/shops/abc")).toBeNull();
  });
});
