import { cn } from '@bloghost/ui';
import type { KeyboardEvent, ReactNode } from 'react';

/**
 * Inline editing primitives for the recipe canvas.
 *
 * Nothing here uses React state or effects, which is what lets the recipe
 * layout stay a plain shared component: the published page renders the same
 * module on the server without pulling any of this into the browser bundle.
 * The auto-growing textarea is CSS-only — `.editable__box` mirrors the value
 * into a hidden pseudo-element that reserves exactly the right height.
 */

export interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name — the canvas has no visible labels. */
  label: string;
  placeholder?: string;
  /** Applied to the wrapper so the field inherits the surrounding type. */
  className?: string;
  error?: string;
  /** Addressable id, used to move focus to a line that was just added. */
  fieldId?: string;
  /** Collapses newlines, so headings and list lines stay single-line. */
  singleLine?: boolean;
  /** Minimum visible lines before the field grows with its content. */
  minRows?: number;
  /** Enter splits the document here instead of committing the field. */
  onEnter?: () => void;
}

export function EditableText({
  value,
  onChange,
  label,
  placeholder,
  className,
  error,
  fieldId,
  singleLine = false,
  minRows = 1,
  onEnter,
}: EditableTextProps) {
  const errorId = fieldId && error ? `${fieldId}-error` : undefined;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    if (onEnter) {
      event.preventDefault();
      onEnter();
      return;
    }

    if (singleLine) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return (
    <span className={cn('editable', error && 'editable--invalid', className)}>
      <span className="editable__box" data-replica={`${value}\u00a0`}>
        <textarea
          className="editable__input"
          data-field-id={fieldId}
          rows={singleLine ? 1 : minRows}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          spellCheck={!singleLine}
          onKeyDown={handleKeyDown}
          onChange={(event) =>
            onChange(
              singleLine ? event.target.value.replace(/\s*\n+\s*/g, ' ') : event.target.value,
            )
          }
        />
      </span>
      {error ? (
        <span className="editable__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export interface EditableSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  label: string;
  options: readonly { value: T; label: string }[];
  className?: string;
}

export function EditableSelect<T extends string>({
  value,
  onChange,
  label,
  options,
  className,
}: EditableSelectProps<T>) {
  return (
    <span className={cn('editable', className)}>
      <select
        className="editable__select"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export interface CanvasControlProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}

/** The small square affordances that sit beside a line or a group. */
export function CanvasControl({
  label,
  onClick,
  children,
  disabled = false,
  tone = 'default',
}: CanvasControlProps) {
  return (
    <button
      className={cn('canvas-control', tone === 'danger' && 'canvas-control--danger')}
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

export function CanvasAddButton({
  label,
  onClick,
  variant = 'line',
}: {
  label: string;
  onClick: () => void;
  variant?: 'line' | 'block';
}) {
  return (
    <button
      className={cn('canvas-add', variant === 'block' && 'canvas-add--block')}
      type="button"
      onClick={onClick}
    >
      <span aria-hidden="true">+</span> {label}
    </button>
  );
}

/**
 * Moves the caret to a line that this event handler just created. The node
 * does not exist until React commits, so the lookup waits for the next frame.
 */
export function focusField(fieldId: string): void {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLTextAreaElement>(`[data-field-id="${fieldId}"]`);
    field?.focus();
  });
}
