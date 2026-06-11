import { AudioFile } from "../db/models/AudioFile";
import { Metadata } from "../db/models/Metadata";
import type { AudioFileRecord, AudioMetadata, UploadedFileRecord } from "../../types/audio";

function mapMetadata(meta: Metadata | null | undefined): AudioMetadata | null {
  if (!meta) return null;
  return {
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    year: meta.year,
    genre: meta.genre,
    track: meta.track,
    comment: meta.comment,
    album_artist: meta.album_artist,
    composer: meta.composer,
    discnumber: meta.discnumber,
    type: meta.type,
    size: meta.size,
  };
}

export function mapAudioFileResponse(
  file: AudioFile & { metadata?: Metadata | null }
): AudioFileRecord {
  return {
    file_id: file.file_id,
    user_id: file.user_id,
    filename: file.filename,
    original_filename: file.original_filename,
    upload_date: file.upload_date?.toISOString() ?? new Date().toISOString(),
    metadata: mapMetadata(file.metadata),
  };
}

export function mapUploadedFileResponse(
  file: { file_id: number; original_filename: string },
  extractedMetadata?: AudioMetadata | null
): UploadedFileRecord {
  return {
    file_id: file.file_id,
    original_filename: file.original_filename,
    metadata: extractedMetadata ?? null,
  };
}
