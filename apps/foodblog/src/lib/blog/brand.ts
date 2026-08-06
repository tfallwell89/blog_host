import type { CSSProperties } from 'react';

/**
 * Brand colour.
 *
 * A blog owner controls exactly one colour. Everything accented on a public
 * page — links, the active nav item, rules under headings — is derived from it
 * in `site.css` with `color-mix`, so there is one value to store and one seam
 * to change. There are no themes: layout and type are the same for every blog.
 */

export const DEFAULT_BRAND_COLOR = '#1F6F5C';

export interface BrandColorOption {
  value: string;
  label: string;
}

/**
 * The offered palette. Every colour is dark enough to carry white text and to
 * stay legible as body-copy links, which is what keeps a blog readable without
 * asking the cook to think about contrast.
 */
export const BRAND_COLOR_PALETTE: readonly BrandColorOption[] = [
  { value: '#1F6F5C', label: 'Basil' },
  { value: '#17636B', label: 'Sage' },
  { value: '#24528C', label: 'Blueberry' },
  { value: '#5B3E8E', label: 'Fig' },
  { value: '#8C2F55', label: 'Plum' },
  { value: '#A82C24', label: 'Chilli' },
  { value: '#B4531F', label: 'Terracotta' },
  { value: '#8A6A14', label: 'Honey' },
  { value: '#4F5A32', label: 'Olive' },
  { value: '#2A2724', label: 'Charcoal' },
];

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Accepts what someone actually types — `1f6f5c`, `#1F6F5C`, `#1f6` — and
 * returns the canonical `#RRGGBB`, or null when it is not a hex colour.
 */
export function normalizeHexColor(value: string): string | null {
  const digits = HEX_PATTERN.exec(value.trim())?.[1];
  if (!digits) return null;

  // Shorthand doubles each digit: #1f6 is #11ff66.
  const expanded = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits;

  return `#${expanded.toUpperCase()}`;
}

export function isPaletteColor(value: string): boolean {
  return BRAND_COLOR_PALETTE.some((option) => option.value === value);
}

/**
 * Inline style that hands the blog's colour to the stylesheet. Public pages and
 * the editor canvas both use this, so a recipe is edited in its real colour.
 */
export function brandColorStyle(brandColor: string): CSSProperties {
  return { '--site-accent': brandColor } as CSSProperties;
}
