import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

// Mock the consentClient module with a controllable flag
vi.mock("../../../lib/analytics/consentClient", () => {
  let allowed = true;
  return {
    isAnalyticsAllowed: () => allowed,
    loadGA: vi.fn(),
    __setAllowed: (v: boolean) => {
      allowed = v;
    },
  } as unknown;
});

describe("sendEvent wrapper", () => {
  let sendEvent: (name: string, params?: any, options?: any) => void;
  let consentMock: any;

  beforeEach(async () => {
    // reset globals
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;
    (globalThis as any).window = globalThis as any;
    (globalThis as any).dataLayer = [];
    (globalThis as any).gtag = vi.fn();
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "nicchyo_visitor_id=visitor123",
    });

    // import mocked consent module and the sendEvent module
    consentMock = await import("../../../lib/analytics/consentClient");
    ({ sendEvent } = await import("../../../lib/analytics/sendEvent"));
  });

  afterEach(() => {
    vi.resetAllMocks();
    try {
      delete (globalThis as any).gtag;
      delete (globalThis as any).dataLayer;
    } catch {}
  });

  it("sends dataLayer/gtag and posts to server when allowed and toServer=true", async () => {
    // ensure allowed
    consentMock.__setAllowed(true);

    sendEvent("shop_impression" as any, { shop_id: "shop1", list_position: 2, context: "list" }, { toServer: true });

    // dataLayer push
    expect((globalThis as any).dataLayer.length).toBeGreaterThan(0);
    const pushed = (globalThis as any).dataLayer[(globalThis as any).dataLayer.length - 1];
    expect(pushed.event).toBe("shop_impression");
    expect(pushed.shop_id).toBe("shop1");

    // gtag called
    expect((globalThis as any).gtag).toHaveBeenCalled();

    // fetch called to server API
    expect(globalThis.fetch).toHaveBeenCalled();
    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/analytics/shop-interaction");
  });

  it("does nothing when consent is not allowed", async () => {
    consentMock.__setAllowed(false);

    sendEvent("shop_impression" as any, { shop_id: "shop2" }, { toServer: true });

    expect((globalThis as any).dataLayer.length).toBe(0);
    expect((globalThis as any).gtag).not.toHaveBeenCalled();
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
  });
});
