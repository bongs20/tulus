-- CreateTable
CREATE TABLE "tbl_pengguna" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PETUGAS_VERIFIKATOR',
    "status_akun" TEXT NOT NULL DEFAULT 'AKTIF',
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tbl_penerima" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nik" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "tanggal_lahir" DATETIME NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "nomor_telepon" TEXT NOT NULL,
    "jumlah_anggota_keluarga" INTEGER NOT NULL,
    "jenis_pekerjaan" TEXT NOT NULL,
    "status_kepemilikan_rumah" TEXT NOT NULL,
    "keterangan_ekonomi" TEXT NOT NULL,
    "status_verifikasi" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tbl_foto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_penerima" TEXT NOT NULL,
    "url_foto" TEXT NOT NULL,
    "nama_file" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_foto_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tbl_desil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_penerima" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nilai_desil" INTEGER NOT NULL,
    "sumber_data" TEXT NOT NULL,
    "status_sinkronisasi" TEXT NOT NULL DEFAULT 'TERTUNDA',
    "tanggal_sinkronisasi" DATETIME NOT NULL,
    CONSTRAINT "tbl_desil_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tbl_penyaluran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_penerima" TEXT NOT NULL,
    "jenis_bantuan" TEXT NOT NULL,
    "metode_penyaluran" TEXT NOT NULL,
    "nominal_bantuan" DECIMAL NOT NULL,
    "status_penyaluran" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_penyaluran" DATETIME NOT NULL,
    CONSTRAINT "tbl_penyaluran_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tbl_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_pengguna" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "note" TEXT,
    "waktu_aksi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_audit_log_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "tbl_pengguna" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tbl_sanggahan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_penerima" TEXT NOT NULL,
    "nama_pengaju" TEXT NOT NULL,
    "isi_sanggahan" TEXT NOT NULL,
    "tanggal_sanggahan" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_sanggahan" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "tbl_sanggahan_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_pengguna_username_key" ON "tbl_pengguna"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_penerima_nik_key" ON "tbl_penerima"("nik");
