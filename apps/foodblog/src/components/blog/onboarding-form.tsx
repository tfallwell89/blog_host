'use client';

import { FormField, Input, Textarea } from '@bloghost/ui';
import { useActionState, useState, type ChangeEvent } from 'react';

import { FormAlert } from '@/components/form-alert';
import { ThemePicker } from '@/components/blog/theme-picker';
import { SubmitButton } from '@/components/submit-button';
import { createBlogAction } from '@/lib/blog/actions';
import { emptyFormState } from '@/lib/form';
import { slugify } from '@/lib/slug';

export function OnboardingForm() {
  const [state, formAction] = useActionState(createBlogAction, emptyFormState);
  const [subdomain, setSubdomain] = useState('');
  // Stop mirroring the blog name once the cook picks their own address.
  const [subdomainEdited, setSubdomainEdited] = useState(false);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    if (!subdomainEdited) {
      setSubdomain(slugify(event.target.value, 40));
    }
  }

  function handleSubdomainChange(event: ChangeEvent<HTMLInputElement>) {
    setSubdomainEdited(true);
    setSubdomain(event.target.value.toLowerCase());
  }

  return (
    <form className="stack stack--lg" action={formAction} noValidate>
      <FormAlert state={state} />

      <FormField
        id="name"
        label="What is your food blog called?"
        hint="You can change this later."
        error={state.fieldErrors?.name}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="name"
            placeholder="Jane's Kitchen"
            autoComplete="off"
            onChange={handleNameChange}
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <FormField
        id="subdomain"
        label="Choose your web address"
        hint="Lowercase letters, numbers and hyphens. This is where readers will find you."
        error={state.fieldErrors?.subdomain}
        required
      >
        {({ id, describedBy, invalid }) => (
          <>
            <Input
              id={id}
              name="subdomain"
              value={subdomain}
              onChange={handleSubdomainChange}
              placeholder="janes-kitchen"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
            <p className="field-preview">
              Your blog will live at <code>/site/{subdomain || 'your-address'}</code>
            </p>
          </>
        )}
      </FormField>

      <FormField
        id="description"
        label="Describe your food blog in a sentence"
        hint="Readers see this under your blog name, and search engines use it too."
        error={state.fieldErrors?.description}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            name="description"
            rows={3}
            placeholder="Unfussy recipes for busy weeknights and slow weekends."
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <div>
        <ThemePicker defaultValue="MINIMAL" legend="Pick a design" />
        {state.fieldErrors?.theme ? (
          <p className="ui-field__error" role="alert">
            {state.fieldErrors.theme}
          </p>
        ) : null}
      </div>

      <SubmitButton size="lg" pendingLabel="Creating your food blog…">
        Create my food blog
      </SubmitButton>
    </form>
  );
}
