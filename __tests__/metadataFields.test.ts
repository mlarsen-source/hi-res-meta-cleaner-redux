import { describe, it, expect } from "vitest";
import { isEditableMetadataField } from "@/app/lib/utils/metadataFields";

describe("isEditableMetadataField", () => {
  it("returns true for known fields", () => {
    expect(isEditableMetadataField("title")).toBe(true);
    expect(isEditableMetadataField("artist")).toBe(true);
    expect(isEditableMetadataField("album")).toBe(true);
    expect(isEditableMetadataField("year")).toBe(true);
    expect(isEditableMetadataField("genre")).toBe(true);
    expect(isEditableMetadataField("track")).toBe(true);
    expect(isEditableMetadataField("comment")).toBe(true);
    expect(isEditableMetadataField("album_artist")).toBe(true);
    expect(isEditableMetadataField("composer")).toBe(true);
    expect(isEditableMetadataField("discnumber")).toBe(true);
  });

  it("returns false for unknown fields", () => {
    expect(isEditableMetadataField("type")).toBe(false);
    expect(isEditableMetadataField("size")).toBe(false);
    expect(isEditableMetadataField("user_id")).toBe(false);
    expect(isEditableMetadataField("__proto__")).toBe(false);
  });
});
