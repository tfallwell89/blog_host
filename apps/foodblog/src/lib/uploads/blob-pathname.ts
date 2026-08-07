/**
 * Canonical Vercel Blob pathnames for uploaded images.
 *
 * Pathnames are built from opaque identifiers only — never titles, slugs,
 * display names or original filenames. Renaming a recipe therefore never
 * orphans a blob, and an attacker-supplied filename can never smuggle an extra
 * path segment into the store.
 */

export type UploadScope = 'recipes' | 'drafts' | 'blogs';
export type RecipeImagePurpose = 'hero' | 'gallery' | 'step' | 'inline';
export type BlogImagePurpose = 'logo';
export type UploadPurpose = RecipeImagePurpose | BlogImagePurpose;

/**
 * The extension is derived from the validated MIME type rather than from
 * `file.name`, which a browser will happily report as anything.
 */
const CONTENT_TYPE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const;

export type SupportedContentType = keyof typeof CONTENT_TYPE_EXTENSIONS;
export type SupportedExtension = (typeof CONTENT_TYPE_EXTENSIONS)[SupportedContentType];

export const SUPPORTED_CONTENT_TYPES = Object.keys(
  CONTENT_TYPE_EXTENSIONS,
) as readonly SupportedContentType[];

const SUPPORTED_EXTENSIONS = Object.values(
  CONTENT_TYPE_EXTENSIONS,
) as readonly SupportedExtension[];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const RECIPE_IMAGE_PURPOSES: readonly RecipeImagePurpose[] = [
  'hero',
  'gallery',
  'step',
  'inline',
];
const BLOG_IMAGE_PURPOSES: readonly BlogImagePurpose[] = ['logo'];

/** cuid, ulid and uuid all fit; separators, dots and traversal do not. */
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Thrown for every rejected pathname so callers can answer with a 400. */
export class UploadPathnameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadPathnameError';
  }
}

function isSupportedContentType(value: string): value is SupportedContentType {
  return Object.hasOwn(CONTENT_TYPE_EXTENSIONS, value);
}

export function extensionForContentType(contentType: string): SupportedExtension {
  if (!isSupportedContentType(contentType)) {
    throw new UploadPathnameError(
      `Unsupported image type "${contentType || 'unknown'}". Allowed types: ${SUPPORTED_CONTENT_TYPES.join(', ')}.`,
    );
  }

  return CONTENT_TYPE_EXTENSIONS[contentType];
}

