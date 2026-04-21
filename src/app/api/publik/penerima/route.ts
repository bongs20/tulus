// src/app/api/publik/penerima/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusVerifikasi } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || ''; // Search by nama or kecamatan (alamat)

  const skip = (page - 1) * limit;

  const where: any = {
    status_verifikasi: StatusVerifikasi.DISETUJUI,
  };

  if (search) {
    where.OR = [
      { nama_lengkap: { contains: search, mode: 'insensitive' } },
      // For 'kecamatan' filtering, assuming 'alamat' contains kecamatan info
      // In a real app, this would be a structured field
      { alamat: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const publicPenerima = await prisma.tbl_penerima.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        nama_lengkap: true,
        nik: true, // Will be masked on client-side
        alamat: true, // To infer kecamatan
        penyaluran: {
          where: { status_penyaluran: 'BERHASIL' },
          select: { jenis_bantuan: true },
          distinct: ['jenis_bantuan'], // Get unique programs
        },
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    const total = await prisma.tbl_penerima.count({ where });

    // Mask NIK on server-side before sending to client
    const maskedPenerima = publicPenerima.map(penerima => ({
      ...penerima,
      nik: `${penerima.nik.substring(0, 6)}****${penerima.nik.substring(10, 14)}`, // Example masking: 327401****0001
      // Assuming 'kecamatan' can be extracted from 'alamat' for display
      kecamatan: penerima.alamat ? penerima.alamat.split(',')[0].trim() : 'N/A', // Simplified extraction
      programs: penerima.penyaluran.map(s => s.jenis_bantuan).join(', '),
    }));

    return NextResponse.json({ data: maskedPenerima, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching public penerima data:', error);
    return NextResponse.json({ message: 'Gagal mengambil data publik.' }, { status: 500 });
  }
}
