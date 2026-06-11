import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/app/lib/auth/authenticateRequest";
import { prepareFilesForDownload, buildZipStream } from "@/app/lib/download/downloadService";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isAuthError(auth)) return auth.error;

  const { user_id } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fileIds } = body as { fileIds?: unknown };

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "fileIds must be a non-empty array" }, { status: 400 });
  }

  if (!fileIds.every((id) => typeof id === "number" && Number.isInteger(id))) {
    return NextResponse.json({ error: "fileIds must be integers" }, { status: 400 });
  }

  const files = await prepareFilesForDownload(user_id, fileIds as number[]);

  if (files.length === 0) {
    return NextResponse.json({ error: "No audio files found" }, { status: 404 });
  }

  const stream = buildZipStream(files);

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="audio-files.zip"',
    },
  });
}
