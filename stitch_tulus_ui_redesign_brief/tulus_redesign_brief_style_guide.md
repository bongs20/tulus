# UI Redesign Brief - TULUS

Dokumen ini jadi acuan desain ulang UI untuk aplikasi **TULUS (Teknologi Usulan Layanan Sosial)**.

## 1) Tujuan Redesign

- Modernisasi tampilan dashboard dan modul operasional.
- Menjaga alur kerja sesuai SRS (registrasi -> sinkronisasi DTKS -> verifikasi -> penyaluran -> laporan).
- Memisahkan jelas pengalaman **publik** vs **internal (admin/kepala bidang/verifikator)**.
- Meningkatkan kejelasan status proses (MATCH, MISMATCH, DISETUJUI, DITOLAK, TERTUNDA).

## 2) User Role & Akses

- `Publik`:
  - Tanpa login.
  - Akses portal transparansi (`/publik`) + ajukan sanggahan.
- `ADMINISTRATOR`:
  - Login wajib.
  - Akses dashboard, laporan, pengaturan, retry sinkronisasi tertunda.
- `KEPALA_BIDANG`:
  - Login wajib.
  - Akses dashboard, laporan, monitoring.
- `PETUGAS_VERIFIKATOR`:
  - Login untuk modul operasional (input data, antrian, penyaluran).

Catatan middleware saat ini: area yang diproteksi ketat adalah `/dashboard`, `/laporan`, `/pengaturan`.

## 3) Struktur Halaman Utama

### Publik
- `/publik`:
  - Tabel penerima disetujui.
  - Search.
  - Tombol ajukan sanggahan.
  - Link login admin.

### Internal
- `/dashboard`:
  - KPI cards.
  - Funnel proses bantuan.
  - Tren bulanan.
  - Tabel penyaluran terbaru.
  - Panel aksi: **Retry Sinkronisasi Tertunda**.
- `/input-data`:
  - Form multi-step calon penerima.
  - Validasi real-time.
- `/antrian`:
  - Daftar verifikasi faktual.
  - Detail calon + foto.
  - Aksi set status disetujui/ditolak + alasan wajib.
- `/penyaluran`:
  - Manajemen proses penyaluran.
  - Status real-time: Menunggu, Diproses, Berhasil, Gagal.
- `/laporan`:
  - Rekap & export.
- `/pengaturan`:
  - Manajemen user/role.

## 4) Entitas & Status Penting (Untuk UI)

- `Penerima`:
  - Identitas inti + ekonomi + foto.
  - `status_verifikasi`:
    - `MENUNGGU`
    - `MATCH`
    - `MISMATCH`
    - `DISETUJUI`
    - `DITOLAK`
- `Desil`:
  - `status_sinkronisasi`:
    - `MATCH`
    - `MISMATCH`
    - `TERTUNDA`
- `Penyaluran`:
  - `status_penyaluran`:
    - `MENUNGGU`
    - `DIPROSES`
    - `BERHASIL`
    - `GAGAL`

## 5) API yang Perlu Diprioritaskan UI

- `GET /api/publik/penerima`
- `POST /api/sanggahan`
- `GET /api/dashboard/stats`
- `GET/POST /api/penerima`
- `PUT /api/penerima/[id]`
- `PUT /api/verifikasi/[id]`
- `GET/POST /api/penyaluran`
- `POST /api/sinkronisasi`
- `POST /api/sinkronisasi/retry-tertunda`

## 6) Prinsip UX yang Disarankan

- Status-driven UI:
  - Gunakan badge warna konsisten per status.
- Action safety:
  - Konfirmasi untuk aksi kritis.
  - Tampilkan alasan error yang actionable.
- Data density seimbang:
  - Ringkas di tabel, detail di drawer/panel.
- Mobile-first fallback:
  - Tabel punya mode card di layar kecil.
- Accessibility:
  - Kontras baik, fokus state jelas, label form lengkap.

## 7) Checklist Komponen UI

- Navigation:
  - Sidebar desktop + mobile nav.
  - Breadcrumb.
- Feedback:
  - Toast success/error.
  - Empty state + loading state + error state.
