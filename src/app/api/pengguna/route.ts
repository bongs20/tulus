// src/app/api/pengguna/route.ts
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

// Zod schema for user creation
const createUserSchema = z.object({
  username: z.string().min(3, { message: 'Username minimal 3 karakter.' }).max(20, { message: 'Username maksimal 20 karakter.' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter.' }),
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap tidak boleh kosong.' }),
  role: z.enum([Role.ADMINISTRATOR, Role.KEPALA_BIDANG, Role.PETUGAS_VERIFIKATOR]),
});

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(req, ['ADMINISTRATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { nama_lengkap: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const users = await prisma.tbl_pengguna.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        nama_lengkap: true,
        role: true,
        status_akun: true,
        login_attempts: true,
        locked_until: true,
        created_at: true,
      },
    });

    const total = await prisma.tbl_pengguna.count({ where });

    return NextResponse.json({ data: users, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(req, ['ADMINISTRATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    const { username, password, nama_lengkap, role } = sanitizedData;

    // Check if username already exists
    const existingUser = await prisma.tbl_pengguna.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Username sudah digunakan.' }, { status: 409 });
    }

    const password_hash = await hash(password, 12);

    const newUser = await prisma.tbl_pengguna.create({
      data: {
        username,
        password_hash,
        nama_lengkap,
        role,
        status_akun: 'AKTIF',
      },
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
      action: 'CREATE_USER',
      description: `Membuat pengguna baru: ${newUser.username}`,
      note: `Nama: ${newUser.nama_lengkap}, Role: ${newUser.role}`,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi input gagal.', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Gagal membuat pengguna baru.' }, { status: 500 });
  }
}
