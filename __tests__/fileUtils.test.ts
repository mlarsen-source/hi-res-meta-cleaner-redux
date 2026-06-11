import { describe, it, expect } from "vitest";
import { isAudioFile, splitFilenameAndExtension, getFileType } from "@/app/lib/client/fileUtils";

function makeFile(name: string, type: string): File {
  return new File([""], name, { type });
}

describe("isAudioFile", () => {
  it("returns true for audio/* MIME types", () => {
    expect(isAudioFile(makeFile("track.mp3", "audio/mpeg"))).toBe(true);
    expect(isAudioFile(makeFile("track.flac", "audio/flac"))).toBe(true);
    expect(isAudioFile(makeFile("track.wav", "audio/wav"))).toBe(true);
  });

  it("returns false for non-audio MIME types", () => {
    expect(isAudioFile(makeFile("image.jpg", "image/jpeg"))).toBe(false);
    expect(isAudioFile(makeFile("video.mp4", "video/mp4"))).toBe(false);
    expect(isAudioFile(makeFile("doc.pdf", "application/pdf"))).toBe(false);
  });
});

describe("splitFilenameAndExtension", () => {
  it("splits normal filename", () => {
    expect(splitFilenameAndExtension("track.mp3")).toEqual({ base: "track", ext: "mp3" });
  });

  it("handles filename with no extension", () => {
    expect(splitFilenameAndExtension("noext")).toEqual({ base: "noext", ext: "" });
  });

  it("handles multiple dots — uses last", () => {
    expect(splitFilenameAndExtension("my.album.track.flac")).toEqual({
      base: "my.album.track",
      ext: "flac",
    });
  });

  it("handles hidden files (dotfile with no ext)", () => {
    expect(splitFilenameAndExtension(".hidden")).toEqual({ base: ".hidden", ext: "" });
  });
});

describe("getFileType", () => {
  it("returns uppercase extension", () => {
    expect(getFileType(makeFile("track.mp3", "audio/mpeg"))).toBe("MP3");
  });

  it("returns UNKNOWN for no extension", () => {
    expect(getFileType(makeFile("noext", "audio/mpeg"))).toBe("UNKNOWN");
  });
});
