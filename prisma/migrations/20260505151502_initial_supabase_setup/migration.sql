-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR');

-- CreateEnum
CREATE TYPE "StatusAkun" AS ENUM ('AKTIF', 'NONAKTIF', 'TERKUNCI');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "StatusVerifikasi" AS ENUM ('MENUNGGU', 'MATCH', 'MISMATCH', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "StatusSinkronisasi" AS ENUM ('MATCH', 'MISMATCH', 'TERTUNDA');

-- CreateEnum
CREATE TYPE "JenisBantuan" AS ENUM ('PKH', 'BPNT', 'BLT');

-- CreateEnum
CREATE TYPE "MetodePenyaluran" AS ENUM ('BANK', 'EWALLET', 'FISIK');

-- CreateEnum
CREATE TYPE "StatusPenyaluran" AS ENUM ('MENUNGGU', 'DIPROSES', 'BERHASIL', 'GAGAL');

-- CreateEnum
CREATE TYPE "StatusSanggahan" AS ENUM ('PENDING', 'DITINJAU', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusDtks" AS ENUM ('TERDAFTAR', 'BELUM_TERDAFTAR', 'LUAR_JANGKAUAN', 'DATA_TIDAK_ADA');

-- CreateEnum
CREATE TYPE "AidApplicationStatus" AS ENUM ('SUBMITTED', 'VALIDATING', 'REJECTED_INVALID', 'PENDING_ADMIN_VERIFICATION', 'REJECTED_ADMIN', 'APPROVED', 'CENTRALIZED', 'PROGRAM_ASSIGNED', 'DISTRIBUTION_IN_PROGRESS', 'DISTRIBUTED');

-- CreateEnum
CREATE TYPE "AidDocumentType" AS ENUM ('KTP', 'KK', 'SURAT_KETERANGAN', 'FOTO_RUMAH', 'FOTO_PENDUKUNG', 'LAINNYA');

-- CreateEnum
CREATE TYPE "AidValidationSource" AS ENUM ('KEMENSOS_DECILE', 'ADMINISTRATIVE_RECORD');

-- CreateEnum
CREATE TYPE "AidValidationResult" AS ENUM ('PASSED', 'FAILED', 'ERROR');

-- CreateEnum
CREATE TYPE "AidAdminDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AidProgram" AS ENUM ('PKH', 'BPNT', 'BLT');

-- CreateEnum
CREATE TYPE "AidDistributionMethod" AS ENUM ('BANK_TRANSFER', 'E_WALLET', 'PHYSICAL_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "AidDistributionExecutionStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AidActorType" AS ENUM ('CITIZEN', 'SYSTEM', 'ADMIN', 'SUPERVISOR');

-- CreateTable
CREATE TABLE "tbl_pengguna" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PETUGAS_VERIFIKATOR',
    "status_akun" "StatusAkun" NOT NULL DEFAULT 'AKTIF',
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "nomor_telepon" TEXT DEFAULT '085157441531',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_penerima" (
    "id" TEXT NOT NULL,
    "nik" BYTEA NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "alamat" TEXT NOT NULL,
    "nomor_telepon" TEXT NOT NULL,
    "jumlah_anggota_keluarga" INTEGER NOT NULL,
    "jenis_pekerjaan" TEXT NOT NULL,
    "status_kepemilikan_rumah" TEXT NOT NULL,
    "keterangan_ekonomi" TEXT NOT NULL,
    "status_verifikasi" "StatusVerifikasi" NOT NULL DEFAULT 'MENUNGGU',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_penerima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_foto" (
    "id" TEXT NOT NULL,
    "id_penerima" TEXT NOT NULL,
    "url_foto" BYTEA NOT NULL,
    "nama_file" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_desil" (
    "id" TEXT NOT NULL,
    "id_penerima" TEXT NOT NULL,
    "nik" BYTEA NOT NULL,
    "nilai_desil" INTEGER NOT NULL,
    "sumber_data" TEXT NOT NULL,
    "status_sinkronisasi" "StatusSinkronisasi" NOT NULL DEFAULT 'TERTUNDA',
    "tanggal_sinkronisasi" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_desil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_penyaluran" (
    "id" TEXT NOT NULL,
    "id_penerima" TEXT NOT NULL,
    "jenis_bantuan" "JenisBantuan" NOT NULL,
    "metode_penyaluran" "MetodePenyaluran" NOT NULL,
    "nominal_bantuan" DECIMAL(65,30) NOT NULL,
    "status_penyaluran" "StatusPenyaluran" NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,
    "bukti_penyaluran" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_penyaluran" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_penyaluran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_audit_log" (
    "id" TEXT NOT NULL,
    "id_pengguna" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "note" TEXT,
    "waktu_aksi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_sanggahan" (
    "id" TEXT NOT NULL,
    "id_penerima" TEXT NOT NULL,
    "nama_pengaju" TEXT NOT NULL,
    "isi_sanggahan" TEXT NOT NULL,
    "nomor_telepon" TEXT,
    "tanggal_sanggahan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_sanggahan" "StatusSanggahan" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "tbl_sanggahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_warga" (
    "id" TEXT NOT NULL,
    "nik" BYTEA NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "wilayah" TEXT NOT NULL,
    "status_dtks" "StatusDtks" NOT NULL DEFAULT 'BELUM_TERDAFTAR',
    "nilai_kesejahteraan" INTEGER NOT NULL,
    "is_dalam_jangkauan" BOOLEAN NOT NULL DEFAULT true,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aid_application" (
    "id" TEXT NOT NULL,
    "application_number" TEXT NOT NULL,
    "nik" BYTEA NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "alamat" TEXT NOT NULL,
    "nomor_telepon" TEXT NOT NULL,
    "jumlah_anggota_keluarga" INTEGER NOT NULL,
    "jenis_pekerjaan" TEXT NOT NULL,
    "status_kepemilikan_rumah" TEXT NOT NULL,
    "keterangan_ekonomi" TEXT NOT NULL,
    "status" "AidApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assigned_program" "AidProgram",
    "assigned_distribution_method" "AidDistributionMethod",
    "nominal_bantuan" DECIMAL(65,30),
    "validation_summary" TEXT,
    "admin_note" TEXT,
    "rejection_reason" TEXT,
    "field_verification_required" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "distributed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_penerima_pusat" TEXT,

    CONSTRAINT "aid_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aid_application_document" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "document_type" "AidDocumentType" NOT NULL,
    "file_url" BYTEA NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aid_application_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aid_validation_result" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "source" "AidValidationSource" NOT NULL,
    "result" "AidValidationResult" NOT NULL,
    "message" TEXT NOT NULL,
    "detail_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aid_validation_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aid_verification" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "verifier_id" TEXT NOT NULL,
    "decision" "AidAdminDecision" NOT NULL,
    "notes" TEXT NOT NULL,
    "field_verification_needed" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aid_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aid_distribution" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "executed_by_id" TEXT,
    "program" "AidProgram" NOT NULL,
    "method" "AidDistributionMethod" NOT NULL,
    "status" "AidDistributionExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "nominal_bantuan" DECIMAL(65,30) NOT NULL,
    "external_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "aid_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aid_application_transition" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" "AidActorType" NOT NULL,
    "from_status" "AidApplicationStatus",
    "to_status" "AidApplicationStatus" NOT NULL,
    "notes" TEXT,
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aid_application_transition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_pengaturan" (
    "id" TEXT NOT NULL DEFAULT 'global_settings',
    "total_anggaran" DECIMAL(65,30) NOT NULL DEFAULT 3000000000,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_pengaturan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_pengguna_username_key" ON "tbl_pengguna"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_penerima_nik_key" ON "tbl_penerima"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_warga_nik_key" ON "tbl_warga"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "aid_application_application_number_key" ON "aid_application"("application_number");

-- CreateIndex
CREATE UNIQUE INDEX "aid_application_id_penerima_pusat_key" ON "aid_application"("id_penerima_pusat");

-- CreateIndex
CREATE INDEX "aid_application_status_idx" ON "aid_application"("status");

-- CreateIndex
CREATE INDEX "aid_application_submitted_at_idx" ON "aid_application"("submitted_at");

-- CreateIndex
CREATE INDEX "aid_application_document_application_id_idx" ON "aid_application_document"("application_id");

-- CreateIndex
CREATE INDEX "aid_validation_result_application_id_source_idx" ON "aid_validation_result"("application_id", "source");

-- CreateIndex
CREATE INDEX "aid_verification_application_id_idx" ON "aid_verification"("application_id");

-- CreateIndex
CREATE INDEX "aid_verification_verifier_id_idx" ON "aid_verification"("verifier_id");

-- CreateIndex
CREATE INDEX "aid_distribution_application_id_idx" ON "aid_distribution"("application_id");

-- CreateIndex
CREATE INDEX "aid_distribution_status_idx" ON "aid_distribution"("status");

-- CreateIndex
CREATE INDEX "aid_application_transition_application_id_created_at_idx" ON "aid_application_transition"("application_id", "created_at");

-- AddForeignKey
ALTER TABLE "tbl_foto" ADD CONSTRAINT "tbl_foto_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_desil" ADD CONSTRAINT "tbl_desil_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_penyaluran" ADD CONSTRAINT "tbl_penyaluran_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_audit_log" ADD CONSTRAINT "tbl_audit_log_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "tbl_pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_sanggahan" ADD CONSTRAINT "tbl_sanggahan_id_penerima_fkey" FOREIGN KEY ("id_penerima") REFERENCES "tbl_penerima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_application" ADD CONSTRAINT "aid_application_id_penerima_pusat_fkey" FOREIGN KEY ("id_penerima_pusat") REFERENCES "tbl_penerima"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_application_document" ADD CONSTRAINT "aid_application_document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_validation_result" ADD CONSTRAINT "aid_validation_result_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_verification" ADD CONSTRAINT "aid_verification_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_verification" ADD CONSTRAINT "aid_verification_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "tbl_pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_distribution" ADD CONSTRAINT "aid_distribution_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_distribution" ADD CONSTRAINT "aid_distribution_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "tbl_pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_application_transition" ADD CONSTRAINT "aid_application_transition_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aid_application_transition" ADD CONSTRAINT "aid_application_transition_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "tbl_pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
