import { describe, it, expect } from "vitest";
import { formatFileSize } from "@/app/lib/utils/formatters";

describe("formatFileSize", () => {
  it("formats 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats bytes under 1 KB", () => {
    expect(formatFileSize(512)).toMatch(/B$/);
  });

  it("formats exactly 1 KB", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats MB values", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("formats large GB values", () => {
    const result = formatFileSize(1024 * 1024 * 1024);
    expect(result).toBe("1 GB");
  });

  it("formats fractional values with one decimal", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});
