# Changelog

All entries below are based on repository changes or verifiable Git history. This is not a reconstruction of undocumented historical intent.

## Unreleased

### Added

- Persistent project memory: context, current task, feature baseline, architecture, database, decision log, and changelog.
- Permanent project-specific Codex rules in `AGENTS.md`.

### Changed

- Replaced the default Create Next App README with project-specific setup, environment, verification, deployment, and documentation guidance.

### Security

- Removed a hardcoded cron credential from the current README. Rotation is still required because Git history may retain it.

### Documentation

- Recorded current features, business rules, integration points, unknown schema details, verification results, and known risks.

## 2026-06-22

### Added

- GitHub Actions workflow to ping Supabase every three days (`6c22d7c`).

### Changed

- Expiry notification window changed to five days (`904ec52`).

## 2026-06-21

### Added

- Main Works Notes App implementation covering places, products, maintenance, Supabase clients, expiry route, and Vercel cron (`f569f51`).
- Responsive UI passes across home, place detail, product, place, and maintenance pages.
- Loading/pending feedback, Sonner toast messages, and unsaved-changes protection.
- Place gallery, upload/client compression, preview, viewer, selection, confirmation, and browser-history behavior.

### Changed

- Successful action redirects changed to replace navigation.
- Product note support and Indonesian date formatting added.
- Product expiry notification schedule/flow iterated.

### Removed

- Product/maintenance photo feature removed before place gallery was introduced (`ef689c9`).

### Fixed

- Gallery upload reset/false error behavior.
- Gallery browser Back, delete modal, and mobile selection behavior.
- Unsaved form guard history after successful submit.

## 2026-06-20

### Added

- Initial Create Next App scaffold (`a5a25ee`).

