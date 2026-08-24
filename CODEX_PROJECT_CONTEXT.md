# CODEX_PROJECT_CONTEXT.md

Dokumen ini adalah konteks utama untuk melanjutkan project **Catatan Kerja** di Codex / VSCode.

Tujuan dokumen ini: **mencegah Codex salah asumsi**, terutama soal struktur folder, fitur yang sudah diputuskan, database Supabase, notifikasi, gallery, dan behavior tombol back HP.

---

## 1. Identitas Project

Project ini adalah aplikasi web internal untuk mencatat data kerja restoran/tempat.

Fitur utama:

- Daftar restoran/tempat kerja.
- Detail tempat.
- Produk per tempat.
- Catatan produk.
- Maintenance bulanan.
- Checklist barang maintenance tetap.
- Kumpulan foto/gallery per tempat.
- Email notification otomatis untuk produk yang mendekati expired.
- Mobile-first UI, karena penggunaan utama di HP.

Stack:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Supabase Database.
- Supabase Storage.
- Resend untuk email notification.
- Vercel untuk deploy dan Cron Job.
- Tidak memakai login/auth untuk saat ini.

---

## 2. Struktur Folder Penting

Project ini **tidak memakai folder `src`**.

Path yang benar:

```text
app/
lib/
components/
```

Jangan membuat path seperti:

```text
src/app/
src/lib/
```

Kecuali project benar-benar diubah secara sadar, tapi saat ini **jangan ubah struktur ke `src`**.

Contoh path yang benar:

```text
app/page.tsx
app/layout.tsx
app/restaurants/new/page.tsx
app/restaurants/[id]/page.tsx
app/restaurants/[id]/edit/page.tsx
app/restaurants/[id]/products/new/page.tsx
app/restaurants/[id]/products/[productId]/edit/page.tsx
app/restaurants/[id]/maintenance/new/page.tsx
app/restaurants/[id]/maintenance/[maintenanceId]/edit/page.tsx
app/restaurants/[id]/maintenance-assets/page.tsx
app/restaurants/[id]/gallery/page.tsx
app/api/cron/expiring-products/route.ts

components/GlobalPendingOverlay.tsx
components/PlaceGalleryClient.tsx
components/ReplaceLink.tsx
components/SonnerProvider.tsx
components/ToastListener.tsx
components/UnsavedChangesGuard.tsx
components/SubmitButton.tsx

lib/supabase.ts
lib/supabase-admin.ts
lib/toast.ts
```

---

## 3. Keputusan Penting Project

### 3.1 Tidak Ada Login Untuk Saat Ini

Project ini sengaja **tidak memakai login/auth**.

Jangan menambahkan kembali:

```text
middleware.ts
app/login/page.tsx
app/logout/route.ts
lib/supabase-server.ts
@supabase/ssr
```

Kecuali user secara eksplisit meminta fitur login.

Catatan keamanan: karena tidak ada login, app yang terdeploy bisa diedit publik jika URL diketahui. Ini disadari dan diterima untuk tahap sekarang.

---

### 3.2 UI Harus Mobile-first

Semua halaman harus nyaman di HP.

Gaya visual yang sudah dipilih:

- Background soft radial gradient biru/putih/emerald.
- Card rounded besar.
- Shadow halus.
- Warna utama: slate, blue, emerald.
- Tombol besar dan mudah ditekan.
- Layout responsif.
- Formal, rapi, modern, dan tidak terlalu ramai.

Jangan mengubah UI menjadi terlalu desktop-oriented.

---

### 3.3 Foto Produk dan Foto Barang Maintenance Sudah Dihapus

Fitur foto individual untuk produk dan barang maintenance sudah diputuskan untuk dihapus.

Jangan menambahkan lagi:

- Upload foto produk di tambah/edit produk.
- Preview foto produk di kartu produk.
- Upload foto barang maintenance.
- Preview foto barang maintenance.

