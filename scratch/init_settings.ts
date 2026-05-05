
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.tbl_pengaturan.upsert({
    where: { id: 'global_settings' },
    update: {},
    create: {
      id: 'global_settings',
      total_anggaran: 3000000000
    }
  });
  console.log('Global settings initialized');
}
main().catch(console.error).finally(() => prisma.$disconnect());
