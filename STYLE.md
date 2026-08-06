# Style

Coding, UI, UX and content conventions for BlogHost. Structure and data flow live in
[`ARCHITECTURE.md`](ARCHITECTURE.md); the repository map lives in [`INDEX.md`](INDEX.md).

Everything below is derived from the code as it stands. Where a rule is aspirational rather than
enforced, it says so.

---

## 1. Core principles

The product should feel simple, calm, editorial, food-focused, fast, approachable, consistent and
close to self-explanatory. The recipe editor should have essentially zero learning curve: a cook
opens it, sees something that looks like a recipe page, and types.

It must not feel like a CRM, an enterprise dashboard, a form builder, a page-builder tool, a theme
marketplace, or a configurable design system handed to end users.

Concretely, this is why `RecipePage` renders editing, preview and publication from one component,
why the editor has no settings sidebar, and why the recipe form has no visible field labels — the
placeholder text and the surrounding layout carry the meaning.

---

## 2. TypeScript conventions

Compiler settings come from `packages/config-typescript/base.json` and are strict:
`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
`noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`.

| Rule                  | Detail                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `any`                 | Banned. `@typescript-eslint/no-explicit-any` is an **error**. Use `unknown` and narrow (see `isSlugConflict` in `apps/foodblog/src/lib/recipes/persistence.ts`)                                                                                                                                  |
| `interface` vs `type` | `interface` for object shapes and component props; `type` for unions, aliases and mapped types                                                                                                                                                                                                   |
| Exports               | **Named exports only** for components, functions and types. Default exports are reserved for Next.js route files (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`) and config files, which the framework requires                                                                         |
| Return types          | Explicit on every exported non-component function (`Promise<SaveRecipeResult>`, `: string`, `: boolean`). React components omit them and return JSX                                                                                                                                              |
| Type imports          | `import type { … }` — `consistent-type-imports` with inline fix style is an error                                                                                                                                                                                                                |
| `null` vs `undefined` | `null` means "the user left this out" and is what reaches the database. `undefined` means "not supplied to this function". Optional props are `undefined`; nullable domain values are `null`. The editor's wire format uses `''` for "not provided" and the Zod schema transforms it to `null`   |
| Enums                 | No TypeScript `enum`. Prisma enums are imported as types; literal unions come from `as const` arrays: `RECIPE_STATUS_VALUES`, `RECIPE_DIFFICULTY_VALUES`, `BLOG_THEME_VALUES`                                                                                                                    |
| Shared domain types   | Declared next to their owner: `apps/foodblog/src/lib/recipes/types.ts` (action results), `apps/foodblog/src/lib/recipes/queries.ts` (row shapes), `apps/foodblog/src/components/recipe/recipe-document.ts` (the editable document), `apps/foodblog/src/lib/form.ts` (`FormState`, `FieldErrors`) |
| Booleans              | Read as a predicate: `ok`, `pending`, `previewing`, `slugEdited`, `isPublished`, `ordered`, `singleLine`, `disabled`                                                                                                                                                                             |
| Errors                | Expected failures are **return values**, not exceptions — always a discriminated union on `ok`. `throw` is reserved for genuine faults (unknown Prisma errors are re-thrown; `apps/foodblog/src/lib/env.ts` throws at import when configuration is invalid)                                      |
| Async                 | Every I/O function is `async` and returns `Promise<T>`. Independent awaits go through `Promise.all` (`apps/foodblog/src/app/dashboard/page.tsx`)                                                                                                                                                 |
| Unused args           | Prefix with `_` (`_prevState` in server actions)                                                                                                                                                                                                                                                 |
| Comparison            | `eqeqeq: ['error', 'smart']`                                                                                                                                                                                                                                                                     |
| `console`             | `warn` and `error` only                                                                                                                                                                                                                                                                          |

The discriminated-union result shape, used everywhere:

```ts
export type WriteRecipeResult =
  { ok: true; recipeId: string } | { ok: false; reason: 'slug-taken' | 'not-found' };
```

---

## 3. React and Next.js conventions

Next.js 15.5 App Router, React 19.

