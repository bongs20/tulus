
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.tbl_penyaluran.update({
    where: { id: 'cc483bc6-4f82-4e56-92a7-7cfc7985b02e' },
    data: {
      status_penyaluran: 'BERHASIL',
      catatan: 'Penyaluran berhasil diproses (Manual Fix).'
    }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
