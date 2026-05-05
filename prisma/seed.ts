// prisma/seed.ts
import { JenisKelamin, PrismaClient, StatusDtks, StatusSinkronisasi, StatusVerifikasi } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createCipheriv, createHash, scryptSync } from 'crypto';

const prisma = new PrismaClient();
const algorithm = 'aes-256-gcm';
const ivLength = 16;
const salt = process.env.ENCRYPTION_SALT || 'tulus_encryption_salt';
const key = scryptSync(process.env.ENCRYPTION_KEY || 'default_encryption_key', salt, 32);
const staticIv = createHash('sha256').update(key).digest().subarray(0, ivLength);

function encrypt(text: string): Buffer {
  const cipher = createCipheriv(algorithm, key, staticIv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([staticIv, tag, encrypted]);
}

async function main() {
  // Clear existing data (optional, for development)
  await prisma.tbl_sanggahan.deleteMany();
  await prisma.tbl_audit_log.deleteMany();
  await prisma.tbl_penyaluran.deleteMany();
  await prisma.tbl_desil.deleteMany();
  await prisma.tbl_warga.deleteMany();
  await prisma.tbl_foto.deleteMany();
  await prisma.tbl_penerima.deleteMany();
  await prisma.tbl_pengguna.deleteMany();

  console.log('Cleared existing data.');

  // Create users
  const password = await hash('Admin@12345', 12);
  const kepalaPassword = await hash('Kepala@12345', 12);
  const verifikatorPassword = await hash('Verifikator@123', 12);

  const admin = await prisma.tbl_pengguna.create({
    data: {
      username: 'admin',
      password_hash: password,
      nama_lengkap: 'Administrator Utama',
      role: 'ADMINISTRATOR',
      status_akun: 'AKTIF',
    },
  });

  const kepalaBidang = await prisma.tbl_pengguna.create({
    data: {
      username: 'kepala',
      password_hash: kepalaPassword,
      nama_lengkap: 'Kepala Bidang Sosial',
      role: 'KEPALA_BIDANG',
      status_akun: 'AKTIF',
    },
  });

  const verifikator1 = await prisma.tbl_pengguna.create({
    data: {
      username: 'verifikator1',
      password_hash: verifikatorPassword,
      nama_lengkap: 'Petugas Verifikator 1',
      role: 'PETUGAS_VERIFIKATOR',
      status_akun: 'AKTIF',
    },
  });

  const verifikator2 = await prisma.tbl_pengguna.create({
    data: {
      username: 'verifikator2',
      password_hash: verifikatorPassword,
      nama_lengkap: 'Petugas Verifikator 2',
      role: 'PETUGAS_VERIFIKATOR',
      status_akun: 'AKTIF',
    },
  });

  console.log('Created users:', { admin, kepalaBidang, verifikator1, verifikator2 });

  const coverageAreas = [
    'Bandung',
    'Bekasi',
    'Bogor',
    'Cirebon',
    'Depok',
    'Garut',
    'Jakarta',
    'Karawang',
    'Sukabumi',
    'Tasikmalaya',
  ];
  const outsideAreas = ['Kabupaten Luar Utara', 'Kabupaten Luar Selatan'];
  const firstNames = ['Adi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gina', 'Hadi', 'Indah', 'Joko'];
  const lastNames = ['Pratama', 'Santoso', 'Lestari', 'Wijaya', 'Sari', 'Hidayat', 'Putri', 'Saputra', 'Aminah', 'Ramadhan'];

  // Add specific test warga for Muhammad Syaiful (testing data)
  await prisma.tbl_warga.create({
    data: {
      nik: encrypt('111111'),
      nama_lengkap: 'Muhammad Syaiful',
      alamat: 'Jl. Test No. 1, Bandung',
      wilayah: coverageAreas[0],
      status_dtks: StatusDtks.BELUM_TERDAFTAR,
      nilai_kesejahteraan: 2,
      is_dalam_jangkauan: true,
      catatan: 'Test record: belum mendaftar',
    },
  });


  for (let index = 1; index <= 100; index++) {
    const isOutsideCoverage = index % 8 === 0;
    const isMissingData = index % 10 === 0;
    const isInCoverage = !isOutsideCoverage;
    const statusDtks = isOutsideCoverage
      ? StatusDtks.LUAR_JANGKAUAN
      : isMissingData
        ? StatusDtks.DATA_TIDAK_ADA
        : index % 5 === 0
          ? StatusDtks.BELUM_TERDAFTAR
          : StatusDtks.TERDAFTAR;
    const wilayah = isInCoverage
      ? coverageAreas[(index - 1) % coverageAreas.length]
      : outsideAreas[(index - 1) % outsideAreas.length];
    const namaLengkap = `${firstNames[(index - 1) % firstNames.length]} ${lastNames[(index - 1) % lastNames.length]} ${String(index).padStart(3, '0')}`;
    const nik = String(3200000000000000 + index);

    await prisma.tbl_warga.create({
      data: {
        nik: encrypt(nik),
        nama_lengkap: namaLengkap,
        alamat: `${wilayah} RW ${String((index % 12) + 1).padStart(2, '0')} / RT ${String((index % 6) + 1).padStart(2, '0')}`,
        wilayah,
        status_dtks: statusDtks,
        nilai_kesejahteraan: ((index * 7) % 10) + 1,
        is_dalam_jangkauan: isInCoverage && !isOutsideCoverage,
        catatan: isOutsideCoverage
          ? 'Di luar jangkauan layanan.'
          : isMissingData
            ? 'Data DTKS belum lengkap.'
            : statusDtks === StatusDtks.BELUM_TERDAFTAR
              ? 'Belum terdaftar DTKS, namun masih dapat mendaftar.'
              : 'Warga dalam jangkauan layanan.',
      },
    });
  }

  console.log('Created warga registry records: 100');

  // Create dummy penerima records
  const penerimaData: Array<{
    nik: string;
    nama_lengkap: string;
    tanggal_lahir: Date;
    jenis_kelamin: JenisKelamin;
    alamat: string;
    nomor_telepon: string;
    jumlah_anggota_keluarga: number;
    jenis_pekerjaan: string;
    status_kepemilikan_rumah: string;
    keterangan_ekonomi: string;
    status_verifikasi: StatusVerifikasi;
  }> = [
    {
      nik: '3274010101000001',
      nama_lengkap: 'Budi Santoso',
      tanggal_lahir: new Date('1980-05-15'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Jl. Merdeka No. 1, Bandung',
      nomor_telepon: '081234567890',
      jumlah_anggota_keluarga: 4,
      jenis_pekerjaan: 'Petani',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Penghasilan tidak tetap',
      status_verifikasi: 'MATCH',
    },
    {
      nik: '3274010101000002',
      nama_lengkap: 'Siti Aminah',
      tanggal_lahir: new Date('1992-11-22'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Jl. Sudirman No. 5, Jakarta',
      nomor_telepon: '081234567891',
      jumlah_anggota_keluarga: 3,
      jenis_pekerjaan: 'Buruh Pabrik',
      status_kepemilikan_rumah: 'Kontrak',
      keterangan_ekonomi: 'Gaji UMR',
      status_verifikasi: 'MISMATCH',
    },
    {
      nik: '3274010101000003',
      nama_lengkap: 'Joko Susilo',
      tanggal_lahir: new Date('1975-03-10'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Kp. Durian Runtuh RT 03/01',
      nomor_telepon: '081234567892',
      jumlah_anggota_keluarga: 5,
      jenis_pekerjaan: 'Pedagang Kecil',
      status_kepemilikan_rumah: 'Sewa',
      keterangan_ekonomi: 'Pendapatan harian tidak menentu',
      status_verifikasi: 'DISETUJUI',
    },
    {
      nik: '3274010101000004',
      nama_lengkap: 'Maria Ulfah',
      tanggal_lahir: new Date('1988-07-01'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Perumahan Indah Blok C No. 12',
      nomor_telepon: '081234567893',
      jumlah_anggota_keluarga: 2,
      jenis_pekerjaan: 'Ibu Rumah Tangga',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Suami bekerja serabutan',
      status_verifikasi: 'DITOLAK',
    },
    {
      nik: '3274010101000005',
      nama_lengkap: 'Agus Salim',
      tanggal_lahir: new Date('1995-09-20'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Jl. Kenanga No. 8, Cirebon',
      nomor_telepon: '081234567894',
      jumlah_anggota_keluarga: 1,
      jenis_pekerjaan: 'Pengangguran',
      status_kepemilikan_rumah: 'Ikut Orang Tua',
      keterangan_ekonomi: 'Tidak ada penghasilan tetap',
      status_verifikasi: 'MENUNGGU',
    },
    // Add more dummy recipients to reach 20
    {
      nik: '3274010101000006',
      nama_lengkap: 'Dewi Lestari',
      tanggal_lahir: new Date('1983-02-28'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Gg. Melati No. 7, Bekasi',
      nomor_telepon: '081234567895',
      jumlah_anggota_keluarga: 3,
      jenis_pekerjaan: 'Karyawan Swasta',
      status_kepemilikan_rumah: 'Kontrak',
      keterangan_ekonomi: 'Gaji cukup',
      status_verifikasi: 'MATCH',
    },
    {
      nik: '3274010101000007',
      nama_lengkap: 'Candra Wijaya',
      tanggal_lahir: new Date('1970-12-03'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Desa Maju RT 01/02',
      nomor_telepon: '081234567896',
      jumlah_anggota_keluarga: 6,
      jenis_pekerjaan: 'Nelayan',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Penghasilan musiman',
      status_verifikasi: 'DISETUJUI',
    },
    {
      nik: '3274010101000008',
      nama_lengkap: 'Eka Nurjanah',
      tanggal_lahir: new Date('1990-06-05'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Jl. Pahlawan No. 20, Bogor',
      nomor_telepon: '081234567897',
      jumlah_anggota_keluarga: 2,
      jenis_pekerjaan: 'Penjahit',
      status_kepemilikan_rumah: 'Sewa',
      keterangan_ekonomi: 'Pekerjaan lepas',
      status_verifikasi: 'DISETUJUI',
    },
    {
      nik: '3274010101000009',
      nama_lengkap: 'Fahmi Hidayat',
      tanggal_lahir: new Date('1986-08-11'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Gg. Anggrek No. 3, Depok',
      nomor_telepon: '081234567898',
      jumlah_anggota_keluarga: 4,
      jenis_pekerjaan: 'Tukang Bangunan',
      status_kepemilikan_rumah: 'Kontrak',
      keterangan_ekonomi: 'Proyek tidak selalu ada',
      status_verifikasi: 'MENUNGGU',
    },
    {
      nik: '3274010101000010',
      nama_lengkap: 'Gina Putri',
      tanggal_lahir: new Date('1978-01-25'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Jl. Gatot Subroto No. 100',
      nomor_telepon: '081234567899',
      jumlah_anggota_keluarga: 3,
      jenis_pekerjaan: 'Ibu Rumah Tangga',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Suami pensiunan',
      status_verifikasi: 'DISETUJUI',
    },
    {
      nik: '3274010101000011',
      nama_lengkap: 'Hadi Prasetyo',
      tanggal_lahir: new Date('1989-04-04'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Komplek Griya Asri No. 5',
      nomor_telepon: '081234567800',
      jumlah_anggota_keluarga: 2,
      jenis_pekerjaan: 'Freelancer',
      status_kepemilikan_rumah: 'Sewa',
      keterangan_ekonomi: 'Pendapatan tidak tetap',
      status_verifikasi: 'MATCH',
    },
    {
      nik: '3274010101000012',
      nama_lengkap: 'Indah Sari',
      tanggal_lahir: new Date('1993-10-18'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Dusun Makmur RT 05/02',
      nomor_telepon: '081234567801',
      jumlah_anggota_keluarga: 1,
      jenis_pekerjaan: 'Mahasiswa',
      status_kepemilikan_rumah: 'Ikut Orang Tua',
      keterangan_ekonomi: 'Belum bekerja',
      status_verifikasi: 'MENUNGGU',
    },
    {
      nik: '3274010101000013',
      nama_lengkap: 'Karunia Putra',
      tanggal_lahir: new Date('1972-07-07'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Jl. Cempaka No. 11, Bandung',
      nomor_telepon: '081234567802',
      jumlah_anggota_keluarga: 5,
      jenis_pekerjaan: 'Pekerja Lepas',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Kadang ada kadang tidak',
      status_verifikasi: 'DISETUJUI',
    },
    {
      nik: '3274010101000014',
      nama_lengkap: 'Lia Fitriani',
      tanggal_lahir: new Date('1985-03-29'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Gg. Kembang No. 1, Jakarta',
      nomor_telepon: '081234567803',
      jumlah_anggota_keluarga: 3,
      jenis_pekerjaan: 'Pengusaha Kuliner',
      status_kepemilikan_rumah: 'Sewa',
      keterangan_ekonomi: 'Usaha sedang berkembang',
      status_verifikasi: 'MATCH',
    },
    {
      nik: '3274010101000015',
      nama_lengkap: 'Mamat Supriadi',
      tanggal_lahir: new Date('1991-01-01'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Blok Sawah Indah RT 02/01',
      nomor_telepon: '081234567804',
      jumlah_anggota_keluarga: 2,
      jenis_pekerjaan: 'Karyawan Toko',
      status_kepemilikan_rumah: 'Kontrak',
      keterangan_ekonomi: 'Gaji pokok',
      status_verifikasi: 'MENUNGGU',
    },
    {
      nik: '3274010101000016',
      nama_lengkap: 'Nia Kurnia',
      tanggal_lahir: new Date('1976-11-11'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Jl. Kartini No. 45, Surabaya',
      nomor_telepon: '081234567805',
      jumlah_anggota_keluarga: 4,
      jenis_pekerjaan: 'Guru Honorer',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Gaji kecil',
      status_verifikasi: 'DITOLAK',
    },
    {
      nik: '3274010101000017',
      nama_lengkap: 'Oki Setiawan',
      tanggal_lahir: new Date('1982-05-30'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Perumahan Elok Blok B No. 7',
      nomor_telepon: '081234567806',
      jumlah_anggota_keluarga: 3,
      jenis_pekerjaan: 'Sopir Online',
      status_kepemilikan_rumah: 'Sewa',
      keterangan_ekonomi: 'Pendapatan fluktuatif',
      status_verifikasi: 'MATCH',
    },
    {
      nik: '3274010101000018',
      nama_lengkap: 'Putri Ramadhani',
      tanggal_lahir: new Date('1994-02-14'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Dusun Damai RT 03/03',
      nomor_telepon: '081234567807',
      jumlah_anggota_keluarga: 1,
      jenis_pekerjaan: 'Content Creator',
      status_kepemilikan_rumah: 'Ikut Orang Tua',
      keterangan_ekonomi: 'Baru memulai',
      status_verifikasi: 'MENUNGGU',
    },
    {
      nik: '3274010101000019',
      nama_lengkap: 'Rizky Pratama',
      tanggal_lahir: new Date('1979-09-09'),
      jenis_kelamin: 'LAKI_LAKI',
      alamat: 'Jl. Harmoni No. 99, Yogyakarta',
      nomor_telepon: '081234567808',
      jumlah_anggota_keluarga: 5,
      jenis_pekerjaan: 'Dosen',
      status_kepemilikan_rumah: 'Milik Sendiri',
      keterangan_ekonomi: 'Gaji tetap',
      status_verifikasi: 'DISETUJUI',
    },
    {
      nik: '3274010101000020',
      nama_lengkap: 'Santi Wijaya',
      tanggal_lahir: new Date('1984-04-24'),
      jenis_kelamin: 'PEREMPUAN',
      alamat: 'Gg. Damar No. 2, Medan',
      nomor_telepon: '081234567809',
      jumlah_anggota_keluarga: 2,
      jenis_pekerjaan: 'Wirausaha',
      status_kepemilikan_rumah: 'Sewa',
      keterangan_ekonomi: 'Usaha maju',
      status_verifikasi: 'DISETUJUI',
    },
  ];

  for (const data of penerimaData) {
    const penerima = await prisma.tbl_penerima.create({
      data: {
        ...data,
        nik: encrypt(data.nik),
      },
    });
    console.log(`Created penerima with NIK: ${data.nik}`);

    // REQ-F-002: minimal 1 foto untuk setiap calon penerima.
    await prisma.tbl_foto.create({
      data: {
        id_penerima: penerima.id,
        url_foto: encrypt(`https://example.com/photos/${data.nik}_1.jpg`),
        nama_file: `${data.nik}_1.jpg`,
      },
    });

    // Tambah foto kedua untuk data yang sudah lolos awal/akhir agar realistis.
    if (penerima.status_verifikasi === 'DISETUJUI' || penerima.status_verifikasi === 'MATCH') {
      await prisma.tbl_foto.create({
        data: {
          id_penerima: penerima.id,
          url_foto: encrypt(`https://example.com/photos/${data.nik}_2.jpg`),
          nama_file: `${data.nik}_2.jpg`,
        },
      });
    }

    // Simpan jejak sinkronisasi DTKS untuk semua status yang sudah pernah disinkronkan.
    let syncStatus: StatusSinkronisasi | null = null;
    if (penerima.status_verifikasi === 'MATCH' || penerima.status_verifikasi === 'DISETUJUI' || penerima.status_verifikasi === 'DITOLAK') {
      syncStatus = StatusSinkronisasi.MATCH;
    } else if (penerima.status_verifikasi === 'MISMATCH') {
      syncStatus = StatusSinkronisasi.MISMATCH;
    }

    if (syncStatus) {
      await prisma.tbl_desil.create({
        data: {
          id_penerima: penerima.id,
          nik: penerima.nik,
          nilai_desil: Math.floor(Math.random() * 10) + 1, // Random desil 1-10
          sumber_data: 'DTKS Mock',
          status_sinkronisasi: syncStatus,
          tanggal_sinkronisasi: new Date(),
        },
      });
    }
  }

  // Add sample penyaluran records for DISETUJUI penerima
  const disetujuiPenerima = await prisma.tbl_penerima.findMany({
    where: { status_verifikasi: 'DISETUJUI' },
  });

  if (disetujuiPenerima.length > 0) {
    await prisma.tbl_penyaluran.create({
      data: {
        id_penerima: disetujuiPenerima[0].id,
        jenis_bantuan: 'PKH',
        metode_penyaluran: 'BANK',
        nominal_bantuan: 300000,
        status_penyaluran: 'BERHASIL',
        tanggal_penyaluran: new Date(),
      },
    });

    if (disetujuiPenerima.length > 1) {
      await prisma.tbl_penyaluran.create({
        data: {
          id_penerima: disetujuiPenerima[1].id,
          jenis_bantuan: 'BPNT',
          metode_penyaluran: 'EWALLET',
          nominal_bantuan: 200000,
          status_penyaluran: 'DIPROSES',
          tanggal_penyaluran: new Date(),
        },
      });
    }
  }


  // Add sample audit log records
  await prisma.tbl_audit_log.create({
    data: {
      id_pengguna: admin.id,
      aksi: 'LOGIN',
      deskripsi: 'Admin login',
      note: 'Successful login',
    },
  });

  await prisma.tbl_audit_log.create({
    data: {
      id_pengguna: verifikator1.id,
      aksi: 'VERIFIKASI',
      deskripsi: 'Verifikasi penerima',
      note: 'Penerima Joko Susilo disetujui',
    },
  });

  // Add sample sanggahan records
  if (penerimaData[1]) { // Siti Aminah (MISMATCH)
    const sitiAminah = await prisma.tbl_penerima.findFirst({
      where: { nama_lengkap: penerimaData[1].nama_lengkap },
    });
    if (sitiAminah) {
      await prisma.tbl_sanggahan.create({
        data: {
          id_penerima: sitiAminah.id,
          nama_pengaju: 'Siti Aminah',
          isi_sanggahan: 'Saya merasa data saya tidak sesuai, saya berhak mendapatkan bantuan.',
          status_sanggahan: 'PENDING',
        },
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
