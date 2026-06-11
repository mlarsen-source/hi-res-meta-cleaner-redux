import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/db/models";
import { verifyPassword } from "@/app/lib/auth/hashPassword";
import {
  generateAccessToken,
  generateRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  serializeCookie,
} from "@/app/lib/auth/jwt";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body as { email?: unknown; password?: unknown };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const foundUser = await User.findOne({ where: { email: String(email) } });
  if (!foundUser) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(String(password), foundUser.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const accessToken = generateAccessToken(foundUser.user_id!);
  const refreshToken = generateRefreshToken(foundUser.user_id!);

  const response = NextResponse.json(
    { user_id: foundUser.user_id, email: foundUser.email },
    { status: 200 }
  );

  response.headers.append(
    "Set-Cookie",
    serializeCookie(ACCESS_COOKIE, accessToken, accessCookieOptions)
  );
  response.headers.append(
    "Set-Cookie",
    serializeCookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
  );

  return response;
}
