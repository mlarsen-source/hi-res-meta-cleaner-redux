"use client";

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/");
}

export function splitFilenameAndExtension(name: string): { base: string; ext: string } {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, lastDot), ext: name.slice(lastDot + 1) };
}

export function getFileType(file: File): string {
  const { ext } = splitFilenameAndExtension(file.name);
  return ext.toUpperCase() || "UNKNOWN";
}

export function handleFileChange(
  fileList: FileList | null,
  onValid: (files: File[]) => void,
  onInvalid: (name: string) => void
): void {
  if (!fileList) return;
  const valid: File[] = [];
  for (const file of Array.from(fileList)) {
    if (isAudioFile(file)) {
      valid.push(file);
    } else {
      onInvalid(file.name);
    }
  }
  if (valid.length > 0) onValid(valid);
}
