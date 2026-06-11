import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test_access_secret_at_least_32_characters";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_at_least_32_characters";
  process.env.JWT_ACCESS_EXPIRES_IN = "1h";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
});

describe("JWT helpers", () => {
  it("access token round-trips user_id", async () => {
    const { generateAccessToken, verifyAccessToken } = await import("@/app/lib/auth/jwt");
    const token = generateAccessToken(42);
    const decoded = verifyAccessToken(token);
    expect(decoded.user_id).toBe(42);
  });

  it("refresh token round-trips user_id", async () => {
    const { generateRefreshToken, verifyRefreshToken } = await import("@/app/lib/auth/jwt");
    const token = generateRefreshToken(99);
    const decoded = verifyRefreshToken(token);
    expect(decoded.user_id).toBe(99);
  });

  it("expired access token throws", async () => {
    const { verifyAccessToken } = await import("@/app/lib/auth/jwt");
    const jwt = await import("jsonwebtoken");
    const expired = jwt.default.sign({ user_id: 1 }, "test_access_secret_at_least_32_characters", {
      expiresIn: -1,
    });
    expect(() => verifyAccessToken(expired)).toThrow();
  });

  it("wrong secret throws", async () => {
    const { verifyAccessToken } = await import("@/app/lib/auth/jwt");
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign({ user_id: 1 }, "wrong_secret");
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
