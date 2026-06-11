"use client";

import { useState, KeyboardEvent } from "react";
import { fetchWithAuth } from "@/app/lib/client/fetchWithAuth";
import type { AudioFileRecord, AudioMetadata } from "@/app/types/audio";

type ColumnKey = keyof AudioMetadata | "original_filename";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "original_filename", label: "Filename" },
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
  { key: "year", label: "Year" },
  { key: "genre", label: "Genre" },
  { key: "track", label: "Track" },
];

interface FileRowProps {
  file: AudioFileRecord;
  onUpdated: (updated: AudioFileRecord) => void;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
}

export function FileRow({ file, onUpdated, selected, onSelect }: FileRowProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  function getValue(key: ColumnKey): string {
    if (key === "original_filename") return file.original_filename;
    const val = file.metadata?.[key];
    return val !== null && val !== undefined ? String(val) : "";
  }

  function startEdit(key: ColumnKey) {
    setEditingKey(key);
    setEditValue(getValue(key));
  }

  async function commitEdit() {
    if (!editingKey || editValue === getValue(editingKey as ColumnKey)) {
      setEditingKey(null);
      return;
    }

    setSaving(true);
    const body: Record<string, unknown> = { file_id: file.file_id };

    if (editingKey === "original_filename") {
      body.filename = editValue;
    } else {
      const numericKeys = new Set(["year", "track", "discnumber"]);
      body[editingKey] =
        numericKeys.has(editingKey) && editValue !== "" ? Number(editValue) : editValue || null;
    }

    const res = await fetchWithAuth("/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated: AudioFileRecord = { ...file };
      if (editingKey === "original_filename") {
        updated.original_filename = editValue;
      } else {
        updated.metadata = {
          ...(file.metadata ?? {
            title: null,
            artist: null,
            album: null,
            year: null,
            genre: null,
            track: null,
            comment: null,
            album_artist: null,
            composer: null,
            discnumber: null,
            type: null,
            size: null,
          }),
          [editingKey]: body[editingKey],
        } as AudioMetadata;
      }
      onUpdated(updated);
    }

    setSaving(false);
    setEditingKey(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditingKey(null);
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(file.file_id, e.target.checked)}
          data-testid={`checkbox-${file.file_id}`}
        />
      </td>
      {COLUMNS.map(({ key }) => (
        <td
          key={key}
          className="px-3 py-2 text-sm cursor-pointer"
          onClick={() => !saving && startEdit(key)}
          data-testid={`cell-${key}-${file.file_id}`}
        >
          {editingKey === key ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={onKeyDown}
              className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm outline-none"
              data-testid={`input-${key}-${file.file_id}`}
            />
          ) : (
            <span>{getValue(key) || <span className="text-gray-300">—</span>}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
