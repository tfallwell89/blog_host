/**
 * True for absolute `http:`/`https:` URLs. Every image a cook supplies — recipe
 * photos, a blog logo — is an external link rather than an upload, so this is
 * the check that keeps `javascript:` and `data:` out of `src` attributes.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
