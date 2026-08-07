import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_CONTENT_TYPES,
  UploadPathnameError,
  parseUploadPathname,
} from '@/lib/uploads/blob-pathname';

/** Lets the handler below map an authorization failure onto a real status code. */
class UploadRejected extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'UploadRejected';
  }
}

/**
 * Issues short-lived client tokens so the browser can upload recipe images
 * straight to Vercel Blob, keeping the read-write token on the server.
 *
 * Vercel Blob calls this same route a second time to report a finished upload,
 * which only works on a deployed URL — the callback cannot reach localhost.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Expected a JSON request body.' }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();

        if (!user) {
          throw new UploadRejected('You must be signed in to upload images.', 401);
        }

        // The token authorizes exactly one pathname, so this is the only place
        // the canonical layout can be enforced.
        const asset = parseUploadPathname(pathname);

        return {
          allowedContentTypes: [...SUPPORTED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          // The pathname already carries a uuid, and every upload mints a new
          // one, so nothing needs a suffix and nothing can collide.
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            userId: user.id,
            scope: asset.scope,
            ownerId: asset.ownerId,
            purpose: asset.purpose,
            assetId: asset.assetId,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // eslint-disable-next-line no-console
        console.log(`[uploads] blob stored at ${blob.url}`);
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UploadPathnameError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const status = error instanceof UploadRejected ? error.status : 500;
    const message =
      error instanceof Error ? error.message : 'Could not authorize the upload request.';

    return NextResponse.json({ error: message }, { status });
  }
}
