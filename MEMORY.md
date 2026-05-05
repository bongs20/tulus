# MEMORY

File ini dipakai sebagai konteks kerja berkelanjutan untuk proyek `tulus`.

## Instruksi

- Setiap sesi baru harus membaca file ini sebelum mulai kerja.
- Setelah melakukan tugas atau tindakan penting, catat ringkas apa yang dilakukan.
- Catatan harus memuat keputusan, file yang diubah, perintah/test yang dijalankan, dan tindak lanjut yang tersisa.
- Tetap ikuti `AGENTS.md`, terutama aturan Next.js: baca dokumentasi relevan di `node_modules/next/dist/docs/` sebelum menulis kode Next.js.

## Log Kerja

### 2026-05-05

- Membaca instruksi pengguna untuk menjadikan memory sebagai konteks setiap sesi.
- Mengecek repo dan folder `C:\Users\ACER\.codex\memories`; belum ada file memory sebelumnya.
- Menambahkan aturan Project Memory di `AGENTS.md`.
- Membuat `MEMORY.md` sebagai catatan konteks kerja awal.
- Memverifikasi isi `AGENTS.md`, isi `MEMORY.md`, dan `git status --short`; tidak menjalankan test karena perubahan hanya dokumentasi/instruksi.
- Menangani runtime error `next/image` di `src/components/verifikasi/DetailPanel.tsx` untuk URL seed dummy `https://example.com/photos/...`.
- Membaca dokumentasi lokal Next.js 16 di `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` dan config image di `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md`; `remotePatterns` adalah pola yang benar dan `images.domains` deprecated.
- Menambahkan guard `canRenderWithNextImage` agar hanya URL lokal dan host upload yang dikenal (`utfs.io`, `ufs.sh`, `*.ufs.sh`) dikirim ke `next/image`; URL dummy/host lain ditampilkan sebagai placeholder sehingga halaman verifikasi tidak crash.
- Menambahkan `sizes` pada pemakaian `Image` di thumbnail dan lightbox `DetailPanel`.
- Validasi: `npm run lint` gagal karena PowerShell memblokir `npm.ps1`; `npm.cmd run lint` berjalan tetapi gagal oleh masalah lint lama di banyak file lain. Validasi scoped berhasil: `npx.cmd eslint src\components\verifikasi\DetailPanel.tsx`.
- Membersihkan error lint lain di route API, hook SWR, form identitas, sanitizer, SMS helper, audit helper, select UI, dan import/type yang tidak terpakai.
- Menghapus cast `req as any` untuk `applyRateLimiter`, mengganti `where` query dengan tipe Prisma, menambahkan validasi enum `JenisBantuan` pada laporan, dan memastikan `totalProsesCount` dipakai di data laporan.
- Mengubah validasi NIK di `FormIdentitas` agar dipicu dari `onChange`, bukan `form.watch` di effect, sehingga rule React Compiler tidak memberi warning.
- Membungkus `mutate` di `usePenerima` agar pemakaian lama yang mengirim array penerima tetap membentuk cache SWR `{ data, total }`.
- Validasi berhasil: `npm.cmd run lint`, `npx.cmd tsc --noEmit`, dan `npm.cmd run build`. Build pertama di sandbox gagal `spawn EPERM`, lalu berhasil setelah diberi izin eskalasi.
- Restart dev server atas permintaan pengguna. `npm.cmd run dev` di sandbox gagal `spawn EPERM`, lalu server berhasil dijalankan di luar sandbox dengan log di `%TEMP%\tulus-next-dev.out.log` dan `%TEMP%\tulus-next-dev.err.log`.
- Verifikasi dev server: `http://localhost:3000` mengembalikan `200 OK`; Next.js log menunjukkan `Ready`, Local `http://localhost:3000`, Network `http://192.168.40.250:3000`.
- Menangani pesan "Gagal memuat data dashboard" pada halaman `/dashboard`.
- Diagnosis dari log dev server: halaman `/dashboard` berhasil dimuat, tetapi `GET /api/dashboard/stats` mengembalikan `403` untuk role yang masih diizinkan membuka dashboard oleh `src/proxy.ts` dan sidebar.
- Mengubah `src/app/api/dashboard/stats/route.ts` agar `PETUGAS_VERIFIKATOR` juga boleh membaca statistik dashboard, selaras dengan guard halaman.
- Memperbaiki view daftar user admin di `src/components/pengaturan/UserTable.tsx` dan `src/app/(dashboard)/pengaturan/page.tsx`: penggunaan `useDebounce` dibetulkan (tidak lagi menghasilkan `search=undefined`/karakter pertama), label role dibuat ramah pengguna, status/security info ditampilkan, pagination diterjemahkan, dan tombol nonaktifkan akun sendiri dibuat disabled berdasarkan sesi.
- Menyesuaikan tipe edit user di `src/components/pengaturan/UserForm.tsx` agar memakai bentuk data yang dikirim API, bukan model Prisma lengkap dengan `password_hash`.
- Mengaktifkan export PDF laporan: menambahkan `src/lib/laporan-pdf.tsx` berbasis `@react-pdf/renderer`, mengubah `src/app/api/laporan/route.ts` agar `export=pdf` mengembalikan `application/pdf`, serta memperbaiki filename download di `src/app/(dashboard)/laporan/page.tsx` menjadi `.pdf`/`.xlsx`.
- Memperbaiki fitur login: Server dan build Next.js crash ("The file ./src\middleware.ts must export a function") karena `src/middleware.ts` belum di-rename sepenuhnya ke `src/proxy.ts` setelah file convention Next.js 16 diubah. Di-rename ke `src/proxy.ts` dan fungsi sudah mengekspor `proxy`.
- Menambahkan pemeriksaan status akun `NONAKTIF` pada `src/lib/auth.ts` agar pengguna yang dinonaktifkan tidak dapat login.
- Build Next.js (`npm run build`) sekarang berhasil dengan sukses, tidak ada error proxy/middleware.
- Memperbaiki bug di mana pendaftaran warga (`/api/pendaftar`) tidak masuk ke antrian verifikasi: Menambahkan eksekusi `mockDtksSync` secara sinkronus pada saat registrasi. Jika sinkronisasi berhasil (`MATCH`), status pendaftar akan langsung berubah menjadi `MATCH` dan masuk ke `AntrianTable`.
- Memperbaiki sistem Tulus berdasarkan laporan masalah operasional:
  - **Akses Kabid**: Menambahkan izin akses menu Penyaluran untuk role `KEPALA_BIDANG` di `src/components/layout/Sidebar.tsx` dan `src/app/api/penyaluran/route.ts`.
  - **Bukti Penyaluran**: Menampilkan tabel riwayat penyaluran detail dengan tautan bukti foto di halaman Laporan (`src/app/(dashboard)/laporan/page.tsx`) dan mengintegrasikannya ke API laporan.
  - **Pencarian NIK**: Memperbaiki Error 500 dengan menghapus `mode: 'insensitive'` yang tidak didukung SQLite dan mengoptimalkan pencarian menggunakan enkripsi deterministik di API admin dan publik.
  - **UI Scroll**: Memperbaiki masalah scrolling pada `DetailPanel` di halaman antrian dengan menyesuaikan CSS layout.
  - **Sinkronisasi Penyaluran**: Menambahkan filter `excludeDisalurkan` pada API penerima dan hook `usePenerima` agar penerima yang sudah diproses tidak muncul lagi di antrian penyaluran bantuan.
  - **Keamanan & Performa**: Menggunakan singleton `prisma` di seluruh route API dan menonaktifkan cache agresif (`force-dynamic`) untuk memastikan data real-time.
- Validasi: Berhasil memverifikasi semua fitur melalui pengujian browser otomatis, skrip integrasi, dan pengujian database.

### Next Steps:
- Lakukan pemantauan pada beban server setelah implementasi pencarian NIK deterministik.
- Pastikan environment produksi memiliki ENCRYPTION_KEY yang sama dengan pengembangan jika ada migrasi data.

### Keputusan Desain:
- Menggunakan `force-dynamic` di API kritis untuk menjamin sinkronisasi data antar petugas di sistem bantuan sosial.
- Filter `excludeDisalurkan` diterapkan secara luas (exclude any distribution) untuk mempermudah alur kerja petugas bantuan.
