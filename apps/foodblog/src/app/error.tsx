'use client';

import { Button } from '@bloghost/ui';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the server logs with a digest that matches this render.
    console.error(error);
  }, [error]);

  return (
    <main className="auth">
      <div className="page page--narrow stack" style={{ textAlign: 'center' }}>
        <h1 className="hero__title" style={{ fontSize: '2.25rem' }}>
          Something went wrong
        </h1>
        <p className="section__lede">
          That is on us. Try again — if it keeps happening, the details below help us track it down.
        </p>
        {error.digest ? <p className="text-sm muted">Reference: {error.digest}</p> : null}
        <div>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </main>
  );
}
