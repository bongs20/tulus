// src/app/api/laporan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, JenisBantuan, StatusPenyaluran } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ExcelJS from 'exceljs';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { applyRateLimiter } from '@/lib/rate-limiter';

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
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const periode = searchParams.get('periode'); // YYYY-MM format
  const jenisBantuan = searchParams.get('jenisBantuan') as JenisBantuan | null;
  const wilayah = searchParams.get('wilayah'); // Not yet implemented in schema, will be a placeholder for filtering
  const exportType = searchParams.get('export') as 'pdf' | 'excel' | null;

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (periode) {
    try {
      const parsedDate = parseISO(`${periode}-01`); // Parse YYYY-MM to first day of month
      startDate = startOfMonth(parsedDate);
      endDate = endOfMonth(parsedDate);
    } catch (e) {
      return NextResponse.json({ message: 'Format periode tidak valid (YYYY-MM).' }, { status: 400 });
    }
  }

  const whereClause: any = {
    tanggal_penyaluran: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (jenisBantuan) whereClause.jenis_bantuan = jenisBantuan;
  // if (wilayah) whereClause.penerima.alamat.contains = wilayah; // Requires address parsing or separate field

  try {
    const totalPenerima = await prisma.tbl_penerima.count({
      where: {
        penyaluran: {
          some: {
            ...whereClause,
            status_penyaluran: StatusPenyaluran.BERHASIL,
          },
        },
      },
    });

    const totalAnggaranResult = await prisma.tbl_penyaluran.aggregate({
      _sum: {
        nominal_bantuan: true,
      },
      where: {
        ...whereClause,
        status_penyaluran: StatusPenyaluran.BERHASIL,
      },
    });
    const totalAnggaran = totalAnggaranResult._sum.nominal_bantuan?.toNumber() || 0;

    const totalTersalurkanCount = await prisma.tbl_penyaluran.count({
      where: {
        ...whereClause,
        status_penyaluran: StatusPenyaluran.BERHASIL,
      },
    });

    const totalDitolakCount = await prisma.tbl_penyaluran.count({
      where: {
        ...whereClause,
        status_penyaluran: StatusPenyaluran.GAGAL,
      },
    });

    const totalProsesCount = await prisma.tbl_penyaluran.count({
        where: {
          ...whereClause,
          status_penyaluran: StatusPenyaluran.DIPROSES,
        },
      });

    const totalPenyaluranOverall = await prisma.tbl_penyaluran.count({
        where: whereClause,
    });


    const percentTersalurkan = totalPenyaluranOverall > 0
      ? (totalTersalurkanCount / totalPenyaluranOverall) * 100
      : 0;

    const programBreakdown = await prisma.tbl_penyaluran.groupBy({
      by: ['jenis_bantuan'],
      _count: {
        id: true,
      },
      _sum: {
        nominal_bantuan: true,
      },
      where: {
        ...whereClause,
        status_penyaluran: StatusPenyaluran.BERHASIL,
      },
      orderBy: {
        jenis_bantuan: 'asc',
      },
    });

    const reportData = {
      periode: periode || 'Semua Waktu',
      jenisBantuan: jenisBantuan || 'Semua',
      wilayah: wilayah || 'Semua',
      totalPenerima,
      totalAnggaran,
      totalTersalurkanCount,
      totalDitolakCount,
      percentTersalurkan,
      programBreakdown,
    };

    if (exportType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Penyaluran Bantuan');

      // Add report header
      worksheet.addRow(['Laporan Penyaluran Bantuan TULUS']);
      worksheet.mergeCells('A1:C1');
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.addRow([]);

      // Add filters info
      worksheet.addRow(['Periode:', reportData.periode]);
      worksheet.addRow(['Jenis Bantuan:', reportData.jenisBantuan]);
      worksheet.addRow(['Wilayah:', reportData.wilayah]);
      worksheet.addRow([]);

      // Add KPI data
      worksheet.addRow(['Total Penerima:', reportData.totalPenerima]);
      worksheet.addRow(['Total Anggaran Tersalurkan:', totalAnggaran]);
      worksheet.addRow(['Total Penyaluran Berhasil:', reportData.totalTersalurkanCount]);
      worksheet.addRow(['Total Penyaluran Gagal:', reportData.totalDitolakCount]);
      worksheet.addRow(['% Tersalurkan:', `${reportData.percentTersalurkan.toFixed(2)}%`]);
      worksheet.addRow([]);

      // Add Program Breakdown
      worksheet.addRow(['Ringkasan Per Program']);
      worksheet.getCell('A10').font = { bold: true };
      worksheet.addRow(['Jenis Bantuan', 'Jumlah Penyaluran', 'Total Nominal']);
      worksheet.getRow(11).font = { bold: true };

      programBreakdown.forEach((item) => {
        worksheet.addRow([item.jenis_bantuan, item._count.id, item._sum.nominal_bantuan?.toNumber() || 0]);
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan_penyaluran_${periode || 'all'}.xlsx"`,
        },
      });
    } else if (exportType === 'pdf') {
      return NextResponse.json(
        { message: 'Ekspor PDF belum tersedia pada build ini.' },
        { status: 501 }
      );
    }

    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    console.error('Error fetching laporan:', error);
    return NextResponse.json({ message: 'Gagal mengambil data laporan.' }, { status: 500 });
  }
}
