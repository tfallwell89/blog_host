import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'brand';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('ui-badge', `ui-badge--${tone}`, className)} {...props}>
      {children}
    </span>
  );
}
