'use client';

import { FormField, Input } from '@bloghost/ui';
import { useActionState } from 'react';

import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { signInAction } from '@/lib/auth/actions';
import { emptyFormState } from '@/lib/form';

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, emptyFormState);

  return (
    <form className="stack" action={formAction} noValidate>
      <FormAlert state={state} />

      <FormField id="email" label="Email address" error={state.fieldErrors?.email} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <FormField id="password" label="Password" error={state.fieldErrors?.password} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="current-password"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <SubmitButton fullWidth pendingLabel="Signing you in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
