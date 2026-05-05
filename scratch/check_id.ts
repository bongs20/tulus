
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.tbl_penyaluran.findUnique({
    where: { id: 'cc483bc6-4f82-4e56-92a7-7cfc7985b02e' },
    include: { penerima: true }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