Kolom lama seperti `products.image_path` atau `maintenance_assets.image_path` boleh masih ada di database, tapi jangan dipakai lagi di UI utama.

Fitur foto sekarang adalah **gallery/kumpulan foto per tempat**, bukan foto per produk/barang.

---

## 4. Database Supabase

### 4.1 Table `places`

Digunakan untuk data tempat/restoran.

Field penting:

```text
id uuid
name text
address text
city_highlight text
last_changed_at timestamptz
created_at timestamptz
updated_at timestamptz
```

Fungsi:

- Tampil di homepage.
- Detail tempat.
- Relasi ke produk, maintenance, gallery.

---

### 4.2 Table `products`

Digunakan untuk produk per tempat.

Field penting:

```text
id uuid
place_id uuid references places(id) on delete cascade
name text
quantity numeric
volume_value numeric
volume_unit text
expires_at date
note text
created_at timestamptz
updated_at timestamptz
```

Catatan:

- `note` adalah catatan khusus produk.
- Produk tidak lagi memakai foto.
- Produk yang expired mendekati 5 hari akan masuk email notification.

---

### 4.3 Table `maintenance_assets`

Barang maintenance tetap per tempat.

Field penting:

```text
id uuid
place_id uuid references places(id) on delete cascade
name text
description text
is_active boolean default true
sort_order int default 0
created_at timestamptz
updated_at timestamptz
```

Catatan:

- Ini adalah daftar barang tetap.
- Saat maintenance bulanan dibuat, semua barang aktif akan otomatis jadi checklist.
- Tidak lagi memakai foto barang maintenance.

---

### 4.4 Table `maintenance_sessions`

Sesi maintenance bulanan.

Field penting:

```text
id uuid
place_id uuid references places(id) on delete cascade
title text
maintenance_date date
note text
created_at timestamptz
updated_at timestamptz
```

Catatan:

- User tidak input item satu per satu.
- User hanya input judul, tanggal, dan catatan bulanan.
- Checklist dibuat otomatis dari `maintenance_assets`.

---

### 4.5 Table `maintenance_checks`

Checklist maintenance.

Field penting:

```text
id uuid
maintenance_session_id uuid references maintenance_sessions(id) on delete cascade
maintenance_asset_id uuid references maintenance_assets(id) on delete cascade
is_checked boolean default false
checked_at timestamptz
created_at timestamptz
updated_at timestamptz
unique (maintenance_session_id, maintenance_asset_id)
```

---

### 4.6 Table `notification_logs`

Mencegah email notification terkirim dobel.

Field penting:

```text
product_id uuid
channel text
target text
status text
sent_at timestamptz
error_message text
created_at timestamptz
notification_type text default 'product_expiry'
expires_at_snapshot date
message text
```

Unique index yang dipakai:

```text
(product_id, channel, target, notification_type, expires_at_snapshot)
```

Channel yang aktif saat ini:

```text
email
```

WhatsApp tidak digunakan karena berbayar/setup lebih rumit.

---

### 4.7 Table `place_gallery_images`

Gallery/kumpulan foto per tempat.

Field penting:

```text
id uuid primary key default gen_random_uuid()
place_id uuid not null references places(id) on delete cascade
image_path text not null
file_name text
file_size bigint
mime_type text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Storage bucket:

```text
place-gallery-images
```

Bucket ini public.

Fitur gallery:

- Upload 1 foto atau banyak foto sekaligus.
- Foto dikompres dulu di browser sebelum upload.
- Hapus 1 foto.
- Pilih banyak foto lalu hapus.
- Popup konfirmasi hapus.
- Klik foto membuka fullscreen viewer.
- Fullscreen bisa digeser kanan/kiri di HP.
- Tombol back HP saat fullscreen akan menutup fullscreen dulu.
- Tombol back HP saat mode pilih foto akan batal pilih dulu.
- Tombol back HP saat popup hapus akan menutup popup dulu.

---

## 5. Supabase Storage

Bucket lama yang mungkin masih ada:

```text
product-images
maintenance-images
```

Tapi fitur ini sudah tidak dipakai.

Bucket yang aktif untuk gallery:

```text
place-gallery-images
```

Foto gallery dikompres di browser memakai:

```text
browser-image-compression
```

Setting kompresi yang disarankan:

```ts
maxSizeMB: 0.85
maxWidthOrHeight: 1800
initialQuality: 0.86
fileType: "image/jpeg"
```

Tujuan:

- Supabase Storage tidak cepat penuh.
- Foto tetap bagus untuk tampilan HP.
- Upload lebih ringan.
- Tidak error body size.

---

## 6. Environment Variables

Jangan pernah hardcode value secret.

Env yang dipakai:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

RESEND_API_KEY
NOTIFICATION_EMAIL_TO

CRON_SECRET
```

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server/admin context:

