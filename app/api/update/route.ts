import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/app/lib/auth/authenticateRequest";
import { AudioFile, Metadata } from "@/app/lib/db/models";
import { isEditableMetadataField } from "@/app/lib/utils/metadataFields";

const INTEGER_FIELDS = new Set(["year", "track", "discnumber"]);

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isAuthError(auth)) return auth.error;

  const { user_id, newAccessCookie } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { file_id, filename, ...rest } = body;

  if (!file_id || typeof file_id !== "number") {
    return NextResponse.json({ error: "file_id is required" }, { status: 400 });
  }

  // Validate metadata field names
  for (const key of Object.keys(rest)) {
    if (!isEditableMetadataField(key)) {
      return NextResponse.json({ error: `Unknown field: ${key}` }, { status: 400 });
    }
    if (INTEGER_FIELDS.has(key) && rest[key] !== null && typeof rest[key] !== "number") {
      return NextResponse.json({ error: `${key} must be an integer` }, { status: 400 });
    }
  }

  const file = await AudioFile.findOne({ where: { file_id, user_id } });
  if (!file) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  if (filename && typeof filename === "string") {
    await AudioFile.update({ original_filename: filename }, { where: { file_id, user_id } });
  }

  await Metadata.upsert({ file_id, ...rest } as any);

  const response = NextResponse.json({ message: "Metadata updated successfully" }, { status: 200 });
  if (newAccessCookie) response.headers.set("Set-Cookie", newAccessCookie);
  return response;
}
