// src/app/api/verifikasi/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusVerifikasi } from '@prisma/client';
import { getServerSession } from 'next-auth'; // For role check
import { authOptions } from '@/lib/auth'; // Assuming authOptions will be defined here or imported
import { writeAuditLog } from '@/lib/audit';
import { sendWhatsappNotification } from '@/lib/fonnte';
import { sendTelegramNotification } from '@/lib/telegram';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { sanitize } from '@/lib/sanitizer';
import { triggerPusherEvent } from '@/lib/pusher-server';

const getPrisma = () => new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Placeholder for authOptions, will be defined in src/lib/auth.ts
// For now, directly check session for role.
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


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id } = await params;
  const { status, catatan } = await req.json();
  const sanitizedCatatan = sanitize(catatan);

  // Role check (PETUGAS_VERIFIKATOR only)
  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'PETUGAS_VERIFIKATOR']); // Admin can also verify
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  if (![StatusVerifikasi.DISETUJUI, StatusVerifikasi.DITOLAK].includes(status)) {
    return NextResponse.json({ message: 'Status verifikasi harus DISETUJUI atau DITOLAK.' }, { status: 400 });
  }

  if (!sanitizedCatatan || !String(sanitizedCatatan).trim()) {
    return NextResponse.json({ message: 'Catatan alasan verifikasi wajib diisi.' }, { status: 400 });
  }

  try {
    const currentPenerima = await getPrisma().tbl_penerima.findUnique({
      where: { id },
      select: { status_verifikasi: true },
    });

    if (!currentPenerima) {
      return NextResponse.json({ message: 'Data penerima tidak ditemukan.' }, { status: 404 });
    }

    if (currentPenerima.status_verifikasi !== StatusVerifikasi.MATCH) {
      return NextResponse.json({ message: 'Data belum lolos verifikasi awal (MATCH), tidak dapat diverifikasi faktual.' }, { status: 409 });
    }

    const updatedPenerima = await getPrisma().tbl_penerima.update({
      where: { id: id },
      data: {
        status_verifikasi: status,
      },
      select: {
        id: true,
        nama_lengkap: true,
        nomor_telepon: true,
        status_verifikasi: true,
      }
    });

    // Write audit log
    await writeAuditLog({
      userId: userId!,
      action: 'VERIFIKASI',
      description: `Verifikasi penerima ${updatedPenerima.nama_lengkap} (ID: ${updatedPenerima.id})`,
      note: `Status diubah menjadi ${status}. Catatan: ${sanitizedCatatan || 'Tidak ada catatan.'}`,
    });

    // Send Notifications
    const msg = `Permohonan bantuan Anda untuk ${updatedPenerima.nama_lengkap} telah ${status.toLowerCase()}. Catatan: ${sanitizedCatatan || 'Tidak ada.'}`;
    // Ensure nomor_telepon is not '0' or empty before sending
    if (updatedPenerima.nomor_telepon && updatedPenerima.nomor_telepon !== '0') {
      await sendWhatsappNotification(updatedPenerima.nomor_telepon, msg);
    }
    
    // Kirim monitoring ke admin
    await sendTelegramNotification(`📝 *HASIL VERIFIKASI*\nNama: ${updatedPenerima.nama_lengkap}\nStatus: ${status}\nCatatan: ${sanitizedCatatan}`);


    await triggerPusherEvent('dashboard-channel', 'verifikasi-update', {
      penerimaId: updatedPenerima.id,
      nama_lengkap: updatedPenerima.nama_lengkap,
      status: updatedPenerima.status_verifikasi,
    });

    return NextResponse.json(updatedPenerima, { status: 200 });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return NextResponse.json({ message: 'Gagal memperbarui status verifikasi.' }, { status: 500 });
  }
}
