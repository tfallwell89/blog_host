import type { CSSProperties } from 'react';

/**
 * Brand colour.
 *
 * A blog owner controls exactly one colour. Everything accented on a public
 * page — links, the active nav item, rules under headings — is derived from it
 * in `site.css` with `color-mix`, so there is one value to store and one seam
 * to change. There are no themes: layout and type are the same for every blog.
 */

export const DEFAULT_BRAND_COLOR = '#FF4F5A';

export interface BrandColorOption {
  value: string;
  label: string;
}

/**
 * The offered palette: a bright spectrum, ordered warm to cool so the swatch
 * grid reads as a gradient rather than a list.
 */
export const BRAND_COLOR_PALETTE: readonly BrandColorOption[] = [
  { value: '#FF4F5A', label: 'Coral' },
  { value: '#FF8A1E', label: 'Tangerine' },
  { value: '#FFB300', label: 'Marigold' },
  { value: '#FFC700', label: 'Lemon' },
  { value: '#7CCB1F', label: 'Lime' },
  { value: '#1EC97B', label: 'Mint' },
  { value: '#00C2E0', label: 'Aqua' },
  { value: '#2E7FFF', label: 'Sky' },
  { value: '#6A3DF0', label: 'Violet' },
  { value: '#FF3E8C', label: 'Pink' },
];

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Accepts what someone actually types — `ff4f5a`, `#FF4F5A`, `#f45` — and
 * returns the canonical `#RRGGBB`, or null when it is not a hex colour.
 */
export function normalizeHexColor(value: string): string | null {
  const digits = HEX_PATTERN.exec(value.trim())?.[1];
  if (!digits) return null;

  // Shorthand doubles each digit: #1f6 is #11ff66.
  const expanded = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits;

  return `#${expanded.toUpperCase()}`;
}

/**
 * Inline style that hands the blog's colour to the stylesheet. Public pages and
 * the editor canvas both use this, so a recipe is edited in its real colour.
 */
export function brandColorStyle(brandColor: string): CSSProperties {
  return { '--site-accent': brandColor } as CSSProperties;
}
