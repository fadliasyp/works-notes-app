# Works Notes App

Works Notes App adalah aplikasi web pencatatan operasional untuk mengelola tempat kerja/restoran, produk beserta masa berlakunya, dokumentasi foto tempat, dan checklist maintenance berkala.

## Stack

- Node.js `>=20.9.0`
- Next.js 16.2.9 (App Router) dan React 19.2.4
- TypeScript 5 dan Tailwind CSS 4
- Supabase Database dan Storage
- Resend untuk email notifikasi
- Vercel Cron dan GitHub Actions

## Persyaratan

- Node.js `>=20.9.0`
- npm
- Project Supabase dengan schema, policy RLS, dan storage bucket yang sesuai
- Akun Resend dan environment Vercel jika notifikasi terjadwal digunakan

Schema/migration Supabase belum tersimpan di repository. Lihat [dokumentasi database](docs/DATABASE.md) sebelum menyiapkan project baru.

## Instalasi

```bash
npm ci
```

Buat `.env.local` dan isi variable yang diperlukan. Jangan commit nilainya.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
RESEND_API_KEY=
NOTIFICATION_EMAIL_TO=
```

`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dipakai aplikasi. Empat variable lainnya dipakai endpoint cron email. Workflow GitHub juga membutuhkan repository secrets `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.

## Development

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Pemeriksaan

```bash
npm run lint
npm run build
```

Belum ada test suite otomatis. Pada discovery 24 Agustus 2026, lint masih memiliki 4 error dan 6 warning. Build melewati kompilasi dan pemeriksaan TypeScript, lalu berhenti karena variable Supabase lokal belum tersedia. Detailnya dicatat di [project context](docs/PROJECT_CONTEXT.md).

## Deployment

Repository memiliki konfigurasi Vercel Cron pada `vercel.json` untuk memanggil `/api/cron/expiring-products` setiap hari pukul 01:00 UTC (08:00 WIB). Keaktifan deployment dan konfigurasi environment production belum dapat dibuktikan dari repository saja.

Workflow `.github/workflows/keep-supabase-alive.yml` menjadwalkan ping Supabase setiap tiga hari dan juga dapat dijalankan manual.

## Dokumentasi

- [Project context](docs/PROJECT_CONTEXT.md)
- [Current task](docs/CURRENT_TASK.md)
- [Feature baseline](docs/FEATURE_BASELINE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Decision log](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)
