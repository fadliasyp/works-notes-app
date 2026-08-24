# Feature Baseline

Last updated: 2026-08-25

## Baseline Status

Catatan project memberikan bukti user-level bahwa visual mobile, gallery, dan behavior navigasi/Back HP sudah bagus dan berjalan. Area tersebut kini menjadi `STABLE / PROTECTED`. CRUD lain tetap `WORKING / PROTECTED` sampai seluruh alur database live diuji.

## Mobile-First Visual System

**Status:** STABLE / USER-APPROVED

**Protected behavior:** Background gradient biru/putih/emerald yang lembut, card rounded besar, shadow halus, warna slate/blue/emerald, tombol besar, layout formal-modern yang tidak ramai, dan kenyamanan penggunaan HP.

**Do not break:** Jangan mengubah aplikasi menjadi desktop-first atau mengganti visual language secara menyeluruh tanpa permintaan pengguna.

**Important files:** Seluruh route UI di `app/`, terutama `app/page.tsx`, `app/restaurants/[id]/page.tsx`, dan `app/globals.css`.

**Verification:** Periksa viewport HP pada seluruh checklist manual di `CODEX_PROJECT_CONTEXT.md`.

## Place Management

**Status:** WORKING / PROTECTED; UI USER-APPROVED

**Function:** Menampilkan, mencari, menambah, mengedit, dan menghapus tempat.

**Protected behavior:**

- Nama wajib; alamat dan highlight kota opsional.
- Pencarian mencocokkan nama, alamat, dan kota tanpa membedakan huruf besar/kecil.
- Detail menampilkan jumlah produk/maintenance dan tanggal perubahan terakhir.
- Mutasi memperbarui `last_changed_at`.
- Child mutation tetap dibatasi ke `place_id` terkait.

**Do not break:**

- Empty state dan database error state.
- Redirect/feedback setelah submit.
- Layout responsive.

**Important files:** `app/page.tsx`, `app/restaurants/new/page.tsx`, `app/restaurants/[id]/edit/page.tsx`, `app/restaurants/[id]/page.tsx`.

**Dependencies:** Supabase table `places` serta child data/storage saat delete.

**Verification:** Jalankan CRUD dan search terhadap Supabase test project; pastikan child data dan storage cleanup sesuai policy/cascade live.

## Product and Expiry Tracking

**Status:** WORKING / PROTECTED; UI USER-APPROVED

**Function:** CRUD produk per tempat, menyimpan quantity/volume/expiry/note, dan menampilkan urgency badge.

**Protected behavior:**

- Nama produk wajib.
- Produk dibatasi oleh kombinasi child ID dan `place_id` saat update/delete.
- Badge merah untuk expired atau ≤3 hari, oranye untuk ≤10 hari, hijau di atasnya.
- Product list diurutkan berdasarkan nama.
- Mutasi memperbarui waktu perubahan tempat.

**Do not break:** Nullable numeric/text handling, date-only input, note, badge boundaries, dan toast redirects.

Foto produk sengaja dihapus. Jangan menambahkan upload/preview foto produk; gunakan gallery tempat.

**Important files:** `app/restaurants/[id]/page.tsx`, `app/restaurants/[id]/products/new/page.tsx`, `app/restaurants/[id]/products/[productId]/edit/page.tsx`.

**Dependencies:** `products`, `places`, `date-fns`.

**Verification:** Uji create/edit/delete dan tanggal kemarin, hari ini, +3, +4, +10, serta +11 hari.

## Maintenance Workflow

**Status:** WORKING / PROTECTED; UI USER-APPROVED

**Function:** Mengelola master asset, membuat sesi bulanan, membuat checklist snapshot, dan menandai hasil pengecekan.

**Protected behavior:**

- Judul default “Maintenance Bulanan”; tanggal wajib.
- Sesi baru mengambil semua asset aktif berdasarkan sort order.
- Asset baru ditambahkan sebagai unchecked ke seluruh sesi existing.
- Toggle checked mengatur `checked_at`; uncheck mengosongkannya.
- Update/delete child menggunakan ID tempat terkait.

