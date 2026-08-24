# Database

Last updated: 2026-08-25

## Status

**Database:** Supabase PostgreSQL, accessed through `@supabase/supabase-js`.  
**ORM:** None; Supabase query builder/PostgREST is used directly.

No schema dump, migration, seed, generated database types, or Supabase config directory exists in the repository. Model di bawah menggabungkan query source dengan schema yang dicatat dalam `CODEX_PROJECT_CONTEXT.md`. Tipe, cascade, default, dan unique index dari catatan tersebut tetap perlu dicocokkan dengan live Supabase karena belum tersedia sebagai migration yang dapat diverifikasi.

## Logical Models

### `places`

| Field | Observed application type/use |
| --- | --- |
| `id` | UUID menurut project context |
| `name` | text; required by app |
| `address` | nullable text |
| `city_highlight` | nullable text |
| `last_changed_at` | timestamptz; updated by child mutations |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

### `products`

| Field | Observed application type/use |
| --- | --- |
| `id` | UUID menurut project context |
| `place_id` | UUID FK ke `places(id) ON DELETE CASCADE` menurut project context |
| `name` | text; required by app |
| `quantity` | nullable numeric |
| `volume_value` | nullable numeric |
| `volume_unit` | nullable text |
| `expires_at` | nullable date |
| `note` | nullable text |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |
| `image_path` | legacy cleanup reference; actual column existence needs confirmation |

### `maintenance_assets`

| Field | Observed application type/use |
| --- | --- |
| `id` | UUID menurut project context |
| `place_id` | UUID FK ke `places(id) ON DELETE CASCADE` menurut project context |
| `name` | text; required by app |
| `description` | nullable text |
| `is_active` | boolean default true menurut project context |
| `sort_order` | integer default 0 menurut project context |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |
| `image_path` | legacy cleanup/join reference; actual column existence needs confirmation |

### `maintenance_sessions`

| Field | Observed application type/use |
| --- | --- |
| `id` | UUID menurut project context |
| `place_id` | UUID FK ke `places(id) ON DELETE CASCADE` menurut project context |
| `title` | nullable text; app defaults to “Maintenance Bulanan” |
| `maintenance_date` | date; required by app when writing |
| `note` | nullable text |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

### `maintenance_checks`

| Field | Observed application type/use |
| --- | --- |
| `id` | UUID menurut project context |
| `maintenance_session_id` | UUID FK ke `maintenance_sessions(id) ON DELETE CASCADE` menurut project context |
| `maintenance_asset_id` | UUID FK ke `maintenance_assets(id) ON DELETE CASCADE` menurut project context |
| `is_checked` | boolean default false menurut project context |
| `checked_at` | nullable timestamptz |
| `created_at` | timestamptz menurut project context |
| `updated_at` | timestamptz menurut project context |

Project context mencatat unique constraint `(maintenance_session_id, maintenance_asset_id)`, sesuai conflict target yang dipakai source.

### `place_gallery_images`

| Field | Observed application type/use |
| --- | --- |
| `id` | UUID primary key, default `gen_random_uuid()` menurut project context |
| `place_id` | UUID not null FK ke `places(id) ON DELETE CASCADE` menurut project context |
| `image_path` | required storage path in app flow |
| `file_name` | nullable original/final filename |
| `file_size` | nullable number |
| `mime_type` | nullable string |
| `created_at` | timestamp default `now()` menurut project context |
| `updated_at` | timestamp default `now()` menurut project context |

### `notification_logs`

| Field | Observed application type/use |
| --- | --- |
| `product_id` | UUID product identifier menurut project context |
| `channel` | written as `email` |
| `target` | notification recipient |
| `status` | written as `sent` or `failed` |
| `sent_at` | nullable timestamptz |
| `error_message` | nullable error text |
| `created_at` | timestamptz menurut project context |
| `notification_type` | written as `product_expiry` |
| `expires_at_snapshot` | date used for deduplication |
| `message` | email subject |

Project context mencatat unique index `(product_id, channel, target, notification_type, expires_at_snapshot)`. Kolom `id` tidak disebutkan dan tetap belum diketahui.

### `todos`

Only referenced by `.github/workflows/keep-supabase-alive.yml` as a one-row REST query. Its schema and existence are unknown.

## Documented Relationships

```text
places 1 ---- * products
places 1 ---- * maintenance_assets
places 1 ---- * maintenance_sessions
places 1 ---- * place_gallery_images

maintenance_sessions 1 ---- * maintenance_checks
maintenance_assets   1 ---- * maintenance_checks

products 1 ---- * notification_logs (inferred from product_id)
```

Relasi dan `ON DELETE CASCADE` di atas berasal dari project context dan konsisten dengan query application. Keberadaannya pada live database belum dapat diverifikasi dari repository.

## Ordering and Query Assumptions

- Places and products are ordered by `name`.
- Maintenance assets are ordered by `sort_order` then `name`.
- Maintenance sessions are ordered descending by `maintenance_date`.
- Gallery is ordered descending by `created_at`.
- Expiry notification filters and orders `expires_at`.

Indexes supporting these access patterns are unknown.

## Storage

| Bucket | Current use |
| --- | --- |
| `place-gallery-images` | Active public bucket untuk place gallery uploads/reads |
| `product-images` | Legacy cleanup reference only |
| `maintenance-images` | Legacy cleanup reference only |

Project context menyatakan bucket gallery public. MIME/size enforcement di Storage, ownership policy, dan lifecycle rules tetap belum terdokumentasi.

## Migrations and Seed

- Migrations: none found.
- Seed: none found.
- Local Supabase config: none found.
- Generated database types: none found.
- Backup/restore procedure: unknown.

## RLS and Constraints

Project context mendokumentasikan beberapa constraints:

- Child tables memakai foreign key ke parent dengan `ON DELETE CASCADE`.
- `maintenance_checks` unik per pasangan session/asset.
- `notification_logs` unik per product/channel/target/type/expiry snapshot.
- Gallery bucket bersifat public.

Semua hal tersebut masih perlu dicocokkan dengan live Supabase. Source menyebut pemeriksaan RLS ketika reads gagal, tetapi tidak ada policies yang terversi. Hal berikut masih belum diketahui:

- RLS enabled state and policies for every table.
- Storage bucket policies.
- Check constraints/enums for notification status/channel/type.
- Timestamp defaults/triggers.
- Numeric/date column types and bounds.

## Data Safety

- Never use the service-role key in browser code.
- Confirm backup and cascade behavior before deleting a place, asset, session, or product.
- Gallery upload/delete crosses Storage and Database and can leave orphaned objects/rows when one operation fails.
- Maintenance creation crosses session and check inserts and can leave an incomplete session.
- Failed email rows currently participate in deduplication and may prevent retry.
- Before schema changes, export/version the authoritative schema and add reversible migrations.

