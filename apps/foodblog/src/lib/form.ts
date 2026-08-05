import type { ZodError } from 'zod';

/** Field name -> first validation message for that field. */
export type FieldErrors = Record<string, string>;

export interface FormState {
  status?: 'error' | 'success';
  /** Summary message shown at the top of the form. */
  message?: string;
  fieldErrors?: FieldErrors;
}

export const emptyFormState: FormState = {};

export function successState(message: string): FormState {
  return { status: 'success', message };
}

export function errorState(message: string, fieldErrors?: FieldErrors): FormState {
  return { status: 'error', message, fieldErrors };
}

/**
 * Collapses a Zod error into one message per field. Only the first issue per
 * field is kept — forms show a single message under each control.
 */
export function toFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_form';
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export function formErrorState(error: ZodError, message?: string): FormState {
  const fieldErrors = toFieldErrors(error);
  return {
    status: 'error',
    message: message ?? fieldErrors._form,
    fieldErrors,
  };
}

/** Reads a text field from FormData, trimming surrounding whitespace. */
export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}
