'use client';

import { Button, Card, CardContent, CardHeader, Input, Select } from '@bloghost/ui';
import type { PutBlobResult } from '@vercel/blob';
import { upload } from '@vercel/blob/client';
import { useId, useState } from 'react';

import {
  MAX_UPLOAD_BYTES,
  RECIPE_IMAGE_PURPOSES,
  SUPPORTED_CONTENT_TYPES,
  buildBlogLogoPathname,
  buildRecipeImagePathname,
  parseUploadPathname,
  type RecipeImagePurpose,
} from '@/lib/uploads/blob-pathname';

const PURPOSE_OPTIONS = RECIPE_IMAGE_PURPOSES.map((purpose) => ({
  value: purpose,
  label: purpose,
}));

/**
 * Temporary diagnostic page for browser-to-Vercel-Blob uploads.
 *
 * Nothing here is wired into the product: no database writes, no reuse of the
 * recipe editor. Delete it once image uploads ship for real.
 */
export default function UploadTestPage() {
  const recipeIdInputId = useId();
  const draftIdInputId = useId();
  const blogIdInputId = useId();
  const purposeInputId = useId();
  const fileInputId = useId();

  const [recipeId, setRecipeId] = useState('');
  const [draftId, setDraftId] = useState('');
  const [blogId, setBlogId] = useState('');
  const [purpose, setPurpose] = useState<RecipeImagePurpose>('hero');
  const [file, setFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetResult() {
    setBlob(null);
    setAssetId(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file) {
      setError('Choose an image first.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`${formatBytes(file.size)} is over the ${formatBytes(MAX_UPLOAD_BYTES)} limit.`);
      return;
    }

    let target: string;

    try {
      target = buildTargetPathname({ recipeId, draftId, blogId, purpose, file });
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : String(buildError));
      return;
    }

    setIsUploading(true);
    setPercentage(0);
    setBlob(null);
    setAssetId(null);
    setError(null);

    try {
      const result = await upload(target, file, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        onUploadProgress: (progress) => setPercentage(progress.percentage),
      });

      setBlob(result);
      setAssetId(parseUploadPathname(target).assetId);
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
          Uploads one image straight from your browser to Vercel Blob using the canonical pathname
          layout. Nothing is saved to the database.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Build a pathname and upload"
          description="Fill in exactly one id. JPEG, PNG, WebP or AVIF, up to 20 MB."
        />
        <CardContent>
          <div className="stack">
            <div>
              <label className="text-sm" htmlFor={recipeIdInputId}>
                recipeId <span className="muted">→ recipes/&#123;recipeId&#125;/…</span>
              </label>
              <Input
                id={recipeIdInputId}
                value={recipeId}
                onChange={(event) => {
                  setRecipeId(event.target.value);
                  resetResult();
                }}
                placeholder="clx9recipe456"
                spellCheck={false}
                autoComplete="off"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="text-sm" htmlFor={draftIdInputId}>
                draftId <span className="muted">→ drafts/&#123;draftId&#125;/…</span>
              </label>
              <Input
                id={draftIdInputId}
                value={draftId}
                onChange={(event) => {
                  setDraftId(event.target.value);
                  resetResult();
                }}
                placeholder="01J5Y7ZKX8"
                spellCheck={false}
                autoComplete="off"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="text-sm" htmlFor={blogIdInputId}>
                blogId <span className="muted">→ blogs/&#123;blogId&#125;/logo/…</span>
              </label>
              <Input
                id={blogIdInputId}
                value={blogId}
                onChange={(event) => {
                  setBlogId(event.target.value);
                  resetResult();
                }}
                placeholder="clx9blog123"
                spellCheck={false}
                autoComplete="off"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="text-sm" htmlFor={purposeInputId}>
                purpose <span className="muted">(ignored for blogId, which is always logo)</span>
              </label>
              <Select
                id={purposeInputId}
                options={PURPOSE_OPTIONS}
                value={purpose}
                onChange={(event) => {
                  setPurpose(event.target.value as RecipeImagePurpose);
                  resetResult();
                }}
                disabled={isUploading || blogId.trim().length > 0}
              />
            </div>

            <div>
              <label className="text-sm" htmlFor={fileInputId}>
                Image file
              </label>
              <br />
              <input
                id={fileInputId}
                type="file"
                accept={SUPPORTED_CONTENT_TYPES.join(',')}
                disabled={isUploading}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  resetResult();
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
                  <dt className="muted">pathname</dt>
                  <dd>
                    <code>{blob.pathname}</code>
                  </dd>
                </div>
                <div>
                  <dt className="muted">assetId</dt>
                  <dd>
                    <code>{assetId}</code>
                  </dd>
                </div>
                <div>
                  <dt className="muted">url</dt>
                  <dd>
                    <code>{blob.url}</code>
                  </dd>
                </div>
                <div>
                  <dt className="muted">contentType</dt>
                  <dd>
                    <code>{blob.contentType}</code>
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

interface BuildTargetOptions {
  recipeId: string;
  draftId: string;
  blogId: string;
  purpose: RecipeImagePurpose;
  file: File;
}

/**
 * Routes the three id fields onto the matching helper. The helpers own every
 * rule about supported types and identifiers, so this only has to reject the
 * ambiguity the form itself introduces.
 */
function buildTargetPathname({
  recipeId,
  draftId,
  blogId,
  purpose,
  file,
}: BuildTargetOptions): string {
  const supplied = (
    [
      ['recipeId', recipeId.trim()],
      ['draftId', draftId.trim()],
      ['blogId', blogId.trim()],
    ] as const
  ).filter(([, value]) => value.length > 0);

  if (supplied.length === 0) {
    throw new Error('Enter exactly one of recipeId, draftId or blogId.');
  }

  if (supplied.length > 1) {
    throw new Error(
      `Enter only one id — received ${supplied.map(([name]) => name).join(' and ')}.`,
    );
  }

  if (blogId.trim()) {
    return buildBlogLogoPathname({ blogId, contentType: file.type });
  }

  return buildRecipeImagePathname({
    recipeId: recipeId.trim() || undefined,
    draftId: draftId.trim() || undefined,
    purpose,
    contentType: file.type,
  });
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
