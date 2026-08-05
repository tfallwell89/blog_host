import type { ReactNode, SelectHTMLAttributes } from 'react';

import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  children?: ReactNode;
}

export function Select({
  options,
  placeholder,
  invalid = false,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn('ui-select', invalid && 'ui-select--invalid', className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );
}
