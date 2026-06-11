"use client";

import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/app/lib/client/fetchWithAuth";
import type { AudioFileRecord } from "@/app/types/audio";

export function useCollection() {
  const [files, setFiles] = useState<AudioFileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/metadata");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to load collection");
        return;
      }
      const data = await res.json();
      setFiles(data as AudioFileRecord[]);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  function updateFile(updated: AudioFileRecord) {
    setFiles((prev) => prev.map((f) => (f.file_id === updated.file_id ? updated : f)));
  }

  return { files, loading, error, refresh, updateFile };
}
