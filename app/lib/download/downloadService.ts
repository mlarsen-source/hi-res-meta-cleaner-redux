import archiver from "archiver";
import fs from "fs";
import path from "path";
import { AudioFile, Metadata } from "../db/models";
import { Op } from "sequelize";
import { writeMetadataToFile } from "../metadata/writeMetadata";

const UPLOADS_DIR = "uploads";
const TEMP_DIR = "temp";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function tempPath(filename: string): string {
  return path.join(TEMP_DIR, `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`);
}

type AudioFileWithMeta = AudioFile & { metadata?: InstanceType<typeof Metadata> | null };

async function processOne(
  file: AudioFileWithMeta
): Promise<{ tempPath: string; originalName: string } | null> {
  const inputPath = path.join(UPLOADS_DIR, file.filename);
  if (!fs.existsSync(inputPath)) return null;

  const out = tempPath(file.filename);
  if (file.metadata) {
    await writeMetadataToFile(inputPath, out, file.metadata as InstanceType<typeof Metadata>);
  } else {
    fs.copyFileSync(inputPath, out);
  }
  return { tempPath: out, originalName: file.original_filename };
}

export async function prepareFilesForDownload(
  userId: number,
  fileIds: number[]
): Promise<{ tempPath: string; originalName: string }[]> {
  const files = (await AudioFile.findAll({
    where: { user_id: userId, file_id: { [Op.in]: fileIds } },
    include: [{ model: Metadata, required: false }],
  })) as AudioFileWithMeta[];

  if (!files.length) return [];

  ensureDir(TEMP_DIR);

  const results = await Promise.all(files.map(processOne));
  return results.filter((r): r is { tempPath: string; originalName: string } => r !== null);
}

export function buildZipStream(
  files: { tempPath: string; originalName: string }[]
): ReadableStream<Uint8Array> {
  const archive = archiver("zip", { zlib: { level: 9 } });

  const cleanup = () => {
    files.forEach(({ tempPath: p }) => {
      try {
        fs.unlinkSync(p);
      } catch {
        // ignore cleanup failures
      }
    });
  };

  return new ReadableStream({
    start(controller) {
      archive.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      archive.on("end", () => {
        cleanup();
        controller.close();
      });
      archive.on("error", (err: Error) => {
        cleanup();
        controller.error(err);
      });

      for (const { tempPath: p, originalName } of files) {
        archive.file(p, { name: originalName });
      }

      archive.finalize();
    },
  });
}
