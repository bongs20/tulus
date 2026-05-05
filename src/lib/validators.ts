// src/lib/validators.ts
import { z } from 'zod';

export const identitasSchema = z.object({
  nik: z.string().length(16, { message: 'NIK harus 16 digit.' }).regex(/^\d+$/, { message: 'NIK harus berupa angka.' }),
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap tidak boleh kosong.' }),
  tanggal_lahir: z.coerce.date(),
  jenis_kelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  alamat: z.string().min(1, { message: 'Alamat tidak boleh kosong.' }),
  nomor_telepon: z.string().min(10, { message: 'Nomor telepon tidak valid.' }).regex(/^\d+$/, { message: 'Nomor telepon harus berupa angka.' }),
  jumlah_anggota_keluarga: z.coerce.number().min(1, { message: 'Jumlah anggota keluarga minimal 1.' }),
});

export type IdentitasSchema = z.infer<typeof identitasSchema>;

export const ekonomiSchema = z.object({
  jenis_pekerjaan: z.string().min(1, { message: 'Jenis pekerjaan tidak boleh kosong.' }),
  status_kepemilikan_rumah: z.string().min(1, { message: 'Status kepemilikan rumah tidak boleh kosong.' }),
  keterangan_ekonomi: z.string().min(1, { message: 'Keterangan ekonomi tidak boleh kosong.' }),
});

export const fotoSchema = z.object({
  url_foto: z.array(z.string().url()).min(1, { message: 'Minimal 1 foto harus diunggah.' }).max(5, { message: 'Maksimal 5 foto dapat diunggah.' }),
});

export const createPenerimaSchema = z.object({
  nik: z.string().length(16, { message: 'NIK harus 16 digit.' }).regex(/^\d+$/, { message: 'NIK harus berupa angka.' }),
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap tidak boleh kosong.' }),
  tanggal_lahir: z.coerce.date(),
  jenis_kelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  alamat: z.string().min(1, { message: 'Alamat tidak boleh kosong.' }),
  nomor_telepon: z.string().min(10, { message: 'Nomor telepon tidak valid.' }).regex(/^\d+$/, { message: 'Nomor telepon harus berupa angka.' }),
  jumlah_anggota_keluarga: z.coerce.number().int().min(1, { message: 'Jumlah anggota keluarga minimal 1.' }),
  jenis_pekerjaan: z.string().min(1, { message: 'Jenis pekerjaan tidak boleh kosong.' }),
  status_kepemilikan_rumah: z.string().min(1, { message: 'Status kepemilikan rumah tidak boleh kosong.' }),
  keterangan_ekonomi: z.string().min(1, { message: 'Keterangan ekonomi tidak boleh kosong.' }),
  url_foto: z.array(z.string().url()).min(1, { message: 'Minimal 1 foto harus diunggah.' }).max(5, { message: 'Maksimal 5 foto dapat diunggah.' }),
});

export const updatePenerimaSchema = createPenerimaSchema.partial().extend({
  nik: z.string().length(16, { message: 'NIK harus 16 digit.' }).regex(/^\d+$/, { message: 'NIK harus berupa angka.' }).optional(),
  tanggal_lahir: z.coerce.date().optional(),
  jumlah_anggota_keluarga: z.coerce.number().int().min(1, { message: 'Jumlah anggota keluarga minimal 1.' }).optional(),
});
