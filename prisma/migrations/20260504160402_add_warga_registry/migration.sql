-- CreateTable
CREATE TABLE "tbl_warga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nik" BLOB NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "wilayah" TEXT NOT NULL,
    "status_dtks" TEXT NOT NULL DEFAULT 'BELUM_TERDAFTAR',
    "nilai_kesejahteraan" INTEGER NOT NULL,
    "is_dalam_jangkauan" BOOLEAN NOT NULL DEFAULT true,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_warga_nik_key" ON "tbl_warga"("nik");