```text
lib/supabase-admin.ts
app/api/cron/expiring-products/route.ts
```

Jangan pakai service role di client component.

---

## 7. File Supabase Client

### `lib/supabase.ts`

Dipakai untuk Supabase client biasa.

Import pattern:

```ts
import { supabase } from "@/lib/supabase";
```

### `lib/supabase-admin.ts`

Dipakai untuk cron/email notification.

Import pattern:

```ts
import { supabaseAdmin } from "@/lib/supabase-admin";
```

---

## 8. Vercel Cron dan Email Notification

File cron:

```text
app/api/cron/expiring-products/route.ts
```

Cron endpoint:

```text
/api/cron/expiring-products
```

Cron harus:

- `export const dynamic = "force-dynamic";`
- Cek header Authorization:
  ```text
  Authorization: Bearer ${CRON_SECRET}
  ```
- Ambil produk dengan `expires_at` dari hari ini sampai 5 hari ke depan.
- Kirim email via Resend.
- Simpan log ke `notification_logs`.
- Tidak mengirim ulang produk yang sudah pernah dikirim untuk `expires_at_snapshot` yang sama.

Threshold saat ini:

```text
5 hari
```

Bukan 10 hari.

Subject email yang diinginkan:

```text
⚠️ Notifikasi Expired 5 Hari: X Produk Perlu Dicek
```

Email berisi banyak produk sekaligus dalam satu email.

Contoh behavior:

```text
Jika ada 5 produk expired ≤ 5 hari:
→ 1 email berisi 5 produk

Jika hanya ada 1 produk:
→ 1 email berisi 1 produk

Jika produk sudah pernah dikirim:
→ tidak dikirim ulang
```

---

## 9. Vercel Cron Schedule

File:

```text
vercel.json
```

Kalau schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/expiring-products",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Maka berjalan sekitar:

```text
08:00 WIB setiap hari
```

Karena Vercel Cron memakai UTC:

```text
01:00 UTC = 08:00 WIB
```

Kalau schedule diubah ke:

```json
{
  "crons": [
    {
      "path": "/api/cron/expiring-products",
      "schedule": "0 * * * *"
    }
  ]
}
```

Maka berjalan setiap jam di menit 00.

Saat ini preferensi notifikasi:

```text
Email notification aktif
WhatsApp tidak dipakai
Threshold expired 5 hari
```

---

## 10. Halaman dan Fitur

### 10.1 Homepage

File:

```text
app/page.tsx
```

Fungsi:

- Menampilkan daftar tempat.
- Search tempat berdasarkan:
  - nama
  - alamat
  - kota/highlight
- Tambah tempat.
- Edit tempat.
- Hapus tempat.
- Card tempat dengan tampilan modern.

Catatan:

- Path benar adalah `app/page.tsx`, bukan `src/app/page.tsx`.

---

### 10.2 Tambah Tempat

File:

```text
app/restaurants/new/page.tsx
```

Field:

```text
name
address
city_highlight
```

Setelah berhasil, redirect ke detail tempat dengan toast success.

---

### 10.3 Edit Tempat

File:

```text
app/restaurants/[id]/edit/page.tsx
```

Field:

