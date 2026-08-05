import type { RecipeDifficulty, RecipeStatus } from '@prisma/client';

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Challenging',
};

export const STATUS_LABELS: Record<RecipeStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export interface RecipeTimings {
  prepMinutes: number | null;
  cookMinutes: number | null;
  additionalMinutes: number | null;
}

/** "1 hr 15 mins" — returns null when the cook did not supply a time. */
export function formatMinutes(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? '' : 's'}`);
  if (remainder > 0) parts.push(`${remainder} min${remainder === 1 ? '' : 's'}`);

  return parts.join(' ');
}

export function totalMinutes(timings: RecipeTimings): number | null {
  const total =
    (timings.prepMinutes ?? 0) + (timings.cookMinutes ?? 0) + (timings.additionalMinutes ?? 0);

  return total > 0 ? total : null;
}

/** ISO 8601 duration (`PT1H15M`) for Recipe structured data. */
export function toIsoDuration(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `PT${hours > 0 ? `${hours}H` : ''}${remainder > 0 ? `${remainder}M` : ''}`;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date | null | undefined): string {
  return date ? dateFormatter.format(date) : '—';
}

const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Publication date as readers see it. Fixed to UTC so it never shifts. */
export function formatLongDate(date: Date | string): string {
  return longDateFormatter.format(new Date(date));
}
