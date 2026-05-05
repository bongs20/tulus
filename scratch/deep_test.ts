
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function deepTest() {
  console.log("🚀 MEMULAI PENGUJIAN MENDALAM SISTEM TULUS...\n");

  // 1. TEST PENDAFTARAN (MATCH)
  console.log("--- 1. Testing Pendaftaran Mandiri (MATCH) ---");
  const regData = {
    nik: "3200000000000099",
    nama_lengkap: "Tester Match " + Date.now(),
    tanggal_lahir: "1990-01-01",
    jenis_kelamin: "LAKI_LAKI",
    alamat: "Jl. Testing No. 123",
    nomor_telepon: "085157441531",
    jumlah_anggota_keluarga: 3,
    jenis_pekerjaan: "Wiraswasta",
    status_kepemilikan_rumah: "MILIK_SENDIRI",
    keterangan_ekonomi: "Mengetes sistem notifikasi ganda.",
    url_foto: ["https://utfs.io/f/test-image.jpg"]
  };

  try {
    const regRes = await fetch(`${BASE_URL}/pendaftar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData)
    });
    const regJson = await regRes.json();
    console.log("Status:", regRes.status);
    console.log("Response Pendaftaran:", regJson);

    if (regRes.status === 201) {
      console.log("✅ Pendaftaran Berhasil.");
      const pId = regJson.penerimaId;

      // 2. CEK DATA DI DATABASE
      const dbData = await prisma.tbl_penerima.findUnique({
        where: { id: pId },
        include: { desil_data: true }
      });
      console.log("✅ Data tersimpan di DB dengan status:", dbData?.status_verifikasi);

      // 3. TEST SANGGAHAN
      console.log("\n--- 2. Testing Pengajuan Sanggahan ---");
      const sanggahanData = {
        id_penerima: pId,
        nama_pengaju: "Keluarga Tester",
        isi_sanggahan: "Data desil saya sepertinya salah, mohon dicek ulang."
      };
      const sangRes = await fetch(`${BASE_URL}/sanggahan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanggahanData)
      });
      console.log("Response Sanggahan:", (await sangRes.json()).message);

      // 4. CEK RELASI SANGGAHAN
      const updatedData = await prisma.tbl_penerima.findUnique({
        where: { id: pId },
        include: { sanggahan: true }
      });
      if (updatedData?.sanggahan.length! > 0) {
        console.log("✅ Sanggahan berhasil terhubung ke data penerima.");
      }

    }
  } catch (err) {
    console.error("❌ Test Gagal:", err);
  }

  console.log("\n--- PENGUJIAN SELESAI ---");
}

deepTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