```text
name
address
city_highlight
```

Setelah berhasil, redirect ke detail tempat dengan toast success.

---

### 10.4 Detail Tempat

File:

```text
app/restaurants/[id]/page.tsx
```

Memiliki tab:

```text
Produk
Maintenance
```

Tab memakai `ReplaceLink`, bukan `Link` biasa, supaya tombol Back HP tidak muter antar tab.

Di tab Produk:

- Card Kumpulan Foto di atas list produk.
- List produk.
- Catatan produk.
- Tambah produk.
- Edit produk.
- Hapus produk.

Di tab Maintenance:

- List maintenance sessions.
- Checklist barang maintenance.
- Kelola barang.
- Tambah maintenance.
- Edit maintenance.
- Hapus maintenance.

---

### 10.5 Tambah Produk

File:

```text
app/restaurants/[id]/products/new/page.tsx
```

Field:

```text
name
quantity
volume_value
volume_unit
expires_at
note
```

Tidak ada foto produk.

Setelah berhasil, kembali ke detail tempat tab Produk.

---

### 10.6 Edit Produk

File:

```text
app/restaurants/[id]/products/[productId]/edit/page.tsx
```

Field:

```text
name
quantity
volume_value
volume_unit
expires_at
note
```

Tidak ada foto produk.

---

### 10.7 Tambah Maintenance

File:

```text
app/restaurants/[id]/maintenance/new/page.tsx
```

Field:

```text
title
maintenance_date
note
```

Saat simpan:

1. Insert `maintenance_sessions`.
2. Ambil semua `maintenance_assets` aktif.
3. Insert semua ke `maintenance_checks`.
4. Redirect ke tab Maintenance.

User tidak input item manual.

---

### 10.8 Edit Maintenance

File:

```text
app/restaurants/[id]/maintenance/[maintenanceId]/edit/page.tsx
```

Field:

```text
title
maintenance_date
note
```

Checklist tidak diedit di halaman ini. Checklist diedit dari halaman detail tempat tab Maintenance.

---

### 10.9 Kelola Barang Maintenance

File:

```text
app/restaurants/[id]/maintenance-assets/page.tsx
```

Field barang:

```text
name
description
sort_order
```

Tidak ada foto barang.

Saat tambah barang baru:

- Insert ke `maintenance_assets`.
- Tambahkan juga missing `maintenance_checks` ke semua maintenance session yang sudah ada.
- Gunakan `upsert` dengan conflict:
  ```text
  maintenance_session_id,maintenance_asset_id
  ```

---

### 10.10 Gallery / Kumpulan Foto

File:

```text
app/restaurants/[id]/gallery/page.tsx
components/PlaceGalleryClient.tsx
```

Fitur:

- Card Kumpulan Foto muncul di atas list produk.
- Klik card membuka gallery.
- Upload banyak foto sekaligus.
- Foto dikompres di client.
- Setelah upload berhasil:
  - input file harus reset/kosong.
  - tombol upload kembali disabled sampai pilih foto baru.
  - tidak boleh muncul alert gagal palsu.
  - `router.refresh()` dipakai agar list foto update.
- Hapus satu foto.
- Pilih banyak foto lalu hapus.
- Konfirmasi hapus dengan modal.
- Fullscreen viewer dengan swipe kanan/kiri.
- Back HP:
  - saat fullscreen: menutup fullscreen dulu.
  - saat popup hapus: menutup popup dulu.
  - saat mode pilih foto: batal pilih dulu.
  - setelah itu baru keluar gallery.

---

## 11. Back HP / Browser History

Project ini punya perhatian khusus pada tombol Back bawaan HP.

Komponen penting:

```text
components/UnsavedChangesGuard.tsx
components/ReplaceLink.tsx
components/PlaceGalleryClient.tsx
```

### 11.1 UnsavedChangesGuard

Dipakai di halaman form:

