'use client';

import { FormField, Input } from '@bloghost/ui';
import { useActionState, useState } from 'react';

import { BrandColorPicker } from '@/components/blog/brand-color-picker';
import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { updateAppearanceAction } from '@/lib/blog/actions';
import { emptyFormState } from '@/lib/form';

export interface AppearanceFormProps {
  blog: {
    name: string;
    logoUrl: string | null;
    brandColor: string;
  };
}

export function AppearanceForm({ blog }: AppearanceFormProps) {
  const [state, formAction] = useActionState(updateAppearanceAction, emptyFormState);
  const [logoUrl, setLogoUrl] = useState(blog.logoUrl ?? '');

  const trimmedLogo = logoUrl.trim();

  return (
    <form className="stack stack--lg" action={formAction} noValidate>
      <FormAlert state={state} />

      <FormField
        id="logoUrl"
        label="Logo"
        hint="Paste a link to your logo image. It replaces your blog name in the header, so a wide image works best. Leave it empty to show the name instead."
        error={state.fieldErrors?.logoUrl}
      >
        {({ id, describedBy, invalid }) => (
          <>
            <Input
              id={id}
              name="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://images.example.com/janes-kitchen-logo.png"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={describedBy}
              invalid={invalid}
            />
            <div className="logo-preview">
              {trimmedLogo ? (
                <img className="logo-preview__image" src={trimmedLogo} alt={`${blog.name} logo`} />
              ) : (
                <span className="logo-preview__fallback">{blog.name}</span>
              )}
            </div>
          </>
        )}
      </FormField>

      <BrandColorPicker
        defaultValue={blog.brandColor}
        legend="Brand colour"
        hint="Used for links, buttons and the rules under headings on your blog."
        error={state.fieldErrors?.brandColor}
      />

      <div>
        <SubmitButton pendingLabel="Saving…">Save appearance</SubmitButton>
      </div>
    </form>
  );
}
