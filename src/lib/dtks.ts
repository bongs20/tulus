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

  const lastNikDigit = Number.parseInt(personData.nik.slice(-1), 10);
  const desilBase = Number.isNaN(lastNikDigit) ? 1 : (lastNikDigit % 10) + 1;
  const isMatch = Number.isNaN(lastNikDigit) ? false : lastNikDigit % 2 === 0;

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
