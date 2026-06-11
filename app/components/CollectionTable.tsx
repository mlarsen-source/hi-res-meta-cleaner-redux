"use client";

import { useState } from "react";
import { FileRow } from "./FileRow";
import { fetchWithAuth } from "@/app/lib/client/fetchWithAuth";
import type { AudioFileRecord } from "@/app/types/audio";

type SortKey = "original_filename" | "title" | "artist" | "album" | "year";

const HEADERS: { key: SortKey | null; label: string }[] = [
  { key: "original_filename", label: "Filename" },
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
  { key: "year", label: "Year" },
  { key: null, label: "Genre" },
  { key: null, label: "Track" },
];

interface CollectionTableProps {
  files: AudioFileRecord[];
  onFileUpdated: (updated: AudioFileRecord) => void;
}

export function CollectionTable({ files, onFileUpdated }: CollectionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("original_filename");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const allSelected = files.length > 0 && selectedIds.size === files.length;

  function toggleSelect(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.file_id)));
    }
  }

  async function downloadSelected() {
    setDownloading(true);
    try {
      const res = await fetchWithAuth("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [...selectedIds] }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audio-files.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function getValue(file: AudioFileRecord, key: SortKey): string {
    if (key === "original_filename") return file.original_filename.toLowerCase();
    const val = file.metadata?.[key as keyof typeof file.metadata];
    return val !== null && val !== undefined ? String(val).toLowerCase() : "";
  }

  const sorted = [...files].sort((a, b) => {
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  function onHeaderClick(key: SortKey | null) {
    if (!key) return;
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-400 mt-4" data-testid="empty-collection">
        No audio files uploaded yet.
      </p>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={downloadSelected}
          disabled={selectedIds.size === 0 || downloading}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="download-button"
        >
          {downloading
            ? "Preparing…"
            : selectedIds.size > 0
              ? `Download (${selectedIds.size})`
              : "Download"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" data-testid="collection-table">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  data-testid="select-all-checkbox"
                />
              </th>
              {HEADERS.map(({ key, label }) => (
                <th
                  key={label}
                  onClick={() => onHeaderClick(key)}
                  className={`px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide
                  ${key ? "cursor-pointer hover:text-blue-600 select-none" : ""}`}
                >
                  {label}
                  {key === sortKey && <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((file) => (
              <FileRow
                key={file.file_id}
                file={file}
                onUpdated={onFileUpdated}
                selected={selectedIds.has(file.file_id)}
                onSelect={toggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
