'use client';

import type { BlogTheme } from '@prisma/client';
import { useActionState } from 'react';

import { ThemePicker } from '@/components/blog/theme-picker';
import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { updateThemeAction } from '@/lib/blog/actions';
import { emptyFormState } from '@/lib/form';

export function AppearanceForm({ currentTheme }: { currentTheme: BlogTheme }) {
  const [state, formAction] = useActionState(updateThemeAction, emptyFormState);

  return (
    <form className="stack stack--lg" action={formAction}>
      <FormAlert state={state} />
      <ThemePicker defaultValue={currentTheme} legend="Choose your food blog theme" />
      <div>
        <SubmitButton pendingLabel="Applying theme…">Save theme</SubmitButton>
      </div>
    </form>
  );
}
