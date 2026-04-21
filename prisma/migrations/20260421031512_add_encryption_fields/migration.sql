/*
  Warnings:

  - You are about to alter the column `nik` on the `tbl_desil` table. The data in that column could be lost. The data in that column will be cast from `String` to `Binary`.
  - You are about to alter the column `url_foto` on the `tbl_foto` table. The data in that column could be lost. The data in that column will be cast from `String` to `Binary`.
  - You are about to alter the column `nik` on the `tbl_penerima` table. The data in that column could be lost. The data in that column will be cast from `String` to `Binary`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tbl_desil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_penerima" TEXT NOT NULL,
    "nik" BLOB NOT NULL,
    "nilai_desil" INTEGER NOT NULL,
    "sumber_data" TEXT NOT NULL,
    "status_sinkronisasi" TEXT NOT NULL DEFAULT 'TERTUNDA',
    "tanggal_sinkronisasi" DATETIME NOT NULL,
    CONSTRAINT "tbl_desil_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tbl_desil" ("id", "id_penerima", "nik", "nilai_desil", "status_sinkronisasi", "sumber_data", "tanggal_sinkronisasi") SELECT "id", "id_penerima", "nik", "nilai_desil", "status_sinkronisasi", "sumber_data", "tanggal_sinkronisasi" FROM "tbl_desil";
DROP TABLE "tbl_desil";
ALTER TABLE "new_tbl_desil" RENAME TO "tbl_desil";
CREATE TABLE "new_tbl_foto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_penerima" TEXT NOT NULL,
    "url_foto" BLOB NOT NULL,
    "nama_file" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_foto_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tbl_foto" ("created_at", "id", "id_penerima", "nama_file", "url_foto") SELECT "created_at", "id", "id_penerima", "nama_file", "url_foto" FROM "tbl_foto";
DROP TABLE "tbl_foto";
ALTER TABLE "new_tbl_foto" RENAME TO "tbl_foto";
CREATE TABLE "new_tbl_penerima" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nik" BLOB NOT NULL,
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
INSERT INTO "new_tbl_penerima" ("alamat", "created_at", "id", "jenis_kelamin", "jenis_pekerjaan", "jumlah_anggota_keluarga", "keterangan_ekonomi", "nama_lengkap", "nik", "nomor_telepon", "status_kepemilikan_rumah", "status_verifikasi", "tanggal_lahir") SELECT "alamat", "created_at", "id", "jenis_kelamin", "jenis_pekerjaan", "jumlah_anggota_keluarga", "keterangan_ekonomi", "nama_lengkap", "nik", "nomor_telepon", "status_kepemilikan_rumah", "status_verifikasi", "tanggal_lahir" FROM "tbl_penerima";
DROP TABLE "tbl_penerima";
ALTER TABLE "new_tbl_penerima" RENAME TO "tbl_penerima";
CREATE UNIQUE INDEX "tbl_penerima_nik_key" ON "tbl_penerima"("nik");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
