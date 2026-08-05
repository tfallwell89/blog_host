import type { ReactNode } from 'react';

import { cn } from './cn';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** Decorative glyph; hidden from assistive technology. */
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('ui-empty-state', className)}>
      {icon ? (
        <div className="ui-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="ui-empty-state__title">{title}</h2>
      {description ? <p className="ui-empty-state__description">{description}</p> : null}
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </div>
  );
}
