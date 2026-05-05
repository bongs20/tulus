
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const total = await prisma.tbl_penyaluran.aggregate({
    where: { status_penyaluran: 'BERHASIL' },
    _sum: { nominal_bantuan: true }
  });
  console.log(JSON.stringify(total, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