```text
app/restaurants/new/page.tsx
app/restaurants/[id]/edit/page.tsx
app/restaurants/[id]/products/new/page.tsx
app/restaurants/[id]/products/[productId]/edit/page.tsx
app/restaurants/[id]/maintenance/new/page.tsx
app/restaurants/[id]/maintenance/[maintenanceId]/edit/page.tsx
app/restaurants/[id]/maintenance-assets/page.tsx
```

Tujuan:

- Kalau user sudah mengisi form lalu menekan Back HP, muncul popup:
  ```text
  Keluar dari halaman?
  ```
- Kalau belum ada perubahan, Back HP normal.
- Setelah submit sukses, guard tidak boleh membuat form lama nyangkut di history.

Jangan mengganti logic ini sembarangan.

---

### 11.2 ReplaceLink untuk Tab

File:

```text
components/ReplaceLink.tsx
```

Dipakai untuk tab Produk/Maintenance supaya perpindahan tab tidak menumpuk history.

---

### 11.3 Redirect Setelah Server Action

Setelah tambah/edit/hapus berhasil, redirect sukses sebaiknya memakai:

```ts
redirect(targetUrl, RedirectType.replace);
```

Import:

```ts
import { redirect, RedirectType } from "next/navigation";
```

Tujuan:

- Setelah submit berhasil, Back HP tidak kembali ke form lama.
- Back HP terasa natural.

---

## 12. Toast / Popup Notification

Project memakai Sonner.

File:

```text
components/SonnerProvider.tsx
components/ToastListener.tsx
lib/toast.ts
```

Install package:

```text
sonner
```

Helper:

```ts
withToast(path, "success", "Pesan")
withToast(path, "error", "Pesan")
withToast(path, "info", "Pesan")
```

Contoh:

```ts
redirect(
  withToast(`/restaurants/${placeId}`, "success", "Produk berhasil ditambahkan."),
  RedirectType.replace
);
```

Toast dibaca dari query URL:

```text
?toast=success&message=...
```

`ToastListener` membersihkan query setelah toast muncul.

---

## 13. Global Pending Overlay

File:

```text
components/GlobalPendingOverlay.tsx
```

Tujuan:

- Saat klik link/form, muncul overlay kecil “Memproses...”
- Membuat aplikasi tidak terasa freeze/pending di HP.

Sudah dipasang di `app/layout.tsx`.

---

## 14. Loading Page

File:

```text
app/loading.tsx
```

Berfungsi untuk route loading skeleton.

Catatan:

- `loading.tsx` tidak selalu terlihat kalau halaman cepat/cache.
- Untuk feedback klik, pakai `GlobalPendingOverlay`.

---

## 15. Layout

File:

```text
app/layout.tsx
```

Harus memasang:

```tsx
<SonnerProvider />

<Suspense fallback={null}>
  <ToastListener />
</Suspense>

<Suspense fallback={null}>
  <GlobalPendingOverlay />
</Suspense>

{children}
```

Kalau body punya `className`, jangan hapus.

---

## 16. Date dan Timezone

Untuk menampilkan tanggal ke user Indonesia, gunakan:

```ts
new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "long",
  year: "numeric",
})
```

Masalah sebelumnya:

- Data disimpan dalam UTC.
- Tampilan bisa terlihat “kemarin” kalau tidak pakai timezone Jakarta.

Pastikan function `formatDate` di halaman penting memakai `timeZone: "Asia/Jakarta"`.

---

## 17. Package Penting

Package yang dipakai/kemungkinan sudah ada:

```text
@supabase/supabase-js
resend
lucide-react
sonner
browser-image-compression
```

Jangan menambah library besar tanpa alasan kuat.

---

## 18. File `next.config`

Karena upload gallery memakai Server Action dan file dikompres dulu, body limit sudah dinaikkan secukupnya.

