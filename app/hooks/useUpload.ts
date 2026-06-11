"use client";

import { useState } from "react";
import { fetchWithAuth } from "@/app/lib/client/fetchWithAuth";
import type { UploadedFileRecord } from "@/app/types/audio";

interface UploadResult {
  uploaded: UploadedFileRecord[];
  error: string | null;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(files: File[]): Promise<UploadResult> {
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const res = await fetchWithAuth("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        const err = (data as { error?: string }).error ?? "Upload failed";
        setUploadError(err);
        return { uploaded: [], error: err };
      }

      return { uploaded: data as UploadedFileRecord[], error: null };
    } catch {
      const err = "Network error during upload";
      setUploadError(err);
      return { uploaded: [], error: err };
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, uploadError, setUploadError };
}
