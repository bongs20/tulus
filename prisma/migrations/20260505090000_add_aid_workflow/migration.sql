CREATE TABLE "aid_application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_number" TEXT NOT NULL,
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
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assigned_program" TEXT,
    "assigned_distribution_method" TEXT,
    "nominal_bantuan" DECIMAL,
    "validation_summary" TEXT,
    "admin_note" TEXT,
    "rejection_reason" TEXT,
    "field_verification_required" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" DATETIME,
    "distributed_at" DATETIME,
    "updated_at" DATETIME NOT NULL,
    "id_penerima_pusat" TEXT,
    CONSTRAINT "aid_application_id_penerima_pusat_fkey" FOREIGN KEY ("id_penerima_pusat") REFERENCES "tbl_penerima" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "aid_application_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" BLOB NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aid_application_document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "aid_validation_result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aid_validation_result_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "aid_verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "verifier_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "field_verification_needed" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aid_verification_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aid_verification_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "tbl_pengguna" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "aid_distribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "executed_by_id" TEXT,
    "program" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "nominal_bantuan" DECIMAL NOT NULL,
    "external_reference" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" DATETIME,
    CONSTRAINT "aid_distribution_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aid_distribution_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "tbl_pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "aid_application_transition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "notes" TEXT,
    "metadata_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aid_application_transition_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "aid_application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aid_application_transition_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "tbl_pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "aid_application_application_number_key" ON "aid_application"("application_number");
CREATE UNIQUE INDEX "aid_application_id_penerima_pusat_key" ON "aid_application"("id_penerima_pusat");
CREATE INDEX "aid_application_status_idx" ON "aid_application"("status");
CREATE INDEX "aid_application_submitted_at_idx" ON "aid_application"("submitted_at");
CREATE INDEX "aid_application_document_application_id_idx" ON "aid_application_document"("application_id");
CREATE INDEX "aid_validation_result_application_id_source_idx" ON "aid_validation_result"("application_id", "source");
CREATE INDEX "aid_verification_application_id_idx" ON "aid_verification"("application_id");
CREATE INDEX "aid_verification_verifier_id_idx" ON "aid_verification"("verifier_id");
CREATE INDEX "aid_distribution_application_id_idx" ON "aid_distribution"("application_id");
CREATE INDEX "aid_distribution_status_idx" ON "aid_distribution"("status");
CREATE INDEX "aid_application_transition_application_id_created_at_idx" ON "aid_application_transition"("application_id", "created_at");
