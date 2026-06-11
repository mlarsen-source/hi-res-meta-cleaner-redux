import { describe, it, expect } from "vitest";
import { removeEmptyFields } from "@/app/lib/utils/objectHelpers";

describe("removeEmptyFields", () => {
  it("strips null values", () => {
    expect(removeEmptyFields({ a: null, b: "keep" })).toEqual({ b: "keep" });
  });

  it("strips undefined values", () => {
    expect(removeEmptyFields({ a: undefined, b: 1 })).toEqual({ b: 1 });
  });

  it("keeps zero", () => {
    expect(removeEmptyFields({ a: 0, b: null })).toEqual({ a: 0 });
  });

  it("keeps empty string", () => {
    expect(removeEmptyFields({ a: "", b: null })).toEqual({ a: "" });
  });

  it("keeps false", () => {
    expect(removeEmptyFields({ a: false, b: undefined })).toEqual({ a: false });
  });
});
