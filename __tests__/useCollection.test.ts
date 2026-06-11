import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { AudioFileRecord } from "@/app/types/audio";

vi.mock("@/app/lib/client/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
}));

const { fetchWithAuth } = await import("@/app/lib/client/fetchWithAuth");
const mockFetch = fetchWithAuth as ReturnType<typeof vi.fn>;

const sampleFile: AudioFileRecord = {
  file_id: 1,
  user_id: 1,
  filename: "uuid-track.mp3",
  original_filename: "track.mp3",
  upload_date: new Date().toISOString(),
  metadata: null,
};

describe("useCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls /api/metadata when refresh() is invoked", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const { useCollection } = await import("@/app/hooks/useCollection");
    const { result } = renderHook(() => useCollection());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/metadata");
  });

  it("sets files on successful refresh", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [sampleFile] });
    const { useCollection } = await import("@/app/hooks/useCollection");
    const { result } = renderHook(() => useCollection());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.files).toEqual([sampleFile]));
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });
    const { useCollection } = await import("@/app/hooks/useCollection");
    const { result } = renderHook(() => useCollection());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.error).toBe("Unauthorized"));
  });

  it("sets error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { useCollection } = await import("@/app/hooks/useCollection");
    const { result } = renderHook(() => useCollection());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.error).toBe("Network error"));
  });

  it("updateFile updates the file in the list without a refetch", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [sampleFile] });
    const { useCollection } = await import("@/app/hooks/useCollection");
    const { result } = renderHook(() => useCollection());

    await act(async () => {
      await result.current.refresh();
    });

    const updated = { ...sampleFile, original_filename: "renamed.mp3" };
    act(() => {
      result.current.updateFile(updated);
    });

    expect(result.current.files[0].original_filename).toBe("renamed.mp3");
    expect(mockFetch).toHaveBeenCalledTimes(1); // no additional fetch
  });
});
