'use client';

import { useId, useState } from 'react';

import { BRAND_COLOR_PALETTE, isPaletteColor, normalizeHexColor } from '@/lib/blog/brand';

export interface BrandColorPickerProps {
  defaultValue: string;
  legend: string;
  hint?: string;
  error?: string;
  name?: string;
}

/**
 * Palette swatches plus an escape hatch for a brand's own hex value.
 *
 * The swatches are radios so the whole group stays keyboard navigable, and the
 * chosen colour is mirrored into a hidden input — that way the custom field can
 * hold half-typed text without ever submitting an invalid colour.
 */
export function BrandColorPicker({
  defaultValue,
  legend,
  hint,
  error,
  name = 'brandColor',
}: BrandColorPickerProps) {
  const startedCustom = !isPaletteColor(defaultValue);
  const [selected, setSelected] = useState(defaultValue);
  const [custom, setCustom] = useState(startedCustom ? defaultValue : '');
  const customId = useId();
  const hintId = useId();

  function handleCustomChange(value: string) {
    setCustom(value);

    const normalized = normalizeHexColor(value);
    if (normalized) setSelected(normalized);
  }

  return (
    <fieldset className="brand-picker" aria-describedby={hint ? hintId : undefined}>
      <legend className="brand-picker__legend">{legend}</legend>
      {hint ? (
        <p className="brand-picker__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      <input type="hidden" name={name} value={selected} />

      <div className="brand-picker__swatches">
        {BRAND_COLOR_PALETTE.map((option) => (
          <label className="swatch" key={option.value} title={option.label}>
            <input
              className="swatch__input"
              type="radio"
              name="brandColorChoice"
              value={option.value}
              checked={selected === option.value}
              onChange={() => {
                setSelected(option.value);
                setCustom('');
              }}
            />
            <span
              className="swatch__chip"
              style={{ backgroundColor: option.value }}
              aria-hidden="true"
            />
            <span className="swatch__label">{option.label}</span>
          </label>
        ))}
      </div>

      <div className="brand-picker__custom">
        <label className="brand-picker__custom-label" htmlFor={customId}>
          Or use your own hex value
        </label>
        <div className="brand-picker__custom-row">
          <span
            className="brand-picker__preview"
            style={{ backgroundColor: selected }}
            aria-hidden="true"
          />
          <input
            className="brand-picker__input"
            id={customId}
            type="text"
            value={custom}
            onChange={(event) => handleCustomChange(event.target.value)}
            placeholder="#1F6F5C"
            spellCheck={false}
            autoComplete="off"
            maxLength={7}
          />
          <output className="brand-picker__value">{selected}</output>
        </div>
      </div>

      {error ? (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
