import { buttonClassName } from '@bloghost/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="auth">
      <div className="page page--narrow stack" style={{ textAlign: 'center' }}>
        <h1 className="hero__title" style={{ fontSize: '2.5rem' }}>
          We could not find that page
        </h1>
        <p className="section__lede">
          The food blog or recipe you are looking for may have been renamed, unpublished or deleted.
        </p>
        <div>
          <Link className={buttonClassName()} href="/">
            Back to BlogHost
          </Link>
        </div>
      </div>
    </main>
  );
}
