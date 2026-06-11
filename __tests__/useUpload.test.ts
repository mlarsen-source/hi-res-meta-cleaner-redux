import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/app/lib/client/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
}));

const { fetchWithAuth } = await import("@/app/lib/client/fetchWithAuth");
const mockFetch = fetchWithAuth as ReturnType<typeof vi.fn>;

function makeFile(name: string): File {
  return new File(["audio"], name, { type: "audio/mpeg" });
}

describe("useUpload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts FormData and returns uploaded records on success", async () => {
    const uploaded = [{ file_id: 1, original_filename: "track.mp3", metadata: null }];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => uploaded });

    const { useUpload } = await import("@/app/hooks/useUpload");
    const { result } = renderHook(() => useUpload());

    let uploadResult: Awaited<ReturnType<typeof result.current.upload>>;
    await act(async () => {
      uploadResult = await result.current.upload([makeFile("track.mp3")]);
    });

    expect(uploadResult!.uploaded).toEqual(uploaded);
    expect(uploadResult!.error).toBeNull();
    expect(result.current.uploading).toBe(false);
  });

  it("returns error on 409 duplicate response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'File "track.mp3" already exists' }),
    });

    const { useUpload } = await import("@/app/hooks/useUpload");
    const { result } = renderHook(() => useUpload());

    let uploadResult: Awaited<ReturnType<typeof result.current.upload>>;
    await act(async () => {
      uploadResult = await result.current.upload([makeFile("track.mp3")]);
    });

    expect(uploadResult!.error).toContain("already exists");
    expect(uploadResult!.uploaded).toHaveLength(0);
  });

  it("returns error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { useUpload } = await import("@/app/hooks/useUpload");
    const { result } = renderHook(() => useUpload());

    let uploadResult: Awaited<ReturnType<typeof result.current.upload>>;
    await act(async () => {
      uploadResult = await result.current.upload([makeFile("track.mp3")]);
    });

    expect(uploadResult!.error).toBe("Network error during upload");
  });
});
