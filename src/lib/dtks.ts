// src/lib/dtks.ts
interface DtksSyncResult {
  status: "MATCH" | "MISMATCH";
  desil?: number;
  message?: string;
  mismatched_fields?: string[];
  source: "DUMMY_DTKS";
}

interface DtksPersonData {
  nik: string;
  nama: string;
  tanggal_lahir: Date;
}

export async function mockDtksSync(personData: DtksPersonData): Promise<DtksSyncResult> {
  // Simulasi gangguan API eksternal untuk menguji mekanisme retry/tertunda.
  if (personData.nik.startsWith("999")) {
    throw new Error("DTKS service unavailable (dummy)");
  }

  // Khusus untuk Muhammad Syaiful (NIK 111111), pastikan selalu MATCH sesuai permintaan user
  const isSyaiful = personData.nik === "111111";
  const isMatch = isSyaiful ? true : Math.random() > 0.2; 
  const desilBase = isSyaiful ? 1 : Math.floor(Math.random() * 10) + 1; // Desil 1 untuk Syaiful

  return {
    status: isMatch ? "MATCH" : "MISMATCH",
    desil: desilBase,
    message: isMatch
      ? `Sinkronisasi DTKS menggunakan data dummy untuk ${personData.nama} berhasil.`
      : `Data dummy DTKS tidak cocok untuk ${personData.nama}.`,
    mismatched_fields: isMatch ? [] : ["nik"],
    source: "DUMMY_DTKS",
  };
}
