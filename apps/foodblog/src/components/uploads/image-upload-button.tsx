'use client';

import { Button } from '@bloghost/ui';
import type { PutBlobResult } from '@vercel/blob';
import { upload } from '@vercel/blob/client';
import { useRef, useState } from 'react';

import { MAX_UPLOAD_BYTES, SUPPORTED_CONTENT_TYPES } from '@/lib/uploads/blob-pathname';

export interface ImageUploadButtonProps {
  /**
   * Builds the canonical blob pathname for the picked file. Throwing here is
   * how a caller rejects a file, and the message is shown to the cook.
   */
  buildPathname: (contentType: string) => string;
  onUploaded: (blob: PutBlobResult) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Uploads one image from the browser straight to Vercel Blob.
 *
 * The picker is hidden behind a button so this drops into an existing form
 * without bringing a file input's default styling with it.
 */
export function ImageUploadButton({
  buildPathname,
  onUploaded,
  label = 'Upload image',
  disabled = false,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `That image is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      );
      return;
    }

    let pathname: string;

    try {
      pathname = buildPathname(file.type);
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : String(buildError));
      return;
    }

    setIsUploading(true);
    setPercentage(0);

    try {
      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        onUploadProgress: (progress) => setPercentage(progress.percentage),
      });

      onUploaded(blob);
    } catch (uploadError) {
      setError(describeUploadError(uploadError));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="stack">
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_CONTENT_TYPES.join(',')}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Clearing the value lets the same file be picked again after a failure.
          event.target.value = '';
          if (file) void uploadFile(file);
        }}
      />

      <div className="row">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? `Uploading ${Math.round(percentage)}%…` : label}
        </Button>
      </div>

      {error ? (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The Blob client collapses any non-2xx response from `/api/uploads` into one
 * generic message, so point at the route instead of repeating a dead end.
 */
function describeUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/retrieve the client token/i.test(message)) {
    return `${message} — /api/uploads refused the upload. Check that you are still signed in.`;
  }

  return message;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
