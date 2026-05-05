// src/app/api/penerima/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/crypto';
import { updatePenerimaSchema } from '@/lib/validators';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { sanitizeObject } from '@/lib/sanitizer';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id } = await params;
  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  try {
    const penerima = await prisma.tbl_penerima.findUnique({
      where: { id },
      include: {
        fotos: true,
        desil_data: { take: 1, orderBy: { tanggal_sinkronisasi: 'desc' } },
      },
    });

    if (!penerima) {
      return NextResponse.json({ message: 'Penerima tidak ditemukan.' }, { status: 404 });
    }

    // Decrypt sensitive fields
    const decryptedPenerima = {
      ...penerima,
      nik: decrypt(penerima.nik),
      fotos: penerima.fotos.map(foto => ({
        ...foto,
        url_foto: decrypt(foto.url_foto),
      })),
    };

    return NextResponse.json(decryptedPenerima, { status: 200 });
  } catch (error) {
    console.error('Error fetching single penerima:', error);
    return NextResponse.json({ message: 'Gagal mengambil data penerima.' }, { status: 500 });
  }
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
  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    const body = await req.json();
    const sanitizedBody = sanitizeObject(body);
    const parsed = updatePenerimaSchema.parse(sanitizedBody);
    const { nik, ...rest } = parsed;

    const dataToUpdate: Record<string, unknown> = {};
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) dataToUpdate[key] = value;
    });

    if (nik) {
      const encryptedNik = encrypt(nik);
      const allPenerima = await prisma.tbl_penerima.findMany({
        where: { id: { not: id } },
        select: { nik: true },
      });
      const duplicateNik = allPenerima.some((penerima) => {
        try {
          return decrypt(penerima.nik) === nik;
        } catch {
          return false;
        }
      });
      if (duplicateNik) {
        return NextResponse.json({ message: 'NIK sudah terdaftar.' }, { status: 409 });
      }
      dataToUpdate.nik = encryptedNik;
    }

    const updatedPenerima = await prisma.tbl_penerima.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nama_lengkap: true,
        nik: true,
      },
    });

    await writeAuditLog({
      userId: userId!,
      action: 'UPDATE_PENERIMA',
      description: `Memperbarui data penerima: ${updatedPenerima.nama_lengkap}`,
      note: `ID: ${updatedPenerima.id}`,
    });

    // Decrypt NIK for response
    const decryptedNik = decrypt(updatedPenerima.nik);

    return NextResponse.json({ ...updatedPenerima, nik: decryptedNik }, { status: 200 });
  } catch (error) {
    console.error('Error updating penerima:', error);
    return NextResponse.json({ message: 'Gagal memperbarui data penerima.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id } = await params;
  const authCheck = await checkRole(req, ['ADMINISTRATOR']); // Only admin can delete penerima
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    // Perform a soft delete or just delete if it's acceptable
    // For now, let's implement a hard delete if it's for cleanup/admin
    const deletedPenerima = await prisma.tbl_penerima.delete({
      where: { id },
      select: { nama_lengkap: true, nik: true },
    });

    await writeAuditLog({
      userId: userId!,
      action: 'DELETE_PENERIMA',
      description: `Menghapus penerima: ${deletedPenerima.nama_lengkap}`,
      note: `NIK: ${decrypt(deletedPenerima.nik)}`,
    });

    return NextResponse.json({ message: `Penerima ${deletedPenerima.nama_lengkap} berhasil dihapus.` }, { status: 200 });
  } catch (error) {
    console.error('Error deleting penerima:', error);
    return NextResponse.json({ message: 'Gagal menghapus data penerima.' }, { status: 500 });
  }
}
