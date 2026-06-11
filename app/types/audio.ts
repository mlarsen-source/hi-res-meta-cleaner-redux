export interface AudioMetadata {
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  genre: string | null;
  track: number | null;
  comment: string | null;
  album_artist: string | null;
  composer: string | null;
  discnumber: number | null;
  type: string | null;
  size: string | null;
}

export interface AudioFileRecord {
  file_id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  upload_date: string;
  metadata: AudioMetadata | null;
}

export interface UploadedFileRecord {
  file_id: number;
  original_filename: string;
  metadata: AudioMetadata | null;
}
