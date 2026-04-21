// src/app/api/verifikasi/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusVerifikasi } from '@prisma/client';
import { getServerSession } from 'next-auth'; // For role check
import { authOptions } from '@/lib/auth'; // Assuming authOptions will be defined here or imported
import { writeAuditLog } from '@/lib/audit';
import { sendSms } from '@/lib/sms';

const prisma = new PrismaClient();

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
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { status, catatan } = await req.json();

  // Role check (PETUGAS_VERIFIKATOR only)
  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'PETUGAS_VERIFIKATOR']); // Admin can also verify
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  if (!Object.values(StatusVerifikasi).includes(status)) {
    return NextResponse.json({ message: 'Status verifikasi tidak valid.' }, { status: 400 });
  }

  try {
    const updatedPenerima = await prisma.tbl_penerima.update({
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
      note: `Status diubah menjadi ${status}. Catatan: ${catatan || 'Tidak ada catatan.'}`,
    });

    // Send SMS notification
    const smsMessage = `Permohonan bantuan Anda untuk ${updatedPenerima.nama_lengkap} telah ${status.toLowerCase()}. Catatan: ${catatan || 'Tidak ada.'}`;
    // Ensure nomor_telepon is not '0' or empty before sending
    if (updatedPenerima.nomor_telepon && updatedPenerima.nomor_telepon !== '0') {
      await sendSms(updatedPenerima.nomor_telepon, smsMessage);
    } else {
      console.warn(`SMS not sent for ${updatedPenerima.nama_lengkap} due to invalid phone number: ${updatedPenerima.nomor_telepon}`);
    }


    // TODO: Broadcast via Pusher channel "dashboard" event "verifikasi-update"

    return NextResponse.json(updatedPenerima, { status: 200 });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return NextResponse.json({ message: 'Gagal memperbarui status verifikasi.' }, { status: 500 });
  }
}
