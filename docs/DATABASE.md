# Database

Last updated: 2026-08-24

## Status

**Database:** Supabase PostgreSQL, accessed through `@supabase/supabase-js`.  
**ORM:** None; Supabase query builder/PostgREST is used directly.

No schema dump, migration, seed, generated database types, or Supabase config directory exists in the repository. Everything below is a **logical model inferred from source queries**, not an authoritative database definition.

## Logical Models

### `places`

| Field | Observed application type/use |
| --- | --- |
| `id` | string identifier |
| `name` | required string in app |
| `address` | nullable string |
| `city_highlight` | nullable string |
| `last_changed_at` | nullable timestamp string, updated by child mutations |
| `created_at` | nullable timestamp string |
| `updated_at` | nullable timestamp string |

### `products`

| Field | Observed application type/use |
| --- | --- |
| `id` | string identifier |
| `place_id` | parent place identifier |
| `name` | required string in app |
| `quantity` | nullable number |
| `volume_value` | nullable number |
| `volume_unit` | nullable string |
| `expires_at` | nullable date string |
| `note` | nullable string |
| `created_at` | nullable timestamp string |
| `updated_at` | nullable timestamp string |
| `image_path` | legacy cleanup reference; actual column existence needs confirmation |

### `maintenance_assets`

| Field | Observed application type/use |
| --- | --- |
| `id` | string identifier |
| `place_id` | parent place identifier |
| `name` | required string in app |
| `description` | nullable string |
| `is_active` | nullable boolean; new records set true |
| `sort_order` | nullable number; app defaults to 0 |
| `created_at` | nullable timestamp string |
| `updated_at` | nullable timestamp string |
| `image_path` | legacy cleanup/join reference; actual column existence needs confirmation |

### `maintenance_sessions`

| Field | Observed application type/use |
| --- | --- |
| `id` | string identifier |
| `place_id` | parent place identifier |
| `title` | nullable string; app defaults to “Maintenance Bulanan” |
| `maintenance_date` | nullable in returned type, required by app when writing |
| `note` | nullable string |
| `created_at` | nullable timestamp string |
| `updated_at` | nullable timestamp string |

### `maintenance_checks`

| Field | Observed application type/use |
| --- | --- |
| `id` | string identifier |
| `maintenance_session_id` | parent session identifier |
| `maintenance_asset_id` | referenced asset identifier |
| `is_checked` | nullable boolean |
| `checked_at` | nullable timestamp string |

The app upserts on `maintenance_session_id,maintenance_asset_id`. A matching unique constraint is likely required for this code to work, but its existence is not proven by repository files.

### `place_gallery_images`

| Field | Observed application type/use |
| --- | --- |
| `id` | string identifier |
| `place_id` | parent place identifier |
| `image_path` | required storage path in app flow |
| `file_name` | nullable original/final filename |
| `file_size` | nullable number |
| `mime_type` | nullable string |
| `created_at` | nullable timestamp string |
| `updated_at` | nullable timestamp string |

### `notification_logs`

| Field | Observed application type/use |
| --- | --- |
| `product_id` | notified product identifier |
| `channel` | written as `email` |
| `target` | notification recipient |
| `status` | written as `sent` or `failed` |
| `sent_at` | nullable timestamp |
| `error_message` | nullable error text |
| `notification_type` | written as `product_expiry` |
| `expires_at_snapshot` | expiry value used for deduplication |
| `message` | email subject |

An `id` or timestamps may exist but are not selected/written by current source; unknown.

### `todos`

Only referenced by `.github/workflows/keep-supabase-alive.yml` as a one-row REST query. Its schema and existence are unknown.

## Inferred Relationships

```text
places 1 ---- * products
places 1 ---- * maintenance_assets
places 1 ---- * maintenance_sessions
places 1 ---- * place_gallery_images

maintenance_sessions 1 ---- * maintenance_checks
maintenance_assets   1 ---- * maintenance_checks

products 1 ---- * notification_logs (inferred from product_id)
```

Foreign keys, deletion actions, nullability, and actual cardinality constraints require confirmation from Supabase.

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
| `place-gallery-images` | Active place gallery uploads and public reads |
| `product-images` | Legacy cleanup reference only |
| `maintenance-images` | Legacy cleanup reference only |

Bucket privacy, MIME/size policy, ownership policy, and lifecycle rules are not stored in the repository.

## Migrations and Seed

- Migrations: none found.
- Seed: none found.
- Local Supabase config: none found.
- Generated database types: none found.
- Backup/restore procedure: unknown.

## RLS and Constraints

The source mentions checking RLS when reads fail, but no policies are versioned. The following are unknown and must be inspected in Supabase before data/security work:

- RLS enabled state and policies for every table.
- Storage bucket policies.
- Foreign keys and `ON DELETE` behavior.
- Unique constraints, especially maintenance check pairs and notification deduplication.
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

