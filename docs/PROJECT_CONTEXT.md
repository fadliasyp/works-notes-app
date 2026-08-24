# Project Context

Last updated: 2026-08-24

## Project Overview

**Name:** Works Notes App  
**Type:** Existing full-stack web application  
**Purpose:** Menyimpan catatan operasional per tempat/restoran: data tempat, persediaan produk dan masa berlaku, dokumentasi foto, serta checklist maintenance berkala.

Target pengguna aktual belum dijelaskan dalam repository. Berdasarkan istilah UI dan alur kerja, aplikasi tampaknya ditujukan untuk operator/pengelola beberapa tempat; hal ini masih perlu dikonfirmasi.

## Current Status

Project memiliki implementasi end-to-end yang cukup lengkap, tetapi belum dapat dinyatakan production-ready atau `STABLE` dari bukti repository saja:

- Branch saat discovery: `main`.
- Source utama dibuat 21 Juni 2026 dan perubahan terakhir dalam history terjadi 22 Juni 2026.
- Tidak ada automated test suite.
- `npm run lint` gagal dengan 4 error dan 6 warning.
- `npm run build` berhasil compile dan melewati TypeScript, lalu gagal saat page-data collection karena environment Supabase lokal belum lengkap.
- Schema, migration, RLS policy, dan seed Supabase tidak tersimpan di repository.
- Deployment yang benar-benar aktif dan perilaku terhadap database production belum diverifikasi.

## Features

| Feature | Status | Evidence |
| --- | --- | --- |
| Daftar, cari, tambah, edit, hapus tempat | WORKING | Route, query, dan Server Actions tersedia; TypeScript lolos dalam build |
| Ringkasan detail tempat | WORKING | Produk, maintenance, dan preview gallery dibaca per `place_id` |
| CRUD produk dan indikator masa berlaku | WORKING | Server Actions, validasi nama, dan badge expiry tersedia |
| CRUD master barang maintenance | WORKING | Tambah/edit/hapus tersedia; barang baru disinkronkan ke sesi existing |
| Sesi dan checklist maintenance | WORKING | Pembuatan snapshot checklist, edit sesi, hapus, dan toggle tersedia |
| Gallery tempat | WORKING | Multi-upload, kompresi client, viewer, selection, dan bulk delete tersedia |
| Toast, pending UI, dan unsaved-changes guard | WORKING | Komponen dipakai pada flow form dan history perbaikannya tersedia |
| Email produk akan expired | PARTIAL | Endpoint dan schedule tersedia; environment/runtime belum diverifikasi |
| Workflow keep-alive Supabase | UNKNOWN | Workflow tersedia tetapi bergantung pada tabel `todos` yang tidak digunakan di source lain |

`WORKING` berarti implementasi ditemukan dan lolos pemeriksaan TypeScript, bukan bukti bahwa fitur sudah diuji terhadap database live.

## Current Work

Belum ada task development aktif setelah bootstrap dokumentasi ini.

## Pending Work

Prioritas perlu dikonfirmasi pengguna. Kandidat berbasis bukti discovery:

1. Rotasi `CRON_SECRET` karena credential pernah tercatat di README dan masih mungkin ada di Git history.
2. Lengkapi environment lokal dan verifikasi aplikasi terhadap Supabase.
3. Selesaikan 4 lint errors dan tinjau 6 warnings.
4. Simpan schema/migration/RLS/storage policy Supabase dalam repository.
5. Verifikasi atau perbaiki workflow keep-alive yang membaca tabel `todos`.
6. Tambahkan regression checks untuk business flow penting.

## Business Logic

- Tempat memiliki nama wajib, sedangkan alamat dan highlight kota opsional.
- Pencarian tempat dilakukan case-insensitive di memory terhadap nama, alamat, dan kota setelah semua tempat dibaca.
- Produk memiliki nama wajib; quantity, volume, unit, expiry date, dan catatan bersifat opsional.
- Badge expiry: lewat tanggal = merah/expired; 0–3 hari = merah; 4–10 hari = oranye; lebih dari 10 hari = hijau.
- Endpoint email memilih produk dari hari ini sampai lima hari ke depan, lalu menghindari pengiriman ulang berdasarkan kombinasi produk dan snapshot tanggal expiry.
- Maintenance baru memakai judul default “Maintenance Bulanan” dan tanggal wajib.
- Saat sesi maintenance dibuat, semua master asset aktif disalin menjadi checklist unchecked.
- Saat master asset baru dibuat, checklist unchecked ditambahkan ke seluruh sesi maintenance tempat tersebut.
- Toggle checklist mengisi `checked_at` ketika checked dan mengosongkannya ketika unchecked.
- Setiap mutasi operasional berusaha memperbarui `places.last_changed_at`.
- Gallery menerima maksimum 20 gambar per batch. Client mengompresi ke JPEG, maksimum sekitar 0,85 MB dan dimensi 1800 px; server menolak file non-image atau di atas 8 MB.
- Tanggal yang tampil diformat dengan locale Indonesia dan zona waktu Asia/Jakarta pada flow utama.

## Technical Facts

