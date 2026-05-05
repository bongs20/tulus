import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { decrypt, encrypt } from '@/lib/crypto';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { ekonomiSchema, identitasSchema } from '@/lib/validators';

const prisma = new PrismaClient();
const WHATSAPP_ADMIN = '085157441531';

// We keep the GET handler as-is for the initial NIK check.
export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(req.url);
  const nik = searchParams.get('nik')?.trim();

  if (!nik || nik.length < 6 || nik.length > 16 || !/^\d+$/.test(nik)) {
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
        select: {
          nama_lengkap: true,
          wilayah: true,
          status_dtks: true,
          nilai_kesejahteraan: true,
        },
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
        message: 'NIK ini sudah terdaftar di sistem. Silakan cek status di portal publik atau tunggu proses berikutnya.',
      }, { status: 200 });
    }

    const warga = await prisma.tbl_warga.findFirst({
      where: { nik: encryptedNik },
      select: {
        nama_lengkap: true,
        wilayah: true,
        status_dtks: true,
        nilai_kesejahteraan: true,
        is_dalam_jangkauan: true,
      },
    });

    if (!warga) {
      return NextResponse.json({
        canRegister: false,
        isRegistered: false,
        status: 'HUBUNGI_ADMIN',
        nik,
        contactWhatsapp: WHATSAPP_ADMIN,
        message: `Data tidak ditemukan atau bukan warga sini. Silakan hubungi admin via WhatsApp ${WHATSAPP_ADMIN}.`,
      }, { status: 200 });
    }

    const canRegister = warga.is_dalam_jangkauan && warga.status_dtks !== 'LUAR_JANGKAUAN' && warga.status_dtks !== 'DATA_TIDAK_ADA';

    return NextResponse.json(canRegister
      ? {
          canRegister: true,
          isRegistered: false,
          status: 'BISA_DAFTAR',
          nik,
          nama_lengkap: warga.nama_lengkap,
          wilayah: warga.wilayah,
          status_dtks: warga.status_dtks,
          nilai_kesejahteraan: warga.nilai_kesejahteraan,
          contactWhatsapp: WHATSAPP_ADMIN,
          message: 'Warga terdeteksi di wilayah layanan. Silakan lanjutkan mengisi formulir pendaftaran.',
        }
      : {
          canRegister: false,
          isRegistered: false,
          status: 'HUBUNGI_ADMIN',
          nik,
          nama_lengkap: warga.nama_lengkap,
          wilayah: warga.wilayah,
          status_dtks: warga.status_dtks,
          nilai_kesejahteraan: warga.nilai_kesejahteraan,
          contactWhatsapp: WHATSAPP_ADMIN,
          message: warga.status_dtks === 'LUAR_JANGKAUAN'
              ? `Wilayah Anda di luar jangkauan layanan. Silakan hubungi admin via WhatsApp ${WHATSAPP_ADMIN}.`
              : `Data Anda belum lengkap di sistem. Silakan hubungi admin via WhatsApp ${WHATSAPP_ADMIN}.`,
        }, { status: 200 });

  } catch (error) {
    console.error('Error checking pendaftar eligibility:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}


const registrationSchema = identitasSchema.merge(ekonomiSchema).extend({
  url_foto: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await req.json();
  const validation = registrationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ message: 'Data yang dikirim tidak valid.', issues: validation.error.issues }, { status: 400 });
  }

  const { nik, url_foto, ...penerimaData } = validation.data;

  try {
    const encryptedNik = encrypt(nik);

    // --- Security Re-validation ---
    const warga = await prisma.tbl_warga.findFirst({ where: { nik: encryptedNik } });
    if (!warga || !warga.is_dalam_jangkauan || warga.status_dtks === 'LUAR_JANGKAUAN' || warga.status_dtks === 'DATA_TIDAK_ADA') {
      return NextResponse.json({ message: 'Warga tidak memenuhi syarat untuk mendaftar.' }, { status: 403 });
    }
    const alreadyRegistered = await prisma.tbl_penerima.findFirst({ where: { nik: encryptedNik } });
    if (alreadyRegistered) {
      return NextResponse.json({ message: 'NIK ini sudah terdaftar.' }, { status: 409 });
    }
    // --- End Security Re-validation ---

    const newPenerima = await prisma.$transaction(async (tx) => {
      const penerima = await tx.tbl_penerima.create({
        data: {
          ...penerimaData,
          nik: encryptedNik,
          keterangan_ekonomi: penerimaData.keterangan_ekonomi ?? `Registrasi mandiri. Nilai Kesejahteraan Awal: ${warga.nilai_kesejahteraan}`,
          status_verifikasi: 'MENUNGGU',
        },
      });

      if (url_foto && url_foto.length > 0) {
        await tx.tbl_foto.createMany({
          data: url_foto.map((url) => ({
            id_penerima: penerima.id,
            url_foto: encrypt(url),
            nama_file: url.substring(url.lastIndexOf('/') + 1) || 'uploaded_file',
          })),
        });
      }

      return penerima;
    });

    return NextResponse.json({
      message: 'Pendaftaran mandiri berhasil. Data Anda sudah tercatat dan menunggu evaluasi petugas.',
      penerimaId: newPenerima.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering pendaftar:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan pada server saat pendaftaran.' }, { status: 500 });
  }
}
