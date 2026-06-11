import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAuthError } from "@/app/lib/auth/authenticateRequest";
import { AudioFile, Metadata } from "@/app/lib/db/models";
import { mapAudioFileResponse } from "@/app/lib/utils/responseMappers";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isAuthError(auth)) return auth.error;

  const { user_id, newAccessCookie } = auth;

  const files = await AudioFile.findAll({
    where: { user_id },
    include: [{ model: Metadata, required: false }],
    order: [["upload_date", "ASC"]],
  });

  const response = NextResponse.json(
    files.map((f) => mapAudioFileResponse(f as Parameters<typeof mapAudioFileResponse>[0])),
    { status: 200 }
  );
  if (newAccessCookie) response.headers.set("Set-Cookie", newAccessCookie);
  return response;
}
