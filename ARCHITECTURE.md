# Architecture

How BlogHost is structured and how data moves through it. Read [`INDEX.md`](INDEX.md) first for
the repository map; read [`STYLE.md`](STYLE.md) for the conventions a change must follow.

Status vocabulary used throughout: **Implemented**, **Partial**, **Planned**, **Not planned**.

---

## 1. Project overview

BlogHost is hosted food-blog software. A cook signs up, creates one blog, writes recipes in a
visual editor, and publishes them to a public blog served under `/site/<subdomain>`.

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js 15.5, App Router, React 19                    |
| Language   | TypeScript 5.9 (`strict`, `noUncheckedIndexedAccess`) |
| Data       | Prisma 6.2 → PostgreSQL                               |
| Validation | Zod 4                                                 |
| Workspace  | pnpm 9 workspaces + Turborepo 2.3, Node ≥ 20.11       |

### MVP scope and status

| Capability                                             | Status       | Notes                                                                                                                             |
| ------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Create and manage one food blog per account            | Implemented  | `createBlogAction` refuses a second blog                                                                                          |
| Create, edit, save, publish, unpublish, delete recipes | Implemented  | See [§6](#6-recipe-lifecycle)                                                                                                     |
| Visual page-like recipe editor (not an admin form)     | Implemented  | `RecipePage` renders edit / preview / published from one component                                                                |
| Editor resembles the published page                    | Implemented  | Same component, same stylesheet, same theme tokens                                                                                |
| Inline fields and contextual `+` controls              | Implemented  | `EditableText`, `CanvasAddButton`                                                                                                 |
| Preview **in a modal**                                 | **Planned**  | Today preview is an in-page mode toggle, not a modal. See [§6](#6-recipe-lifecycle)                                               |
| Publish makes the recipe publicly readable             | Implemented  |                                                                                                                                   |
| One platform-wide visual system, no selectable themes  | **Diverges** | Markup and layout are platform-wide, but three token themes are user-selectable. See [§10](#10-important-architectural-decisions) |
| Recipe metadata and structured data on public pages    | Implemented  | `generateMetadata` + `Recipe` JSON-LD                                                                                             |

### Recipe content model

| Content                  | Field / model                                                          | Status                                            |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------- |
| Title                    | `Recipe.title`                                                         | Implemented                                       |
| Description              | `Recipe.description` (required, index + meta)                          | Implemented                                       |
| Introduction             | `Recipe.introduction` (optional, plain text)                           | Implemented                                       |
| Hero image               | `Recipe.featuredImageUrl` (external URL string)                        | Partial — URL only, no upload                     |
| Servings                 | `Recipe.servings`                                                      | Implemented                                       |
| Prep / cook / extra time | `prepMinutes`, `cookMinutes`, `additionalMinutes`                      | Implemented                                       |
| Total time               | Derived, `totalMinutes()` in `apps/foodblog/src/lib/recipes/format.ts` | Implemented                                       |
| Ingredients              | `Ingredient`                                                           | Implemented                                       |
| Ingredient groups        | `IngredientGroup`                                                      | Implemented                                       |
| Instruction steps        | `InstructionStep`                                                      | Implemented                                       |
| Instruction sections     | `InstructionGroup`                                                     | Implemented                                       |
| Notes                    | `Recipe.notes` (single plain-text field)                               | Implemented                                       |
| Tags / categories        | `Recipe.cuisine`, `Recipe.course` free-text strings                    | Partial — no `Tag`/`Category` model, no tag pages |
| Difficulty               | `Recipe.difficulty` enum                                               | Implemented                                       |
| Publication status       | `Recipe.status`, `Recipe.publishedAt`                                  | Implemented                                       |
| Slug                     | `Recipe.slug`, unique per blog                                         | Implemented                                       |

All long-form fields are **plain text**. There is no rich-text editor and no stored HTML.

---

## 2. Repository structure

```
bloghost/
├── apps/
│   └── foodblog/                    # @bloghost/foodblog — the only deployable app
│       ├── prisma/
│       │   ├── schema.prisma        # single source of truth for the data model
│       │   ├── migrations/          # SQL migrations, one folder per migration
│       │   └── seed.ts              # demo account, blog and four recipes
│       └── src/
│           ├── app/                 # App Router route tree
│           │   ├── (auth)/          # sign-in, sign-up
│           │   ├── dashboard/       # authenticated area
│           │   ├── onboarding/      # first-run blog creation
│           │   ├── site/[subdomain]/# public hosted blog
│           │   ├── layout.tsx       # root layout, global metadata
│           │   ├── page.tsx         # marketing landing page
│           │   ├── error.tsx        # root error boundary
│           │   └── globals.css
│           ├── components/
│           │   ├── auth/            # sign-in / sign-up forms
│           │   ├── blog/            # onboarding, settings, appearance, theme picker
│           │   ├── dashboard/       # nav, recipe row, delete button, sign out
│           │   ├── recipe/          # the recipe document, canvas and editor
│           │   └── site/            # public blog nav, index, prose, print
│           ├── lib/
│           │   ├── auth/            # password, session, service, guards, actions
│           │   ├── blog/            # queries, guards, actions, validation, themes
│           │   ├── recipes/         # queries, persistence, actions, validation, format, json-ld
│           │   ├── db.ts            # the Prisma client singleton
│           │   ├── env.ts           # parsed, validated environment
│           │   ├── form.ts          # FormState and field-error helpers
│           │   ├── slug.ts          # slugify / uniqueSlug
│           │   └── tenant.ts        # every public URL is built here
│           └── styles/              # marketing.css, dashboard.css, editor.css, site.css
├── packages/
│   ├── ui/                          # @bloghost/ui — generic primitives + design tokens
│   ├── config-eslint/               # @bloghost/config-eslint — flat configs
│   └── config-typescript/           # @bloghost/config-typescript — tsconfig presets
├── .env.example
├── package.json                     # root scripts, all delegate to turbo or pnpm --filter
├── pnpm-workspace.yaml
└── turbo.json
```

There is **no** `packages/db`, `packages/types`, `packages/validation`, `packages/utils`, or test
directory. Domain code lives in `apps/foodblog/src/lib`.

### Packages

| Package                        | Responsibility                                                                                                                                                                                                             | May import                           | Must not import                                                                                 | Consumed by                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| `packages/ui` (`@bloghost/ui`) | Generic, product-agnostic primitives: `Button`, `Input`, `Textarea`, `Select`, `FormField`, `Card`, `Badge`, `EmptyState`, `ConfirmDialog`, `DashboardShell`, `cn`; plus all design tokens in `packages/ui/src/styles.css` | `react`, `react-dom` (peers), `clsx` | `next/*`, `@prisma/client`, `zod`, anything under `apps/`, anything that knows what a recipe is | `apps/foodblog`                |
| `packages/config-eslint`       | Flat ESLint configs: `./base` (TS), `./react-library`, `./next`                                                                                                                                                            | ESLint plugins                       | app code                                                                                        | `apps/foodblog`, `packages/ui` |
| `packages/config-typescript`   | `base.json`, `react-library.json`, `nextjs.json`                                                                                                                                                                           | —                                    | —                                                                                               | `apps/foodblog`, `packages/ui` |

`@bloghost/ui` ships TypeScript source; the app compiles it via `transpilePackages` in
`apps/foodblog/next.config.ts`. Anything added there must stay usable outside Next.js.

---

## 3. Application boundaries

| Boundary                       | Where                                                                                                                                              | Next.js allowed?                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Public blog and recipe pages   | `src/app/site/[subdomain]/**`                                                                                                                      | Yes                                                                                                          |
| Marketing landing page         | `apps/foodblog/src/app/page.tsx`                                                                                                                   | Yes                                                                                                          |
| Authenticated dashboard        | `src/app/dashboard/**`                                                                                                                             | Yes                                                                                                          |
| Recipe editor chrome           | `apps/foodblog/src/components/recipe/recipe-editor.tsx`                                                                                            | Yes (`next/link`, `next/navigation`)                                                                         |
| Recipe canvas / published page | `apps/foodblog/src/components/recipe/recipe-page.tsx`                                                                                              | Yes (`next/link` only)                                                                                       |
| Inline editing primitives      | `apps/foodblog/src/components/recipe/editable.tsx`                                                                                                 | No — plain React and DOM                                                                                     |
| Recipe document model          | `apps/foodblog/src/components/recipe/recipe-document.ts`                                                                                           | No — pure data, no Prisma, no Next.js                                                                        |
| Preview                        | Mode of `RecipePage`, toggled in `recipe-editor.tsx`                                                                                               | Yes                                                                                                          |
| Publishing workflow            | `apps/foodblog/src/lib/recipes/actions.ts` → `persistence.ts`                                                                                      | Yes (`revalidatePath`)                                                                                       |
| Database layer                 | `apps/foodblog/src/lib/db.ts`, `apps/foodblog/src/lib/*/queries.ts`, `apps/foodblog/src/lib/recipes/persistence.ts`                                | Server only                                                                                                  |
| Shared UI layer                | `packages/ui`                                                                                                                                      | **No**                                                                                                       |
| Authentication                 | `src/lib/auth/**`                                                                                                                                  | `session.ts` and `guards.ts` use `next/headers` and `next/navigation`; `password.ts` and `service.ts` do not |
| Image / media handling         | External URLs only, validated in `apps/foodblog/src/lib/recipes/validation.ts`                                                                     | —                                                                                                            |
| Server-side operations         | `'use server'` files: `apps/foodblog/src/lib/auth/actions.ts`, `apps/foodblog/src/lib/blog/actions.ts`, `apps/foodblog/src/lib/recipes/actions.ts` | Yes                                                                                                          |
| Client interactivity           | The 13 app files and 1 package file marked `'use client'`                                                                                          | Yes                                                                                                          |

Framework-independent by rule: `packages/ui/**`, `apps/foodblog/src/lib/slug.ts`,
`apps/foodblog/src/lib/recipes/format.ts`, `apps/foodblog/src/lib/recipes/json-ld.ts` (types only from Prisma),
`apps/foodblog/src/lib/recipes/validation.ts`, `apps/foodblog/src/components/recipe/recipe-document.ts`,
`apps/foodblog/src/components/recipe/editable.tsx`, `apps/foodblog/src/lib/auth/password.ts`.

Never import into a browser bundle: `apps/foodblog/src/lib/db.ts`, any `*/queries.ts`,
`apps/foodblog/src/lib/recipes/persistence.ts`, `apps/foodblog/src/lib/auth/session.ts`, `apps/foodblog/src/lib/auth/service.ts`,
`apps/foodblog/src/lib/auth/password.ts`, `apps/foodblog/src/lib/env.ts`. Client components may import `'use server'` action
modules — that is the only sanctioned client → server edge.

---

## 4. Routing

All routes live under `apps/foodblog/src/app`.

| URL                                               | Purpose                                                            | Access                                                    | Primary files                                                                                                                                                                  | Data                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `/`                                               | Marketing landing page with a live preview of the seeded demo blog | Public                                                    | `page.tsx`, `apps/foodblog/src/styles/marketing.css`                                                                                                                           | `getBlogBySubdomain('janes-kitchen')`, `getPublishedRecipes`, `getCurrentUser` (for the nav CTA) |
| `/sign-in`                                        | Sign in                                                            | Public, redirects away if signed in                       | `apps/foodblog/src/app/(auth)/sign-in/page.tsx`, `apps/foodblog/src/components/auth/sign-in-form.tsx`, `apps/foodblog/src/lib/auth/actions.ts`                                 | —                                                                                                |
| `/sign-up`                                        | Register                                                           | Public, redirects away if signed in                       | `apps/foodblog/src/app/(auth)/sign-up/page.tsx`, `apps/foodblog/src/components/auth/sign-up-form.tsx`                                                                          | —                                                                                                |
| `/onboarding`                                     | Create the account's blog                                          | Authenticated; redirects to `/dashboard` if a blog exists | `apps/foodblog/src/app/onboarding/page.tsx`, `apps/foodblog/src/components/blog/onboarding-form.tsx`                                                                           | `getBlogForUser`                                                                                 |
| `/dashboard`                                      | Overview: counts, recent recipes, public URL                       | Authenticated + blog                                      | `apps/foodblog/src/app/dashboard/page.tsx`, `apps/foodblog/src/app/dashboard/layout.tsx`                                                                                       | `getBlogRecipeStats`, `getRecentRecipes`                                                         |
| `/dashboard/recipes?status=all\|published\|draft` | Recipe list and filter                                             | Authenticated + blog                                      | `apps/foodblog/src/app/dashboard/recipes/page.tsx`, `apps/foodblog/src/components/dashboard/recipe-row.tsx`, `apps/foodblog/src/components/dashboard/delete-recipe-button.tsx` | `getRecipesForBlog(blogId, status?)`                                                             |
| `/dashboard/recipes/new`                          | Editor for an unsaved recipe                                       | Authenticated + blog                                      | `apps/foodblog/src/app/dashboard/recipes/new/page.tsx`                                                                                                                         | `requireBlog` only; document starts from `emptyRecipeDocument()`                                 |
| `/dashboard/recipes/[recipeId]?saved=…`           | Editor for an existing recipe                                      | Authenticated + owner                                     | `apps/foodblog/src/app/dashboard/recipes/[recipeId]/page.tsx`                                                                                                                  | `getEditableRecipe(recipeId, userId)` — 404 if not owned                                         |
| `/dashboard/appearance`                           | Theme switching                                                    | Authenticated + blog                                      | `apps/foodblog/src/app/dashboard/appearance/page.tsx`, `apps/foodblog/src/components/blog/appearance-form.tsx`                                                                 | `getThemeOption(blog.theme)`                                                                     |
| `/dashboard/settings`                             | Blog name, address, description, author; custom-domain placeholder | Authenticated + blog                                      | `apps/foodblog/src/app/dashboard/settings/page.tsx`, `apps/foodblog/src/components/blog/settings-form.tsx`                                                                     | `requireBlog`                                                                                    |
| `/site/[subdomain]`                               | Public recipe index with client-side title search                  | Public                                                    | `apps/foodblog/src/app/site/[subdomain]/page.tsx`, `apps/foodblog/src/app/site/[subdomain]/layout.tsx`, `apps/foodblog/src/components/site/recipe-index.tsx`                   | `getBlogBySubdomain`, `getPublishedRecipes`                                                      |
| `/site/[subdomain]/recipes/[slug]`                | Public recipe page + `Recipe` JSON-LD                              | Public                                                    | `apps/foodblog/src/app/site/[subdomain]/recipes/[slug]/page.tsx`, `apps/foodblog/src/components/recipe/recipe-page.tsx`                                                        | `getPublishedRecipeBySlug` — published only                                                      |
| `/site/[subdomain]/about`                         | Public about page, generated from blog fields                      | Public                                                    | `apps/foodblog/src/app/site/[subdomain]/about/page.tsx`                                                                                                                        | `getBlogBySubdomain`                                                                             |

Error and empty routes: `apps/foodblog/src/app/error.tsx` (root boundary), `apps/foodblog/src/app/not-found.tsx`,
`apps/foodblog/src/app/site/[subdomain]/not-found.tsx`.

**Planned routes** (none exist yet): real subdomain hosts via middleware rewrite, tag/category
archive pages, a media library, password reset.

Public URLs are never hard-coded in components. Build them with the helpers in `apps/foodblog/src/lib/tenant.ts`:
`blogPath`, `blogRecipePath`, `blogAboutPath`, `blogUrl`, `blogRecipeUrl`, `absoluteUrl`.

---

## 5. Data model

Schema: [`apps/foodblog/prisma/schema.prisma`](apps/foodblog/prisma/schema.prisma). Migrations:
`apps/foodblog/prisma/migrations/` (currently one, `20260805014250_init`).

All models use `cuid()` string ids, `@@map` to snake_case table names, and `createdAt` where
useful. Every foreign key in the recipe tree is `onDelete: Cascade`.

```
User ──< BlogMember >── Blog ──< Recipe ──< IngredientGroup ──< Ingredient
 │                                    └──< InstructionGroup ──< InstructionStep
 └──< Session
```

| Model              | Purpose                                        | Key fields                                                | Relationships                                     | Ownership / lifecycle                                             | Constraints                                                                                | Delete behaviour                                                |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `User`             | An account                                     | `email`, `passwordHash`, `displayName`, `emailVerifiedAt` | `sessions`, `memberships`                         | —                                                                 | `email` unique                                                                             | Deleting cascades sessions and memberships                      |
| `Session`          | Server-side session                            | `tokenHash` (SHA-256 of the cookie value), `expiresAt`    | → `User`                                          | Expiry checked on read in `apps/foodblog/src/lib/auth/session.ts` | `tokenHash` unique; indexed on `userId`, `expiresAt`                                       | Cascades from `User`. **No background cleanup of expired rows** |
| `Blog`             | One hosted food blog                           | `name`, `subdomain`, `description`, `authorName`, `theme` | `members`, `recipes`                              | Access via `BlogMember`                                           | `subdomain` unique globally                                                                | Cascades members and recipes                                    |
| `BlogMember`       | User ↔ blog join with a role                   | `role` (`OWNER` \| `EDITOR`)                              | → `User`, → `Blog`                                | The only ownership record                                         | `@@unique([blogId, userId])`                                                               | Cascades from either side                                       |
| `Recipe`           | A recipe                                       | See [§1](#recipe-content-model)                           | → `Blog`, `ingredientGroups`, `instructionGroups` | Owned via `blogId`                                                | `@@unique([blogId, slug])`; indexes `[blogId, status, publishedAt]`, `[blogId, updatedAt]` | Cascades both group trees                                       |
| `IngredientGroup`  | Titled ingredient section; `title` may be null | `title`, `position`                                       | → `Recipe`, `ingredients`                         | Via recipe                                                        | Index `[recipeId, position]`                                                               | Cascades ingredients                                            |
| `Ingredient`       | One ingredient line                            | `text`, `position`                                        | → `IngredientGroup`                               | Via group                                                         | Index `[groupId, position]`                                                                | —                                                               |
| `InstructionGroup` | Titled instruction section                     | `title`, `position`                                       | → `Recipe`, `steps`                               | Via recipe                                                        | Index `[recipeId, position]`                                                               | Cascades steps                                                  |
| `InstructionStep`  | One numbered step                              | `text`, `position`                                        | → `InstructionGroup`                              | Via group                                                         | Index `[groupId, position]`                                                                | —                                                               |

Enums: `BlogTheme` (`MINIMAL`, `EDITORIAL`, `WARM`), `BlogRole` (`OWNER`, `EDITOR`),
`RecipeStatus` (`DRAFT`, `PUBLISHED`), `RecipeDifficulty` (`EASY`, `MEDIUM`, `HARD`).

Ordering is stored explicitly in `position`, assigned from array index at write time, and every
read orders by it. There is no ordering guarantee without an explicit `orderBy`.

**Not modelled yet:** `Category` / `Tag` (only the `cuisine` and `course` strings exist), `Media`
(only `Recipe.featuredImageUrl`), comments, ratings, and anything billing-related.

**Modelled but unused:** `BlogRole.EDITOR` is never assigned — `createBlogAction` always creates
`OWNER`, and no code branches on role. `User.emailVerifiedAt` is a column only; nothing sets or
reads it.

---

## 6. Recipe lifecycle

Nothing is persisted while typing. **There is no autosave and no draft buffer**; the document
lives in `useState` inside `RecipeEditor` until a button is pressed. Navigating away loses it.

| Step              | Trigger                                              | What happens                                                                                                                                              |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Create a draft | Open `/dashboard/recipes/new`                        | `emptyRecipeDocument()` gives one empty ingredient group and one empty instruction group. Nothing is written yet                                          |
| 2. Edit           | Typing on the canvas                                 | `handleChange` updates local `RecipeDocument`. While the slug has not been hand-edited, it tracks the title through `slugify(value, 80)`                  |
| 3. Save           | `Save draft`                                         | `saveRecipeAction(toFormValues(recipe, 'DRAFT'), recipeId?)`. On first save the editor `router.replace`s to `/dashboard/recipes/<id>?saved=draft-created` |
| 4. Preview        | `Preview`                                            | Local `previewing` flag swaps the canvas to `<RecipePage mode="preview">`. No network call, no modal, no mutation path                                    |
| 5. Publish        | `Publish recipe`                                     | Same action with `status: 'PUBLISHED'`; `publishedAt` set to `now()` if it was null                                                                       |
| 6. Edit published | Typing, then `Update recipe`                         | Same replace path; the original `publishedAt` is preserved                                                                                                |
| 7. Unpublish      | `Unpublish` (the `Save draft` button when published) | Saves with `status: 'DRAFT'`, which sets `publishedAt = null`. Re-publishing later produces a **new** publication date                                    |
| 8. Delete         | `Delete` in the recipe list → `ConfirmDialog`        | `deleteRecipeAction` → `prisma.recipe.deleteMany({ where: { id, blogId } })`, cascading the whole tree                                                    |

**Save is a full replace.** `replaceRecipe` runs one `$transaction` that deletes every
`IngredientGroup` and `InstructionGroup` for the recipe and recreates them from the submitted
document. Consequence: ingredient and step row ids change on every save, so nothing may reference
them.

**Draft vs published** is `Recipe.status` plus `Recipe.publishedAt`. Draft recipes are excluded at
the query level, not by a filter in the view: `getPublishedRecipes` and `getPublishedRecipeBySlug`
both hard-code `status: 'PUBLISHED'`.

**Slugs.** Generated client-side by `slugify` in `apps/foodblog/src/lib/slug.ts` while the field is untouched,
then validated server-side by `recipeSlugSchema` (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, 3–80 chars,
lowercased). Uniqueness is enforced by the `@@unique([blogId, slug])` constraint; a Prisma `P2002`
is caught in `persistence.ts` and returned as `{ ok: false, reason: 'slug-taken' }`, which the
action turns into a field error on `slug`. `uniqueSlug()` exists in `apps/foodblog/src/lib/slug.ts` but is
**not wired up** — collisions surface as an error for the user to resolve.

**Preview vs the public route.** Preview renders unsaved local state through
`RecipePage mode="preview"` inside `.editor__canvas`; the public route renders saved database rows
through `RecipePage mode="published"` and adds the back link, print button and JSON-LD script.
Preview cannot write anything.

**Authorization** is enforced in three places, all server-side: `requireBlog()` at the top of every
dashboard page and every recipe action; `getEditableRecipe(recipeId, userId)` which scopes by
membership; and `replaceRecipe`/`deleteRecipe`, which take `blogId` and scope their `where` clauses
by it. An id from another tenant matches nothing and produces a 404 or a `not-found` result.

---

## 7. Data flow

**Dashboard page load**

```
Request → dashboard/layout.tsx requireBlog()
          → requireUser() → getCurrentSession() [React cache] → prisma.session
          → getBlogForUser(userId) [React cache] → prisma.blog
        → page.tsx server component → lib/*/queries.ts → Prisma → PostgreSQL
        → RSC payload → @bloghost/ui server components
```

**Editing a recipe**

```
page.tsx (server): getEditableRecipe → toRecipeDocument(recipe) → RecipeDocument
        → <RecipeEditor initialRecipe={...}> (client boundary; plain serialisable data)
        → useState<RecipeDocument> → <RecipePage mode="edit"> → EditableText onChange
        → handleChange(field, value) → setRecipe   (no network traffic)
```

**Saving / publishing**

```
Editor → toFormValues(recipe, status) → saveRecipeAction(values, recipeId?)   ['use server']
       → requireBlog()                      # authn + authz
       → recipeInputSchema.safeParse        # the validation boundary
         ├─ fail → { ok:false, fieldErrors } → setFieldErrors → inline errors on the canvas
         └─ pass → createRecipe | replaceRecipe → Prisma $transaction → PostgreSQL
                 → revalidatePath('/dashboard','layout')
                 → revalidatePath('/site/<subdomain>','layout')
                 → { ok:true, recipeId } → router.replace(...) or router.refresh()
```

**Previewing**

```
Editor: setPreviewing(true) → <RecipePage mode="preview" recipe={localState}>
(no server round trip, no mutation)
```

**Rendering a public recipe page**

```
GET /site/<subdomain>/recipes/<slug>
  → site/[subdomain]/layout.tsx: getBlogBySubdomain → themeAttribute → data-theme
  → page.tsx: getPublishedRecipeBySlug(blog.id, slug)   # status: 'PUBLISHED' only
              ├─ null → notFound()
              └─ buildRecipeJsonLd(...) → <script type="application/ld+json">
                 toRecipeDocument(recipe) → <RecipePage mode="published">
  → generateMetadata: title, description, canonical, Open Graph
```

---

## 8. Server and client component rules

**Server Components are the default.** Only these files carry `'use client'`:

| File                                                                                                | Why it must be a client component              |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/foodblog/src/components/recipe/recipe-editor.tsx`                                             | Holds the whole editing document in `useState` |
| `apps/foodblog/src/components/dashboard/dashboard-nav.tsx`                                          | `usePathname` for the active link              |
| `apps/foodblog/src/components/site/site-nav.tsx`                                                    | `usePathname` for the active link              |
| `apps/foodblog/src/components/dashboard/delete-recipe-button.tsx`                                   | `ConfirmDialog` open state and `useTransition` |
| `apps/foodblog/src/components/site/recipe-index.tsx`                                                | Client-side title search                       |
| `apps/foodblog/src/components/site/print-button.tsx`                                                | `window.print()`                               |
| `apps/foodblog/src/components/submit-button.tsx`                                                    | `useFormStatus`                                |
| `apps/foodblog/src/components/auth/sign-in-form.tsx`, `sign-up-form.tsx`                            | `useActionState`                               |
| `apps/foodblog/src/components/blog/onboarding-form.tsx`, `settings-form.tsx`, `appearance-form.tsx` | `useActionState`                               |
| `apps/foodblog/src/app/error.tsx`                                                                   | Error boundaries must be client components     |
| `packages/ui/src/dialog.tsx`                                                                        | Imperative `<dialog>.showModal()`              |

`apps/foodblog/src/components/recipe/recipe-page.tsx` and `editable.tsx` have **no** `'use client'` directive on
purpose: they are pulled into the client bundle by `recipe-editor.tsx` and rendered on the server
by the public recipe route. Keep them free of hooks and browser-only globals at module scope so
that stays true. (`focusField` in `editable.tsx` touches `document` only inside an event-driven
callback.)

- **Database access** is allowed in server components, `'use server'` actions, `apps/foodblog/src/lib/*/queries.ts`,
  `apps/foodblog/src/lib/recipes/persistence.ts`, and `apps/foodblog/prisma/seed.ts`. Nowhere else.
- **Mutations** belong in a `'use server'` module under `apps/foodblog/src/lib/<domain>/actions.ts`. Actions
  never touch Prisma directly for recipes; they call `persistence.ts`. Blog and auth actions
  currently call `prisma` inline, which is the existing pattern for those domains.
- **Validation is shared** by putting the Zod schema in `apps/foodblog/src/lib/<domain>/validation.ts` and importing
  it from both sides. The editor imports only the _types_ (`RecipeFormValues`) so no schema is
  duplicated; the server owns the only enforced parse.
- **Server → client data** must be plain serialisable values. Prisma rows are converted first:
  `toRecipeDocument()` turns `RecipeDetail` into strings, and `Date` becomes an ISO string
  (`recipe.publishedAt?.toISOString() ?? null`). Never pass a Prisma model or a `Date` across the
  boundary.
- **Never in a browser bundle:** the list at the end of [§3](#3-application-boundaries).

Two forms of mutation coexist, both valid:

| Pattern                                | Used by                                | Shape                                                              |
| -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `useActionState` + `<form action={…}>` | auth, onboarding, settings, appearance | `(prevState: FormState, formData: FormData) => Promise<FormState>` |
| Direct action call in `useTransition`  | recipe save, recipe delete             | `(values, id?) => Promise<{ ok: … }>` discriminated union          |

Use the form pattern for conventional forms; use the direct call when the payload is a structured
document rather than form fields (the editor sends a whole `RecipeDocument`, which is why
`next.config.ts` raises `serverActions.bodySizeLimit` to `2mb`).

---

## 9. Security and authorization

| Concern                                    | Status                                                                                                                                                                                                                  | Where                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Password hashing                           | Implemented — scrypt, `N=16384, r=8, p=1`, format `scrypt$N$r$p$salt$hash`, `timingSafeEqual` compare                                                                                                                   | `apps/foodblog/src/lib/auth/password.ts`                                                             |
| Timing-safe login                          | Implemented — a missing account still pays for a hash                                                                                                                                                                   | `apps/foodblog/src/lib/auth/service.ts`                                                              |
| Sessions                                   | Implemented — 32 random bytes, stored as SHA-256, `httpOnly` + `sameSite: lax` + `secure` in production, 30-day TTL, expiry checked on read                                                                             | `apps/foodblog/src/lib/auth/session.ts`                                                              |
| Route protection                           | Implemented — `requireUser()` / `requireBlog()` at the top of every dashboard page and every action                                                                                                                     | `apps/foodblog/src/lib/auth/guards.ts`, `apps/foodblog/src/lib/blog/guards.ts`                       |
| Recipe ownership                           | Implemented — every read and write is scoped by `blogId` or by `blog.members.some.userId`                                                                                                                               | `apps/foodblog/src/lib/recipes/queries.ts`, `apps/foodblog/src/lib/recipes/persistence.ts`           |
| Server-side input validation               | Implemented — every action `safeParse`s before touching the database                                                                                                                                                    | `apps/foodblog/src/lib/*/validation.ts`                                                              |
| Unpublished content leakage                | Implemented — public queries hard-code `status: 'PUBLISHED'`; the dashboard sets `robots: { index: false }`                                                                                                             | `apps/foodblog/src/lib/recipes/queries.ts`, `apps/foodblog/src/app/dashboard/layout.tsx`             |
| Slug safety                                | Implemented — strict regex, lowercase, reserved-subdomain list for blogs                                                                                                                                                | `apps/foodblog/src/lib/recipes/validation.ts`, `apps/foodblog/src/lib/blog/validation.ts`            |
| HTML sanitization                          | Not needed — all user text is plain text rendered as React children; `Prose` splits on blank lines only                                                                                                                 | `apps/foodblog/src/components/site/prose.tsx`                                                        |
| Environment validation                     | Implemented — fails fast at import                                                                                                                                                                                      | `apps/foodblog/src/lib/env.ts`                                                                       |
| **JSON-LD injection**                      | **Missing safeguard.** `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` does not escape `<`, `>` or `/`, so a recipe title containing `</script>` can break out of the script element on a published page | `apps/foodblog/src/app/site/[subdomain]/recipes/[slug]/page.tsx`                                     |
| **File uploads**                           | **Not implemented.** `featuredImageUrl` accepts any `http(s)` URL; there is no upload endpoint, no size or MIME check, no domain allowlist, and images render through a raw `<img>`                                     | `apps/foodblog/src/lib/recipes/validation.ts`, `apps/foodblog/src/components/recipe/recipe-page.tsx` |
| **Rate limiting / brute-force protection** | **Missing.** Sign-in and sign-up have no throttling                                                                                                                                                                     | —                                                                                                    |
| **Email verification, password reset**     | **Missing.** `User.emailVerifiedAt` is an unused seam                                                                                                                                                                   | —                                                                                                    |
| **Expired session cleanup**                | **Missing.** Rows are deleted lazily when a stale token is presented; nothing sweeps the table                                                                                                                          | `apps/foodblog/src/lib/auth/session.ts`                                                              |
| **Role enforcement**                       | **Missing.** `BlogRole.EDITOR` exists but no code checks it; `userCanEditBlog()` in `apps/foodblog/src/lib/blog/queries.ts` is dead code despite its comment                                                            | `apps/foodblog/src/lib/blog/queries.ts`                                                              |
| CSRF                                       | Relies entirely on Next.js Server Action origin checks; nothing additional                                                                                                                                              | —                                                                                                    |

---

## 10. Important architectural decisions

**Monorepo with `packages/`.** pnpm workspaces + Turborepo. _Why:_ keeps a genuinely generic design
system and shared configs out of the app so a second application could reuse them. _Consequence:_
extraction is deliberate and rare — see the last decision.

**PostgreSQL through Prisma.** _Why:_ the recipe tree is relational and ordering matters.
_Consequence:_ the schema is the single source of truth; every data change needs a migration, and
Prisma types flow outward through `Prisma.RecipeGetPayload`.

**Nested trees are replaced, not diffed, on save.** _Why:_ reordering, insertion and deletion in the
editor all become the same operation, and `position` always matches array order.
_Consequence:_ child row ids are not stable across saves; nothing may reference them.

**One component renders edit, preview and published.** `RecipePage` takes
`mode: 'edit' | 'preview' | 'published'` and swaps text nodes for inline fields in place. _Why:_ the
editor cannot drift away from what a reader sees. _Consequence:_ it must stay hook-free so the
public route can render it on the server, and any new recipe content block must be added there once
rather than twice.

**The editor is a canvas, not a form.** No settings sidebar, no field list. _Why:_ the target user
is a cook, not an administrator. _Consequence:_ new fields must find a home in the reading layout;
if there is no natural place for it in the published page, question the field.

**Preview is an in-page mode toggle.** _Why:_ it reuses the same component tree with zero extra
state. _Consequence:_ it diverges from the intended MVP, which specifies a modal.
`ConfirmDialog` in `@bloghost/ui` already wraps the native `<dialog>` element and is the component
to build on when preview moves into a modal. Status: **Planned**.

**Themes are CSS custom properties, not layout.** Each of the three themes is a token block on
`.site[data-theme='…']` in `apps/foodblog/src/styles/site.css`; the markup is byte-identical between them.
_Why:_ strong finished defaults instead of a page builder. _Consequence:_ the platform-wide visual
identity is genuinely shared, but the MVP goal of _no user-selectable themes_ is not met — the
`BlogTheme` enum, `/dashboard/appearance`, and `apps/foodblog/src/components/blog/theme-picker.tsx` all still exist.
Removing them would be a schema change plus a route deletion. Status: **Diverges — decide before
launch**.

**Tenant routing has exactly one seam.** Public blogs are served from `/site/<subdomain>` and every
public URL is produced by `apps/foodblog/src/lib/tenant.ts`. _Why:_ moving to real `<subdomain>.bloghost.app`
hosts should be a change to those helpers plus a middleware rewrite. _Consequence:_ never
hand-build a public URL.

**Auth is hand-rolled and small.** _Why:_ email + password with a database session is the whole
requirement; a library would add more surface than it removes. _Consequence:_ everything a library
would have given you — verification, reset, throttling, session sweeping — is missing and listed in
[§9](#9-security-and-authorization).

**Extract to a package only when there is a second consumer.** `@bloghost/ui` contains nothing that
knows what a recipe is. Auth, tenant resolution and recipe persistence stay in
`apps/foodblog/src/lib` until something else needs them.

---

## 11. How to add common features

Every recipe below ends the same way: `pnpm typecheck && pnpm lint`, then exercise the affected
route in the browser. There is no test runner yet — see [§12](#12-known-limitations-and-planned-work).

### Add a field to a recipe

1. `apps/foodblog/prisma/schema.prisma` — add the column to `Recipe`.
2. `pnpm db:migrate` — creates the migration and regenerates the client.
3. `apps/foodblog/src/lib/recipes/validation.ts` — add it to `recipeInputSchema` (use `optionalText` /
   `optionalWholeNumber` for optional values; empty string means "not provided").
4. `apps/foodblog/src/lib/recipes/persistence.ts` — add it to `scalarRecipeData`.
5. `apps/foodblog/src/components/recipe/recipe-document.ts` — add it to `RecipeDocument`, `StoredRecipe`,
   `toRecipeDocument`, `emptyRecipeDocument`, `toFormValues`. If it belongs in the fact strip, add a
   `RECIPE_FACTS` entry instead of hand-wiring a control.
6. `apps/foodblog/src/components/recipe/recipe-page.tsx` — render it in both branches (`edit` and reading).
7. `apps/foodblog/src/lib/recipes/queries.ts` — add it to `select` blocks that need it (`RecipeListItem`,
   `PublicRecipeCard`); `recipeDetailInclude` picks up new scalars automatically.
8. `apps/foodblog/src/lib/recipes/json-ld.ts` and the route's `generateMetadata` if it affects SEO.
9. `apps/foodblog/prisma/seed.ts` if the demo content should show it off.

### Add a new recipe content block

Add it to `RecipePage` in `apps/foodblog/src/components/recipe/recipe-page.tsx` as a section component that takes
`{ recipe, edit }` and renders inline fields when `edit` is non-null. If it is a titled ordered
list, reuse `RecipeGroups` rather than writing a third copy. Then follow the field recipe above for
persistence, and style it in `apps/foodblog/src/styles/site.css` (reading) plus `apps/foodblog/src/styles/editor.css` (editing
affordances only).

### Add a dashboard page

1. `apps/foodblog/src/app/dashboard/<name>/page.tsx` — server component, `export const metadata`, start with
   `const { blog } = await requireBlog();`.
2. `apps/foodblog/src/components/dashboard/dashboard-nav.tsx` — add to `NAV_ITEMS` if it needs a nav entry.
3. Data via a function in `apps/foodblog/src/lib/<domain>/queries.ts`, never inline `prisma` in the page.
4. Styles in `apps/foodblog/src/styles/dashboard.css`.

### Add a public page

1. `apps/foodblog/src/app/site/[subdomain]/<name>/page.tsx` — resolve the blog with `getBlogBySubdomain`,
   `notFound()` when missing, export `generateMetadata` with a canonical from `apps/foodblog/src/lib/tenant.ts`.
2. Add the link to `apps/foodblog/src/components/site/site-nav.tsx`.
3. Only query published content.
4. Styles in `apps/foodblog/src/styles/site.css`, using the `--site-*` tokens so all three themes work.

### Add a database model

1. `apps/foodblog/prisma/schema.prisma` — model, `@@map` to a snake_case plural table, `position` if ordered,
   indexes for every access path, explicit `onDelete`.
2. `pnpm db:migrate`.
3. New `apps/foodblog/src/lib/<domain>/queries.ts` with narrow `select` blocks and exported row types.
4. `apps/foodblog/prisma/seed.ts` if the demo blog should include it.

### Add a reusable UI component

Only if it is product-agnostic: `packages/ui/src/<name>.tsx`, styles appended to
`packages/ui/src/styles.css` with the `ui-` class prefix, export from `packages/ui/src/index.ts`
(component _and_ its props type). If it mentions recipes, blogs or drafts, it belongs in
`apps/foodblog/src/components/<feature>/` instead.

### Add validation

Extend the schema in `apps/foodblog/src/lib/<domain>/validation.ts` and export the inferred type. Never validate
in a component as the only check. Messages are sentence-case, user-facing and actionable; field
errors reach the UI through `toFieldErrors` in `apps/foodblog/src/lib/form.ts`.

### Add a server mutation

In `apps/foodblog/src/lib/<domain>/actions.ts` (`'use server'` at the top of the file):

```ts
export async function doThingAction(values: ThingValues): Promise<ThingResult> {
  const { blog } = await requireBlog(); // 1. authn + authz
  const parsed = thingSchema.safeParse(values); // 2. validate
  if (!parsed.success) {
    return { ok: false, message: '…', fieldErrors: toFieldErrors(parsed.error) };
  }
  const result = await writeThing(blog.id, parsed.data); // 3. scoped write
  if (!result.ok) return { ok: false, message: '…' };
  revalidatePath('/dashboard', 'layout'); // 4. revalidate every affected tree
  revalidatePath(blogPath(blog.subdomain), 'layout');
  return { ok: true };
}
```

Return a discriminated union; never throw for an expected failure.

### Add a new package

Justify a second consumer first. Then: `packages/<name>/package.json`
(`"name": "@bloghost/<name>"`, `"private": true`, `"main": "./src/index.ts"`), a `tsconfig.json`
extending `@bloghost/config-typescript/react-library.json` or `base.json`, an `eslint.config.mjs`
re-exporting the matching shared config, `pnpm-workspace.yaml` already globs `packages/*`, add the
dependency as `"workspace:*"`, and add the package name to `transpilePackages` in
`apps/foodblog/next.config.ts` if it ships TypeScript source. Run `pnpm install`.

---

## 12. Known limitations and planned work

| Gap                                                                                 | Status                  | Impact                                                                            |
| ----------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| No test tooling at all — no runner, no `test` script, no test files                 | Planned                 | Every change is verified by `typecheck`, `lint` and manual clicking               |
| Preview is an in-page toggle, not a modal                                           | Planned                 | Diverges from the MVP definition                                                  |
| Three user-selectable themes rather than one platform-wide theme                    | Diverges                | Requires a product decision, then a schema migration and route removal            |
| JSON-LD is serialised without escaping `</script>`                                  | Planned (security)      | Breakout risk on published recipe pages — see [§9](#9-security-and-authorization) |
| No image upload; hero images are external URLs rendered through a raw `<img>`       | Planned                 | No `next/image`, no domain allowlist, no size limits                              |
| No tags or categories as first-class data                                           | Planned                 | Only the `cuisine` and `course` strings exist                                     |
| No autosave and no unsaved-changes warning                                          | Planned                 | Navigating away from the editor loses work                                        |
| Save rewrites the whole ingredient and instruction tree                             | Accepted trade-off      | Child row ids are unstable                                                        |
| Unpublishing clears `publishedAt`                                                   | Accepted trade-off      | Re-publishing produces a new date                                                 |
| No email verification, password reset, or rate limiting                             | Planned                 | `User.emailVerifiedAt` is the prepared seam                                       |
| Expired `Session` rows are never swept                                              | Planned                 | Table grows unbounded                                                             |
| `BlogRole.EDITOR` unenforced; `userCanEditBlog()` is dead code                      | Planned                 | Multi-author blogs are modelled but not usable                                    |
| `uniqueSlug()` in `apps/foodblog/src/lib/slug.ts` is unused                         | Debt                    | Slug collisions surface as a user-facing error instead of being resolved          |
| Subdomain hosting is path-based (`/site/<subdomain>`); no middleware rewrite exists | Planned                 | The seam is `apps/foodblog/src/lib/tenant.ts`                                     |
| No custom domains, billing, comments, ratings, or newsletters                       | Not planned for the MVP | The Settings page shows a "Coming soon" badge for custom domains                  |

---

## Documentation maintenance

- Update [`INDEX.md`](INDEX.md) when important paths, commands, or feature locations change.
- Update this file when data flow, package boundaries, models, or major decisions change.
- Update [`STYLE.md`](STYLE.md) when coding, UI, accessibility, or testing conventions change.
- Ship documentation changes in the same pull request as the code change that makes them necessary.
