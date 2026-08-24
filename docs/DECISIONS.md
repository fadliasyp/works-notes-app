# Decision Log

Last updated: 2026-08-24

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