- **Server Components by default.** Add `'use client'` only for state, effects, browser APIs,
  React hooks like `useActionState` / `useFormStatus` / `usePathname`, or an error boundary. The
  current list of client components is in
  [`ARCHITECTURE.md` §8](ARCHITECTURE.md#8-server-and-client-component-rules); if your file is not
  on it and you are about to add the directive, justify it.
- **Shared components stay directive-free** when they must render on both sides.
  `apps/foodblog/src/components/recipe/recipe-page.tsx` and `apps/foodblog/src/components/recipe/editable.tsx` have no directive so the
  public route can server-render them while the editor pulls them into its client bundle. Keep them
  hook-free.
- **Async params.** Route params and search params are Promises in Next.js 15:
  `{ params }: { params: Promise<{ recipeId: string }> }`, then `const { recipeId } = await params;`.
- **Naming.** Components are `PascalCase`; files are `kebab-case.tsx`. The file name matches the
  component (`delete-recipe-button.tsx` → `DeleteRecipeButton`).
- **Props.** One exported `interface <Component>Props` per public component, exported alongside it.
  Inline the type only for small private components inside the same file. Discriminate variants
  rather than accepting impossible combinations:

  ```ts
  export type RecipePageProps = RecipePageBaseProps &
    (
      | { mode: 'edit'; edit: RecipeEditContext }
      | { mode: 'preview' | 'published'; edit?: undefined }
    );
  ```

- **Data loading** happens in server components through `apps/foodblog/src/lib/<domain>/queries.ts`. Never call
  `prisma` from a page body, and never fetch in a `useEffect`.
- **Request-level caching.** Queries that may be called more than once per render are wrapped in
  React `cache()` (`getCurrentSession`, `getBlogForUser`, `getBlogBySubdomain`,
  `getPublishedRecipes`, `getPublishedRecipeBySlug`).
- **Mutations** are Server Actions in `apps/foodblog/src/lib/<domain>/actions.ts`. After a write, call
  `revalidatePath` for every affected tree (dashboard _and_ the public blog), then
  `router.refresh()` or `router.replace()` on the client.
- **Suspense and loading states.** There are no `loading.tsx` files today; pages await their data
  directly. In-flight feedback is local: `useTransition`'s `pending` disables buttons, `SubmitButton`
  reads `useFormStatus`, and the editor shows `Saving…` with `role="status"`.
- **Error handling.** `apps/foodblog/src/app/error.tsx` is the root boundary. `notFound()` for missing or
  unauthorised resources, `redirect()` for guards. Expected failures come back as `{ ok: false }`
  and are rendered inline.
- **Forms.** Conventional forms use `<form action={formAction} noValidate>` with `useActionState`
  and `emptyFormState`. `FormField` from `@bloghost/ui` wires label, hint, error and
  `aria-describedby` through a render prop.
- **Modals.** Built on the native `<dialog>` element via `ConfirmDialog` so focus trapping, Escape
  and background inertness come from the platform. Controlled by an `open` prop; never allow a
  confirm handler to fire while `pending`.
- **Avoid effects.** There is exactly one `useEffect` in application code (`apps/foodblog/src/app/error.tsx`, to log)
  and one in `@bloghost/ui` (`dialog.tsx`, to call `showModal`). Derive state during render instead —
  `RecipeIndex` filters during render, `recipeFacts()` computes the fact strip from the document.
- **Do not mirror server state in the client.** Pass server data in as `initial*` props and let the
  client own it from then on (`initialRecipe`, `initialStatus`, `initialPublishedAt`). Do not add a
  second copy that has to be kept in sync.

---

## 4. Component organization

| Kind                         | Location                                  | Example                                                 |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| Route-owned page markup      | Inline in the `page.tsx`                  | `apps/foodblog/src/app/dashboard/page.tsx` stat grid    |
| Feature components           | `apps/foodblog/src/components/<feature>/` | `apps/foodblog/src/components/dashboard/recipe-row.tsx` |
| Cross-feature app components | `apps/foodblog/src/components/` root      | `form-alert.tsx`, `submit-button.tsx`                   |
| Product-agnostic primitives  | `packages/ui/src/`                        | `button.tsx`, `form-field.tsx`, `dialog.tsx`            |

Feature folders in use: `auth/`, `blog/`, `apps/foodblog/src/app/dashboard/`, `recipe/`, `site/`. Prefer adding to one of
these over growing the `apps/foodblog/src/components/` root — that root is for things genuinely used by more than one
feature, and it currently holds two files.

**Extract a component when** it is used in two places, or when a `page.tsx` needs `'use client'`
for one small interactive piece (extract the piece, keep the page a server component — that is
exactly why `DeleteRecipeButton` and `PrintButton` exist).

**Do not create a generic abstraction** for a single caller, and do not add configuration options
speculatively. `RecipeGroups` is generic over ingredients and instructions because there are two
real callers with identical structure; it takes an explicit `labels` object rather than deriving
strings from a key.

**Editor components** live in `apps/foodblog/src/components/recipe/` and split by role:

| File                 | Role                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `recipe-document.ts` | The data model, conversions and the `RECIPE_FACTS` table. No JSX                                             |
| `recipe-page.tsx`    | The recipe layout for all three modes                                                                        |
| `editable.tsx`       | Inline field primitives (`EditableText`, `EditableSelect`, `CanvasControl`, `CanvasAddButton`, `focusField`) |
| `recipe-editor.tsx`  | The client shell: action bar, save state, mode toggle                                                        |

**The published recipe display is reused, not copied.** The public route, the preview and the
editing canvas all render `RecipePage`. If you find yourself writing a second recipe layout, stop
and add a mode or a section to that component instead.

---

## 5. Naming conventions

| Thing                   | Pattern                                                                                                      | Example                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Component               | `PascalCase`                                                                                                 | `RecipeEditor`, `EmptyState`                                       |
| Component file          | `kebab-case.tsx`                                                                                             | `delete-recipe-button.tsx`                                         |
| Props type              | `<Component>Props`, exported                                                                                 | `RecipeRowProps`                                                   |
| Hook                    | `useThing`                                                                                                   | none custom yet; follow React's rule if you add one                |
| Server action           | `<verb><Noun>Action` in `apps/foodblog/src/lib/<domain>/actions.ts`                                          | `saveRecipeAction`, `updateAppearanceAction`                       |
| Query                   | `get…` / `is…` / `…CanEdit` in `apps/foodblog/src/lib/<domain>/queries.ts`                                   | `getPublishedRecipeBySlug`, `isSubdomainAvailable`                 |
| Write helper            | verb + noun in `apps/foodblog/src/lib/recipes/persistence.ts`                                                | `createRecipe`, `replaceRecipe`                                    |
| Guard                   | `require…` / `redirectIf…` in `apps/foodblog/src/lib/<domain>/guards.ts`                                     | `requireBlog`                                                      |
| Validation schema       | `<thing>Schema` in `apps/foodblog/src/lib/<domain>/validation.ts`                                            | `recipeInputSchema`, `subdomainSchema`                             |
| Inferred types          | `z.input` → `…FormValues`; `z.output` → `…Input`                                                             | `RecipeFormValues`, `RecipeInput`                                  |
| Literal-union constants | `SCREAMING_SNAKE` `as const` array                                                                           | `RECIPE_STATUS_VALUES`                                             |
| Result union            | `<Verb><Noun>Result`                                                                                         | `SaveRecipeResult`, `WriteRecipeResult`                            |
| Route folder            | lowercase, `kebab-case`, dynamic segments in brackets                                                        | `dashboard/recipes/[recipeId]`, `site/[subdomain]`                 |
| CSS class               | BEM-ish `block__element--modifier`; `ui-` prefix for `@bloghost/ui`, `site-`/`recipe-`/`editor-` for the app | `.recipe__fact-label`, `.ui-button--ghost`, `.editor__bar-actions` |
| CSS variable            | `--ui-*` for platform tokens, `--site-*` for public blog tokens                                              | `--ui-space-4`, `--site-accent`                                    |
| Prisma model            | `PascalCase` singular, `@@map` to snake_case plural                                                          | `InstructionStep` → `instruction_steps`                            |
| Prisma field            | `camelCase`; `…At` for timestamps, `…Url` for URLs, `…Minutes` for durations                                 | `publishedAt`, `featuredImageUrl`, `cookMinutes`                   |
| Public slug             | lowercase ASCII, hyphen-separated, no trailing hyphen                                                        | `lemon-garlic-butter-chicken`                                      |
| Test file               | `<subject>.test.ts` next to the subject (**convention only — no tests exist yet**)                           | —                                                                  |

---

## 6. Validation and errors

The library is **Zod 4**. Schemas live in `apps/foodblog/src/lib/<domain>/validation.ts` and in `apps/foodblog/src/lib/env.ts`.

Rules:

1. **The server boundary is the only enforced validation.** Every action calls `safeParse` before
   it touches the database. Forms use `noValidate` so browser validation never masks it.
2. **Client validation is convenience only.** `slugify()` shaping the address as you type and the
   `singleLine` newline collapse in `EditableText` are UX, not security.
3. **Errors attach to fields.** `toFieldErrors()` in `apps/foodblog/src/lib/form.ts` collapses a `ZodError` to
   one message per dotted path (`ingredientGroups.0.ingredients.2.text`), keeping the first issue.
   `_form` is the key for issues with no path.
4. **Messages are written for cooks.** Sentence case, no field-name prefix, actionable:
   `'Write the ingredient, for example "200g plain flour"'`,
   `'You already have a recipe at that address. Try a different one.'` Never expose a Prisma error
   code, stack trace or SQL.
5. **Nothing is swallowed.** Unknown Prisma errors are re-thrown after the expected code is handled
   (`isSlugConflict` checks `P2002` and re-throws everything else). `catch {}` with an empty body is
   only acceptable for a genuine predicate, as in `isHttpUrl`.
6. **Two error transports, matching the two mutation patterns:** `FormState`
   (`{ status, message, fieldErrors }`) via `useActionState` for forms, and a discriminated union
   for direct action calls. Summary messages render through `FormAlert` with
   `role="status"` on success and `role="alert"` on failure.

Optional-value idiom: `optionalText(max, message)` and `optionalWholeNumber({…})` in
`apps/foodblog/src/lib/recipes/validation.ts` trim, bound, and transform `''` to `null`. Reuse them.

---

## 7. Database conventions

- **Naming.** Models `PascalCase` singular with `@@map` to a snake_case plural table; fields
  `camelCase`; ids `String @id @default(cuid())`.
- **Every foreign key declares `onDelete`.** The whole recipe tree is `Cascade`, so deleting a blog
  or a recipe cleans up after itself.
- **Indexes are explicit.** Add one for every access path you introduce; existing examples:
  `@@index([blogId, status, publishedAt])`, `@@index([recipeId, position])`.
- **Uniqueness is a constraint, not a check.** `@@unique([blogId, slug])` and `Blog.subdomain`
  are enforced by the database; the application catches `P2002` and converts it to a field error.
  Do not replace a constraint with a read-then-write.
- **Ownership is expressed in the `where` clause**, never as a separate `if`. Recipe reads use
  `{ id, blogId }` or `{ id, blog: { members: { some: { userId } } } }`, so another tenant's id
  matches nothing.
- **Select narrowly.** Use `select` with an explicit field list for lists and cards
  (`RecipeListItem`, `PublicRecipeCard`); use the shared `recipeDetailInclude` only when the full
  tree is needed. Do not `include` a tree to render a title.
- **Order explicitly.** Nested reads always pass `orderBy: { position: 'asc' }`; lists order by
  `updatedAt: 'desc'` (dashboard) or `[{ publishedAt: 'desc' }, { createdAt: 'desc' }]` (public).
- **Transactions** wrap any multi-statement write that must be consistent — `replaceRecipe` uses
  `prisma.$transaction([...])` for delete-delete-recreate.
- **One client.** Import `prisma` from `apps/foodblog/src/lib/db.ts`; never construct `new PrismaClient()` outside
  that file and `apps/foodblog/prisma/seed.ts`.
- **Migrations are mandatory.** Any `schema.prisma` change ships with the generated migration
  folder from `pnpm db:migrate` in the same commit. Never hand-edit an applied migration.
- **Seed data** in `apps/foodblog/prisma/seed.ts` is realistic demo content for one account
  (`jane@bloghost.dev`), idempotent by reset, and reuses application code
  (`hashPassword`) rather than duplicating logic.
- **Dates.** Store `DateTime`; `@default(now())` for `createdAt`, `@updatedAt` for `updatedAt`.
  Convert to ISO strings before crossing to a client component. Format for display only through
  `formatDate` / `formatLongDate` in `apps/foodblog/src/lib/recipes/format.ts`, which pin the timezone to UTC so
  the rendered date never shifts between server and browser.

---

## 8. Visual design system

Tokens are CSS custom properties defined on `:root` in `packages/ui/src/styles.css`. Public blog
pages add a second, overridable layer of `--site-*` tokens in `apps/foodblog/src/styles/site.css`.
**Use tokens; do not introduce raw hex values or magic pixel sizes.**

| Concern           | Tokens / classes                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts             | `--ui-font-sans` (system stack), `--ui-font-serif`. Public pages read `--site-heading-font` / `--site-body-font`                                                                   |
| Colour — neutral  | `--ui-color-bg` `#fbf9f7`, `--ui-color-surface`, `--ui-color-surface-muted`, `--ui-color-border`, `--ui-color-border-strong`, `--ui-color-text` `#1f1a17`, `--ui-color-text-muted` |
| Colour — brand    | `--ui-color-primary` `#c2410c`, `--ui-color-primary-hover`, `--ui-color-primary-soft`, `--ui-color-primary-contrast`                                                               |
| Colour — feedback | `--ui-color-danger` / `-hover` / `-soft`, `--ui-color-success` / `-soft`, `--ui-color-focus`                                                                                       |
| Spacing           | `--ui-space-1` `0.25rem` → `--ui-space-8` `4rem`                                                                                                                                   |
| Radius            | `--ui-radius-sm` `6px`, `-md` `10px`, `-lg` `16px`, `-full`. Public pages use `--site-radius`, set once on `.site`                                                                 |
| Shadow            | `--ui-shadow-sm`, `-md`, `-lg`. Cards use `sm`, dialogs use `lg`                                                                                                                   |
| Page width        | `.page` `72rem`, `.page--narrow` `44rem`, `.site-container` `74rem` (1136px of content), `.site-container--narrow` `44rem`, dashboard shell `88rem`                                |
| Layout helpers    | `.stack`, `.stack--lg`, `.row`, `.muted`, `.text-sm` in `apps/foodblog/src/app/globals.css`                                                                                        |

| Element                   | Component / class                                                                                                          | Notes                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Button                    | `Button`, or `buttonClassName()` on an anchor or `next/link`                                                               | Variants `primary` \| `secondary` \| `ghost` \| `danger`; sizes `sm` \| `md` \| `lg`; `type="button"` by default |
| Input / textarea / select | `Input`, `Textarea`, `Select`                                                                                              | All take `invalid`, which adds `--invalid` and the danger border                                                 |
| Field scaffolding         | `FormField`                                                                                                                | Label + optional hint + error, wired via a render prop                                                           |
| Card                      | `Card`, `CardHeader`, `CardContent`, `CardFooter`                                                                          | Surface, 1px border, `--ui-radius-lg`, `--ui-shadow-sm`                                                          |
| Badge                     | `Badge`                                                                                                                    | Tones `neutral` \| `success` \| `warning` \| `brand`; used for Draft/Published                                   |
| Modal                     | `ConfirmDialog`                                                                                                            | Native `<dialog>`, backdrop `rgb(31 26 23 / 45%)`, `min(30rem, 100vw - 2rem)`                                    |
| Empty state               | `EmptyState`                                                                                                               | Icon, title, description, one action; dashed border. Every list must have one                                    |
| Shell                     | `DashboardShell`                                                                                                           | Topbar + 15rem sidebar, collapsing to a horizontal scroller under `48rem`                                        |
| Alerts                    | `.alert`, `.alert--success`, `.alert--error`, `.alert--info`                                                               | Rendered by `FormAlert`                                                                                          |
| Loading                   | Text and disabled controls — `Saving…`, `Working…`, `Publishing…`                                                          | No spinner component exists; do not add one without a reason                                                     |
| Error state               | Field-level `.ui-field__error` / `.editable__error`, summary `.alert--error`, page-level `apps/foodblog/src/app/error.tsx` |                                                                                                                  |
| Focus                     | `:focus-visible` → `2px solid var(--ui-color-focus)`, `2px` offset, globally in `apps/foodblog/src/app/globals.css`        | Never remove it without an equivalent replacement                                                                |

The public blog has one token block, on `.site`: serif headings (`--site-heading-font`) over
Helvetica body copy (`--site-body-font`). **There are no themes.** The only token that varies per
blog is `--site-accent`, applied as an inline style from `Blog.brandColor` — so anything accented
must mix from it, and no layout, spacing or type may branch on an owner's settings.

The blog header (`.site__bar`) is sticky at the top of every public page and carries the logo, or
the blog name when there is none. The tall centred masthead (`.site__masthead`) belongs to the home
page only; every other page leads with its own `h1`.

Mobile: the dashboard shell and the editor both break at `48rem`. On the editor the action bar
stops being sticky and canvas controls become permanently visible (they are also always visible
under `@media (hover: none)`).

---

## 9. Recipe editor UX rules

Implemented in `apps/foodblog/src/components/recipe/recipe-page.tsx` (canvas), `editable.tsx` (fields) and
`recipe-editor.tsx` (chrome), styled by `apps/foodblog/src/styles/editor.css` on top of `apps/foodblog/src/styles/site.css`.

### The editor must

- **Look like the published page.** It is literally the same component, inside
  `.editor__canvas.site` with the blog's brand colour applied. `editor.css` may add editing
  affordances; it must never restyle the recipe itself.
- **Edit in context.** Replace a text node with a field in the same position. `.editable` cancels
  its own padding with an equal negative margin so nothing shifts when a field appears.
- **Inherit surrounding type.** Fields set `font: inherit`, so the title field is title-sized. Pass
  a `className` to adjust placement, not typography.
- **Grow with content.** `EditableText` is a CSS-only auto-growing `<textarea>`: `.editable__box`
  mirrors the value into a hidden `::after` that reserves the height. Do not add a resize effect.
- **Use `+` controls for adding.** `CanvasAddButton` renders `+ Add ingredient`,
  `+ Add step`, `+ Add ingredient group`, `+ Add instruction group`. Label them with the
  domain word, never "Add item" or "Add block".
- **Move focus to what was just created.** `addItem` and `addGroup` call `focusField(id)`, which
  waits a frame for React to commit. Any new `+` control must do the same.
- **Support Enter to continue.** Enter on a list line inserts the next line and focuses it
  (`onEnter`); Enter on a single-line field blurs; Shift+Enter always inserts a newline.
- **Keep administrative controls secondary.** The action bar is `sticky` with a translucent
  background; Back is a `ghost` link, status is a `Badge`, and the only prominent control is the
  primary publish button.
- **Provide clear Preview and Publish.** Labels change with state: `Save draft` / `Unpublish`,
  `Preview` / `Back to editing`, `Publish recipe` / `Update recipe`.
- **Reveal move and delete controls only when relevant.** `.canvas-controls` are `opacity: 0` until
  the row is hovered or focused within — and always visible on touch and narrow screens. Disable
  rather than hide the control that cannot apply (first item's ↑, the last remaining group's ✕).
- **Preserve reading order.** Header → photo → facts → introduction → ingredients → instructions →
  notes, in both modes.
- **Work from the keyboard.** Every control is a real `<button type="button">` with an `aria-label`
  and a `title`; every field has an `aria-label` because the canvas has no visible labels.
- **Work on narrow screens** as the same product, with the same canvas — not a reduced editor.

### The editor must not

- Look like a CRM record page, or present the recipe as one long stack of labelled form fields.
- Use a settings sidebar as the primary editing surface.
- Require the user to learn "blocks" before typing.
- Expose design or appearance controls (those live at `/dashboard/appearance`).
- Show database ids, positions, or status enum values. The only technical string a user sees is the
  slug, presented as an address with its reader-facing prefix.
- Hide basic editing behind a menu, a right-click, or a mode switch.
- Let preview mutate or publish anything. Preview renders local state with no handlers wired; keep
  it that way. When preview moves into a modal
  ([planned](ARCHITECTURE.md#12-known-limitations-and-planned-work)), the modal must contain no
  save or publish control.

---

## 10. Public recipe-page rules

- **One column per page.** The recipe fills the page column (`.site-container`, 1136px of content),
  so the back link, title, photo, lists and notes share their edges with the bar and the footer.
  Nothing on a recipe page is wider or narrower than that column. `line-height: 1.5` body, `1.2`
  headings with `text-wrap: balance`.
- **Ingredients beside instructions.** Inside the page column, `.recipe__content` splits the
  two lists into a grid — the shopping list at `35fr`, the method it is read against at `65fr`.
- **Hierarchy.** One `<h1>` (title), `<h2>` for Ingredients / Instructions / Notes, `<h3>` for group
  titles. Ingredients are a `<ul class="ingredient-list">`, instructions an
  `<ol class="step-list">`. Facts use a `<dl>`, so each label/value pair is machine-readable.
- **Sections collapse when empty.** A missing image, introduction, note or fact renders nothing —
  never a placeholder or an em dash on the public page.
- **Images.** Hero image is a plain `<img>` with `decoding="async"` and `alt={recipe.title}`; index
  cards use `loading="lazy"` and `alt=""` because the adjacent link carries the name.
- **Metadata.** Every public route exports `generateMetadata` with a title, description, and a
  canonical built from `apps/foodblog/src/lib/tenant.ts`. The recipe page adds Open Graph `article` fields with
  `publishedTime` and `modifiedTime`. `metadataBase` is set once in `apps/foodblog/src/app/layout.tsx`.
- **Structured data.** `buildRecipeJsonLd` in `apps/foodblog/src/lib/recipes/json-ld.ts` emits `schema.org/Recipe`
  with `HowToSection`/`HowToStep` instructions. Only fields the cook filled in are emitted — never
  invent values for rich results.
- **Print.** `PrintButton` calls `window.print()`; print rules live in `apps/foodblog/src/styles/site.css`.
- **Stable URLs.** `/<subdomain>/recipes/<slug>`. Changing a slug or subdomain breaks every
  existing link — there are no redirects. Treat a published slug as close to permanent.
- **Unpublished content is unreachable.** Public queries filter `status: 'PUBLISHED'` and a miss
  is a `notFound()`, indistinguishable from a recipe that never existed.
- **Shared identity.** Every blog uses the same markup, components, layout and type. A blog's own
  logo and `--site-accent` are the only things that differ.
- **Responsive.** Under `64rem` the two lists collapse to one column, ingredients first, still
  filling the page column; container padding from `--ui-space-5`, images `max-width: 100%`.

---

## 11. Accessibility

Concrete requirements, most already met in the code:

- **Semantic HTML.** `<article>`, `<header>`, `<nav>`, `<main>`, `<footer>`, `<dl>`, `<ul>`, `<ol>`,
  `<fieldset>`/`<legend>` (brand colour picker). Never a `<div>` with `onClick`.
- **One `<h1>` per page**, no skipped levels.
- **Landmarks and skip links.** `.skip-link` → `#site-main` on public pages; `DashboardShell`
  provides `<nav aria-label>` and `<main>`.
- **Every control is focusable and operable by keyboard.** Buttons are `<button type="button">`;
  navigation is `next/link`.
- **Focus management in modals.** Use `ConfirmDialog` / the native `<dialog>` `showModal()` so
  focus trapping, Escape and background inertness are handled by the platform. Do not build a
  `div`-based modal.
- **Focus is always visible.** Global `:focus-visible` outline in `apps/foodblog/src/app/globals.css`; inline canvas
  fields get a border plus a 3px ring. Never `outline: none` without a replacement.
- **Icon-only controls are labelled.** `CanvasControl` requires a `label` and applies both
  `aria-label` and `title`; the glyph is `aria-hidden`. Decorative emoji in navigation are
  `aria-hidden` with a text label beside them.
- **Form errors are associated.** `FormField` generates `<id>-error` and wires `aria-describedby`;
  `EditableText` sets `aria-invalid` and `aria-describedby` and gives the message `role="alert"`.
- **Status is announced.** `role="status"` for success and progress (`Saving…`, the result count),
  `role="alert"` for errors.
- **Sections are named.** `aria-labelledby` pointing at the section heading
  (`ingredients-heading`, `instructions-heading`, `notes-heading`).
- **Current page is marked** with `aria-current="page"` (dashboard nav, recipe filters).
- **Alt text is meaningful.** Content images describe the dish; decorative images use `alt=""`.
- **Contrast.** Body text `#1f1a17` on `#fbf9f7`; muted text `--ui-color-text-muted` is for
  secondary content only, never for the sole copy of important information.
- **Touch targets.** Minimum `sm` button padding (`0.375rem 0.75rem`); canvas controls are
  `1.6rem` squares and stay visible on touch devices via `@media (hover: none)`.
- **Reduced motion.** Transitions are ≤ 120ms and limited to colour and opacity. If you add
  movement, gate it behind `@media (prefers-reduced-motion: reduce)` — there is no such block yet,
  so anything animated is your responsibility.

---

## 12. Writing and interface copy

Direct, calm, ordinary. Sentence case everywhere except proper nouns. Address the user as "you",
and describe their blog as "your food blog".

| Prefer                                                                  | Avoid                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------ |
| `Add ingredient`, `Add step`, `Add ingredient group`                    | `Add item`, `New block`, `Insert element`        |
| `Preview`, `Publish recipe`, `Update recipe`, `Save draft`, `Unpublish` | `Commit`, `Go live`, `Deploy`, `Submit`          |
| `Recipe title`, `Short description`, `Web address of this recipe`       | `Name field`, `Slug`, `Meta description`, `URI`  |
| `Draft saved. Only you can see it.`                                     | `Operation completed successfully.`              |
| `You already have a recipe at that address. Try a different one.`       | `Unique constraint violation on (blogId, slug).` |

- Buttons are verbs. Pending labels are the verb in progress: `Saving…`, `Publishing…`,
  `Working…` (with a real ellipsis character).
- Empty states say what to do next and offer the action, in one or two sentences.
- Do not explain the interface in the interface. One short hint under a field is the limit, and only
  when a consequence is non-obvious (`Changing this changes every link to your food blog.`).
- Confirm only what is destructive and irreversible. Deleting a recipe confirms; saving,
  publishing and unpublishing do not.
- Unfinished features are labelled with a plain `Coming soon` badge, not marketing copy.

---

## 13. Testing expectations

**There is no test tooling in this repository today** — no runner, no `test` script in any
`package.json`, and no test files. Do not reference `pnpm test` in code, docs or CI; it does not
exist. Until a runner is added, the verification gate is `pnpm typecheck`, `pnpm lint`, and manual
checks of the affected routes.

When tests are introduced, the following are the priorities, roughly in order of value. Note this
list next to any change you make in these areas.

| Area                   | What to cover                                                                                                                                             | Where the logic lives                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Pure domain logic      | `slugify`, `uniqueSlug`, `formatMinutes`, `totalMinutes`, `toIsoDuration`, `moveBy`/`insertAt`/`removeAt`, `recipeFacts`                                  | `apps/foodblog/src/lib/slug.ts`, `apps/foodblog/src/lib/recipes/format.ts`, `apps/foodblog/src/components/recipe/recipe-document.ts` |
| Validation             | Boundary cases of `recipeInputSchema` and `subdomainSchema`: empty-string → `null`, min/max lengths, slug regex, reserved subdomains, non-http image URLs | `apps/foodblog/src/lib/*/validation.ts`                                                                                              |
| Password and session   | Hash round-trip, wrong password, malformed stored hash, expired session                                                                                   | `apps/foodblog/src/lib/auth/password.ts`, `session.ts`                                                                               |
| Authorization          | A recipe id from another blog is invisible to `getEditableRecipe`, `replaceRecipe` and `deleteRecipe`                                                     | `apps/foodblog/src/lib/recipes/queries.ts`, `persistence.ts`                                                                         |
| Database queries       | Ordering by `position`, draft exclusion in `getPublishedRecipes*`, `getBlogRecipeStats` counts                                                            | `apps/foodblog/src/lib/*/queries.ts`                                                                                                 |
| Recipe lifecycle       | Create → save → publish → unpublish → republish, asserting `status`, `publishedAt` and the rebuilt group tree                                             | `apps/foodblog/src/lib/recipes/actions.ts`, `persistence.ts`                                                                         |
| Publishing             | Slug conflict returns a field error and writes nothing; `revalidatePath` is called for both trees                                                         | `apps/foodblog/src/lib/recipes/actions.ts`                                                                                           |
| Editor interactions    | Adding a line focuses it; Enter splits; the last group cannot be removed; the slug stops tracking the title once edited                                   | `src/components/recipe/*`                                                                                                            |
| Preview                | Preview renders the current unsaved document and exposes no mutation control                                                                              | `recipe-editor.tsx`                                                                                                                  |
| Public rendering       | Published recipe renders; draft slug 404s; JSON-LD contains only supplied fields                                                                          | `apps/foodblog/src/app/[subdomain]/recipes/[slug]/page.tsx`                                                                          |
| Accessibility-critical | Dialog focus trapping and Escape; error messages associated with their field; icon-only buttons have accessible names                                     | `packages/ui/src/dialog.tsx`, `form-field.tsx`, `editable.tsx`                                                                       |

---

## 14. Definition of done

A change is complete only when all of these hold:

1. `pnpm typecheck` passes.
2. `pnpm lint` passes.
3. `pnpm format:check` passes (or run `pnpm format`).
4. Relevant tests pass — currently vacuous; add tests with the runner if you introduce one.
5. Any `schema.prisma` change ships with its generated migration folder in the same commit.
6. Authorization is enforced server-side, in the query's `where` clause, for every new read and
   write.
7. Validation exists at the server boundary for every new input.
8. Loading, empty and failure states are handled — `EmptyState` for empty lists, disabled controls
   while pending, an inline message on failure.
9. Desktop and narrow-screen (`< 48rem`) behaviour are both checked in the browser.
10. Documentation is updated in the same pull request when architecture, paths or conventions
    changed.

---

## Documentation maintenance

- Update [`INDEX.md`](INDEX.md) when important paths, commands, or feature locations change.
- Update [`ARCHITECTURE.md`](ARCHITECTURE.md) when data flow, package boundaries, models, or major
  decisions change.
- Update this file when coding, UI, accessibility, or testing conventions change.
- Ship documentation changes in the same pull request as the code change that makes them necessary.
