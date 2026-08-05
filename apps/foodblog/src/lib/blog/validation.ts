import { z } from 'zod';

import { BLOG_THEME_VALUES } from './themes';

/**
 * Subdomains that the platform keeps for itself, so a blog can never shadow
 * an operational host once real subdomain routing is switched on. Blogs are
 * served from `/<subdomain>`, so this list must also cover every top-level
 * route of the app itself — those win the route match and would otherwise
 * leave the blog unreachable.
 */
const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'billing',
  'blog',
  'cdn',
  'dashboard',
  'docs',
  'help',
  'mail',
  'media',
  'onboarding',
  'settings',
  'sign-in',
  'sign-up',
  'signin',
  'signup',
  'site',
  'static',
  'status',
  'support',
  'www',
]);

export const subdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters')
  .max(40, 'Keep it under 40 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only')
  .refine((value) => !RESERVED_SUBDOMAINS.has(value), 'That address is reserved by the platform');

export const blogNameSchema = z
  .string()
  .trim()
  .min(2, 'Give your food blog a name')
  .max(80, 'Keep the name under 80 characters');

export const blogDescriptionSchema = z
  .string()
  .trim()
  .min(10, 'Write at least a sentence about your food blog')
  .max(280, 'Keep the description under 280 characters');

export const authorNameSchema = z
  .string()
  .trim()
  .min(2, 'Add the name readers should see')
  .max(80, 'Keep it under 80 characters');

export const blogThemeSchema = z.enum(BLOG_THEME_VALUES);

export const createBlogSchema = z.object({
  name: blogNameSchema,
  subdomain: subdomainSchema,
  description: blogDescriptionSchema,
  theme: blogThemeSchema,
});

export const updateBlogSettingsSchema = createBlogSchema.extend({
  authorName: authorNameSchema,
});

export const updateThemeSchema = z.object({
  theme: blogThemeSchema,
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogSettingsInput = z.infer<typeof updateBlogSettingsSchema>;
