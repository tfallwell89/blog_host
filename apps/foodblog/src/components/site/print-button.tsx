'use client';

export function PrintButton() {
  return (
    <button className="site-button" type="button" onClick={() => window.print()}>
      Print this recipe
    </button>
  );
}
