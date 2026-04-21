// src/app/api/sanggahan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const sanggahanSchema = z.object({
  id_penerima: z.string().uuid({ message: 'ID Penerima tidak valid.' }),
  nama_pengaju: z.string().min(1, { message: 'Nama pengaju tidak boleh kosong.' }),
  isi_sanggahan: z.string().min(10, { message: 'Isi sanggahan terlalu pendek.' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = sanggahanSchema.parse(body);

    // Verify if id_penerima exists and is DISETUJUI
    const penerima = await prisma.tbl_penerima.findUnique({
      where: { id: validatedData.id_penerima },
      select: { id: true, status_verifikasi: true },
    });

    if (!penerima || penerima.status_verifikasi !== 'DISETUJUI') {
      return NextResponse.json({ message: 'Penerima tidak ditemukan atau belum disetujui.' }, { status: 404 });
    }

    const newSanggahan = await prisma.tbl_sanggahan.create({
      data: {
        id_penerima: validatedData.id_penerima,
        nama_pengaju: validatedData.nama_pengaju,
        isi_sanggahan: validatedData.isi_sanggahan,
        tanggal_sanggahan: new Date(),
        status_sanggahan: 'PENDING',
      },
    });

    return NextResponse.json(newSanggahan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi input gagal.', errors: error.errors }, { status: 400 });
    }
    console.error('Error submitting sanggahan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
