import type { FormState } from '@/lib/form';

/** Renders the summary message of a form action result, if there is one. */
export function FormAlert({ state }: { state: FormState }) {
  if (!state.message) return null;

  const isSuccess = state.status === 'success';

  return (
    <p
      className={`alert ${isSuccess ? 'alert--success' : 'alert--error'}`}
      role={isSuccess ? 'status' : 'alert'}
    >
      {state.message}
    </p>
  );
}