**Do not break:** Sinkronisasi asset/check, composite upsert behavior, urutan asset, checked count, dan tab `?tab=maintenance`.

Foto maintenance asset sengaja dihapus. Jangan menambahkan upload/preview foto asset; gunakan gallery tempat.

**Important files:** `app/restaurants/[id]/maintenance-assets/page.tsx`, `app/restaurants/[id]/maintenance/new/page.tsx`, `app/restaurants/[id]/maintenance/[maintenanceId]/edit/page.tsx`, `app/restaurants/[id]/page.tsx`.

**Dependencies:** `maintenance_assets`, `maintenance_sessions`, `maintenance_checks`, `places`.

**Verification:** Buat asset sebelum/sesudah sesi, toggle checklist, edit sesi, hapus asset/sesi, dan periksa cascade/constraints.

## Place Gallery

**Status:** STABLE / USER-VERIFIED

**Function:** Menyimpan dokumentasi foto per tempat dengan multi-upload, viewer, selection, dan bulk delete.

**Protected behavior:**

- Maksimum 20 file per batch.
- Client mengompresi ke JPEG sekitar 0,85 MB dan 1800 px.
- Server memvalidasi image MIME dan maksimal 8 MB per file.
- Storage path memakai prefix `placeId/`.
- List terbaru lebih dulu; detail tempat menampilkan preview terbatas.
- Browser Back menutup viewer, selection mode, atau delete confirmation sebelum meninggalkan halaman.

**Do not break:** Input reset setelah upload, no false error after success, mobile selection bar, swipe/keyboard navigation, dan same-place filtering saat delete.

**Important files:** `app/restaurants/[id]/gallery/page.tsx`, `components/PlaceGalleryClient.tsx`, `app/restaurants/[id]/page.tsx`, `next.config.ts`.

**Dependencies:** `place_gallery_images`, bucket `place-gallery-images`, `browser-image-compression`.

**Verification:** Uji 1 dan 20 gambar, invalid type, oversized image, selection/delete, refresh, keyboard/swipe, dan browser Back di mobile/desktop.

## Navigation and Form Feedback

**Status:** STABLE / USER-VERIFIED

**Function:** Memberi pending UI, toast, replace-navigation, dan peringatan perubahan form yang belum disimpan.

**Protected behavior:**

- Submit button disabled dan mengganti teks selama pending.
- Toast dibaca dari URL lalu query parameter dibersihkan.
- Redirect sukses memakai replace agar form tidak muncul lagi saat Back.
- Unsaved guard menangani link, browser Back, refresh/close, dan submit tanpa menggandakan history.
- Global pending overlay memiliki fallback timeout.

**Important files:** `components/SubmitButton.tsx`, `components/ToastListener.tsx`, `components/UnsavedChangesGuard.tsx`, `components/ReplaceLink.tsx`, `components/GlobalPendingOverlay.tsx`, `lib/toast.ts`.

**Dependencies:** Next.js navigation, React DOM form status, Sonner, browser History API.

**Verification:** Edit setiap form lalu cancel/navigate/back/refresh/submit; cek tidak ada double-submit atau history trap.

## Expiry Email Notification

**Status:** WORKING / USER-VERIFIED DELIVERY

**Function:** Cron GET memilih produk yang expired dalam lima hari, mengirim satu email ringkasan, dan menulis notification logs.

**Current behavior to preserve until intentionally changed:**

- Bearer `CRON_SECRET` wajib.
- Query memakai service-role server-side.
- Rentang hari ini sampai +5 hari dan urutan tanggal ascending.
- Deduplikasi memakai product ID + expiry snapshot + target/channel/type.
- HTML dan plain-text email dikirim bersama.

**Known risk:** Log gagal ikut mencegah retry. Pengiriman SMTP sudah diverifikasi pengguna; skenario gagal dan deduplikasi belum diuji secara terpisah.

**Important files:** `app/api/cron/expiring-products/route.ts`, `lib/supabase-admin.ts`, `vercel.json`.

**Verification:** Gunakan test database dan test recipient; uji unauthorized, missing env, empty result, successful send, failed send, dan repeated invocation.
