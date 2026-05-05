import { z } from "zod";

export const aidApplicationDocumentSchema = z.object({
  document_type: z.enum([
    "KTP",
    "KK",
    "SURAT_KETERANGAN",
    "FOTO_RUMAH",
    "FOTO_PENDUKUNG",
    "LAINNYA",
  ]),
  file_url: z.string().url(),
  file_name: z.string().min(1).max(255),
});

export const createAidApplicationSchema = z.object({
  nik: z.string().length(16).regex(/^\d+$/),
  nama_lengkap: z.string().min(1).max(255),
  tanggal_lahir: z.coerce.date(),
  jenis_kelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  alamat: z.string().min(1).max(1000),
  nomor_telepon: z.string().min(10).max(20).regex(/^\+?\d+$/),
  jumlah_anggota_keluarga: z.coerce.number().int().min(1).max(100),
  jenis_pekerjaan: z.string().min(1).max(255),
  status_kepemilikan_rumah: z.string().min(1).max(255),
  keterangan_ekonomi: z.string().min(1).max(2000),
  documents: z.array(aidApplicationDocumentSchema).min(1),
});

export const resubmitAidApplicationSchema = createAidApplicationSchema.partial()
  .extend({
    documents: z.array(aidApplicationDocumentSchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided for resubmission.",
  });

export const validateAidApplicationSchema = z.object({
  force_recheck: z.boolean().optional().default(false),
});

export const verifyAidApplicationSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().min(1).max(2000),
  field_verification_needed: z.boolean().optional().default(false),
});

export const assignAidProgramSchema = z.object({
  program: z.enum(["PKH", "BPNT", "BLT"]).optional(),
  nominal_bantuan: z.coerce.number().positive(),
  distribution_method: z.enum([
    "BANK_TRANSFER",
    "E_WALLET",
    "PHYSICAL_DISTRIBUTION",
  ]),
});

export const distributeAidSchema = z.object({
  external_reference: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
  simulate_failure: z.boolean().optional().default(false),
});
