import type { ReactNode } from 'react';

import { cn } from './cn';

export interface FormFieldRenderProps {
  /** Wire this onto the control so the label points at it. */
  id: string;
  /** Wire onto `aria-describedby` so hints and errors are announced. */
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FormFieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode | ((props: FormFieldRenderProps) => ReactNode);
}

/**
 * Label + hint + error scaffolding for a single form control. Pass a function
 * as the child to receive the generated ids for accessible wiring.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('ui-field', className)}>
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="ui-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {typeof children === 'function'
        ? children({ id, describedBy, invalid: Boolean(error) })
        : children}
      {hint ? (
        <p className="ui-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="ui-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
