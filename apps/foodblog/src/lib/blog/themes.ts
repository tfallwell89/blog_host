import type { BlogTheme } from '@prisma/client';

export const BLOG_THEME_VALUES = ['MINIMAL', 'EDITORIAL', 'WARM'] as const;

export interface BlogThemeOption {
  value: BlogTheme;
  label: string;
  tagline: string;
  description: string;
}

/**
 * The three themes a blog owner can pick from. Strong defaults on purpose —
 * there is no page builder, so each theme has to look finished on its own.
 */
export const BLOG_THEME_OPTIONS: readonly BlogThemeOption[] = [
  {
    value: 'MINIMAL',
    label: 'Minimal',
    tagline: 'Clean and quiet',
    description: 'Generous white space and crisp type. Lets the food photography lead.',
  },
  {
    value: 'EDITORIAL',
    label: 'Editorial',
    tagline: 'Magazine styling',
    description: 'Serif headlines and structured columns, like a printed food magazine.',
  },
  {
    value: 'WARM',
    label: 'Warm',
    tagline: 'Cosy kitchen',
    description: 'Soft cream tones and rounded shapes for a homely, welcoming feel.',
  },
];

const FALLBACK_THEME: BlogThemeOption = {
  value: 'MINIMAL',
  label: 'Minimal',
  tagline: 'Clean and quiet',
  description: 'Generous white space and crisp type. Lets the food photography lead.',
};

export function getThemeOption(theme: BlogTheme): BlogThemeOption {
  return BLOG_THEME_OPTIONS.find((option) => option.value === theme) ?? FALLBACK_THEME;
}

/** Value used for the `data-theme` attribute on public blog pages. */
export function themeAttribute(theme: BlogTheme): string {
  return theme.toLowerCase();
}
