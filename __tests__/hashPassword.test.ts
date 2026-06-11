import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/app/lib/auth/hashPassword";

describe("hashPassword", () => {
  it("hashing produces a bcrypt string", async () => {
    const hash = await hashPassword("password123");
    expect(hash).toMatch(/^\$2b\$/);
  });

  it("verifyPassword returns true for correct input", async () => {
    const hash = await hashPassword("correcthorse");
    expect(await verifyPassword("correcthorse", hash)).toBe(true);
  });

  it("verifyPassword returns false for wrong input", async () => {
    const hash = await hashPassword("correcthorse");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });
});
