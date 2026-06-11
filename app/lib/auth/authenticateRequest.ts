import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  accessCookieOptions,
  serializeCookie,
} from "./jwt";

export type AuthResult = { user_id: number; newAccessCookie?: string } | { error: NextResponse };

export function authenticateRequest(request: NextRequest): AuthResult {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      return { user_id: decoded.user_id };
    } catch {
      // fall through to refresh attempt
    }
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(decoded.user_id);
    const newAccessCookie = serializeCookie(ACCESS_COOKIE, newAccessToken, accessCookieOptions);
    return { user_id: decoded.user_id, newAccessCookie };
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

export function isAuthError(result: AuthResult): result is { error: NextResponse } {
  return "error" in result;
}
