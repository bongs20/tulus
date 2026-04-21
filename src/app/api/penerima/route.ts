// src/app/api/penerima/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, JenisKelamin, StatusVerifikasi } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/crypto';
import { identitasSchema } from '@/lib/validators'; // Use existing schema for validation
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

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any);
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

  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status_verifikasi = status;
  if (search) {
    // Search encrypted NIK (will require decryption for comparison) or unencrypted nama_lengkap
    // For encrypted fields, direct 'contains' is not possible. A more advanced search would involve
    // decrypting all NIKs, searching, then re-encrypting. For simplicity, will search unencrypted fields.
    // If NIK search is critical, it would require a separate lookup or a different encryption strategy.
    // For now, assume search is primarily on nama_lengkap.
    // For encrypted NIK, if search by NIK is needed, it would look like:
    // 1. Fetch all penerima
    // 2. Decrypt all NIKs
    // 3. Filter client-side. This is not scalable for large datasets.
    // A proper solution for encrypted search often involves searchable encryption or partial encryption.
    where.OR = [
      { nama_lengkap: { contains: search, mode: 'insensitive' } },
      // To search NIKs: Fetch all, decrypt, filter (not performant).
      // For this implementation, NIK search will rely on exact match after decryption from frontend.
      // Or we can add an unencrypted, indexed NIK hash for quick lookup if full NIK is encrypted.
    ];
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
  const rateLimitResponse = applyRateLimiter(req as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authCheck = await checkRole(req, ['ADMINISTRATOR', 'PETUGAS_VERIFIKATOR']);
  if (!authCheck.authorized) {
    return NextResponse.json({ message: authCheck.message }, { status: 403 });
  }
  const userId = authCheck.user?.id;

  try {
    const body = await req.json();
    const sanitizedBody = sanitizeObject(body);
    // Validate using the identitasSchema, but it's for form, not direct API input.
    // Need to ensure the full expected data structure is present.
    // For simplicity, I'll manually check required fields for now.
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
      url_fotos, // Array of URLs from FormUploadFoto
    } = sanitizedBody;

    // Basic validation
    if (!nik || !nama_lengkap || !tanggal_lahir || !jenis_kelamin || !alamat || !nomor_telepon || !jumlah_anggota_keluarga) {
      return NextResponse.json({ message: 'Data identitas tidak lengkap.' }, { status: 400 });
    }

    // Encrypt sensitive fields
    const encryptedNik = encrypt(nik);
    const encryptedFotoUrls = url_fotos ? url_fotos.map((url: string) => encrypt(url)) : [];

    // Check for duplicate NIK before creating (with encryption)
    const existingPenerima = await prisma.tbl_penerima.findUnique({
      where: { nik: encryptedNik },
    });
    if (existingPenerima) {
      return NextResponse.json({ message: 'NIK sudah terdaftar.' }, { status: 409 });
    }

    const newPenerima = await prisma.tbl_penerima.create({
      data: {
        nik: encryptedNik,
        nama_lengkap,
        tanggal_lahir: new Date(tanggal_lahir),
        jenis_kelamin,
        alamat,
        nomor_telepon,
        jumlah_anggota_keluarga,
        jenis_pekerjaan: jenis_pekerjaan || 'Tidak Diketahui',
        status_kepemilikan_rumah: status_kepemilikan_rumah || 'Tidak Diketahui',
        keterangan_ekonomi: keterangan_ekonomi || 'Tidak Ada Keterangan',
        status_verifikasi: StatusVerifikasi.MENUNGGU,
        fotos: {
          create: encryptedFotoUrls.map((url: Buffer) => ({
            url_foto: url,
            nama_file: `foto-${nik}-${Date.now()}.jpg`, // Generic name
          })),
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
      return NextResponse.json({ message: 'Validasi input gagal.', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Gagal membuat data penerima baru.' }, { status: 500 });
  }
}
