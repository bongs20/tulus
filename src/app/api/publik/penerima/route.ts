// src/app/api/publik/penerima/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusVerifikasi } from '@prisma/client';
import { decrypt } from '@/lib/crypto'; // Import decrypt function
import { applyRateLimiter } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || ''; // Search by nama or kecamatan (alamat)

  const skip = (page - 1) * limit;

  try {
    const approvedPenerima = await prisma.tbl_penerima.findMany({
      where: { status_verifikasi: StatusVerifikasi.DISETUJUI },
      select: {
        id: true,
        nama_lengkap: true,
        nik: true,
        alamat: true,
        penyaluran: {
          where: { status_penyaluran: 'BERHASIL' },
          select: { jenis_bantuan: true },
          distinct: ['jenis_bantuan'],
        },
        fotos: {
          select: {
            id: true,
            url_foto: true,
            nama_file: true,
          },
        },
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    const normalizedSearch = search.trim().toLowerCase();
    const filteredPenerima = normalizedSearch
      ? approvedPenerima.filter((penerima) => {
          const decryptedNik = decrypt(penerima.nik).toLowerCase();
          return (
            penerima.nama_lengkap.toLowerCase().includes(normalizedSearch) ||
            penerima.alamat.toLowerCase().includes(normalizedSearch) ||
            decryptedNik.includes(normalizedSearch)
          );
        })
      : approvedPenerima;

    const total = filteredPenerima.length;
    const paginatedPenerima = filteredPenerima.slice(skip, skip + limit);

    const processedPenerima = paginatedPenerima.map((penerima) => {
      const decryptedNik = decrypt(penerima.nik);
      const maskedNik = `${decryptedNik.substring(0, 6)}****${decryptedNik.substring(10, 14)}`; // Example masking
      
      const decryptedFotos = penerima.fotos.map(foto => ({
        ...foto,
        url_foto: decrypt(foto.url_foto),
      }));

      return {
        ...penerima,
        nik: maskedNik,
        kecamatan: penerima.alamat ? penerima.alamat.split(',')[0].trim() : 'N/A',
        programs: penerima.penyaluran.map(s => s.jenis_bantuan).join(', '),
        fotos: decryptedFotos,
      };
    });

    return NextResponse.json({ data: processedPenerima, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching public penerima data:', error);
    return NextResponse.json({ message: 'Gagal mengambil data publik.' }, { status: 500 });
  }
}
