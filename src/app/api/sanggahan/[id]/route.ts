import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { StatusSanggahan, StatusVerifikasi } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { writeAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { sendWhatsappNotification } from '@/lib/fonnte';

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) return rateLimitResponse;

  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  const { id: sanggahanId } = await params;

  try {
    const { action } = await req.json(); // action: 'APPROVE' | 'REJECT'

    const sanggahan = await prisma.tbl_sanggahan.findUnique({
      where: { id: sanggahanId },
      include: { penerima: true },
    });

    if (!sanggahan) {
      return NextResponse.json({ message: 'Sanggahan tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // 1. Update sanggahan status
      await prisma.tbl_sanggahan.update({
        where: { id: sanggahanId },
        data: { status_sanggahan: StatusSanggahan.SELESAI },
      });

      // 2. Reset penerima status to MATCH so it can be re-verified (only if it exists)
      if (sanggahan.id_penerima) {
        await prisma.tbl_penerima.update({
          where: { id: sanggahan.id_penerima },
          data: { status_verifikasi: StatusVerifikasi.MATCH },
        });
      }

      // 3. Send WA notification if exists
      if (sanggahan.nomor_telepon) {
        const targetName = sanggahan.penerima?.nama_lengkap || `NIK: ${sanggahan.nik_pengaju}`;
        const message = `Halo ${sanggahan.nama_pengaju}, sanggahan/banding Anda untuk ${targetName} telah DITERIMA. Data akan segera ditinjau ulang oleh petugas. Terima kasih.`;
        await sendWhatsappNotification(sanggahan.nomor_telepon, message);
      }

      await writeAuditLog({
        userId: authCheck.user!.id,
        action: 'APPROVE_SANGGAHAN',
        description: `Menyetujui sanggahan dari ${sanggahan.nama_pengaju} untuk ${sanggahan.penerima?.nama_lengkap || sanggahan.nik_pengaju}`,
        note: `Status diproses. Notifikasi WA dikirim ke ${sanggahan.nomor_telepon || 'N/A'}.`,
      });

      return NextResponse.json({ message: 'Sanggahan disetujui.' });
    } else if (action === 'REJECT') {
      await prisma.tbl_sanggahan.update({
        where: { id: sanggahanId },
        data: { status_sanggahan: StatusSanggahan.SELESAI },
      });

      // Send WA notification if exists
      if (sanggahan.nomor_telepon) {
        const targetName = sanggahan.penerima?.nama_lengkap || `NIK: ${sanggahan.nik_pengaju}`;
        const message = `Halo ${sanggahan.nama_pengaju}, mohon maaf sanggahan/banding Anda untuk ${targetName} telah DITOLAK setelah ditinjau oleh petugas. Keputusan ini bersifat final.`;
        await sendWhatsappNotification(sanggahan.nomor_telepon, message);
      }

      await writeAuditLog({
        userId: authCheck.user!.id,
        action: 'REJECT_SANGGAHAN',
        description: `Menolak sanggahan dari ${sanggahan.nama_pengaju} untuk ${sanggahan.penerima?.nama_lengkap || sanggahan.nik_pengaju}`,
        note: `Notifikasi WA dikirim ke ${sanggahan.nomor_telepon || 'N/A'}.`,
      });

      return NextResponse.json({ message: 'Sanggahan ditolak.' });
    }

    return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('Error processing sanggahan:', error);
    return NextResponse.json({ message: 'Gagal memproses sanggahan.' }, { status: 500 });
  }
}
