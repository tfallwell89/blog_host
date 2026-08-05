import { z } from 'zod';

export const emailSchema = z
  .email('Enter a valid email address')
  .max(254, 'That email address is too long')
  .transform((value) => value.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(200, 'Passwords are limited to 200 characters');

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Tell us what to call you')
  .max(80, 'Keep this under 80 characters');

export const signUpSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  // Existing passwords are only compared, never re-validated for strength.
  password: z.string().min(1, 'Enter your password'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
