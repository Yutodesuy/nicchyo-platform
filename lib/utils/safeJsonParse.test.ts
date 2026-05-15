import { describe, it, expect } from "vitest";
import { safeJsonParse } from "./safeJsonParse";

describe("safeJsonParse", () => {
  it("正常なJSONをパースして返す", () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("配列もパースできる", () => {
    expect(safeJsonParse("[1,2,3]", [])).toEqual([1, 2, 3]);
  });

  it("不正なJSONはfallbackを返す", () => {
    expect(safeJsonParse("not json", { default: true })).toEqual({ default: true });
  });

  it("nullはfallbackを返す", () => {
    expect(safeJsonParse(null, "fallback")).toBe("fallback");
  });

  it("undefinedはfallbackを返す", () => {
    expect(safeJsonParse(undefined, 42)).toBe(42);
  });

  it("空文字はfallbackを返す", () => {
    expect(safeJsonParse("", [])).toEqual([]);
  });

  it("数値文字列をパースできる", () => {
    expect(safeJsonParse("123", 0)).toBe(123);
  });

  it("ネストされたオブジェクトをパースできる", () => {
    const raw = '{"user":{"name":"太郎","age":30}}';
    expect(safeJsonParse(raw, null)).toEqual({ user: { name: "太郎", age: 30 } });
  });

  it('"null"文字列はnullを返す（fallbackではなくJSON.parseの結果）', () => {
    // JSON.parse("null") === null のため、fallback ではなく null が返る
    // 呼び出し側で !result チェックをしている場合は null も fallback と同等に扱われる点に注意
    expect(safeJsonParse("null", "fallback")).toBeNull();
  });
});
