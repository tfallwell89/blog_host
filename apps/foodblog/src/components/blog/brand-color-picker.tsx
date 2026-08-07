'use client';

import type { CSSProperties } from 'react';
import { useId, useState } from 'react';

import { BRAND_COLOR_PALETTE, normalizeHexColor } from '@/lib/blog/brand';

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
  const [selected, setSelected] = useState(defaultValue);
  const [custom, setCustom] = useState(defaultValue);
  const customId = useId();
  const hintId = useId();
  const customHintId = useId();

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
          <label
            className="swatch"
            key={option.value}
            style={{ '--swatch-color': option.value } as CSSProperties}
          >
            <input
              className="swatch__input"
              type="radio"
              name="brandColorChoice"
              value={option.value}
              checked={selected === option.value}
              onChange={() => {
                setSelected(option.value);
                setCustom(option.value);
              }}
            />
            <span className="swatch__chip" aria-hidden="true">
              <span className="swatch__check" />
            </span>
            <span className="swatch__text">
              <span className="swatch__label">{option.label}</span>
              <span className="swatch__value">{option.value}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="brand-picker__custom">
        <label className="brand-picker__custom-label" htmlFor={customId}>
          Custom colour
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
            placeholder="#FF4F5A"
            spellCheck={false}
            autoComplete="off"
            maxLength={7}
            aria-describedby={customHintId}
          />
        </div>
        <p className="brand-picker__custom-hint" id={customHintId}>
          Enter a hex value like #FF4F5A
        </p>
      </div>

      {error ? (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
