
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { writeAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'KEPALA_BIDANG') {
    return NextResponse.json({ message: 'Hanya Kepala Bidang yang dapat menambah dana.' }, { status: 403 });
  }

  try {
    const { nominal } = await req.json();
    if (!nominal || isNaN(Number(nominal)) || Number(nominal) <= 0) {
      return NextResponse.json({ message: 'Nominal tidak valid.' }, { status: 400 });
    }

    const currentSettings = await prisma.tbl_pengaturan.findUnique({
      where: { id: 'global_settings' },
    });

    const currentBudget = Number(currentSettings?.total_anggaran || 0);
    const newBudget = currentBudget + Number(nominal);

    const updated = await prisma.tbl_pengaturan.update({
      where: { id: 'global_settings' },
      data: { total_anggaran: newBudget },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: 'UPDATE_BUDGET',
      description: `Menambah dana bantuan sebesar Rp ${Number(nominal).toLocaleString('id-ID')}`,
      note: `Total anggaran baru: Rp ${newBudget.toLocaleString('id-ID')}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json({ message: 'Gagal memperbarui anggaran.' }, { status: 500 });
  }
}
