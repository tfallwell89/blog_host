'use client';

import { FormField, Input } from '@bloghost/ui';
import { useActionState } from 'react';

import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { signUpAction } from '@/lib/auth/actions';
import { emptyFormState } from '@/lib/form';

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, emptyFormState);

  return (
    <form className="stack" action={formAction} noValidate>
      <FormAlert state={state} />

      <FormField id="displayName" label="Your name" error={state.fieldErrors?.displayName} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="displayName"
            autoComplete="name"
            placeholder="Jane Okafor"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

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

      <FormField
        id="password"
        label="Password"
        hint="At least 10 characters."
        error={state.fieldErrors?.password}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby={describedBy}
            invalid={invalid}
            required
            minLength={10}
          />
        )}
      </FormField>

      <SubmitButton fullWidth pendingLabel="Creating your account…">
        Create your account
      </SubmitButton>
    </form>
  );
}
