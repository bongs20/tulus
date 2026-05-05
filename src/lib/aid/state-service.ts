import {
  AidActorType,
  AidApplicationStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { AID_ALLOWED_TRANSITIONS } from "@/lib/aid/constants";
import { AidWorkflowError } from "@/lib/aid/errors";

export const aidApplicationDetailInclude = {
  documents: true,
  validation_results: {
    orderBy: { created_at: "asc" },
  },
  verifications: {
    include: { verifier: true },
    orderBy: { verified_at: "asc" },
  },
  distributions: {
    include: { executed_by: true },
    orderBy: { created_at: "asc" },
  },
  transitions: {
    include: { actor: true },
    orderBy: { created_at: "asc" },
  },
  central_record: true,
} as const;

export function assertAidTransition(
  from: AidApplicationStatus,
  to: AidApplicationStatus,
) {
  if (!AID_ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new AidWorkflowError(
      `Invalid application transition from ${from} to ${to}.`,
      409,
      "INVALID_AID_TRANSITION",
    );
  }
}

export async function createTransition(params: {
  tx: Prisma.TransactionClient;
  applicationId: string;
  fromStatus?: AidApplicationStatus;
  toStatus: AidApplicationStatus;
  actorType: AidActorType;
  actorId?: string | null;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  await params.tx.aid_application_transition.create({
    data: {
      application_id: params.applicationId,
      actor_id: params.actorId ?? null,
      actor_type: params.actorType,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      notes: params.notes,
      metadata_json: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function updateAidApplicationStatus(params: {
  tx: Prisma.TransactionClient;
  applicationId: string;
  currentStatus: AidApplicationStatus;
  nextStatus: AidApplicationStatus;
  actorType: AidActorType;
  actorId?: string | null;
  notes?: string;
  data?: Prisma.aid_applicationUpdateInput;
  metadata?: Record<string, unknown>;
}) {
  assertAidTransition(params.currentStatus, params.nextStatus);

  const updated = await params.tx.aid_application.update({
    where: { id: params.applicationId },
    data: {
      status: params.nextStatus,
      ...params.data,
    },
    include: aidApplicationDetailInclude,
  });

  await createTransition({
    tx: params.tx,
    applicationId: params.applicationId,
    fromStatus: params.currentStatus,
    toStatus: params.nextStatus,
    actorType: params.actorType,
    actorId: params.actorId,
    notes: params.notes,
    metadata: params.metadata,
  });

  return updated;
}

export async function getAidApplicationRecordOrThrow(applicationId: string) {
  const application = await prisma.aid_application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new AidWorkflowError("Application not found.", 404, "APPLICATION_NOT_FOUND");
  }

  return application;
}

export function formatAidApplication<
  T extends {
    nik: Uint8Array;
    documents?: Array<{ file_url: Uint8Array } & Record<string, unknown>>;
    nominal_bantuan?: Prisma.Decimal | null;
    distributions?: Array<{ nominal_bantuan: Prisma.Decimal } & Record<string, unknown>>;
    validation_results?: Array<{ detail_json: string | null } & Record<string, unknown>>;
    transitions?: Array<{ metadata_json: string | null } & Record<string, unknown>>;
  },
>(row: T) {
  return {
    ...row,
    nik: decrypt(row.nik),
    nominal_bantuan: row.nominal_bantuan?.toNumber() ?? null,
    documents: row.documents?.map((document) => ({
      ...document,
      file_url: decrypt(document.file_url),
    })),
    distributions: row.distributions?.map((distribution) => ({
      ...distribution,
      nominal_bantuan: distribution.nominal_bantuan.toNumber(),
    })),
    validation_results: row.validation_results?.map((result) => ({
      ...result,
      detail: result.detail_json ? JSON.parse(result.detail_json) : null,
    })),
    transitions: row.transitions?.map((transition) => ({
      ...transition,
      metadata: transition.metadata_json
        ? JSON.parse(transition.metadata_json)
        : null,
    })),
  };
}
