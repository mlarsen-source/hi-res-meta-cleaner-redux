export const EDITABLE_METADATA_FIELDS = [
  "title",
  "artist",
  "album",
  "year",
  "genre",
  "track",
  "comment",
  "album_artist",
  "composer",
  "discnumber",
] as const;

export type EditableMetadataField = (typeof EDITABLE_METADATA_FIELDS)[number];

export function isEditableMetadataField(field: string): field is EditableMetadataField {
  return (EDITABLE_METADATA_FIELDS as readonly string[]).includes(field);
}
