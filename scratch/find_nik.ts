
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  const warga = await prisma.tbl_warga.findFirst({
    where: {
      is_dalam_jangkauan: true,
      status_dtks: 'TERDAFTAR'
    }
  });

  if (warga) {
    console.log("FOUND_NIK:" + decrypt(warga.nik));
  } else {
    console.log("NO_VALID_NIK_FOUND");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
