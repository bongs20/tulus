// src/app/api/pengguna/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role, StatusAkun } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { hash } from 'bcryptjs';
import { z } from 'zod';
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

// Zod schema for user update
const updateUserSchema = z.object({
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap tidak boleh kosong.' }).optional(),
  role: z.enum([Role.ADMINISTRATOR, Role.KEPALA_BIDANG, Role.PETUGAS_VERIFIKATOR]).optional(),
  status_akun: z.enum([StatusAkun.AKTIF, StatusAkun.NONAKTIF, StatusAkun.TERKUNCI]).optional(),
  password: z.string().min(8, { message: 'Password minimal 8 karakter.' }).optional().or(z.literal('')), // Optional password update
});


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id } = await params;
  const authCheck = await checkRole(req, ['ADMINISTRATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);
    let { password, ...dataToUpdate } = sanitizedData;

    // Hash new password if provided
    if (password && password.length > 0) {
      (dataToUpdate as any).password_hash = await hash(password, 12);
    }

    const updatedUser = await prisma.tbl_pengguna.update({
      where: { id: id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        nama_lengkap: true,
        role: true,
        status_akun: true,
      },
    });

    await writeAuditLog({
      userId: userId!,
      action: 'UPDATE_USER',
      description: `Memperbarui pengguna: ${updatedUser.username}`,
      note: `Perubahan: ${JSON.stringify(dataToUpdate)}`,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi input gagal.', errors: error.issues }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Gagal memperbarui pengguna.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id } = await params;
  const authCheck = await checkRole(req, ['ADMINISTRATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    // Prevent admin from deleting themselves
    if (userId === id) {
      return NextResponse.json({ message: 'Tidak dapat menonaktifkan akun Anda sendiri.' }, { status: 403 });
    }

    // Soft delete by setting status_akun to NONAKTIF
    const deactivatedUser = await prisma.tbl_pengguna.update({
      where: { id: id },
      data: {
        status_akun: StatusAkun.NONAKTIF,
      },
      select: {
        id: true,
        username: true,
        nama_lengkap: true,
      },
    });

    await writeAuditLog({
      userId: userId!,
      action: 'DEACTIVATE_USER',
      description: `Menonaktifkan pengguna: ${deactivatedUser.username}`,
      note: `Akun diubah status menjadi NONAKTIF.`,
    });

    return NextResponse.json({ message: `Pengguna ${deactivatedUser.username} berhasil dinonaktifkan.` }, { status: 200 });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ message: 'Gagal menonaktifkan pengguna.' }, { status: 500 });
  }
}
