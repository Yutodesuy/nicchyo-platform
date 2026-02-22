import { describe, expect, it } from "vitest";

import {
  formatShopIdToCode,
  normalizeShopCodeToId,
  normalizeShopsPathSegmentToId,
} from "./route";

describe("normalizeShopCodeToId", () => {
  it("3桁コードを数値IDに変換する", () => {
    expect(normalizeShopCodeToId("001")).toBe(1);
    expect(normalizeShopCodeToId("010")).toBe(10);
    expect(normalizeShopCodeToId("300")).toBe(300);
  });

  it("範囲外や不正形式は null を返す", () => {
    expect(normalizeShopCodeToId("000")).toBeNull();
    expect(normalizeShopCodeToId("301")).toBeNull();
    expect(normalizeShopCodeToId("abc")).toBeNull();
    expect(normalizeShopCodeToId("1")).toBeNull();
  });
});

describe("normalizeShopsPathSegmentToId", () => {
  it("/shops001 形式のセグメントを数値IDに変換する", () => {
    expect(normalizeShopsPathSegmentToId("shops001")).toBe(1);
    expect(normalizeShopsPathSegmentToId("shops300")).toBe(300);
  });

  it("不正なセグメントは null を返す", () => {
    expect(normalizeShopsPathSegmentToId("shops000")).toBeNull();
    expect(normalizeShopsPathSegmentToId("shops301")).toBeNull();
    expect(normalizeShopsPathSegmentToId("shopsabc")).toBeNull();
    expect(normalizeShopsPathSegmentToId("001")).toBeNull();
  });
});

describe("formatShopIdToCode", () => {
  it("数値IDを3桁コードへ変換する", () => {
    expect(formatShopIdToCode(1)).toBe("001");
    expect(formatShopIdToCode(300)).toBe("300");
  });

  it("範囲外や整数以外は null を返す", () => {
    expect(formatShopIdToCode(0)).toBeNull();
    expect(formatShopIdToCode(301)).toBeNull();
    expect(formatShopIdToCode(1.2)).toBeNull();
  });
});
