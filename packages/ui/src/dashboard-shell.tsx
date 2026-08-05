import type { ReactNode } from 'react';

import { cn } from './cn';

export interface NavLinkStyleOptions {
  active?: boolean;
  className?: string;
}

/**
 * Class names for a sidebar navigation item. Exported so the application can
 * apply them to its own router link component.
 */
export function navLinkClassName({ active = false, className }: NavLinkStyleOptions = {}): string {
  return cn('ui-shell__nav-link', active && 'ui-shell__nav-link--active', className);
}

export interface DashboardShellProps {
  /** Product/brand area on the left of the top bar. */
  brand: ReactNode;
  /** Navigation items, typically rendered with `navLinkClassName`. */
  nav: ReactNode;
  topbarActions?: ReactNode;
  sidebarFooter?: ReactNode;
  navLabel?: string;
  children: ReactNode;
}

export function DashboardShell({
  brand,
  nav,
  topbarActions,
  sidebarFooter,
  navLabel = 'Dashboard',
  children,
}: DashboardShellProps) {
  return (
    <div className="ui-shell">
      <header className="ui-shell__topbar">
        <div className="ui-shell__brand">{brand}</div>
        {topbarActions ? <div className="ui-shell__topbar-actions">{topbarActions}</div> : null}
      </header>
      <div className="ui-shell__body">
        <aside className="ui-shell__sidebar">
          <nav className="ui-shell__nav" aria-label={navLabel}>
            {nav}
          </nav>
          {sidebarFooter ? <div className="ui-shell__sidebar-footer">{sidebarFooter}</div> : null}
        </aside>
        <main className="ui-shell__main">{children}</main>
      </div>
    </div>
  );
}