/** Blank text inputs arrive as empty strings, which must count as "not given". */
function normalizeId(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildPathname(
  scope: UploadScope,
  ownerId: string,
  purpose: UploadPurpose,
  contentType: string,
  assetId: string | undefined,
): string {
  if (!ID_PATTERN.test(ownerId)) {
    throw new UploadPathnameError(
      `"${ownerId}" is not a usable identifier; use letters, digits, hyphens or underscores only.`,
    );
  }

  const extension = extensionForContentType(contentType);
  const resolvedAssetId = assetId ?? crypto.randomUUID();

  if (!UUID_PATTERN.test(resolvedAssetId)) {
    throw new UploadPathnameError(`Asset id "${resolvedAssetId}" is not a UUID.`);
  }

  return `${scope}/${ownerId}/${purpose}/${resolvedAssetId}.${extension}`;
}

export interface BuildRecipeImagePathnameOptions {
  /** Mutually exclusive with `draftId`. */
  recipeId?: string;
  /** Used until the recipe earns a permanent id. */
  draftId?: string;
  purpose: RecipeImagePurpose;
  contentType: string;
  /** Only supply this from tests; callers otherwise get a fresh uuid. */
  assetId?: string;
}

/**
 * `recipes/{recipeId}/{purpose}/{uuid}.{ext}` for saved recipes, or
 * `drafts/{draftId}/{purpose}/{uuid}.{ext}` while the recipe is still a draft.
 */
export function buildRecipeImagePathname({
  recipeId,
  draftId,
  purpose,
  contentType,
  assetId,
}: BuildRecipeImagePathnameOptions): string {
  const recipe = normalizeId(recipeId);
  const draft = normalizeId(draftId);

  if (recipe && draft) {
    throw new UploadPathnameError(
      'Supply either recipeId or draftId, not both — a blob belongs to one of them.',
    );
  }

  if (recipe) return buildPathname('recipes', recipe, purpose, contentType, assetId);
  if (draft) return buildPathname('drafts', draft, purpose, contentType, assetId);

  throw new UploadPathnameError('Supply one of recipeId or draftId.');
}

export interface BuildBlogLogoPathnameOptions {
  blogId: string;
  contentType: string;
  /** Only supply this from tests; callers otherwise get a fresh uuid. */
  assetId?: string;
}

/** `blogs/{blogId}/logo/{uuid}.{ext}` — a logo belongs to a blog, not a recipe. */
export function buildBlogLogoPathname({
  blogId,
  contentType,
  assetId,
}: BuildBlogLogoPathnameOptions): string {
  const blog = normalizeId(blogId);

  if (!blog) {
    throw new UploadPathnameError('Supply a blogId.');
  }

  return buildPathname('blogs', blog, 'logo', contentType, assetId);
}

export interface ParsedUploadPathname {
  scope: UploadScope;
  ownerId: string;
  purpose: UploadPurpose;
  assetId: string;
  extension: SupportedExtension;
}

function purposesForScope(scope: UploadScope): readonly UploadPurpose[] {
  return scope === 'blogs' ? BLOG_IMAGE_PURPOSES : RECIPE_IMAGE_PURPOSES;
}

/**
 * Validates the whole shape of a pathname, not just its prefix, and is the only
 * thing standing between a client token and an arbitrary write into the store.
 */
export function parseUploadPathname(pathname: string): ParsedUploadPathname {
  if (pathname.startsWith('/')) {
    throw new UploadPathnameError('Pathname must not begin with "/".');
  }

  if (pathname.includes('\\')) {
    throw new UploadPathnameError('Pathname must not contain backslashes.');
  }

  if (pathname.includes('..')) {
    throw new UploadPathnameError('Pathname must not contain "..".');
  }

  const segments = pathname.split('/');

  if (segments.length !== 4) {
    throw new UploadPathnameError(
      `Expected 4 segments like "recipes/{id}/{purpose}/{uuid}.{ext}", received ${segments.length}.`,
    );
  }

  const [scope, ownerId, purpose, filename] = segments;

  if (scope !== 'recipes' && scope !== 'drafts' && scope !== 'blogs') {
    throw new UploadPathnameError(
      `Unsupported upload scope "${scope}"; expected "recipes", "drafts" or "blogs".`,
    );
  }

  if (!ownerId || !ID_PATTERN.test(ownerId)) {
    throw new UploadPathnameError(`Missing or malformed id in "${pathname}".`);
  }

  const allowedPurposes = purposesForScope(scope);
  if (!purpose || !allowedPurposes.includes(purpose as UploadPurpose)) {
    throw new UploadPathnameError(
      `Unsupported purpose "${purpose}" for "${scope}"; expected one of ${allowedPurposes.join(', ')}.`,
    );
  }

  if (!filename) {
    throw new UploadPathnameError('Missing asset filename.');
  }

  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) {
    throw new UploadPathnameError(`Asset "${filename}" needs a "{uuid}.{ext}" filename.`);
  }

  const assetId = filename.slice(0, dotIndex);
  const extension = filename.slice(dotIndex + 1);

  if (!UUID_PATTERN.test(assetId)) {
    throw new UploadPathnameError(`Asset id "${assetId}" is not a UUID.`);
  }

  if (!SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)) {
    throw new UploadPathnameError(
      `Unsupported extension ".${extension}"; expected one of ${SUPPORTED_EXTENSIONS.join(', ')}.`,
    );
  }

  return {
    scope,
    ownerId,
    purpose: purpose as UploadPurpose,
    assetId,
    extension: extension as SupportedExtension,
  };
}
