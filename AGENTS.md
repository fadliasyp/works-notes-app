<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Works Notes App — Permanent Agent Rules

## Project Identity

- This is an existing operational notes web application, not a new scaffold.
- It is an internal, mobile-first app for places/restaurants, expiring products, place galleries, and recurring maintenance checklists.
- Authentication is intentionally out of scope for the current stage unless the user explicitly requests it.
- Preserve verified current behavior. Do not refactor unrelated code while completing a task.

## Required Context

Before a material change, read:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CURRENT_TASK.md`
3. `docs/FEATURE_BASELINE.md`
4. The other document relevant to the change (`ARCHITECTURE.md`, `DATABASE.md`, or `DECISIONS.md`)
5. The current Next.js guide under `node_modules/next/dist/docs/`

Source code and configuration override stale documentation. If they disagree, verify the behavior and update the documentation in the same task.

## Technology Stack

- Node.js, npm, TypeScript, Next.js App Router, React, and Tailwind CSS.
- Supabase provides database access and object storage.
- Nodemailer sends expiry emails through SMTP.
- Vercel Cron invokes the notification endpoint; GitHub Actions pings Supabase.

Do not add a dependency when the platform, standard library, or an installed dependency already solves the problem.

## Project Structure

- `app/`: routes, Server Components, Server Actions, loading UI, and the cron Route Handler.
- `components/`: shared Client Components and UI helpers.
- `lib/`: Supabase clients and toast URL helper.
- `public/`: static assets.
- `.github/workflows/`: automation.
- `docs/`: persistent project memory.

Keep the current colocated Server Actions unless a requested change gives a concrete reason to move them.
Keep the current root structure (`app/`, `components/`, `lib/`); do not introduce `src/` unless the user explicitly approves a structural migration.

## Coding Rules

- Use strict TypeScript and the existing `@/*` import alias.
- Follow existing formatting and naming in touched files.
- Make the smallest change that fixes the root cause.
- Do not implement speculative abstractions, broad cleanup, or unrelated modernization.
- Preserve mobile-responsive behavior, pending states, toast redirects, browser-back behavior, and unsaved-form protection.
- Preserve the approved mobile-first visual language: soft blue/white/emerald gradients, large rounded cards, subtle shadows, spacious touch targets, and a formal uncluttered layout.
- Use Asia/Jakarta where the current product behavior explicitly formats operational dates.

## Database Rules

- No authoritative schema or migrations are stored in this repository. Read `docs/DATABASE.md` and confirm the live Supabase schema before schema-dependent work.
- Do not infer constraints, cascade rules, RLS policies, or indexes as facts.
- Never run a destructive migration or modify production data without explicit approval and a backup plan.
- Keep place ownership checks in mutations (`place_id` plus child ID) where the current flow uses them.
- Multi-step storage/database mutations require explicit rollback or a documented consistency decision.

## API and Security Rules

- `/api/cron/expiring-products` must remain protected by `Authorization: Bearer <CRON_SECRET>`.
- Never expose or log secret values. Service-role access is server-only.
- Treat all form data, route params, and request headers as untrusted and validate them on the server.
- The lack of application login is intentional for the current stage. Do not add auth, middleware, login/logout routes, `@supabase/ssr`, or a server auth client unless explicitly requested.
- A deployed URL can therefore be publicly editable. Do not describe the app as secure without verifying Supabase RLS and deployment controls.
- Do not weaken storage validation, upload count/size limits, or same-place record filtering.

## Project-Specific Rules

- Product photos and maintenance-asset photos were deliberately removed. Do not restore their upload/preview UI; use the place gallery instead.
- Keep expiry email notification at five days unless the user requests a policy change.
- Keep email as the notification channel; do not add WhatsApp without an explicit request.
- Keep `UnsavedChangesGuard`, replace-navigation for detail tabs and successful actions, and gallery Back-button behavior.
- Do not remove legacy database columns or storage buckets without explicit approval and live-schema verification.

## Testing Rules

- Run the smallest relevant check, then `npm run lint` and `npm run build` for material changes when the environment permits.
- For browser-facing changes, manually cover the mobile flows listed in `CODEX_PROJECT_CONTEXT.md` when a runnable environment is available.
- Do not claim a check passed unless it was run successfully.
- There is currently no automated test suite. Add a focused test only when a non-trivial behavior change needs regression protection.
- Record environment-caused verification failures separately from source failures.

## Documentation Rules

After material work, update the relevant files:

- `docs/CURRENT_TASK.md` for active work and handoff.
- `docs/PROJECT_CONTEXT.md` for current facts, issues, and pending work.
- `docs/FEATURE_BASELINE.md` when protected behavior changes or becomes verified stable.
- `docs/ARCHITECTURE.md` or `docs/DATABASE.md` when those areas change.
- `docs/DECISIONS.md` for a real decision; do not invent historical rationale.
- `docs/CHANGELOG.md` for significant changes.

## Feature Regression Protection

- Read `docs/FEATURE_BASELINE.md` before changing an existing user flow.
- Trace callers, consumers, database records, storage objects, redirects, and navigation history affected by a change.
- A feature is `STABLE` only with credible runtime/test/user evidence. Compilation alone means `WORKING`, not `STABLE`.
- If intentionally changing protected behavior, document the new baseline after verification.

## Git Safety

- Preserve unrelated and pre-existing worktree changes.
- Do not commit, push, rewrite history, switch branches, reset, or discard changes unless explicitly requested.
- Inspect Git history only as supporting evidence; commit messages do not prove runtime correctness.

## Session Handoff

Before ending substantial work, leave `docs/CURRENT_TASK.md` accurate, including completed work, files touched, checks run, blockers, and next steps. If no task remains, write `Belum ada task aktif.`
