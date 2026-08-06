'use client';

import { FormField, Input, Textarea } from '@bloghost/ui';
import { useActionState } from 'react';

import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { updateBlogSettingsAction } from '@/lib/blog/actions';
import { emptyFormState } from '@/lib/form';

export interface SettingsFormProps {
  blog: {
    name: string;
    subdomain: string;
    description: string;
    authorName: string;
  };
}

export function SettingsForm({ blog }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateBlogSettingsAction, emptyFormState);

  return (
    <form className="stack stack--lg" action={formAction} noValidate>
      <FormAlert state={state} />

      <FormField id="name" label="Food blog name" error={state.fieldErrors?.name} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="name"
            defaultValue={blog.name}
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <FormField
        id="description"
        label="Description"
        hint="Shown under your blog name and used as the search-engine description."
        error={state.fieldErrors?.description}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            name="description"
            rows={3}
            defaultValue={blog.description}
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <FormField
        id="subdomain"
        label="Web address"
        hint="Changing this changes every link to your food blog."
        error={state.fieldErrors?.subdomain}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="subdomain"
            defaultValue={blog.subdomain}
            spellCheck={false}
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <FormField
        id="authorName"
        label="Author display name"
        hint="The name readers see on your recipes."
        error={state.fieldErrors?.authorName}
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="authorName"
            defaultValue={blog.authorName}
            autoComplete="name"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </FormField>

      <div>
        <SubmitButton pendingLabel="Saving settings…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
