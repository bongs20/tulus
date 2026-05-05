import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { Prisma, StatusVerifikasi, StatusPenyaluran } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/crypto';
import { z } from 'zod';
import { applyRateLimiter } from '@/lib/rate-limiter';
import { sanitizeObject } from '@/lib/sanitizer';
import { createPenerimaSchema } from '@/lib/validators';
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

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Allow all authenticated users to read penerima list for now,
  // specific role checks can be added if needed for certain views.
  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const status = searchParams.get('status') as StatusVerifikasi | undefined;
  const search = searchParams.get('search') || '';
  const excludeDisalurkan = searchParams.get('excludeDisalurkan') === 'true';

  const skip = (page - 1) * limit;

  const where: Prisma.tbl_penerimaWhereInput = {};
  if (status) where.status_verifikasi = status;

  if (excludeDisalurkan) {
    where.penyaluran = {
      none: {
        OR: [
          { status_penyaluran: 'BERHASIL' },
          { status_penyaluran: 'DIPROSES' }
        ]
      },
    };
  }

  if (search) {
    const isNikSearch = /^\d+$/.test(search);
    
    if (isNikSearch) {
      // Deterministic encryption allows searching by exact NIK match
      where.nik = { equals: encrypt(search) };
    } else {
      where.nama_lengkap = { contains: search };
    }
  }

  try {
    const penerimaRecords = await prisma.tbl_penerima.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        fotos: true, // Include photos for detail view
        desil_data: { take: 1, orderBy: { tanggal_sinkronisasi: 'desc' } }, // Latest desil data
        sanggahan: { orderBy: { tanggal_sanggahan: 'desc' } }, // Include sanggahan
      },
    });

    const total = await prisma.tbl_penerima.count({ where });

    // Decrypt NIK and photo URLs for all records
    const decryptedPenerima = penerimaRecords.map(p => ({
      ...p,
      nik: decrypt(p.nik),
      fotos: p.fotos.map(foto => ({
        ...foto,
        url_foto: decrypt(foto.url_foto),
      })),
    }));

    return NextResponse.json({ data: decryptedPenerima, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching penerima records:', error);
    return NextResponse.json({ message: 'Gagal mengambil data penerima.' }, { status: 500 });
  }
}

// POST endpoint for creating new penerima.
// This is typically called after the 4-step form is completed.
export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
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
    const sanitizedBody = sanitizeObject(body);
    const parsed = createPenerimaSchema.parse({
      ...sanitizedBody,
      url_foto: Array.isArray(sanitizedBody.url_foto)
        ? sanitizedBody.url_foto
        : Array.isArray(sanitizedBody.url_fotos)
          ? sanitizedBody.url_fotos
          : [],
    });

    const {
      nik,
      nama_lengkap,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      nomor_telepon,
      jumlah_anggota_keluarga,
      jenis_pekerjaan,
      status_kepemilikan_rumah,
      keterangan_ekonomi,
      url_foto,
    } = parsed;

    // Encrypt sensitive fields
    const encryptedNik = encrypt(nik);
    const encryptedFotoUrls = url_foto.map((url: string) => encrypt(url));

    const existingPenerima = await prisma.tbl_penerima.findMany({
      select: { id: true, nik: true },
    });
    const duplicateNik = existingPenerima.some((penerima) => {
      try {
        return decrypt(penerima.nik) === nik;
      } catch {
        return false;
      }
    });
    if (duplicateNik) {
      return NextResponse.json({ message: 'NIK sudah terdaftar.' }, { status: 409 });
    }

    const newPenerima = await prisma.tbl_penerima.create({
      data: {
        nik: encryptedNik,
        nama_lengkap,
        tanggal_lahir,
        jenis_kelamin,
        alamat,
        nomor_telepon,
        jumlah_anggota_keluarga,
        jenis_pekerjaan,
        status_kepemilikan_rumah,
        keterangan_ekonomi,
        status_verifikasi: StatusVerifikasi.MENUNGGU,
        fotos: {
          create: encryptedFotoUrls.map((url: Buffer) => ({
            url_foto: url,
            nama_file: `foto-${nik}-${Date.now()}.jpg`, // Generic name
          })),
        },
        desil_data: {
          create: {
            nik: encryptedNik,
            nilai_desil: 0,
            sumber_data: 'INPUT ADMIN',
            status_sinkronisasi: 'TERTUNDA',
            tanggal_sinkronisasi: new Date(),
          },
        },
      },
    });

    await writeAuditLog({
      userId: userId!,
      action: 'CREATE_PENERIMA',
      description: `Menambahkan penerima baru: ${nama_lengkap}`,
      note: `NIK: ${nik}`,
    });

    return NextResponse.json(newPenerima, { status: 201 });
  } catch (error) {
    console.error('Error creating penerima:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi input gagal.', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Gagal membuat data penerima baru.' }, { status: 500 });
  }
}
