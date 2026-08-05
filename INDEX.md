# Index

Repository map for coding agents. BlogHost is hosted food-blog software: one Next.js 15 app
(`apps/foodblog`) backed by Prisma and PostgreSQL, plus three support packages.

## 1. Start here

1. This file.
2. The relevant section of [`ARCHITECTURE.md`](ARCHITECTURE.md) — structure, data flow, boundaries.
3. The relevant section of [`STYLE.md`](STYLE.md) — conventions you must follow.
4. The implementation files for the task, found through the [feature map](#5-feature-map).

Documentation is a map. **The code is the source of truth**; if they disagree, fix the docs in the
same pull request.

## 2. Essential commands

Run from the repository root. Every command below exists in `package.json`.

| Command                                     | What it does                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm install`                              | Install the workspace (pnpm 9, Node ≥ 20.11)                             |
| `pnpm dev`                                  | Start the app on `http://localhost:3000` (runs `db:generate` first)      |
| `pnpm build`                                | Production build of every workspace package                              |
| `pnpm start`                                | Serve the production build                                               |
| `pnpm typecheck`                            | `tsc --noEmit` across the monorepo                                       |
| `pnpm lint`                                 | ESLint across the monorepo                                               |
| `pnpm format` / `pnpm format:check`         | Prettier write / check                                                   |
| `pnpm db:generate`                          | Generate the Prisma client                                               |
| `pnpm db:migrate`                           | Create and apply a migration in development                              |
| `pnpm db:deploy`                            | Apply existing migrations (deployed environments)                        |
| `pnpm db:seed`                              | Insert the demo blog, recipes and login                                  |
| `pnpm db:reset`                             | Drop, re-migrate and re-seed                                             |
| `pnpm db:studio`                            | Open Prisma Studio                                                       |
| `pnpm --filter @bloghost/foodblog <script>` | Run an app script directly (`dev`, `build`, `lint`, `typecheck`, `db:*`) |
| `pnpm --filter @bloghost/ui <script>`       | `lint` or `typecheck` the UI package                                     |

**There is no `pnpm test`.** No test runner is installed and no test files exist. See
[`STYLE.md` §13](STYLE.md#13-testing-expectations).

## 3. Environment

The app reads `apps/foodblog/.env`. The committed example is `.env.example` at the repository root;
copy it with `cp .env.example apps/foodblog/.env`. `.env` files are git-ignored. Variables are
parsed and validated at import by `apps/foodblog/src/lib/env.ts`, which throws on invalid config.

| Variable       | Required                                 | Purpose                                     |
| -------------- | ---------------------------------------- | ------------------------------------------- |
| `DATABASE_URL` | Yes                                      | PostgreSQL connection string used by Prisma |
| `APP_URL`      | No (defaults to `http://localhost:3000`) | Origin for canonical and absolute URLs      |
| `NODE_ENV`     | Set by tooling                           | `development` \| `test` \| `production`     |

Local development connection string, as configured in `.env.example`:

```
postgresql://bloghost:bloghost_dev@localhost:5432/bloghost?schema=public
```

`pnpm db:seed` creates a demo account (`jane@bloghost.dev`), the blog `janes-kitchen`, and four
recipes — three published, one draft. Credentials are in [`README.md`](README.md).

## 4. Repository map

Paths are repository-relative. Entries in **Read first** are relative to that row's **Path**.

| Area               | Path                                                       | Purpose                                                    | Read first                                         |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| App                | `apps/foodblog/`                                           | The only deployable application                            | `package.json`, `next.config.ts`                   |
| Routes             | `apps/foodblog/src/app/`                                   | App Router tree                                            | `layout.tsx`                                       |
| Public blog        | `apps/foodblog/src/app/[subdomain]/`                       | Hosted blog: index, recipe, about                          | `layout.tsx`                                       |
| Dashboard          | `apps/foodblog/src/app/dashboard/`                         | Authenticated area                                         | `layout.tsx`                                       |
| Auth routes        | `apps/foodblog/src/app/(auth)/`                            | Sign in, sign up                                           | `sign-in/page.tsx`                                 |
| Recipe UI          | `apps/foodblog/src/components/recipe/`                     | Document model, canvas, editor shell                       | `recipe-document.ts`                               |
| Feature components | `apps/foodblog/src/components/{auth,blog,dashboard,site}/` | Per-feature UI                                             | —                                                  |
| Domain logic       | `apps/foodblog/src/lib/`                                   | auth, blog, recipes, db, env, form, slug, tenant           | `tenant.ts`, `form.ts`                             |
| Recipe domain      | `apps/foodblog/src/lib/recipes/`                           | queries, persistence, actions, validation, format, json-ld | `validation.ts`                                    |
| Auth domain        | `apps/foodblog/src/lib/auth/`                              | password, session, service, guards, actions                | `session.ts`                                       |
| Blog domain        | `apps/foodblog/src/lib/blog/`                              | queries, guards, actions, validation, themes               | `queries.ts`                                       |
| Prisma schema      | `apps/foodblog/prisma/schema.prisma`                       | Single source of truth for the data model                  | whole file                                         |
| Migrations         | `apps/foodblog/prisma/migrations/`                         | SQL history (one migration: `20260805014250_init`)         | —                                                  |
| Seed               | `apps/foodblog/prisma/seed.ts`                             | Demo account, blog and recipes                             | —                                                  |
| Styles             | `apps/foodblog/src/styles/`                                | `marketing.css`, `dashboard.css`, `editor.css`, `site.css` | `site.css`                                         |
| Global CSS         | `apps/foodblog/src/app/globals.css`                        | Reset, utilities, alerts, focus ring                       | —                                                  |
| Design system      | `packages/ui/src/`                                         | `@bloghost/ui` primitives and tokens                       | `index.ts`, `styles.css`                           |
| ESLint configs     | `packages/config-eslint/`                                  | `./base`, `./react-library`, `./next`                      | `base.js`                                          |
| TS configs         | `packages/config-typescript/`                              | `base.json`, `react-library.json`, `nextjs.json`           | `base.json`                                        |
| Workspace          | `package.json`, `pnpm-workspace.yaml`, `turbo.json`        | Scripts, workspace globs, task graph                       | `turbo.json`                                       |
| Docs               | `README.md`, `INDEX.md`, `ARCHITECTURE.md`, `STYLE.md`     | —                                                          | this file                                          |
| Tests              | —                                                          | **None exist**                                             | [`STYLE.md` §13](STYLE.md#13-testing-expectations) |

## 5. Feature map

| To change…                                              | Start here                                                                   | Also inspect                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recipe editor chrome (action bar, save, preview toggle) | `apps/foodblog/src/components/recipe/recipe-editor.tsx`                      | `apps/foodblog/src/styles/editor.css`, `apps/foodblog/src/lib/recipes/actions.ts`                                                                       |
| Recipe layout / content blocks                          | `apps/foodblog/src/components/recipe/recipe-page.tsx`                        | `apps/foodblog/src/components/recipe/editable.tsx`, `apps/foodblog/src/components/recipe/recipe-document.ts`                                            |
| Inline editing fields and `+` controls                  | `apps/foodblog/src/components/recipe/editable.tsx`                           | `apps/foodblog/src/styles/editor.css`                                                                                                                   |
| Published recipe page                                   | `apps/foodblog/src/app/[subdomain]/recipes/[slug]/page.tsx`                  | `apps/foodblog/src/components/recipe/recipe-page.tsx`, `apps/foodblog/src/styles/site.css`, `apps/foodblog/src/lib/recipes/json-ld.ts`                  |
| Public recipe index / search                            | `apps/foodblog/src/components/site/recipe-index.tsx`                         | `apps/foodblog/src/app/[subdomain]/page.tsx`                                                                                                            |
| Recipe database fields                                  | `apps/foodblog/prisma/schema.prisma`                                         | `apps/foodblog/src/lib/recipes/validation.ts`, `apps/foodblog/src/lib/recipes/persistence.ts`, `apps/foodblog/src/components/recipe/recipe-document.ts` |
| Recipe reads                                            | `apps/foodblog/src/lib/recipes/queries.ts`                                   | `apps/foodblog/src/lib/db.ts`                                                                                                                           |
| Recipe writes                                           | `apps/foodblog/src/lib/recipes/persistence.ts`                               | `apps/foodblog/src/lib/recipes/actions.ts`                                                                                                              |
| Preview                                                 | `apps/foodblog/src/components/recipe/recipe-editor.tsx` (`previewing` state) | `packages/ui/src/dialog.tsx` (for the planned modal)                                                                                                    |
| Publishing workflow                                     | `apps/foodblog/src/lib/recipes/actions.ts`                                   | `apps/foodblog/src/lib/recipes/persistence.ts`, [`ARCHITECTURE.md` §6](ARCHITECTURE.md#6-recipe-lifecycle)                                              |
| Recipe list, filters, delete                            | `apps/foodblog/src/app/dashboard/recipes/page.tsx`                           | `apps/foodblog/src/components/dashboard/recipe-row.tsx`, `apps/foodblog/src/components/dashboard/delete-recipe-button.tsx`                              |
| Shared buttons and inputs                               | `packages/ui/src/index.ts`                                                   | `packages/ui/src/button.tsx`, `input.tsx`, `form-field.tsx`, `styles.css`                                                                               |
| Modals / confirmations                                  | `packages/ui/src/dialog.tsx`                                                 | `apps/foodblog/src/components/dashboard/delete-recipe-button.tsx`                                                                                       |
| Authentication                                          | `apps/foodblog/src/lib/auth/session.ts`                                      | `apps/foodblog/src/lib/auth/{password,service,guards,actions,validation}.ts`                                                                            |
| Route protection                                        | `apps/foodblog/src/lib/blog/guards.ts`                                       | `apps/foodblog/src/lib/auth/guards.ts`                                                                                                                  |
| Blog settings                                           | `apps/foodblog/src/app/dashboard/settings/page.tsx`                          | `apps/foodblog/src/components/blog/settings-form.tsx`, `apps/foodblog/src/lib/blog/{actions,validation}.ts`                                             |
| Themes / appearance                                     | `apps/foodblog/src/lib/blog/themes.ts`                                       | `apps/foodblog/src/app/dashboard/appearance/page.tsx`, `apps/foodblog/src/components/blog/theme-picker.tsx`, `apps/foodblog/src/styles/site.css`        |
| Global visual styles / tokens                           | `packages/ui/src/styles.css`                                                 | `apps/foodblog/src/app/globals.css`, `apps/foodblog/src/styles/site.css`                                                                                |
| Validation                                              | `apps/foodblog/src/lib/recipes/validation.ts`                                | `apps/foodblog/src/lib/blog/validation.ts`, `apps/foodblog/src/lib/auth/validation.ts`, `apps/foodblog/src/lib/form.ts`                                 |
| Public URLs and links                                   | `apps/foodblog/src/lib/tenant.ts`                                            | every `blogPath` / `blogRecipePath` call site                                                                                                           |
| SEO metadata and JSON-LD                                | `apps/foodblog/src/lib/recipes/json-ld.ts`                                   | route `generateMetadata` functions, `apps/foodblog/src/app/layout.tsx`                                                                                  |
| Marketing landing page                                  | `apps/foodblog/src/app/page.tsx`                                             | `apps/foodblog/src/styles/marketing.css`                                                                                                                |
| Seed data                                               | `apps/foodblog/prisma/seed.ts`                                               | `apps/foodblog/prisma/schema.prisma`                                                                                                                    |
| Tests                                                   | **No test setup exists**                                                     | [`STYLE.md` §13](STYLE.md#13-testing-expectations)                                                                                                      |

## 6. Domain terminology

Use these exact words in code, UI copy and commit messages.

| Term                  | Meaning in this codebase                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blog**              | `Blog` model. One hosted food blog: name, `subdomain`, description, `authorName`, theme. One per account today                              |
| **Subdomain**         | The blog's address segment. Served at `/<subdomain>`, globally unique, reserved words blocked in `apps/foodblog/src/lib/blog/validation.ts` |
| **Recipe**            | `Recipe` model plus its ingredient and instruction trees                                                                                    |
| **Draft**             | `Recipe.status === 'DRAFT'`. Never returned by a public query                                                                               |
| **Published recipe**  | `Recipe.status === 'PUBLISHED'` with a `publishedAt` timestamp; readable at `/<subdomain>/recipes/<slug>`                                   |
| **Recipe editor**     | `RecipeEditor` — the client shell around the canvas at `/dashboard/recipes/new` and `/dashboard/recipes/[recipeId]`                         |
| **Canvas**            | The editable recipe surface: `RecipePage` in `mode="edit"`, styled by `editor.css`                                                          |
| **Recipe document**   | `RecipeDocument` in `apps/foodblog/src/components/recipe/recipe-document.ts` — the all-strings client-side shape the editor mutates         |
| **Preview**           | `RecipePage` in `mode="preview"`, showing unsaved local state. An in-page toggle today, not a modal                                         |
| **Ingredient group**  | `IngredientGroup` — an optionally titled, ordered list of ingredients ("For the sauce")                                                     |
| **Instruction group** | `InstructionGroup` — an optionally titled, ordered list of steps. The spec's "instruction section"                                          |
| **Fact**              | An entry in the strip under the hero image (prep, cook, extra, total, serves, course, cuisine, difficulty), declared in `RECIPE_FACTS`      |
| **Slug**              | `Recipe.slug` — lowercase hyphenated address segment, unique per blog                                                                       |
| **Owner**             | A `BlogMember` with `role: 'OWNER'`. The only role ever created; `EDITOR` exists in the enum but is unused                                  |
| **Tenant**            | A blog as addressed by URL. All public URL construction goes through `apps/foodblog/src/lib/tenant.ts`                                      |

## 7. Dependency direction

```
apps/foodblog
  app/ (routes)  →  components/ (feature UI)  →  lib/ (domain)  →  Prisma  →  PostgreSQL
        │                    │                      │
        └────────────────────┴──────────────────────┴──→  @bloghost/ui  →  react, clsx

@bloghost/config-eslint, @bloghost/config-typescript  →  (build/lint only, no runtime deps)
```

Prohibited:

- `packages/ui` → `next/*`, `@prisma/client`, `zod`, `apps/**`, or anything food-specific.
- `apps/foodblog/src/lib/` → `apps/foodblog/src/components/` or `apps/foodblog/src/app/`. Domain code never imports UI. (`recipe-document.ts` lives under
  `apps/foodblog/src/components/` precisely so it can be imported _by_ routes without dragging Prisma into the client.)
- Client components → `apps/foodblog/src/lib/db.ts`, any `*/queries.ts`, `apps/foodblog/src/lib/recipes/persistence.ts`,
  `apps/foodblog/src/lib/auth/{session,service,password}.ts`, `apps/foodblog/src/lib/env.ts`. Importing a `'use server'` actions module
  is the only allowed client → server edge.
- Components → raw `prisma`. Data enters through a query function called by a server component.
- Anywhere → a hand-built public URL string. Use `apps/foodblog/src/lib/tenant.ts`.

## 8. Common agent workflows

### Before changing code

- Find the feature in the [feature map](#5-feature-map).
- Read the matching section of [`ARCHITECTURE.md`](ARCHITECTURE.md) and
  [`STYLE.md`](STYLE.md).
- Check `apps/foodblog/prisma/schema.prisma` whenever data is involved.
- Search `packages/ui/src/index.ts` and `apps/foodblog/src/components/` before creating a component;
  most primitives already exist.
- There are no tests to read. Read the adjacent module and its doc comments instead — this codebase
  documents intent in comments above non-obvious functions.

### After changing code

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- If `schema.prisma` changed: `pnpm db:migrate`, and commit the generated migration folder.
- Verify the affected routes in the browser at `http://localhost:3000`, including a narrow viewport
  (`< 48rem`).
- Update `INDEX.md`, `ARCHITECTURE.md` or `STYLE.md` when paths, responsibilities or conventions
  changed.

## 9. High-risk areas

| Area                          | Why                                                                                                                                     | Where                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Authentication                | Hand-rolled scrypt + database sessions; no library safety net                                                                           | `apps/foodblog/src/lib/auth/password.ts`, `session.ts`, [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-security-and-authorization) |
| Authorization                 | Enforced by `where` clauses, not by explicit checks — an over-broad query silently exposes other tenants                                | `apps/foodblog/src/lib/recipes/queries.ts`, `persistence.ts`, `apps/foodblog/src/lib/blog/guards.ts`                         |
| Draft vs published visibility | Public routes rely on `status: 'PUBLISHED'` being hard-coded in the query                                                               | `apps/foodblog/src/lib/recipes/queries.ts` (`getPublishedRecipes`, `getPublishedRecipeBySlug`)                               |
| Recipe ownership              | Every write takes `blogId` and scopes by it; dropping that argument removes the boundary                                                | `apps/foodblog/src/lib/recipes/persistence.ts`                                                                               |
| Slug changes                  | No redirects exist; changing a slug or subdomain breaks every published link                                                            | `apps/foodblog/src/lib/slug.ts`, `apps/foodblog/src/lib/recipes/validation.ts`, `apps/foodblog/src/lib/tenant.ts`            |
| Database migrations           | One migration so far; never hand-edit an applied one                                                                                    | `apps/foodblog/prisma/migrations/`                                                                                           |
| Destructive deletes           | The whole recipe tree cascades; `deleteRecipe` uses `deleteMany` scoped by `blogId`                                                     | `apps/foodblog/prisma/schema.prisma`, `apps/foodblog/src/lib/recipes/persistence.ts`                                         |
| Rendered HTML                 | Only one `dangerouslySetInnerHTML` in the codebase — the JSON-LD script, which is **not escaped against `</script>`**                   | `apps/foodblog/src/app/[subdomain]/recipes/[slug]/page.tsx`, `apps/foodblog/src/lib/recipes/json-ld.ts`                      |
| File uploads                  | Not implemented; hero images are unvalidated external URLs in a raw `<img>`                                                             | `apps/foodblog/src/lib/recipes/validation.ts`, `apps/foodblog/src/components/recipe/recipe-page.tsx`                         |
| Preview state                 | Renders unsaved local state and must never gain a mutation path                                                                         | `apps/foodblog/src/components/recipe/recipe-editor.tsx`                                                                      |
| Reordering nested content     | Save deletes and recreates both group trees in one transaction; `position` comes from array index, and child ids change every save      | `apps/foodblog/src/lib/recipes/persistence.ts`, `apps/foodblog/src/components/recipe/recipe-document.ts`                     |
| Client/server boundary        | `recipe-page.tsx` and `editable.tsx` carry no `'use client'` on purpose; adding a hook there breaks server rendering of the public page | [`ARCHITECTURE.md` §8](ARCHITECTURE.md#8-server-and-client-component-rules)                                                  |

## 10. Current implementation status

| Feature                                     | Status                  | Primary path                                            | Notes                                                                      |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| Accounts (sign up, sign in, sign out)       | Implemented             | `apps/foodblog/src/lib/auth/`                           | scrypt hashes, database sessions, `httpOnly` cookie                        |
| Email verification, password reset          | Planned                 | —                                                       | `User.emailVerifiedAt` is an unused seam                                   |
| Rate limiting on auth                       | Planned                 | —                                                       | None today                                                                 |
| Onboarding (create a blog)                  | Implemented             | `apps/foodblog/src/app/onboarding/page.tsx`             | One blog per account                                                       |
| Dashboard overview                          | Implemented             | `apps/foodblog/src/app/dashboard/page.tsx`              | Counts, recent recipes, public URL                                         |
| Recipe list, filter, delete                 | Implemented             | `apps/foodblog/src/app/dashboard/recipes/page.tsx`      | Confirm dialog on delete                                                   |
| Visual recipe editor                        | Implemented             | `apps/foodblog/src/components/recipe/recipe-editor.tsx` | Canvas is the published page                                               |
| Ingredient / instruction groups, reordering | Implemented             | `apps/foodblog/src/components/recipe/recipe-page.tsx`   | ↑ ↓ ✕ controls, `+` to add                                                 |
| Save, publish, unpublish                    | Implemented             | `apps/foodblog/src/lib/recipes/actions.ts`              | Explicit buttons; unpublishing clears `publishedAt`                        |
| Autosave / unsaved-changes warning          | Planned                 | —                                                       | Navigating away loses the document                                         |
| Preview                                     | Partial                 | `recipe-editor.tsx`                                     | In-page mode toggle; the MVP calls for a modal                             |
| Drag-and-drop reordering                    | Planned                 | —                                                       | Only ↑ ↓ buttons; the one drop target is the photo URL well                |
| Hero image                                  | Partial                 | `apps/foodblog/src/lib/recipes/validation.ts`           | External `http(s)` URL only; no upload, no allowlist, raw `<img>`          |
| Tags / categories                           | Partial                 | `apps/foodblog/prisma/schema.prisma`                    | Free-text `cuisine` and `course`; no model, no archive pages               |
| Public recipe index and page                | Implemented             | `apps/foodblog/src/app/[subdomain]/`                    | Title search, print button, about page                                     |
| SEO metadata + `Recipe` JSON-LD             | Implemented             | `apps/foodblog/src/lib/recipes/json-ld.ts`              | Escaping gap noted in [§9](#9-high-risk-areas)                             |
| Single platform-wide visual system          | Partial                 | `apps/foodblog/src/styles/site.css`                     | Shared markup, but three user-selectable token themes                      |
| Custom domains                              | Planned                 | `apps/foodblog/src/app/dashboard/settings/page.tsx`     | "Coming soon" badge only                                                   |
| Real subdomain hosting                      | Planned                 | `apps/foodblog/src/lib/tenant.ts`                       | Path-based `/<subdomain>` today; needs a middleware rewrite                |
| Multi-author blogs                          | Blocked                 | `apps/foodblog/prisma/schema.prisma`                    | `BlogRole.EDITOR` and `userCanEditBlog()` exist but nothing enforces roles |
| Automated tests                             | Planned                 | —                                                       | No runner, no test files, no `test` script                                 |
| Billing, comments, ratings, newsletters     | Not planned for the MVP | —                                                       | See `README.md`                                                            |

---

## Documentation maintenance

- Update this file when important paths, commands, or feature locations change.
- Update [`ARCHITECTURE.md`](ARCHITECTURE.md) when data flow, package boundaries, models, or major
  decisions change.
- Update [`STYLE.md`](STYLE.md) when coding, UI, accessibility, or testing conventions change.
- Ship documentation changes in the same pull request as the code change that makes them necessary.
