"use client";

import { useState } from "react";
import { FileRow } from "./FileRow";
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
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse" data-testid="collection-table">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
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
            <FileRow key={file.file_id} file={file} onUpdated={onFileUpdated} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
