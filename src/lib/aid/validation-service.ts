import {
  AidValidationResult,
  AidValidationSource,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { mockDtksSync } from "@/lib/dtks";

export type ValidationOutcome = {
  passed: boolean;
  summary: string;
  results: Array<{
    source: AidValidationSource;
    result: AidValidationResult;
    message: string;
    detail_json?: string;
  }>;
};

export async function runAidValidation(input: {
  applicationId: string;
  nik: string;
  nama_lengkap: string;
  tanggal_lahir: Date;
}): Promise<ValidationOutcome> {
  const encryptedNik = encrypt(input.nik);
  const warga = await prisma.tbl_warga.findFirst({
    where: { nik: encryptedNik },
  });

  const validationRows: ValidationOutcome["results"] = [];

  try {
    const dtksResult = await mockDtksSync({
      nik: input.nik,
      nama: input.nama_lengkap,
      tanggal_lahir: input.tanggal_lahir,
    });

    validationRows.push({
      source: "KEMENSOS_DECILE",
      result: dtksResult.status === "MATCH" ? "PASSED" : "FAILED",
      message: dtksResult.message ?? "DTKS validation completed.",
      detail_json: JSON.stringify({
        desil: dtksResult.desil,
        mismatched_fields: dtksResult.mismatched_fields ?? [],
        source: dtksResult.source,
      }),
    });
  } catch (error) {
    validationRows.push({
      source: "KEMENSOS_DECILE",
      result: "ERROR",
      message: error instanceof Error ? error.message : "DTKS validation failed.",
    });
  }

  const adminPassed = Boolean(
    warga &&
      warga.is_dalam_jangkauan &&
      warga.status_dtks !== "LUAR_JANGKAUAN" &&
      warga.status_dtks !== "DATA_TIDAK_ADA",
  );

  validationRows.push({
    source: "ADMINISTRATIVE_RECORD",
    result: adminPassed ? "PASSED" : "FAILED",
    message: adminPassed
      ? "Administrative record validation passed."
      : "Citizen is not eligible based on administrative records.",
    detail_json: JSON.stringify(
      warga
        ? {
            wilayah: warga.wilayah,
            status_dtks: warga.status_dtks,
            nilai_kesejahteraan: warga.nilai_kesejahteraan,
            is_dalam_jangkauan: warga.is_dalam_jangkauan,
          }
        : {
            status_dtks: "DATA_TIDAK_ADA",
          },
    ),
  });

  await prisma.aid_validation_result.createMany({
    data: validationRows.map((row) => ({
      application_id: input.applicationId,
      source: row.source,
      result: row.result,
      message: row.message,
      detail_json: row.detail_json,
    })),
  });

  const failed = validationRows.find((row) => row.result !== "PASSED");
  const passed = !failed;

  return {
    passed,
    summary: passed
      ? "All validation checks passed."
      : failed?.message ?? "Validation failed.",
    results: validationRows,
  };
}

export function getSuggestedAidProgram(nilaiKesejahteraan?: number | null) {
  if (nilaiKesejahteraan == null) {
    return "BLT" as const;
  }

  if (nilaiKesejahteraan <= 3) {
    return "PKH" as const;
  }

  if (nilaiKesejahteraan <= 6) {
    return "BPNT" as const;
  }

  return "BLT" as const;
}
