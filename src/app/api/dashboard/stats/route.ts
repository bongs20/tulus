// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusVerifikasi, StatusPenyaluran, JenisBantuan } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  try {
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
      sum: item._sum.nominal_bantuan?.toNumber() || 0, // Convert Decimal to number
    }));

    // Funnel chart data (e.g., from total_masuk to tersalurkan)
    const funnel_data = [
      { name: 'Total Masuk', value: total_masuk },
      { name: 'Lolos Awal (DTKS Match)', value: lolos_awal },
      { name: 'Disetujui Verifikasi', value: disetujui },
      { name: 'Tersalurkan', value: tersalurkan },
    ];

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

    return NextResponse.json({
      total_masuk,
      lolos_awal,
      disetujui,
      tersalurkan,
      per_program,
      monthly_trend: formattedMonthlyTrend,
      funnel_data,
      recent_penyaluran,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Gagal mengambil data dashboard.' }, { status: 500 });
  }
}
