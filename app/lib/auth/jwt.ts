import jwt from "jsonwebtoken";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is not set`);
  return val;
}

export function generateAccessToken(userId: number): string {
  return jwt.sign({ user_id: userId }, requireEnv("JWT_ACCESS_SECRET"), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "1h") as jwt.SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ user_id: userId }, requireEnv("JWT_REFRESH_SECRET"), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): { user_id: number } {
  return jwt.verify(token, requireEnv("JWT_ACCESS_SECRET")) as { user_id: number };
}

export function verifyRefreshToken(token: string): { user_id: number } {
  return jwt.verify(token, requireEnv("JWT_REFRESH_SECRET")) as { user_id: number };
}

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60, // 1 hour in seconds (for Set-Cookie header)
  path: "/",
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: "/",
};

export function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
    maxAge?: number;
    path?: string;
  }
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) cookie += "; HttpOnly";
  if (options.secure) cookie += "; Secure";
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${options.maxAge}`;
  if (options.path) cookie += `; Path=${options.path}`;
  return cookie;
}
