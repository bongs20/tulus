import {
  AidDistributionMethod,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";
import { sanitizeObject } from "@/lib/sanitizer";
import {
  assignAidProgramSchema,
  distributeAidSchema,
} from "@/lib/aid/schemas";
import { AidWorkflowError } from "@/lib/aid/errors";
import { broadcastAidApplicationUpdate } from "@/lib/aid/realtime-service";
import {
  formatAidApplication,
  getAidApplicationRecordOrThrow,
  updateAidApplicationStatus,
} from "@/lib/aid/state-service";
import { getSuggestedAidProgram } from "@/lib/aid/validation-service";
import { notifyCitizenStatus } from "@/lib/aid/notification-service";
import { mapRoleToActorType } from "@/lib/aid/workflow";

function mapDistributionFailureReason(method: AidDistributionMethod) {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank transfer failed.";
    case "E_WALLET":
      return "E-wallet transfer failed.";
    case "PHYSICAL_DISTRIBUTION":
      return "Physical distribution could not be completed.";
  }
}

export async function assignAidProgram(params: {
  applicationId: string;
  payload: unknown;
  actorId: string;
  actorRole: Role;
}) {
  const data = assignAidProgramSchema.parse(params.payload);
  const current = await getAidApplicationRecordOrThrow(params.applicationId);

  if (current.status !== "CENTRALIZED") {
    throw new AidWorkflowError(
      "Application must be centralized before program assignment.",
      409,
      "INVALID_PROGRAM_ASSIGNMENT_STATUS",
    );
  }

  const encryptedNik = encrypt(decrypt(current.nik));
  const warga = await prisma.tbl_warga.findFirst({
    where: { nik: encryptedNik },
  });

  const program = data.program ?? getSuggestedAidProgram(warga?.nilai_kesejahteraan);

  const updated = await prisma.$transaction(async (tx) =>
    updateAidApplicationStatus({
      tx,
      applicationId: params.applicationId,
      currentStatus: current.status,
      nextStatus: "PROGRAM_ASSIGNED",
      actorType: mapRoleToActorType(params.actorRole),
      actorId: params.actorId,
      notes: `Program ${program} assigned.`,
      data: {
        assigned_program: program,
        assigned_distribution_method: data.distribution_method,
        nominal_bantuan: new Prisma.Decimal(data.nominal_bantuan),
      },
      metadata: {
        program,
        distribution_method: data.distribution_method,
        nominal_bantuan: data.nominal_bantuan,
      },
    }),
  );

  await broadcastAidApplicationUpdate(updated);
  return formatAidApplication(updated);
}

export async function distributeAid(params: {
  applicationId: string;
  payload: unknown;
  actorId: string;
  actorRole: Role;
}) {
  const data = sanitizeObject(distributeAidSchema.parse(params.payload));
  const current = await getAidApplicationRecordOrThrow(params.applicationId);

  if (current.status !== "PROGRAM_ASSIGNED") {
    throw new AidWorkflowError(
      "Application is not ready for distribution.",
      409,
      "INVALID_DISTRIBUTION_STATUS",
    );
  }

  if (
    !current.assigned_program ||
    !current.assigned_distribution_method ||
    !current.nominal_bantuan
  ) {
    throw new AidWorkflowError(
      "Application program assignment is incomplete.",
      409,
      "INCOMPLETE_PROGRAM_ASSIGNMENT",
    );
  }

  const assignedProgram = current.assigned_program;
  const distributionMethod = current.assigned_distribution_method;
  const nominalBantuan = current.nominal_bantuan;

  const processing = await prisma.$transaction(async (tx) => {
    await tx.aid_distribution.create({
      data: {
        application_id: params.applicationId,
        executed_by_id: params.actorId,
        program: assignedProgram,
        method: distributionMethod,
        status: "PROCESSING",
        nominal_bantuan: nominalBantuan,
        external_reference: data.external_reference,
        notes: data.notes,
      },
    });

    return updateAidApplicationStatus({
      tx,
      applicationId: params.applicationId,
      currentStatus: current.status,
      nextStatus: "DISTRIBUTION_IN_PROGRESS",
      actorType: mapRoleToActorType(params.actorRole),
      actorId: params.actorId,
      notes: "Distribution execution started.",
    });
  });

  if (data.simulate_failure) {
    const failureReason =
      data.notes ?? mapDistributionFailureReason(distributionMethod);

    await prisma.$transaction(async (tx) => {
      await tx.aid_distribution.updateMany({
        where: {
          application_id: params.applicationId,
          status: "PROCESSING",
        },
        data: {
          status: "FAILED",
          notes: failureReason,
        },
      });

      await updateAidApplicationStatus({
        tx,
        applicationId: params.applicationId,
        currentStatus: processing.status,
        nextStatus: "PROGRAM_ASSIGNED",
        actorType: mapRoleToActorType(params.actorRole),
        actorId: params.actorId,
        notes: failureReason,
      });
    });

    throw new AidWorkflowError(
      failureReason,
      502,
      "AID_DISTRIBUTION_FAILED",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.aid_distribution.updateMany({
      where: {
        application_id: params.applicationId,
        status: "PROCESSING",
      },
      data: {
        status: "SUCCESS",
        executed_at: new Date(),
        external_reference: data.external_reference,
        notes: data.notes,
      },
    });

    return updateAidApplicationStatus({
      tx,
      applicationId: params.applicationId,
      currentStatus: processing.status,
      nextStatus: "DISTRIBUTED",
      actorType: mapRoleToActorType(params.actorRole),
      actorId: params.actorId,
      notes: "Distribution executed successfully.",
      data: {
        distributed_at: new Date(),
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
