'use client';

import { Button, Card, CardContent, CardHeader } from '@bloghost/ui';
import type { PutBlobResult } from '@vercel/blob';
import { upload } from '@vercel/blob/client';
import { useId, useState } from 'react';

/**
 * Temporary diagnostic page for browser-to-Vercel-Blob uploads.
 *
 * Nothing here is wired into the product: no database writes, no reuse of the
 * recipe editor. Delete it once image uploads ship for real.
 */
export default function UploadTestPage() {
  const fileInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    setIsUploading(true);
    setPercentage(0);
    setBlob(null);
    setError(null);

    try {
      const result = await upload(`recipe-images/test/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        onUploadProgress: (progress) => setPercentage(progress.percentage),
      });

      setBlob(result);
    } catch (uploadError) {
      setError(describeUploadError(uploadError));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="page page--narrow stack stack--lg" style={{ paddingBlock: '3rem' }}>
      <div>
        <h1>Blob upload test</h1>
        <p className="muted">
          Uploads one image straight from your browser to Vercel Blob under{' '}
          <code>recipe-images/test/</code>. Nothing is saved to the database.
        </p>
      </div>

      <Card>
        <CardHeader title="Pick an image" description="JPEG, PNG, WebP or AVIF, up to 20 MB." />
        <CardContent>
          <div className="stack">
            <div>
              <label className="text-sm" htmlFor={fileInputId}>
                Image file
              </label>
              <br />
              <input
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={isUploading}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setBlob(null);
                  setError(null);
                }}
              />
            </div>

            <div className="row">
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? 'Uploading…' : 'Upload image'}
              </Button>
              {file ? (
                <span className="muted text-sm">
                  {file.name} · {formatBytes(file.size)} · {file.type || 'unknown type'}
                </span>
              ) : null}
            </div>

            {isUploading ? (
              <div className="stack">
                <progress max={100} value={percentage} />
                <span className="muted text-sm">{Math.round(percentage)}% uploaded</span>
              </div>
            ) : null}

            {error ? (
              <p className="alert alert--error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {blob ? (
        <Card>
          <CardHeader title="Upload succeeded" description="The blob is public and live now." />
          <CardContent>
            <div className="stack">
              <img
                src={blob.url}
                alt="The image that was just uploaded"
                style={{ borderRadius: 'var(--ui-radius-md)' }}
              />

              <p className="text-sm">
                <a href={blob.url} target="_blank" rel="noreferrer">
                  {blob.url}
                </a>
              </p>

              <dl className="text-sm stack">
                <div>
                  <dt className="muted">url</dt>
                  <dd>
                    <code>{blob.url}</code>
                  </dd>
                </div>
                <div>
                  <dt className="muted">pathname</dt>
                  <dd>
                    <code>{blob.pathname}</code>
                  </dd>
                </div>
                <div>
                  <dt className="muted">contentType</dt>
                  <dd>
                    <code>{blob.contentType}</code>
                  </dd>
                </div>
                <div>
                  <dt className="muted">downloadUrl</dt>
                  <dd>
                    <code>{blob.downloadUrl}</code>
                  </dd>
                </div>
              </dl>

              <pre className="text-sm" style={{ overflowX: 'auto' }}>
                {JSON.stringify(blob, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

/**
 * The Blob client collapses any non-2xx response from `/api/uploads` into one
 * generic message, so point at the route instead of repeating a dead end.
 */
function describeUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/retrieve the client token/i.test(message)) {
    return `${message} — /api/uploads refused to authorize this upload. Check that you are signed in and look at the server logs for the reason.`;
  }

  return message;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
