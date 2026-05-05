// src/app/api/sanggahan/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { sanitizeObject } from '@/lib/sanitizer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const sanggahanSchema = z.object({
  id_penerima: z.string().uuid({ message: 'ID Penerima tidak valid.' }),
  nama_pengaju: z.string().min(1, { message: 'Nama pengaju tidak boleh kosong.' }),
  isi_sanggahan: z.string().min(10, { message: 'Isi sanggahan terlalu pendek.' }),
  nomor_telepon: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validatedData = sanggahanSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    // Verify if id_penerima exists
    const penerima = await prisma.tbl_penerima.findUnique({
      where: { id: sanitizedData.id_penerima },
      select: { id: true, status_verifikasi: true },
    });

    if (!penerima) {
      return NextResponse.json({ message: 'Penerima tidak ditemukan.' }, { status: 404 });
    }

    const newSanggahan = await prisma.tbl_sanggahan.create({
      data: {
        id_penerima: sanitizedData.id_penerima,
        nama_pengaju: sanitizedData.nama_pengaju,
        isi_sanggahan: sanitizedData.isi_sanggahan,
        nomor_telepon: sanitizedData.nomor_telepon,
        tanggal_sanggahan: new Date(),
        status_sanggahan: 'PENDING',
      },
    });

    return NextResponse.json(newSanggahan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi input gagal.', errors: error.issues }, { status: 400 });
    }
    console.error('Error submitting sanggahan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  try {
    const where: Prisma.tbl_sanggahanWhereInput = {};
    if (status && Object.values(StatusSanggahan).includes(status as StatusSanggahan)) {
      where.status_sanggahan = status as StatusSanggahan;
    }

    const sanggahanList = await prisma.tbl_sanggahan.findMany({
      where,
      include: {
        penerima: {
          select: {
            nama_lengkap: true,
            nik: true,
          },
        },
      },
      orderBy: { tanggal_sanggahan: 'desc' },
    });

    return NextResponse.json(sanggahanList);
  } catch (error) {
    console.error('Error fetching sanggahan list:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
