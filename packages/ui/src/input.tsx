import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      className={cn('ui-input', invalid && 'ui-input--invalid', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
