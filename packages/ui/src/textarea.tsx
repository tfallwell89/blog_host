import type { TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn('ui-textarea', invalid && 'ui-textarea--invalid', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
