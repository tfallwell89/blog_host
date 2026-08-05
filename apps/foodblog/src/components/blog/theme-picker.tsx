import type { BlogTheme } from '@prisma/client';

import { BLOG_THEME_OPTIONS, themeAttribute } from '@/lib/blog/themes';

export interface ThemePickerProps {
  defaultValue: BlogTheme;
  legend: string;
  name?: string;
}

/**
 * Radio group of the three included themes. Plain radios keep it keyboard
 * accessible and let it submit inside any server-action form.
 */
export function ThemePicker({ defaultValue, legend, name = 'theme' }: ThemePickerProps) {
  return (
    <fieldset className="theme-picker">
      <legend className="theme-picker__legend">{legend}</legend>
      <div className="theme-picker__grid">
        {BLOG_THEME_OPTIONS.map((option) => (
          <label className="theme-card" key={option.value}>
            <input
              className="theme-card__input"
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
            />
            <span
              className="theme-card__preview"
              data-theme-preview={themeAttribute(option.value)}
              aria-hidden="true"
            >
              <span className="theme-card__preview-title" />
              <span className="theme-card__preview-line" />
              <span className="theme-card__preview-line theme-card__preview-line--short" />
            </span>
            <span className="theme-card__body">
              <span className="theme-card__label">{option.label}</span>
              <span className="theme-card__tagline">{option.tagline}</span>
              <span className="theme-card__description">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