- Next.js 16.2.9 App Router dengan React Server Components sebagai default.
- Mutasi UI memakai Server Actions yang colocated di file route.
- Data UI memakai Supabase anon client; cron memakai service-role client server-side.
- Hanya ada satu Route Handler publik: `GET /api/cron/expiring-products`, dilindungi bearer secret.
- Tidak ada authentication/session/role/permission layer di source.
- Toast diteruskan melalui query parameter lalu dibaca komponen client.
- Gallery memakai Supabase public URL dan bucket `place-gallery-images`.
- `next.config.ts` menaikkan Server Action body limit ke 20 MB.
- Package manager yang terbukti adalah npm melalui `package-lock.json`.

## Constraints

- Next.js lokal memiliki breaking changes; baca guide terkait di `node_modules/next/dist/docs/` sebelum mengubah kode.
- Akses data yang aman bergantung pada RLS/storage policy Supabase yang belum tersedia di repository.
- Serverless runtime diperlukan untuk Server Actions dan cron route; static export tidak memadai.
- Build membutuhkan network untuk mengambil Geist dari Google Fonts dan environment Supabase yang valid.
- Tidak boleh mengasumsikan cascade, foreign key, unique constraint, atau policy dari query application saja.

## Known Issues and Risks

### Security

- Credential cron pernah ditulis langsung di README. Nilainya sudah dihapus dari current README, tetapi masih dapat berada di Git history; secret harus dirotasi.
- Tidak ada app-level authentication atau authorization. Efektivitas RLS Supabase belum diketahui.
- Server Actions UI menggunakan anon key. Hidden form IDs bukan authorization boundary.

### Bugs / Behavior Risks

- Notification log dengan status `failed` tetap dianggap “sudah pernah dikirim”, sehingga kegagalan email dapat mencegah retry untuk produk/tanggal expiry yang sama.
- Hapus tempat tidak membersihkan bucket gallery `place-gallery-images`; perilaku cascade row dan potensi orphaned files belum diketahui.
- Multi-step mutations (storage + table, session + checks) tidak transaksional dan beberapa error cleanup storage diabaikan.
- Workflow keep-alive mengakses tabel `todos`; keberadaan tabel itu belum terbukti.

### Technical Debt / Documentation Drift

- UI masih menyebut foto produk/asset pada beberapa teks, sementara Git history menunjukkan fitur foto produk/maintenance dihapus dan gallery tempat ditambahkan.
- Cleanup legacy masih membaca `products.image_path`, `maintenance_assets.image_path`, dan bucket lama.
- Metadata root masih bernilai default Create Next App.
- README sebelumnya masih template dan kini telah diganti dengan dokumentasi project.

### Verification Debt

- Lint errors: empat unescaped quotes pada `app/page.tsx`.
- Lint warnings: unused import, tiga penggunaan `<img>`, dan dua dependency warning pada React effects.
- Tidak ada unit, integration, atau E2E tests.

## Important Files

- `app/page.tsx`: daftar, pencarian, dan hapus tempat.
- `app/restaurants/[id]/page.tsx`: detail, produk, maintenance, gallery preview.
- `app/restaurants/[id]/gallery/page.tsx`: Server Actions gallery.
- `components/PlaceGalleryClient.tsx`: kompresi, selection, viewer, dan browser history gallery.
- `components/UnsavedChangesGuard.tsx`: perlindungan perubahan form.
- `app/api/cron/expiring-products/route.ts`: query expiry, email, dan notification logs.
- `lib/supabase.ts`: anon client.
- `lib/supabase-admin.ts`: service-role client untuk cron.
- `next.config.ts`, `vercel.json`, dan `.github/workflows/keep-supabase-alive.yml`: runtime dan automation.

## External Services

| Service | Purpose | Integration |
| --- | --- | --- |
| Supabase | Database dan object storage | `@supabase/supabase-js` |
| Resend | Email expiry | Server-side Route Handler |
| Vercel | Target deployment dan daily cron | `vercel.json` |
| GitHub Actions | Ping Supabase tiap tiga hari | workflow YAML |
| Google Fonts | Geist saat build | `next/font/google` |

## Things We Must Not Break

- Relasi seluruh child record dengan `place_id`.
- Update `last_changed_at` setelah mutasi operasional.
- Default dan snapshot checklist maintenance.
- Deduplikasi email berdasarkan produk dan tanggal expiry.
- Filter endpoint cron dengan bearer secret dan service-role yang server-only.
- Kompresi/limit upload serta bulk selection/delete gallery.
- Browser-back semantics pada gallery dan unsaved form.
- Redirect replace, pending state, dan toast feedback setelah Server Actions.
- Layout mobile-responsive yang telah menjadi fokus banyak commit.

## Session Handoff

Bootstrap project memory selesai pada 24 Agustus 2026. Source code, dependency, database, deployment, dan perubahan `.gitignore` yang sudah ada tidak diubah. Mulai task berikutnya dengan membaca `AGENTS.md`, `docs/CURRENT_TASK.md`, dan `docs/FEATURE_BASELINE.md`, lalu konfirmasi akses/schema Supabase bila task menyentuh data.

