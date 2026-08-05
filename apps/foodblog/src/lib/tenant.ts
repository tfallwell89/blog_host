/**
 * Tenant routing.
 *
 * Hosted blogs live at the root of the platform origin (`/<subdomain>`) so the
 * whole platform runs from a single origin in development while readers still
 * get a clean address. The app router resolves the platform's own static routes
 * (`/dashboard`, `/sign-in`, ...) before the `[subdomain]` segment, and
 * `RESERVED_SUBDOMAINS` in `lib/blog/validation.ts` keeps blogs from claiming
 * one of those names. Every public link is produced here, so switching to real
 * `<subdomain>.bloghost.app` hosts later only means changing these helpers plus
 * a middleware rewrite.
 */

export function normalizeSubdomain(value: string): string {
  return value.trim().toLowerCase();
}

export function blogPath(subdomain: string): string {
  return `/${normalizeSubdomain(subdomain)}`;
}

export function blogRecipePath(subdomain: string, recipeSlug: string): string {
  return `${blogPath(subdomain)}/recipes/${recipeSlug}`;
}

export function blogAboutPath(subdomain: string): string {
  return `${blogPath(subdomain)}/about`;
}

/** Origin the platform is served from, used to build absolute/canonical URLs. */
export function appOrigin(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  return new URL(path, appOrigin()).toString();
}

export function blogUrl(subdomain: string): string {
  return absoluteUrl(blogPath(subdomain));
}

export function blogRecipeUrl(subdomain: string, recipeSlug: string): string {
  return absoluteUrl(blogRecipePath(subdomain, recipeSlug));
}