Contoh:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
```

Kalau Next.js version meminta format berbeda, sesuaikan berdasarkan versi project.

---

## 19. Testing Checklist Setelah Perubahan

Setelah Codex mengubah kode, selalu jalankan:

```bash
npm run build
```

Lalu:

```bash
npm run dev
```

Test minimal:

```text
1. Homepage tampil dan search tempat jalan.
2. Tambah tempat.
3. Edit tempat.
4. Detail tempat tab Produk.
5. Tambah produk.
6. Edit produk.
7. Catatan produk tampil.
8. Tab Maintenance.
9. Tambah maintenance.
10. Checklist maintenance.
11. Edit maintenance.
12. Kelola barang maintenance.
13. Gallery:
    - upload banyak foto
    - input file reset setelah upload
    - buka fullscreen
    - swipe foto
    - hapus satu foto
    - pilih banyak foto lalu hapus
    - tombol Back HP fullscreen/popup/selection bekerja benar
14. Tombol Back HP setelah submit tidak kembali ke form lama.
15. Email cron route masih build.
```

---

## 20. Hal Yang Jangan Dilakukan Codex

Jangan lakukan ini tanpa instruksi eksplisit user:

```text
- Jangan membuat folder src.
- Jangan menambahkan login/auth.
- Jangan mengaktifkan ulang foto produk.
- Jangan mengaktifkan ulang foto barang maintenance.
- Jangan mengubah threshold notification kembali ke 10 hari.
- Jangan mengganti email notification menjadi WhatsApp.
- Jangan menghapus notification_logs.
- Jangan menghapus kolom database lama tanpa persetujuan.
- Jangan menaruh service role key di client component.
- Jangan menghilangkan UnsavedChangesGuard.
- Jangan mengubah ReplaceLink tab menjadi Link biasa.
- Jangan membuat UI desktop-first.
- Jangan menghapus behavior Back HP gallery.
```

---

## 21. Cara Menjawab Jika User Minta Fitur Baru

Jika user minta fitur baru, Codex harus:

1. Cek struktur project dulu.
2. Cek file existing sebelum edit.
3. Pertahankan gaya UI yang sudah ada.
4. Pastikan mobile-first.
5. Pastikan `npm run build` aman.
6. Hindari perubahan database destruktif.
7. Kalau perlu SQL, berikan SQL jelas untuk Supabase.
8. Jangan menyimpan secret di kode.
9. Kalau ada upload file, pikirkan ukuran storage dan kompresi.
10. Untuk navigasi, pikirkan behavior tombol Back HP.

---

## 22. Status Terakhir Project

Status terakhir saat dokumen ini dibuat:

```text
- UI utama sudah rapi, modern, mobile-first.
- Halaman detail tempat sudah rapi.
- Tambah/edit produk sudah rapi.
- Tambah/edit tempat sudah rapi.
- Tambah/edit maintenance sudah rapi.
- Kelola barang maintenance sudah rapi.
- Foto produk/barang maintenance sudah dihapus.
- Product note sudah ditambahkan.
- Gallery/kumpulan foto per tempat sudah berjalan.
- Upload gallery sudah dikompres dan reset input setelah berhasil.
- Fullscreen gallery dan tombol Back HP sudah rapi.
- Popup hapus gallery sudah rapi.
- Selection action bar mobile gallery sudah rapi.
- Unsaved form guard sudah berjalan.
- Redirect sukses sudah memakai replace agar Back HP tidak kembali ke form lama.
- Notification email expired sudah berjalan.
- Threshold notification sekarang 5 hari, bukan 10 hari.
- WhatsApp notification tidak dipakai karena berbayar/setup rumit.
```

---

## 23. Instruksi Untuk Codex

Sebelum mengubah kode, baca dokumen ini sampai selesai.

Prioritas saat membantu project ini:

```text
1. Jangan salah path.
2. Jangan salah asumsi fitur lama.
3. Jaga UI tetap mobile-first.
4. Jaga Supabase schema tetap konsisten.
5. Jaga back button HP tetap nyaman.
6. Jaga cron/email notification tetap aman.
7. Jalankan build setelah perubahan.
```

Jika ada informasi yang tidak jelas, **tanya dulu**, jangan asal refactor besar.
