// src/app/api/sinkronisasi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { mockDtksSync } from '@/lib/dtks';
import { sendSms } from '@/lib/sms';
import { encrypt } from '@/lib/crypto';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { sanitizeObject } from '@/lib/sanitizer';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const sanitizedBody = sanitizeObject(body);
    const { nik, nama, tanggal_lahir } = sanitizedBody;

    // Basic validation
    if (!nik || !nama || !tanggal_lahir) {
      return NextResponse.json({ message: 'Data input tidak lengkap.' }, { status: 400 });
    }

    // Convert tanggal_lahir string to Date object
    const parsedTanggalLahir = new Date(tanggal_lahir);
    if (isNaN(parsedTanggalLahir.getTime())) {
      return NextResponse.json({ message: 'Format tanggal lahir tidak valid.' }, { status: 400 });
    }

    // Call mock DTKS sync
    const dtksResult = await mockDtksSync({ nik, nama, tanggal_lahir: parsedTanggalLahir });

    // Encrypt NIK for database operations
    const encryptedNik = encrypt(nik);

    // Find or create penerima
    let penerima = await prisma.tbl_penerima.findUnique({
      where: { nik: encryptedNik },
    });

    if (!penerima) {
      // If penerima does not exist, create it.
      penerima = await prisma.tbl_penerima.create({
        data: {
          nik: encryptedNik,
          nama_lengkap: nama,
          tanggal_lahir: parsedTanggalLahir,
          jenis_kelamin: 'LAKI_LAKI', // Default, will be updated by FormIdentitas later if not set
          alamat: 'Alamat Sementara',
          nomor_telepon: '0',
          jumlah_anggota_keluarga: 0,
          jenis_pekerjaan: 'Pekerjaan Sementara',
          status_kepemilikan_rumah: 'Sementara',
          keterangan_ekonomi: 'Sementara',
          status_verifikasi: dtksResult.status === 'MATCH' ? 'MATCH' : 'MISMATCH',
        },
      });
    } else {
      // If penerima exists, update its status based on DTKS result
      penerima = await prisma.tbl_penerima.update({
        where: { id: penerima.id },
        data: {
          status_verifikasi: dtksResult.status === 'MATCH' ? 'MATCH' : 'MISMATCH',
          // Optionally update other fields here if DTKS is the source of truth
        },
      });
    }

    // Write result to tbl_desil
    await prisma.tbl_desil.create({
      data: {
        id_penerima: penerima.id,
        nik: encryptedNik, // Store encrypted NIK
        nilai_desil: dtksResult.desil || 0,
        sumber_data: 'DTKS API Mock',
        status_sinkronisasi: dtksResult.status,
        tanggal_sinkronisasi: new Date(),
      },
    });

    if (dtksResult.status === 'MATCH') {
      // Send SMS
      console.log(`SMS: Verifikasi awal berhasil untuk NIK ${nik}. Data masuk antrian verifikasi.`);
    }

    return NextResponse.json({ ...dtksResult, penerimaId: penerima.id }, { status: 200 });
  } catch (error) {
    console.error('Error during DTKS synchronization:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
