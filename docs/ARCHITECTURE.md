# Architecture

Last updated: 2026-08-24

## High-Level Architecture

Works Notes App adalah satu aplikasi Next.js App Router. UI, reads, dan Server Actions berada dalam route tree yang sama. Supabase menjadi data/storage backend, sedangkan Resend hanya dipakai oleh cron Route Handler.

```text
Browser
  |
  +-- Server-rendered pages / Client Components
  |       |
  |       +-- Server Actions -------------------+
  |       +-- Gallery client compression        |
  |                                             v
  |                                      Supabase Database
  |                                      Supabase Storage
  |
Vercel Cron -- Bearer secret --> GET /api/cron/expiring-products
                                      |
                                      +-- Supabase service role
                                      +-- Resend email
                                      +-- notification_logs

GitHub Actions -- anon REST ping --> Supabase /rest/v1/todos
```

## Frontend

- React Server Components adalah default untuk route pages.
- Client Components dipakai hanya untuk browser state/API:
  - `PlaceGalleryClient`: compression, selection, viewer, gesture, dan History API.
  - `UnsavedChangesGuard`: dirty-form detection dan navigation interception.
  - `GlobalPendingOverlay`: global route transition feedback.
  - `ToastListener` dan `SonnerProvider`: toast.
  - `SubmitButton`: pending form state.
  - `ReplaceLink`: replace navigation pada detail tab.
- Styling memakai Tailwind CSS utility classes dan global CSS minimal.
- Geist dan Geist Mono dimuat melalui `next/font/google`.

## Routes

| Route | Responsibility |
| --- | --- |
| `/` | List/search/delete tempat |
| `/restaurants/new` | Create tempat |
| `/restaurants/[id]` | Detail, products, maintenance, gallery preview |
| `/restaurants/[id]/edit` | Edit tempat |
| `/restaurants/[id]/products/new` | Create produk |
| `/restaurants/[id]/products/[productId]/edit` | Edit produk |
| `/restaurants/[id]/maintenance-assets` | CRUD master maintenance assets |
| `/restaurants/[id]/maintenance/new` | Create maintenance session/check snapshot |
| `/restaurants/[id]/maintenance/[maintenanceId]/edit` | Edit session dan lihat summary checks |
| `/restaurants/[id]/gallery` | Gallery UI dan Server Actions |
| `/api/cron/expiring-products` | Protected GET cron untuk email expiry |

`app/loading.tsx` menyediakan route-level loading UI. Tidak ada custom `error.tsx` atau `not-found.tsx` dalam repository.

## Backend

Tidak ada backend service terpisah. Backend-for-frontend dibentuk oleh:

- Async Server Components untuk reads.
- Colocated Server Actions untuk form mutations.
- Satu Route Handler untuk cron.

UI Actions memakai singleton Supabase anon client dari `lib/supabase.ts`. Cron memakai service-role client dari `lib/supabase-admin.ts` dengan session persistence dimatikan.

## API

### `GET /api/cron/expiring-products`

- Dynamic Route Handler (`force-dynamic`).
- Authentication: exact bearer comparison terhadap `CRON_SECRET`.
- Query products yang `expires_at` berada antara hari ini dan +5 hari.
- Join place summary untuk isi email.
- Filter existing `notification_logs`.
- Kirim HTML + plain-text melalui Resend.
- Simpan success/failure log.
- Response JSON dengan `ok`, `message`/`error`, dan kadang `count`.

Tidak ada API route lain. CRUD UI tidak diekspos sebagai REST API tersendiri.

## Database

Supabase/PostgreSQL digunakan melalui PostgREST query builder. Logical tables yang digunakan:

- `places`
- `products`
- `maintenance_assets`
- `maintenance_sessions`
- `maintenance_checks`
- `place_gallery_images`
- `notification_logs`
- `todos` hanya direferensikan oleh keep-alive workflow

Schema authoritative tidak tersedia. Lihat `docs/DATABASE.md`.

## Authentication and Authorization

- Tidak ditemukan login, register, logout, session, OAuth, JWT, role, atau permission code.
- UI memakai public anon key.
- Cron memakai server-only service-role key dan bearer secret.
- RLS/table policy/storage policy tidak tersimpan di repository dan harus dianggap belum diketahui.

## Storage

- Bucket aktif: `place-gallery-images` dengan public URL.
- Path gallery: `<placeId>/<generated-file-name>`.
- Bucket `product-images` dan `maintenance-images` hanya masih direferensikan oleh cleanup legacy saat place dihapus.
- Upload gallery adalah storage write diikuti table insert; transaksi lintas keduanya tidak tersedia.

## External Services

- Supabase Database/Storage.
- Resend Email API.
- Vercel deployment/cron berdasarkan `vercel.json`.
- GitHub Actions untuk keep-alive.
- Google Fonts saat build.

Tidak ditemukan payment, queue, analytics, maps, AI, messaging, atau webhook integration lain.

## Background Jobs

1. Vercel Cron: setiap hari pukul 01:00 UTC memanggil expiry endpoint.
2. GitHub Actions: setiap tiga hari pukul 00:00 UTC memanggil Supabase REST `todos`; juga mendukung manual dispatch.

Status eksekusi aktual kedua job belum diketahui.

## Main Data Flows

### Place and Child Mutation

```text
Form --> Server Action --> validate FormData
     --> Supabase mutation scoped by place/child IDs
     --> update places.last_changed_at
     --> redirect(replace) + toast query
     --> ToastListener displays toast and cleans URL
```

### Maintenance Snapshot

```text
Create session
  --> read active maintenance_assets for place
  --> insert one maintenance_check per asset
  --> later toggle is_checked / checked_at
```

### Gallery

```text
Browser files
  --> validate count
  --> compress/convert to JPEG
  --> Server Action validates each file
  --> upload to Storage
  --> insert metadata rows
  --> revalidate detail/gallery
```

### Expiry Notification

```text
Vercel Cron
  --> bearer validation
  --> products expiring today..+5 days
  --> exclude existing product/expiry logs
  --> Resend email
  --> insert notification_logs
```

## Deployment

- `package.json` supports Node server deployment with `build` and `start` scripts.
- `vercel.json` proves Vercel-specific cron configuration, but repository does not prove an active production deployment.
- No Dockerfile, docker-compose, Netlify, Railway, or infrastructure-as-code files were found.

## Architectural Rules

- Server-only secrets and service role stay outside Client Components.
- Child mutations should remain scoped to their parent place.
- Business flow changes must preserve `last_changed_at` semantics or intentionally update the baseline.
- Gallery storage and metadata must be treated as one consistency boundary.
- Maintenance session/check creation should be treated as one logical unit.
- Validate the live schema/RLS before relying on cascade or ownership.
- Read the installed Next.js 16 guide before changing framework APIs.

## Risks

- Security depends on unknown RLS/storage policy.
- Several multi-step writes can leave partial state.
- No test harness protects complex browser history behavior.
- Failed email logs currently suppress retry.
- Build is coupled to Google Fonts network access.
- Place search reads all rows and filters in-process; this may become inefficient at larger scale.