- Data views:
  - Table dengan search/filter/pagination.
  - Stat cards + charts.
- Forms:
  - Input, select, textarea, upload foto, validation message.
- Actions:
  - Confirm dialog.
  - Retry/refresh button.

## 8) Prioritas Redesign (Disarankan)

1. Dashboard (`/dashboard`) - informasi eksekutif + kontrol operasional.
2. Antrian verifikasi (`/antrian`) - core workflow harian.
3. Input data (`/input-data`) - kualitas data awal.
4. Penyaluran (`/penyaluran`) - tracking status real-time.
5. Publik (`/publik`) - transparansi dan trust.

## 9) Acceptance Criteria UI Baru

- Alur status mudah dipahami tanpa baca dokumentasi teknis.
- Semua halaman inti punya loading/error/empty states.
- Aksi kritis selalu memberi feedback jelas.
- Role-based view jelas (publik vs internal).
- Komponen visual konsisten lintas modul.

## 10) Catatan Teknis untuk Desainer/Frontend

- Stack UI saat ini berbasis React + Next.js + komponen shadcn-style.
- Sudah ada toast (`sonner`) dan komponen table/card/form.
- Bisa redesign bertahap per halaman tanpa refactor backend total.

## 11) UI Style Guide - Blue Theme

Panduan visual ini melengkapi `UI_REDESIGN_BRIEF.md` dan menetapkan tema utama **biru**.

## 1) Design Direction

- Kesan: profesional, bersih, institusional.
- Dominan: biru untuk identitas utama sistem.
- Netral: abu terang untuk background dan border.
- Aksen: hijau/amber/merah untuk status proses.

## 2) Color Tokens

Gunakan token ini sebagai CSS variables/global theme:

```css
:root {
  --bg: #f6f9ff;
  --surface: #ffffff;
  --surface-muted: #f1f6ff;
  --text: #10233f;
  --text-muted: #5b6b84;
  --border: #d7e3f7;

  --primary-50: #eef5ff;
  --primary-100: #d9e9ff;
  --primary-200: #bdd8ff;
  --primary-300: #93beff;
  --primary-400: #5b9bff;
  --primary-500: #2f7fff;
  --primary-600: #1f63db;
  --primary-700: #194fb2;
  --primary-800: #173f8d;
  --primary-900: #16366f;

  --success: #1f9d5a;
  --warning: #d18a00;
  --danger: #d14343;
  --info: #2f7fff;
}
```

## 3) Status Colors

- `MENUNGGU`: `--warning` + background amber muda.
- `MATCH`: `--info` + background biru muda.
- `MISMATCH`: `--danger` + background merah muda.
- `DISETUJUI`: `--success` + background hijau muda.
- `DITOLAK`: `--danger` + background merah muda.
- `TERTUNDA`: ungu kebiruan lembut (`#5b5bd6`) + background `#f1f0ff`.

## 4) Component Rules

- `Button Primary`: `--primary-600`, hover `--primary-700`, text putih.
- `Button Secondary`: background `--primary-50`, text `--primary-800`.
- `Card`: putih, border `--border`, shadow halus.
- `Table Header`: `--surface-muted`, text `--text`.
- `Link`: `--primary-700`, hover underline.
- `Focus Ring`: `0 0 0 3px rgba(47, 127, 255, 0.25)`.

## 5) Chart Palette

Urutan default chart:
1. `#2f7fff`
2. `#1f63db`
3. `#5b9bff`
4. `#173f8d`
5. `#93beff`

## 6) Accessibility

- Pastikan rasio kontras teks utama >= WCAG AA.
- Jangan gunakan warna saja untuk makna status; selalu tambah label/badge text.
- State error form wajib punya teks penjelas, bukan hanya border merah.

## 7) Quick Mapping (Tailwind)

Jika memakai Tailwind, map token ke class semantik:
- `bg-app` -> `--bg`
- `bg-surface` -> `--surface`
- `text-app` -> `--text`
- `text-muted` -> `--text-muted`
- `border-app` -> `--border`
- `bg-primary` -> `--primary-600`
- `bg-primary-hover` -> `--primary-700`

