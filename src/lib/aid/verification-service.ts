import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";
import { sanitizeObject } from "@/lib/sanitizer";
import { notifyCitizenStatus } from "@/lib/aid/notification-service";
import {
  runAidValidation,
} from "@/lib/aid/validation-service";
import { verifyAidApplicationSchema } from "@/lib/aid/schemas";
import { AidWorkflowError } from "@/lib/aid/errors";
import { broadcastAidApplicationUpdate } from "@/lib/aid/realtime-service";
import {
  aidApplicationDetailInclude,
  formatAidApplication,
  getAidApplicationRecordOrThrow,
  updateAidApplicationStatus,
} from "@/lib/aid/state-service";
import { mapRoleToActorType } from "@/lib/aid/workflow";

export async function validateAidApplication(applicationId: string) {
  const current = await getAidApplicationRecordOrThrow(applicationId);

  if (!["SUBMITTED", "VALIDATING"].includes(current.status)) {
    throw new AidWorkflowError(
      "Application cannot be validated from its current status.",
      409,
      "INVALID_VALIDATION_STATUS",
    );
  }

  const validating = current.status === "SUBMITTED"
    ? await prisma.$transaction((tx) =>
        updateAidApplicationStatus({
          tx,
          applicationId,
          currentStatus: current.status,
          nextStatus: "VALIDATING",
          actorType: "SYSTEM",
          notes: "System started validation.",
        }),
      )
    : await prisma.aid_application.findUniqueOrThrow({
        where: { id: applicationId },
        include: aidApplicationDetailInclude,
      });

  await prisma.aid_validation_result.deleteMany({
    where: { application_id: applicationId },
  });

  const outcome = await runAidValidation({
    applicationId,
    nik: decrypt(validating.nik),
    nama_lengkap: validating.nama_lengkap,
    tanggal_lahir: validating.tanggal_lahir,
  });

  const nextStatus = outcome.passed
    ? "PENDING_ADMIN_VERIFICATION"
    : "REJECTED_INVALID";

  const updated = await prisma.$transaction(async (tx) =>
    updateAidApplicationStatus({
      tx,
      applicationId,
      currentStatus: "VALIDATING",
      nextStatus,
      actorType: "SYSTEM",
      notes: outcome.summary,
      data: {
        validation_summary: outcome.summary,
        rejection_reason: outcome.passed ? null : outcome.summary,
      },
      metadata: {
        results: outcome.results,
      },
    }),
  );

  await notifyCitizenStatus({
    phoneNumber: updated.nomor_telepon,
    applicationNumber: updated.application_number,
    status: updated.status,
    note: outcome.passed ? null : outcome.summary,
  });

  await broadcastAidApplicationUpdate(updated);
  return formatAidApplication(updated);
}

export async function verifyAidApplication(params: {
  applicationId: string;
  payload: unknown;
  actorId: string;
  actorRole: Role;
}) {
  const data = sanitizeObject(verifyAidApplicationSchema.parse(params.payload));
  const current = await getAidApplicationRecordOrThrow(params.applicationId);

  if (current.status !== "PENDING_ADMIN_VERIFICATION") {
    throw new AidWorkflowError(
      "Application is not waiting for admin verification.",
      409,
      "INVALID_VERIFICATION_STATUS",
    );
  }

  const nextStatus = data.decision === "APPROVED" ? "APPROVED" : "REJECTED_ADMIN";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.aid_verification.create({
      data: {
        application_id: params.applicationId,
        verifier_id: params.actorId,
        decision: data.decision,
        notes: data.notes,
        field_verification_needed: data.field_verification_needed,
      },
    });

    return updateAidApplicationStatus({
      tx,
      applicationId: params.applicationId,
      currentStatus: current.status,
      nextStatus,
      actorType: mapRoleToActorType(params.actorRole),
      actorId: params.actorId,
      notes: data.notes,
      data: {
        admin_note: data.notes,
        rejection_reason: data.decision === "REJECTED" ? data.notes : null,
        field_verification_required: data.field_verification_needed,
        approved_at: data.decision === "APPROVED" ? new Date() : null,
      },
    });
  });

  await notifyCitizenStatus({
    phoneNumber: updated.nomor_telepon,
    applicationNumber: updated.application_number,
    status: updated.status,
    note: data.notes,
  });

  await broadcastAidApplicationUpdate(updated);
  return formatAidApplication(updated);
}

export async function centralizeAidApplication(applicationId: string) {
  const current = await getAidApplicationRecordOrThrow(applicationId);

  if (current.status !== "APPROVED") {
    throw new AidWorkflowError(
      "Application must be approved before centralization.",
      409,
      "INVALID_CENTRALIZATION_STATUS",
    );
  }

  const encryptedNik = encrypt(decrypt(current.nik));

  const updated = await prisma.$transaction(async (tx) => {
    const existingCentralRecord = await tx.tbl_penerima.findFirst({
      where: { nik: encryptedNik },
    });

    const centralRecord =
      existingCentralRecord ??
      (await tx.tbl_penerima.create({
        data: {
          nik: encryptedNik,
          nama_lengkap: current.nama_lengkap,
          tanggal_lahir: current.tanggal_lahir,
          jenis_kelamin: current.jenis_kelamin,
          alamat: current.alamat,
          nomor_telepon: current.nomor_telepon,
          jumlah_anggota_keluarga: current.jumlah_anggota_keluarga,
          jenis_pekerjaan: current.jenis_pekerjaan,
          status_kepemilikan_rumah: current.status_kepemilikan_rumah,
          keterangan_ekonomi: current.keterangan_ekonomi,
          status_verifikasi: "DISETUJUI",
        },
      }));

    return updateAidApplicationStatus({
      tx,
      applicationId,
      currentStatus: current.status,
      nextStatus: "CENTRALIZED",
      actorType: "SYSTEM",
      notes: "Application data stored in the central database.",
      data: {
        central_record: {
          connect: {
            id: centralRecord.id,
          },
        },
      },
      metadata: {
        central_record_id: centralRecord.id,
      },
    });
  });

  await broadcastAidApplicationUpdate(updated);
  return formatAidApplication(updated);
}
