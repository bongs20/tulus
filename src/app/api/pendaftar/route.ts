// src/app/api/pendaftar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { encrypt } from '@/lib/crypto';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { ekonomiSchema, identitasSchema } from '@/lib/validators';

const prisma = new PrismaClient();
const WHATSAPP_ADMIN = '085157441531';

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const nik = searchParams.get('nik')?.trim();

  if (!nik || nik.length !== 16 || !/^\d+$/.test(nik)) {
    return NextResponse.json({ message: 'NIK tidak valid.' }, { status: 400 });
  }

  try {
    const encryptedNik = encrypt(nik);

    const existingPenerima = await prisma.tbl_penerima.findFirst({
      where: { nik: encryptedNik },
    });

    if (existingPenerima) {
      const warga = await prisma.tbl_warga.findFirst({
        where: { nik: encryptedNik },
        select: { nama_lengkap: true, wilayah: true, status_dtks: true, nilai_kesejahteraan: true },
      });

      return NextResponse.json({
        canRegister: false,
        isRegistered: true,
        status: 'SUDAH_TERDAFTAR',
        nik,
        nama_lengkap: warga?.nama_lengkap,
        wilayah: warga?.wilayah,
        status_dtks: warga?.status_dtks,
        nilai_kesejahteraan: warga?.nilai_kesejahteraan,
        contactWhatsapp: WHATSAPP_ADMIN,
        message: 'NIK ini sudah terdaftar di sistem.',
      });
    }

    const warga = await prisma.tbl_warga.findFirst({
      where: { nik: encryptedNik },
    });

    if (!warga) {
      return NextResponse.json({
        canRegister: false,
        isRegistered: false,
        status: 'HUBUNGI_ADMIN',
        nik,
        contactWhatsapp: WHATSAPP_ADMIN,
        message: `Data NIK tidak ditemukan di database Master Warga kami.`,
      });
    }

    const canRegister = warga.is_dalam_jangkauan && warga.status_dtks !== 'LUAR_JANGKAUAN';

    return NextResponse.json({
      canRegister,
      isRegistered: false,
      status: canRegister ? 'BISA_DAFTAR' : 'HUBUNGI_ADMIN',
      nik,
      nama_lengkap: warga.nama_lengkap,
      wilayah: warga.wilayah,
      status_dtks: warga.status_dtks,
      nilai_kesejahteraan: warga.nilai_kesejahteraan,
      contactWhatsapp: WHATSAPP_ADMIN,
      message: canRegister ? 'Warga ditemukan. Silakan lanjutkan pendaftaran.' : 'Data Anda belum memenuhi syarat pendaftaran mandiri.',
    });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json({ message: 'Kesalahan server.' }, { status: 500 });
  }
}

const registrationSchema = identitasSchema.merge(ekonomiSchema).extend({
  url_foto: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const validation = registrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Data tidak valid.', issues: validation.error.issues }, { status: 400 });
    }

    const { nik, url_foto, ...penerimaData } = validation.data;
    const encryptedNik = encrypt(nik);

    // Direct check in database
    const warga = await prisma.tbl_warga.findFirst({ where: { nik: encryptedNik } });
    if (!warga || !warga.is_dalam_jangkauan) {
      return NextResponse.json({ message: 'Warga tidak memenuhi syarat.' }, { status: 403 });
    }

    const alreadyRegistered = await prisma.tbl_penerima.findFirst({ where: { nik: encryptedNik } });
    if (alreadyRegistered) {
      return NextResponse.json({ message: 'NIK ini sudah terdaftar.' }, { status: 409 });
    }

    // DTKS Sync
    const { mockDtksSync } = await import('@/lib/dtks');
    let dtksResult = null;
    try {
      dtksResult = await mockDtksSync({ nik, nama: penerimaData.nama_lengkap, tanggal_lahir: new Date(penerimaData.tanggal_lahir) });
    } catch (e) { console.warn('Sync failed'); }

    const statusVerifikasi = !dtksResult ? 'MENUNGGU' : dtksResult.status === 'MATCH' ? 'MATCH' : 'MISMATCH';

    const newPenerima = await prisma.$transaction(async (tx) => {
      const p = await tx.tbl_penerima.create({
        data: {
          ...penerimaData,
          nik: encryptedNik,
          status_verifikasi: statusVerifikasi,
        },
      });

      if (url_foto && url_foto.length > 0) {
        await tx.tbl_foto.createMany({
          data: url_foto.map(url => ({
            id_penerima: p.id,
            url_foto: encrypt(url),
            nama_file: 'pendaftaran_mandiri',
          })),
        });
      }

      await tx.tbl_desil.create({
        data: {
          id_penerima: p.id,
          nik: encryptedNik,
          nilai_desil: dtksResult?.desil ?? warga.nilai_kesejahteraan,
          sumber_data: 'PENDAFTARAN MANDIRI',
          status_sinkronisasi: !dtksResult ? 'TERTUNDA' : dtksResult.status === 'MATCH' ? 'MATCH' : 'MISMATCH',
          tanggal_sinkronisasi: new Date(),
        },
      });

      return p;
    });

    // Notifications
    const { sendTelegramNotification } = await import('@/lib/telegram');
    const { sendWhatsappNotification } = await import('@/lib/fonnte');
    
    const statusMsg = statusVerifikasi === 'MATCH' 
      ? 'Verifikasi awal berhasil. Data Anda masuk ke antrian verifikasi.' 
      : 'Sinkronisasi DTKS gagal. Silakan ajukan sanggahan jika data Anda benar.';
    
    if (newPenerima.nomor_telepon) {
      await sendWhatsappNotification(newPenerima.nomor_telepon, statusMsg);
    }
    await sendTelegramNotification(`🆕 Pendaftar Baru: ${newPenerima.nama_lengkap} (${nik})`);

    return NextResponse.json({ message: 'Pendaftaran berhasil.', id: newPenerima.id }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Kesalahan server.' }, { status: 500 });
  }
}
