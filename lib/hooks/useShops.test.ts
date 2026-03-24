import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useShops } from "./useShops";

describe("useShops", () => {
  const mockShops = [
    { id: "1", name: "Shop 1" },
    { id: "2", name: "Shop 2" },
  ];

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should initially set isLoading to true and shops to empty array", () => {
    // We want to test the initial state before fetch resolves.
    // By providing a promise that doesn't resolve immediately, we can check the initial state.
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useShops());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.shops).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should fetch shops successfully", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ shops: mockShops }),
    } as Response);

    const { result } = renderHook(() => useShops());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shops).toEqual(mockShops);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useShops());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shops).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed to load shops: 500");
  });

  it("should handle network error", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useShops());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shops).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should handle invalid payload (not an array)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ shops: "invalid" }),
    } as Response);

    const { result } = renderHook(() => useShops());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shops).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not update state if unmounted (cancelled)", async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(global.fetch).mockImplementation(() => fetchPromise as Promise<Response>);

    const { result, unmount } = renderHook(() => useShops());

    expect(result.current.isLoading).toBe(true);

    unmount();

    resolveFetch!({
      ok: true,
      json: async () => ({ shops: mockShops }),
    });

    // We can't easily wait for a state update that shouldn't happen,
    // but we can ensure that after resolving, the state isn't updated on the unmounted component.
    // In React 18+ renderHook with act, it might complain if state updates after unmount.
    // Vitest doesn't have a direct way to assert "no state update occurred", but we can check the result.

    // Give it a tiny bit of time to settle in case it would have updated
    await new Promise((r) => setTimeout(r, 50));

    expect(result.current.isLoading).toBe(true); // Should remain at its last state before unmount
    expect(result.current.shops).toEqual([]);
  });
});
