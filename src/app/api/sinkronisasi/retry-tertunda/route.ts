import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusSinkronisasi, StatusVerifikasi } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { decrypt } from '@/lib/crypto';
import { mockDtksSync } from '@/lib/dtks';

const prisma = new PrismaClient();

async function checkRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) {
    return { authorized: false, message: 'Unauthorized' };
  }
  if (!allowedRoles.includes(session.user.role)) {
    return { authorized: false, message: 'Forbidden: Insufficient role' };
  }
  return { authorized: true };
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(['ADMINISTRATOR', 'KEPALA_BIDANG']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedLimit = Number.parseInt(searchParams.get('limit') || '100', 10);
  const limit = Number.isNaN(requestedLimit) ? 100 : Math.min(Math.max(requestedLimit, 1), 500);

  const pendingRecords = await prisma.tbl_desil.findMany({
    where: { status_sinkronisasi: StatusSinkronisasi.TERTUNDA },
    orderBy: { tanggal_sinkronisasi: 'asc' },
    take: limit,
    include: {
      penerima: {
        select: {
          id: true,
          nama_lengkap: true,
          tanggal_lahir: true,
        },
      },
    },
  });

  const results: Array<{ id_desil: string; status: 'MATCH' | 'MISMATCH' | 'GAGAL'; note: string }> = [];

  for (const record of pendingRecords) {
    try {
      const nik = decrypt(record.nik);
      const dtksResult = await mockDtksSync({
        nik,
        nama: record.penerima.nama_lengkap,
        tanggal_lahir: record.penerima.tanggal_lahir,
      });

      const nextSinkronisasiStatus =
        dtksResult.status === 'MATCH' ? StatusSinkronisasi.MATCH : StatusSinkronisasi.MISMATCH;
      const nextVerifikasiStatus =
        dtksResult.status === 'MATCH' ? StatusVerifikasi.MATCH : StatusVerifikasi.MISMATCH;

      await prisma.$transaction([
        prisma.tbl_desil.update({
          where: { id: record.id },
          data: {
            status_sinkronisasi: nextSinkronisasiStatus,
            nilai_desil: dtksResult.desil ?? 0,
            tanggal_sinkronisasi: new Date(),
          },
        }),
        prisma.tbl_penerima.update({
          where: { id: record.id_penerima },
          data: { status_verifikasi: nextVerifikasiStatus },
        }),
      ]);

      results.push({
        id_desil: record.id,
        status: dtksResult.status,
        note: dtksResult.message || 'Sinkronisasi ulang berhasil.',
      });
    } catch (error) {
      results.push({
        id_desil: record.id,
        status: 'GAGAL',
        note: error instanceof Error ? error.message : 'Sinkronisasi ulang gagal',
      });
    }
  }

  return NextResponse.json(
    {
      message: 'Proses retry sinkronisasi tertunda selesai.',
      limit,
      totalDiproses: pendingRecords.length,
      totalBerhasil: results.filter((item) => item.status !== 'GAGAL').length,
      totalGagal: results.filter((item) => item.status === 'GAGAL').length,
      results,
    },
    { status: 200 }
  );
}
