import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authenticateRequest, isAuthError } from "@/app/lib/auth/authenticateRequest";
import { AudioFile, Metadata } from "@/app/lib/db/models";
import { extractAndStoreMetadata } from "@/app/lib/metadata/extractMetadata";
import { mapUploadedFileResponse } from "@/app/lib/utils/responseMappers";

const UPLOADS_DIR = "uploads";
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

function isAudioMime(type: string): boolean {
  return type.startsWith("audio/");
}

async function cleanupFiles(filePaths: string[]): Promise<void> {
  await Promise.all(filePaths.map((p) => fs.unlink(p).catch(() => {})));
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isAuthError(auth)) return auth.error;

  const { user_id, newAccessCookie } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request" }, { status: 400 });
  }

  const rawFiles = formData.getAll("files");
  const files = rawFiles.filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Validate MIME types and sizes
  for (const file of files) {
    if (!isAudioMime(file.type)) {
      return NextResponse.json({ error: `${file.name} is not an audio file` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `${file.name} exceeds the 200 MB limit` }, { status: 400 });
    }
  }

  // Check within-batch duplicates
  const names = files.map((f) => f.name);
  const batchDup = names.find((n, i) => names.indexOf(n) !== i);
  if (batchDup) {
    return NextResponse.json(
      { error: `File "${batchDup}" appears twice in the upload` },
      { status: 409 }
    );
  }

  // Check DB duplicates
  for (const file of files) {
    const existing = await AudioFile.findOne({
      where: { user_id, original_filename: file.name },
    });
    if (existing) {
      return NextResponse.json({ error: `File "${file.name}" already exists` }, { status: 409 });
    }
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const writtenPaths: string[] = [];

  try {
    const uploaded: { file_id: number; filename: string; original_filename: string }[] = [];

    for (const file of files) {
      const storedFilename = `${uuidv4()}-${file.name}`;
      const filePath = path.join(UPLOADS_DIR, storedFilename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      writtenPaths.push(filePath);

      const record = await AudioFile.create({
        user_id,
        filename: storedFilename,
        original_filename: file.name,
      });

      uploaded.push({
        file_id: record.file_id,
        filename: record.filename,
        original_filename: record.original_filename,
      });
    }

    const withMeta = await Promise.all(
      uploaded.map(async (f) => {
        const meta = await extractAndStoreMetadata(f);
        return mapUploadedFileResponse(f, meta);
      })
    );

    const response = NextResponse.json(withMeta, { status: 201 });
    if (newAccessCookie) response.headers.set("Set-Cookie", newAccessCookie);
    return response;
  } catch (err) {
    await cleanupFiles(writtenPaths);
    throw err;
  }
}
