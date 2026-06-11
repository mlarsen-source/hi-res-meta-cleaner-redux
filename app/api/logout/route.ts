import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, serializeCookie } from "@/app/lib/auth/jwt";

export async function POST() {
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  response.headers.append("Set-Cookie", serializeCookie(ACCESS_COOKIE, "", clearOptions));
  response.headers.append("Set-Cookie", serializeCookie(REFRESH_COOKIE, "", clearOptions));
  return response;
}
