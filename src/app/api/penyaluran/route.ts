import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { Prisma, JenisBantuan, MetodePenyaluran, StatusPenyaluran, StatusVerifikasi } from '@prisma/client';
import { writeAuditLog } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { triggerPusherEvent } from '@/lib/pusher-server';
import { decrypt } from '@/lib/crypto';

import { prisma } from '@/lib/prisma';

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

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    const { id_penerima, jenis_bantuan, metode_penyaluran, nominal_bantuan, catatan, bukti_penyaluran } = await req.json();

    if (!id_penerima || !jenis_bantuan || !metode_penyaluran || nominal_bantuan === undefined) {
      return NextResponse.json({ message: 'Data penyaluran tidak lengkap.' }, { status: 400 });
    }

    // Validate enum values
    if (!Object.values(JenisBantuan).includes(jenis_bantuan)) {
      return NextResponse.json({ message: 'Jenis bantuan tidak valid.' }, { status: 400 });
    }
    if (!Object.values(MetodePenyaluran).includes(metode_penyaluran)) {
      return NextResponse.json({ message: 'Metode penyaluran tidak valid.' }, { status: 400 });
    }

    // BR-007: Penyaluran only for penerima with status DISETUJUI
    const penerima = await prisma.tbl_penerima.findUnique({
      where: { id: id_penerima },
      select: { status_verifikasi: true, nama_lengkap: true, nomor_telepon: true },
    });

    if (!penerima || penerima.status_verifikasi !== StatusVerifikasi.DISETUJUI) {
      return NextResponse.json(
        { message: 'Penyaluran hanya bisa dilakukan untuk penerima yang statusnya DISETUJUI.' },
        { status: 403 }
      );
    }

    const newPenyaluran = await prisma.tbl_penyaluran.create({
      data: {
        id_penerima,
        jenis_bantuan,
        metode_penyaluran,
        nominal_bantuan,
        catatan,
        bukti_penyaluran,
        tanggal_penyaluran: new Date(),
        status_penyaluran: StatusPenyaluran.DIPROSES, // Initial status
      },
    });

    await writeAuditLog({
      userId: userId!,
      action: 'PENYALURAN_MULAI',
      description: `Memulai proses penyaluran bantuan untuk ${penerima.nama_lengkap} (ID: ${id_penerima})`,
      note: `Jenis: ${jenis_bantuan}, Nominal: ${nominal_bantuan}`,
    });

    // Mock external bank API (always success after 2s for this prototype)
    setTimeout(async () => {
      const isSuccess = true;
      const finalStatus = StatusPenyaluran.BERHASIL;
      const finalCatatan = catatan || 'Penyaluran berhasil diproses oleh bank.';

      const updatedPenyaluran = await prisma.tbl_penyaluran.update({
        where: { id: newPenyaluran.id },
        data: {
          status_penyaluran: finalStatus,
          catatan: finalCatatan,
        },
      });

      // Send WhatsApp Notification to Citizen
      const { sendWhatsappNotification } = await import('@/lib/fonnte');
      if (penerima.nomor_telepon && penerima.nomor_telepon !== '0') {
        const message = `Halo ${penerima.nama_lengkap}, dana bantuan ${jenis_bantuan} sebesar Rp ${new Intl.NumberFormat('id-ID').format(Number(nominal_bantuan))} telah BERHASIL disalurkan melalui ${metode_penyaluran}. Silakan cek rekening atau tempat pengambilan Anda. Terima kasih.`;
        await sendWhatsappNotification(penerima.nomor_telepon, message);
      }

      await writeAuditLog({
        userId: userId!,
        action: 'PENYALURAN_SELESAI',
        description: `Proses penyaluran bantuan untuk ${penerima.nama_lengkap} (ID: ${id_penerima}) ${finalStatus}`,
        note: `Status: ${finalStatus}, Jenis: ${jenis_bantuan}, Nominal: ${nominal_bantuan}`,
      });

      // Pusher broadcast for real-time update
      await triggerPusherEvent('penyaluran-channel', 'penyaluran-update', {
        penyaluranId: updatedPenyaluran.id,
        status: updatedPenyaluran.status_penyaluran,
        catatan: updatedPenyaluran.catatan,
      });
      await triggerPusherEvent('dashboard-channel', 'penyaluran-update', {
        penyaluranId: updatedPenyaluran.id,
        status: updatedPenyaluran.status_penyaluran,
        catatan: updatedPenyaluran.catatan,
      });

      console.log(`Penyaluran ${updatedPenyaluran.id} updated to ${finalStatus}`);
    }, 2000); // 2-second delay

    // Initial response before mock bank API completes
    return NextResponse.json(newPenyaluran, { status: 202 }); // 202 Accepted for processing
  } catch (error) {
    console.error('Error during penyaluran process:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memulai penyaluran.' }, { status: 500 });
  }
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

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const status = searchParams.get('status') as StatusPenyaluran | null;
  const jenisBantuan = searchParams.get('jenisBantuan') as JenisBantuan | null;
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  const where: Prisma.tbl_penyaluranWhereInput = {};
  if (status) where.status_penyaluran = status;
  if (jenisBantuan) where.jenis_bantuan = jenisBantuan;
  if (search) {
    where.penerima = {
      OR: [
        { nama_lengkap: { contains: search } },
      ],
    };
  }

  try {
    const penyaluranRecords = await prisma.tbl_penyaluran.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        penerima: {
          select: {
            id: true,
            nik: true,
            nama_lengkap: true,
            status_verifikasi: true,
          },
        },
      },
    });

    const total = await prisma.tbl_penyaluran.count({ where });

    const processedRecords = penyaluranRecords.map((record) => ({
      ...record,
      penerima: {
        ...record.penerima,
        nik: decrypt(record.penerima.nik),
      },
    }));

    return NextResponse.json({ data: processedRecords, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching penyaluran records:', error);
    return NextResponse.json({ message: 'Gagal mengambil data penyaluran.' }, { status: 500 });
  }
}
