import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  ACCESS_COOKIE,
  verifyRefreshToken,
  generateAccessToken,
  accessCookieOptions,
  serializeCookie,
} from "@/app/lib/auth/jwt";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token required" }, { status: 401 });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(decoded.user_id);
    const response = NextResponse.json(
      { message: "Token refreshed successfully" },
      { status: 200 }
    );
    response.headers.set(
      "Set-Cookie",
      serializeCookie(ACCESS_COOKIE, newAccessToken, accessCookieOptions)
    );
    return response;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "TokenExpiredError"
    ) {
      return NextResponse.json(
        { error: "Refresh token expired, please login again" },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
