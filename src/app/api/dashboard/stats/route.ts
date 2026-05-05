// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusVerifikasi, StatusPenyaluran } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { decrypt } from '@/lib/crypto';

const prisma = new PrismaClient();

async function checkRole(req: NextRequest, allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.role) {
    return { authorized: false, message: 'Unauthorized' };
  }
  if (!allowedRoles.includes(session.user.role)) {
    return { authorized: false, message: 'Forbidden: Insufficient role' };
  }
  return { authorized: true, user: session.user };
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  try {
    const toSafeNumber = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber: unknown }).toNumber === 'function') {
        return (value as { toNumber: () => number }).toNumber();
      }
      return 0;
    };

    // 1. Total Masuk (all penerima records)
    const total_masuk = await prisma.tbl_penerima.count();

    // 2. Lolos Awal (penerima with status MATCH)
    const lolos_awal = await prisma.tbl_penerima.count({
      where: { status_verifikasi: StatusVerifikasi.MATCH },
    });

    // 3. Disetujui (penerima with status DISETUJUI)
    const disetujui = await prisma.tbl_penerima.count({
      where: { status_verifikasi: StatusVerifikasi.DISETUJUI },
    });

    // 4. Tersalurkan (penyaluran with status BERHASIL)
    const tersalurkan = await prisma.tbl_penyaluran.count({
      where: { status_penyaluran: StatusPenyaluran.BERHASIL },
    });

    // 5. Per program breakdown
    const per_program = await prisma.tbl_penyaluran.groupBy({
      by: ['jenis_bantuan'],
      _count: {
        id: true,
      },
      _sum: {
        nominal_bantuan: true,
      },
    });

    // 6. Monthly trend of penyaluran (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5); // Go back 5 months to include current month

    const monthly_trend = await prisma.tbl_penyaluran.groupBy({
      by: ['tanggal_penyaluran'],
      _count: {
        id: true,
      },
      _sum: {
        nominal_bantuan: true,
      },
      where: {
        tanggal_penyaluran: {
          gte: sixMonthsAgo,
          lte: now,
        },
        status_penyaluran: StatusPenyaluran.BERHASIL, // Only successful penyaluran
      },
      orderBy: {
        tanggal_penyaluran: 'asc',
      },
    });

    // Format monthly trend data to be more chart-friendly
    const formattedMonthlyTrend = monthly_trend.map((item) => ({
      month: item.tanggal_penyaluran.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
      count: item._count.id,
      sum: toSafeNumber(item._sum.nominal_bantuan),
    }));

    // Funnel chart data (e.g., from total_masuk to tersalurkan)
    const funnel_data = [
      { name: 'Total Masuk', value: total_masuk },
      { name: 'Lolos Awal (DTKS Match)', value: lolos_awal },
      { name: 'Disetujui Verifikasi', value: disetujui },
      { name: 'Tersalurkan', value: tersalurkan },
    ];

    // Calculate total distributed amount for budget subtraction
    const total_distributed_aggregate = await prisma.tbl_penyaluran.aggregate({
      where: { status_penyaluran: StatusPenyaluran.BERHASIL },
      _sum: {
        nominal_bantuan: true,
      },
    });
    const total_distributed = toSafeNumber(total_distributed_aggregate._sum.nominal_bantuan);
    
    // Fetch budget from settings
    const settings = await prisma.tbl_pengaturan.findUnique({
      where: { id: 'global_settings' },
    });
    const initial_budget = toSafeNumber(settings?.total_anggaran || 3000000000);
    const remaining_budget = initial_budget - total_distributed;

    // Recent data table (last 10 entries of successful penyaluran)
    const recent_penyaluran = await prisma.tbl_penyaluran.findMany({
      where: { status_penyaluran: StatusPenyaluran.BERHASIL },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        penerima: {
          select: {
            nama_lengkap: true,
            nik: true,
          },
        },
      },
    });

    const formattedRecentPenyaluran = recent_penyaluran.map((item) => ({
      ...item,
      penerima: {
        ...item.penerima,
        nik: decrypt(item.penerima.nik),
      },
    }));

    return NextResponse.json({
      total_masuk,
      lolos_awal,
      disetujui,
      tersalurkan,
      total_anggaran: remaining_budget,
      per_program,
      monthly_trend: formattedMonthlyTrend,
      funnel_data,
      recent_penyaluran: formattedRecentPenyaluran,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Gagal mengambil data dashboard.' }, { status: 500 });
  }
}
