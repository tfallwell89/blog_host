'use client';

import { Card, CardContent, CardHeader, Input, Select } from '@bloghost/ui';
import type { PutBlobResult } from '@vercel/blob';
import { useId, useState } from 'react';

import { ImageUploadButton } from '@/components/uploads/image-upload-button';
import {
  RECIPE_IMAGE_PURPOSES,
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
 * The real flows live in the recipe editor and the appearance form; this only
 * exists to exercise a pathname by hand. Delete it once uploads are trusted.
 */
export default function UploadTestPage() {
  const recipeIdInputId = useId();
  const draftIdInputId = useId();
  const blogIdInputId = useId();
  const purposeInputId = useId();

  const [recipeId, setRecipeId] = useState('');
  const [draftId, setDraftId] = useState('');
  const [blogId, setBlogId] = useState('');
  const [purpose, setPurpose] = useState<RecipeImagePurpose>('hero');
  const [blob, setBlob] = useState<PutBlobResult | null>(null);

  function buildPathname(contentType: string): string {
    return buildTargetPathname({ recipeId, draftId, blogId, purpose, contentType });
  }

  const assetId = blob ? parseUploadPathname(blob.pathname).assetId : null;

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
                onChange={(event) => setRecipeId(event.target.value)}
                placeholder="clx9recipe456"
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-sm" htmlFor={draftIdInputId}>
                draftId <span className="muted">→ drafts/&#123;draftId&#125;/…</span>
              </label>
              <Input
                id={draftIdInputId}
                value={draftId}
                onChange={(event) => setDraftId(event.target.value)}
                placeholder="01J5Y7ZKX8"
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-sm" htmlFor={blogIdInputId}>
                blogId <span className="muted">→ blogs/&#123;blogId&#125;/logo/…</span>
              </label>
              <Input
                id={blogIdInputId}
                value={blogId}
                onChange={(event) => setBlogId(event.target.value)}
                placeholder="clx9blog123"
                spellCheck={false}
                autoComplete="off"
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
                onChange={(event) => setPurpose(event.target.value as RecipeImagePurpose)}
                disabled={blogId.trim().length > 0}
              />
            </div>

            <ImageUploadButton
              buildPathname={buildPathname}
              onUploaded={setBlob}
              label="Choose an image and upload"
            />
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
  contentType: string;
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
  contentType,
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
    return buildBlogLogoPathname({ blogId, contentType });
  }

  return buildRecipeImagePathname({
    recipeId: recipeId.trim() || undefined,
    draftId: draftId.trim() || undefined,
    purpose,
    contentType,
  });
}
