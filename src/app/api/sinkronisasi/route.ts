// src/app/api/sinkronisasi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mockDtksSync } from '@/lib/dtks';
import { decrypt, encrypt } from '@/lib/crypto';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { sanitizeObject } from '@/lib/sanitizer';
import { sendWhatsappNotification } from '@/lib/fonnte';
import { sendTelegramNotification } from '@/lib/telegram';

const MAX_RETRY = 3;
const RETRY_DELAY_MS = 30_000;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { PrismaClient, StatusVerifikasi, StatusSinkronisasi } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const rateLimitResponse = applyRateLimiter(req);
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
    if (!/^\d{16}$/.test(String(nik))) {
      return NextResponse.json({ message: 'NIK harus 16 digit numerik.' }, { status: 400 });
    }

    // Convert tanggal_lahir string to Date object
    const parsedTanggalLahir = new Date(tanggal_lahir);
    if (isNaN(parsedTanggalLahir.getTime())) {
      return NextResponse.json({ message: 'Format tanggal lahir tidak valid.' }, { status: 400 });
    }

    let dtksResult: Awaited<ReturnType<typeof mockDtksSync>> | null = null;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        dtksResult = await mockDtksSync({ nik, nama, tanggal_lahir: parsedTanggalLahir });
        break;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRY) {
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    const encryptedNik = encrypt(nik);
    const existingPenerima = await prisma.tbl_penerima.findMany({
      select: { id: true, nik: true },
    });

    const matchedPenerima = existingPenerima.find((item) => {
      try {
        return decrypt(item.nik) === nik;
      } catch {
        return false;
      }
    });

    const isSyncFailed = !dtksResult;
    const mappedStatusVerifikasi = isSyncFailed
      ? StatusVerifikasi.MENUNGGU
      : dtksResult?.status === 'MATCH'
        ? StatusVerifikasi.MATCH
        : StatusVerifikasi.MISMATCH;
    const mappedStatusSinkronisasi = isSyncFailed
      ? StatusSinkronisasi.TERTUNDA
      : dtksResult?.status === 'MATCH'
        ? StatusSinkronisasi.MATCH
        : StatusSinkronisasi.MISMATCH;

    let penerima = matchedPenerima
      ? await prisma.tbl_penerima.findUnique({ where: { id: matchedPenerima.id } })
      : null;

    if (!penerima) {
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
          status_verifikasi: mappedStatusVerifikasi,
        },
      });
    } else {
      penerima = await prisma.tbl_penerima.update({
        where: { id: penerima.id },
        data: {
          status_verifikasi: mappedStatusVerifikasi,
        },
      });
    }

    await prisma.tbl_desil.create({
      data: {
        id_penerima: penerima.id,
        nik: encryptedNik,
        nilai_desil: dtksResult?.desil || 0,
        sumber_data: 'DTKS DUMMY',
        status_sinkronisasi: mappedStatusSinkronisasi,
        tanggal_sinkronisasi: new Date(),
      },
    });

    if (!isSyncFailed && dtksResult?.status === 'MATCH' && penerima.nomor_telepon && penerima.nomor_telepon !== '0') {
      await sendWhatsappNotification(
        penerima.nomor_telepon,
        'Verifikasi awal berhasil. Data Anda masuk ke antrian verifikasi faktual TULUS.'
      );
      
      // Kirim monitoring ke admin
      await sendTelegramNotification(`📢 *SINKRONISASI BERHASIL*\nNama: ${nama}\nNIK: ${nik}\nStatus: MATCH`);
    }

    if (isSyncFailed) {
      return NextResponse.json(
        {
          status: 'TERTUNDA',
          message: 'Sinkronisasi DTKS tertunda. Sistem telah mencoba 3 kali dan akan diproses ulang.',
          penerimaId: penerima.id,
          error: lastError instanceof Error ? lastError.message : 'Sinkronisasi gagal',
        },
        { status: 202 }
      );
    }

    const syncResult = dtksResult!;

    return NextResponse.json(
      {
        ...syncResult,
        status: syncResult.status,
        message:
          syncResult.status === 'MATCH'
            ? 'Sinkronisasi DTKS berhasil. Data masuk antrian verifikasi faktual.'
            : 'Sinkronisasi DTKS mismatch. Silakan perbaiki data dan sinkronkan ulang.',
        penerimaId: penerima.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during DTKS synchronization:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
