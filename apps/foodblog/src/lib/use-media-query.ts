'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches right now.
 *
 * The browser owns the answer, so it is read from `matchMedia` through
 * `useSyncExternalStore` rather than copied into state by an effect. There is
 * no viewport on the server and it reports `false` there, so only gate an
 * enhancement on it — never a layout that has to work without it.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onStoreChange);
      return () => list.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  const matches = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, matches, () => false);
}
