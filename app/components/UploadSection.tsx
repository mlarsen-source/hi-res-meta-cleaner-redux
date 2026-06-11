"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { useUpload } from "@/app/hooks/useUpload";
import { handleFileChange } from "@/app/lib/client/fileUtils";

interface UploadSectionProps {
  onUploaded: () => void;
}

export function UploadSection({ onUploaded }: UploadSectionProps) {
  const { upload, uploading, uploadError, setUploadError } = useUpload();
  const [dragging, setDragging] = useState(false);
  const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: File[]) {
    setInvalidFiles([]);
    setUploadError(null);
    const { error } = await upload(files);
    if (!error) onUploaded();
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files, processFiles, (name) =>
      setInvalidFiles((prev) => [...prev, name])
    );
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    handleFileChange(e.target.files, processFiles, (name) =>
      setInvalidFiles((prev) => [...prev, name])
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mb-6">
      <div
        data-testid="drop-zone"
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={onInputChange}
          data-testid="file-input"
        />
        <p className="text-gray-500">
          {uploading ? "Uploading…" : "Drag & drop audio files here, or click to browse"}
        </p>
      </div>

      {uploadError && (
        <p className="mt-2 text-sm text-red-600" data-testid="upload-error">
          {uploadError}
        </p>
      )}
      {invalidFiles.length > 0 && (
        <p className="mt-2 text-sm text-orange-600">
          Skipped non-audio files: {invalidFiles.join(", ")}
        </p>
      )}
    </div>
  );
}
