import NodeID3 from "node-id3";
import fs from "fs/promises";
import type { Metadata } from "../db/models/Metadata";

type MetadataInstance = InstanceType<typeof Metadata>;

export async function writeMetadataToFile(
  inputPath: string,
  outputPath: string,
  meta: MetadataInstance
): Promise<void> {
  const isMp3 = meta.type?.toUpperCase() === "MP3";

  if (!isMp3) {
    await fs.copyFile(inputPath, outputPath);
    return;
  }

  const tags: NodeID3.Tags = {};
  if (meta.title) tags.title = meta.title;
  if (meta.artist) tags.artist = meta.artist;
  if (meta.album) tags.album = meta.album;
  if (meta.year) tags.year = String(meta.year);
  if (meta.genre) tags.genre = meta.genre;
  if (meta.track) tags.trackNumber = String(meta.track);
  if (meta.comment) tags.comment = { language: "eng", text: meta.comment };
  if (meta.album_artist) tags.performerInfo = meta.album_artist;
  if (meta.composer) tags.composer = meta.composer;
  if (meta.discnumber) tags.partOfSet = String(meta.discnumber);

  const buffer = await fs.readFile(inputPath);
  const written = NodeID3.write(tags, buffer);
  await fs.writeFile(outputPath, written);
}
