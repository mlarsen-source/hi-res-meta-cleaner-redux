import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.stubGlobal("window", { location: { href: "/" } });

describe("fetchWithAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns response when status is not 401", async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });
    const { fetchWithAuth } = await import("@/app/lib/client/fetchWithAuth");
    const res = await fetchWithAuth("/api/metadata");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries once after successful refresh on 401", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 }) // refresh
      .mockResolvedValueOnce({ status: 200, ok: true }); // retry

    const { fetchWithAuth } = await import("@/app/lib/client/fetchWithAuth");
    const res = await fetchWithAuth("/api/metadata");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("redirects to /login when refresh fails", async () => {
    const location = { href: "/" };
    vi.stubGlobal("window", { location });

    mockFetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    const { fetchWithAuth } = await import("@/app/lib/client/fetchWithAuth");
    await fetchWithAuth("/api/metadata");
    expect(location.href).toBe("/login");
  });
});
