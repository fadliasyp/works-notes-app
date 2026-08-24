# Decision Log

Last updated: 2026-08-25

This log records decisions made during or after the documentation bootstrap. It does not invent rationale for historical implementation choices.

## 2026-08-24 — Repository as Persistent Project Memory

### Status

ACCEPTED

### Decision

Use `AGENTS.md` and `docs/*.md` as the durable source of project context between Codex sessions.

### Context

The user requested that project knowledge survive chat, session, and account changes.

### Reason

Repository documentation is versioned alongside the code and can be validated against the current implementation.

### Alternatives

- Keep context only in chat.
- Store all detail in README.

### Consequences

Material work must update the relevant memory files. README remains a concise entry point rather than a complete technical reference.

## 2026-08-24 — Discovery Without Source Refactor

### Status

ACCEPTED

### Decision

During bootstrap, document the existing architecture and issues without changing application source, dependencies, database, or deployment.

### Context

The repository is an existing project and `CODEX_PROJECT_SETUP.md` explicitly requires Discover → Understand → Document.

### Reason

Mixing fixes with discovery would make the baseline unreliable and risk regressions before the system is understood.

### Alternatives

- Fix every issue as it is found.
- Refactor the application before documenting it.

### Consequences

Known lint, consistency, security, and workflow issues remain documented for later prioritized tasks. Removing a credential from the current README was treated as required documentation/security hygiene; the secret still needs rotation.

## 2026-08-24 — Evidence-Based Feature Status

### Status

ACCEPTED

### Decision

Do not classify features as `STABLE` until supported by runtime tests, automated tests, or explicit user validation. Use `WORKING / PROTECTED` for implemented flows that compile but are not functionally verified.

### Context

The project has substantial implementation and Git history but no test suite, incomplete local environment, and no live-database verification.

### Reason

Source presence and commit messages do not prove correct runtime behavior.

### Alternatives

- Mark every completed-looking feature as stable.
- Leave all features undocumented until live access is available.

### Consequences

Current behavior is still protected as a regression baseline, while the documentation remains honest about confidence.

## 2026-08-25 — No Authentication for the Current Stage

### Status

ACCEPTED

### Decision

Keep the application without login/auth until the user explicitly requests it.

### Context

`CODEX_PROJECT_CONTEXT.md` states that the app is internal and intentionally has no authentication. The resulting public-edit risk for a known deployment URL is understood for the current stage.

### Reason

This preserves the intentionally simple current workflow and avoids reintroducing removed auth files or dependencies.

### Alternatives

- Add application login and session handling now.
- Restrict access only through external deployment controls.

### Consequences

Do not add auth speculatively. Do not treat the deployed app as suitable for sensitive data; Supabase RLS and deployment access remain security boundaries.

## 2026-08-25 — Mobile-First UI and Back Navigation Are Protected

### Status

ACCEPTED

### Decision

Treat the existing mobile visual language, touch targets, unsaved-form guard, replace-navigation, and gallery Back-button behavior as a stable product baseline.

### Context

The project is primarily used on phones, and the project context records these behaviors as already good and working.

### Reason

Navigation history and gallery overlays are core usability behavior on mobile, not incidental styling.

### Alternatives

- Redesign desktop-first.
- Replace custom browser-history handling without preserving behavior.

### Consequences

Browser-facing changes require mobile regression checks and must not trap users in form/tab/modal history.

## 2026-08-25 — Photos Belong to the Place Gallery

### Status

ACCEPTED

### Decision

Keep photos centralized in the place gallery; do not restore product or maintenance-asset photo UI.

### Context

Individual item photo features were deliberately removed and replaced by a per-place gallery.

### Reason

This is the product model recorded in the project context and current Git history.

### Alternatives

- Restore product photos.
- Restore maintenance-asset photos.

### Consequences

Legacy columns/buckets may remain for compatibility, but the main UI must not use them unless the user intentionally changes this decision.

