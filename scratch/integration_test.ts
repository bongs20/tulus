import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function integrationTest() {
  const name = 'Dewi Lestari'; // Example name from previous test
  console.log(`--- Testing for ${name} ---`);

  // 1. Check if they are in the filtered list
  const initial = await prisma.tbl_penerima.findMany({
    where: {
      nama_lengkap: { contains: name },
      status_verifikasi: 'DISETUJUI',
      penyaluran: {
        none: {
          OR: [
            { status_penyaluran: 'BERHASIL' },
            { status_penyaluran: 'DIPROSES' }
          ]
        }
      }
    }
  });

  if (initial.length === 0) {
    console.log(`${name} is ALREADY excluded or not found.`);
  } else {
    console.log(`${name} is currently in the queue.`);
    const p = initial[0];

    // 2. Create a distribution
    console.log(`Creating distribution for ${p.nama_lengkap} (ID: ${p.id})...`);
    await prisma.tbl_penyaluran.create({
      data: {
        id_penerima: p.id,
        jenis_bantuan: 'PKH',
        metode_penyaluran: 'BANK',
        nominal_bantuan: 500000,
        status_penyaluran: 'DIPROSES',
        tanggal_penyaluran: new Date(),
      }
    });

    // 3. Check again immediately
    const after = await prisma.tbl_penerima.findMany({
      where: {
        id: p.id,
        penyaluran: {
          none: {
            OR: [
              { status_penyaluran: 'BERHASIL' },
              { status_penyaluran: 'DIPROSES' }
            ]
          }
        }
      }
    });

    if (after.length === 0) {
      console.log(`SUCCESS: ${name} is now EXCLUDED from the queue.`);
    } else {
      console.log(`FAILURE: ${name} is STILL in the queue!`);
    }
  }
}

integrationTest().catch(console.error);
