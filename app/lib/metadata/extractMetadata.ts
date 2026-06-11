import * as musicMetadata from "music-metadata";
import fs from "fs";
import path from "path";
import { Metadata } from "../db/models/Metadata";
import { formatFileSize } from "../utils/formatters";
import type { AudioMetadata } from "../../types/audio";

const UPLOADS_DIR = "uploads";

function getFileInfo(
  filePath: string,
  originalFilename: string
): { type: string | null; size: string | null } {
  const type = path.extname(originalFilename).slice(1).toUpperCase() || null;
  let size: string | null = null;
  try {
    const stats = fs.statSync(filePath);
    size = formatFileSize(stats.size);
  } catch {
    // file may not exist
  }
  return { type, size };
}

function extractCommentText(commentArray: unknown): string | null {
  if (!Array.isArray(commentArray) || commentArray.length === 0) return null;
  const first = commentArray[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "text" in first)
    return String((first as { text: unknown }).text);
  return null;
}

export async function extractAndStoreMetadata(file: {
  file_id: number;
  filename: string;
  original_filename: string;
}): Promise<AudioMetadata | null> {
  const filePath = path.join(UPLOADS_DIR, file.filename);
  const fileInfo = getFileInfo(filePath, file.original_filename);

  let parsed: musicMetadata.IAudioMetadata | null = null;
  try {
    parsed = await musicMetadata.parseFile(filePath);
  } catch {
    // extraction failed — store minimal record
  }

  const record: Partial<AudioMetadata> & { file_id: number } = {
    file_id: file.file_id,
    type: fileInfo.type,
    size: fileInfo.size,
  };

  if (parsed) {
    const c = parsed.common;
    record.title = c.title ?? null;
    record.artist = c.artist ?? null;
    record.album = c.album ?? null;
    record.year = c.year ?? null;
    record.comment = extractCommentText(c.comment);
    record.track = c.track?.no ?? null;
    record.genre = c.genre?.[0] ?? null;
    record.album_artist = c.albumartist ?? null;
    record.composer = (c.composer as string[] | undefined)?.[0] ?? null;
    record.discnumber = c.disk?.no ?? null;
  }

  await Metadata.upsert(record as any);

  return parsed ? (record as AudioMetadata) : null;
}
