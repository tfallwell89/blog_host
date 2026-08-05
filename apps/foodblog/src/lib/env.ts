import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_URL: z.url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  const details = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
  );
  throw new Error(
    `Invalid environment configuration.\n${details.join('\n')}\n\nCopy .env.example to apps/foodblog/.env and fill in the values.`,
  );
}

export const env = parsed.data;
