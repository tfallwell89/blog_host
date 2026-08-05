# BlogHost

Hosted food-blog software. The promise is simple:

> **Start your very own food blog in 10 minutes.**

Sign up, name your blog, pick one of three designs, and publish a recipe. No WordPress, no
plugins, no hosting setup, no code.

---

## What is in the box

| Area              | What works today                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Marketing site    | Landing page with the three-step story and a live preview of a real hosted blog                 |
| Accounts          | Email + password sign up, sign in, sign out, database-backed sessions, protected dashboard      |
| Onboarding        | Blog name, web address, description and theme — validated and unique                            |
| Dashboard         | Recipe counts, recent recipes, public URL, and Overview / Recipes / Appearance / Settings nav   |
| Recipe editor     | Ingredient groups, instruction groups, reordering, timings, servings, notes, draft vs published |
| Recipe management | Filter by draft or published, edit, view, delete with confirmation, empty states                |
| Public food blog  | Recipe index with title search, recipe pages, about page, print button, three themes            |
| SEO               | Per-page metadata, canonical URLs, Open Graph, and `Recipe` JSON-LD on every recipe page        |

Draft recipes are never served publicly, and nobody can read or edit a blog or recipe they do not
own.

---

## Getting started

You need Node.js 20.11+, pnpm 9, and a PostgreSQL database.

```bash
pnpm install

# The app reads its environment from apps/foodblog/.env
cp .env.example apps/foodblog/.env

pnpm db:generate   # generate the Prisma client
pnpm db:migrate    # apply migrations to PostgreSQL
pnpm db:seed       # insert the demo blog and recipes
pnpm dev           # http://localhost:3000
```

The development connection string in `.env.example` is:

```
DATABASE_URL="postgresql://bloghost:bloghost_dev@localhost:5432/bloghost?schema=public"
```

`.env` files are git-ignored. Only `.env.example` is committed.

### Demo login

`pnpm db:seed` creates one demo account with a food blog and four recipes (three published, one
draft):

| Email               | Password          |
| ------------------- | ----------------- |
| `jane@bloghost.dev` | `RoastedGarlic22` |

Its public blog lives at [`/janes-kitchen`](http://localhost:3000/janes-kitchen), and the
dashboard is at [`/dashboard`](http://localhost:3000/dashboard).

---

## Commands

Run these from the repository root.

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `pnpm dev`         | Start the food-blog app in development mode           |
| `pnpm build`       | Production build of every workspace package           |
| `pnpm start`       | Serve the production build                            |
| `pnpm lint`        | ESLint across the monorepo                            |
| `pnpm typecheck`   | `tsc --noEmit` across the monorepo                    |
| `pnpm format`      | Prettier write                                        |
| `pnpm db:generate` | Generate the Prisma client                            |
| `pnpm db:migrate`  | Create and apply a migration in development           |
| `pnpm db:deploy`   | Apply existing migrations (for deployed environments) |
| `pnpm db:seed`     | Reset and insert the demo blog, recipes and login     |
| `pnpm db:reset`    | Drop, re-migrate and re-seed the database             |
| `pnpm db:studio`   | Open Prisma Studio                                    |

---

## Repository layout

```
bloghost/
├── apps/
│   └── foodblog/                  # the deployable Next.js application
│       ├── prisma/                # schema, migrations, seed script
│       └── src/
│           ├── app/               # App Router routes
│           ├── components/        # food-blog specific components
│           ├── lib/               # auth, blogs, recipes, tenant resolution
│           └── styles/            # marketing, dashboard, editor, public blog CSS
├── packages/
│   ├── ui/                        # @bloghost/ui — generic design system
│   ├── config-eslint/             # @bloghost/config-eslint — shared flat configs
│   └── config-typescript/         # @bloghost/config-typescript — shared tsconfigs
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

`apps/foodblog` is independently deployable. Everything food-specific stays inside it; the shared
packages contain nothing that knows what a recipe is.

### Routes

| Route                           | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `/`                             | Marketing landing page                          |
| `/sign-up`, `/sign-in`          | Accounts                                        |
| `/onboarding`                   | Create a food blog                              |
| `/dashboard`                    | Overview                                        |
| `/dashboard/recipes`            | Recipe management (with draft/published filter) |
| `/dashboard/recipes/new`        | Recipe editor                                   |
| `/dashboard/recipes/[recipeId]` | Recipe editor for an existing recipe            |
| `/dashboard/appearance`         | Theme switching                                 |
| `/dashboard/settings`           | Blog name, description, address, author         |
| `/[subdomain]`                  | Public recipe index                             |
| `/[subdomain]/recipes/[slug]`   | Public recipe page                              |
| `/[subdomain]/about`            | Public about page                               |

---

## How it is put together

**Server Components by default.** Only four things are client components: the recipe editor, the
public recipe search field, the delete confirmation, and the small forms that need
`useActionState` for inline errors.

**Validation lives on the server.** Every mutation is a Server Action that parses its input with
Zod before touching the database. Client-side niceties (auto-generated slugs, live previews) are
conveniences, never the security boundary.

**Tenant routing has one seam.** Hosted blogs are served from `/<subdomain>` so everything
runs on a single origin locally. Every public link is produced by the helpers in
`src/lib/tenant.ts`; moving to real `<subdomain>.bloghost.app` hosts means changing those helpers
and adding a middleware rewrite, not hunting through components. The platform's own routes take
precedence over `/[subdomain]`, so adding a top-level route also means adding it to the reserved
subdomain list in `src/lib/blog/validation.ts`.

**Auth is deliberately small.** Passwords are hashed with scrypt (`scrypt$N$r$p$salt$hash`, so cost
parameters can be raised later without invalidating existing hashes). Sessions are random 32-byte
tokens stored as SHA-256 hashes in PostgreSQL, referenced by an `httpOnly` cookie. `User` already
carries an `emailVerifiedAt` column so verification and password reset can be added without a
migration to existing data.

**Themes are data, not layout.** Each theme is a set of CSS custom properties applied through a
`data-theme` attribute on the public blog. The markup is identical across all three, which is what
lets the product ship strong defaults instead of a page builder.

**Ownership is enforced by the query, not by a check.** Recipe reads and writes are scoped with
`blogId` or `blog: { members: { some: { userId } } }`, so an id belonging to another tenant simply
matches nothing and the page 404s.

### Ready to extract, not yet extracted

Auth, tenant resolution, and recipe persistence each live in their own module under
`apps/foodblog/src/lib`. When billing, email, custom domains or media uploads arrive and grow a
second consumer, they can be lifted into packages. They have not been extracted early, because
there is nothing yet to share.

---

## Deliberately not built

Stripe billing, paid plans, custom domains, reader accounts, comments, ratings, saved recipes, a
central recipe network, newsletters, nutrition calculation, unit conversion, ads, affiliate links,
WordPress or social imports, AI-generated recipes, drag-and-drop page building, and any second
vertical CMS.

The custom-domain section in Settings is present but marked **Coming soon**.
