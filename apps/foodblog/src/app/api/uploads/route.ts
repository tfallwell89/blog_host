import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const PATHNAME_PREFIX = 'recipe-images/';

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

        if (!pathname.startsWith(PATHNAME_PREFIX)) {
          throw new UploadRejected(
            `Uploads must be stored under "${PATHNAME_PREFIX}" (received "${pathname}").`,
            400,
          );
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // eslint-disable-next-line no-console
        console.log(`[uploads] blob stored at ${blob.url}`);
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof UploadRejected ? error.status : 500;
    const message =
      error instanceof Error ? error.message : 'Could not authorize the upload request.';

    return NextResponse.json({ error: message }, { status });
  }
}
