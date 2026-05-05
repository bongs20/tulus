// src/app/api/validate-nik/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/crypto';
import { applyRateLimiter } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(req.url);
  const nik = searchParams.get('nik');

  if (!nik || nik.length !== 16 || !/^\d+$/.test(nik)) {
    return NextResponse.json({ message: 'NIK tidak valid.' }, { status: 400 });
  }

  try {
    console.log(`Checking NIK: ${nik}`);
    const existingPenerima = await prisma.tbl_penerima.findMany({
      select: { id: true, nik: true },
    });

    console.log(`Found ${existingPenerima.length} existing recipients to check.`);

    const isDuplicate = existingPenerima.some((penerima) => {
      try {
        const decryptedNik = decrypt(penerima.nik);
        return decryptedNik === nik;
      } catch {
        console.error(`Failed to decrypt record ${penerima.id}`);
        return false;
      }
    });

    console.log(`NIK ${nik} duplicate status: ${isDuplicate}`);

    if (isDuplicate) {
      return NextResponse.json({ isDuplicate: true, message: 'NIK sudah terdaftar.' }, { status: 200 });
    } else {
      return NextResponse.json({ isDuplicate: false, message: 'NIK tersedia.' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking NIK:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
