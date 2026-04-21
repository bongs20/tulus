// src/lib/dtks.ts
interface DtksSyncResult {
  status: "MATCH" | "MISMATCH";
  desil?: number;
  message?: string;
  mismatched_fields?: string[];
}

interface DtksPersonData {
  nik: string;
  nama: string;
  tanggal_lahir: Date;
}

/**
 * Mocks a DTKS synchronization API call.
 * - NIK ending in an odd number: MATCH
 * - NIK ending in an even number: MISMATCH
 *
 * @param personData The person data to sync.
 * @returns A promise that resolves with the DTKS sync result.
 */
export async function mockDtksSync(personData: DtksPersonData): Promise<DtksSyncResult> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const lastNikDigit = parseInt(personData.nik.slice(-1));

      if (lastNikDigit % 2 !== 0) { // Odd number = MATCH
        resolve({
          status: "MATCH",
          desil: Math.floor(Math.random() * 10) + 1, // Random desil 1-10
          message: "Data cocok dengan DTKS.",
        });
      } else { // Even number = MISMATCH
        // Simulate some mismatched fields
        const mismatched_fields = [];
        if (Math.random() > 0.5) mismatched_fields.push("nama_lengkap");
        if (Math.random() > 0.5) mismatched_fields.push("tanggal_lahir");
        if (mismatched_fields.length === 0) mismatched_fields.push("alamat"); // Ensure at least one mismatch

        resolve({
          status: "MISMATCH",
          message: "Data tidak cocok dengan DTKS.",
          mismatched_fields,
        });
      }
    }, 2000); // 2-second delay
  });
}
