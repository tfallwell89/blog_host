import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
  children: ReactNode;
}

export function Card({ flat = false, className, children, ...props }: CardProps) {
  return (
    <div className={cn('ui-card', flat && 'ui-card--flat', className)} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Rendered on the trailing edge of the header, e.g. an action button. */
  action?: ReactNode;
  /** Heading level for the title, keeps document outlines sane. */
  as?: 'h2' | 'h3' | 'h4';
}

export function CardHeader({
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn('ui-card__header', className)} {...props}>
      <div>
        <Heading className="ui-card__title">{title}</Heading>
        {description ? <p className="ui-card__description">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('ui-card__content', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('ui-card__footer', className)} {...props}>
      {children}
    </div>
  );
}
