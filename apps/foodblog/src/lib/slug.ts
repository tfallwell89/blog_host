/**
 * Turns free text into a URL-safe slug: lowercase, ASCII, hyphen separated.
 */
export function slugify(input: string, maxLength = 60): string {
  return (
    input
      .normalize('NFKD')
      // Strip diacritics so "crème brûlée" becomes "creme-brulee".
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maxLength)
      .replace(/-+$/g, '')
  );
}

/**
 * Appends `-2`, `-3`, ... until the slug is not in `taken`.
 */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
