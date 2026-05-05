import { AidApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { sanitizeObject } from "@/lib/sanitizer";
import {
  createAidApplicationSchema,
  resubmitAidApplicationSchema,
} from "@/lib/aid/schemas";
import { AidWorkflowError } from "@/lib/aid/errors";
import {
  aidApplicationDetailInclude,
  createTransition,
  formatAidApplication,
  getAidApplicationRecordOrThrow,
  updateAidApplicationStatus,
} from "@/lib/aid/state-service";
import { isAidApplicationStatus } from "@/lib/aid/constants";
import { validateAidApplication } from "@/lib/aid/verification-service";
import {
  assignAidProgram,
  distributeAid,
} from "@/lib/aid/distribution-service";
import { broadcastAidApplicationUpdate } from "@/lib/aid/realtime-service";
import {
  centralizeAidApplication,
  verifyAidApplication,
} from "@/lib/aid/verification-service";

function generateApplicationNumber() {
  return `TULUS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function submitAidApplication(payload: unknown) {
  const data = sanitizeObject(createAidApplicationSchema.parse(payload));
  const encryptedNik = encrypt(data.nik);

  const created = await prisma.$transaction(async (tx) => {
    const application = await tx.aid_application.create({
      data: {
        application_number: generateApplicationNumber(),
        nik: encryptedNik,
        nama_lengkap: data.nama_lengkap,
        tanggal_lahir: data.tanggal_lahir,
        jenis_kelamin: data.jenis_kelamin,
        alamat: data.alamat,
        nomor_telepon: data.nomor_telepon,
        jumlah_anggota_keluarga: data.jumlah_anggota_keluarga,
        jenis_pekerjaan: data.jenis_pekerjaan,
        status_kepemilikan_rumah: data.status_kepemilikan_rumah,
        keterangan_ekonomi: data.keterangan_ekonomi,
        documents: {
          create: data.documents.map((document) => ({
            document_type: document.document_type,
            file_url: encrypt(document.file_url),
            file_name: document.file_name,
          })),
        },
      },
      include: aidApplicationDetailInclude,
    });

    await createTransition({
      tx,
      applicationId: application.id,
      toStatus: application.status,
      actorType: "CITIZEN",
      notes: "Citizen submitted a new application.",
    });

    return application;
  });

  await broadcastAidApplicationUpdate(created);
  return formatAidApplication(created);
}

export async function submitAidApplicationWorkflow(payload: unknown) {
  const application = await submitAidApplication(payload);
  return validateAidApplication(application.id);
}

export async function resubmitAidApplication(applicationId: string, payload: unknown) {
  const patch = sanitizeObject(resubmitAidApplicationSchema.parse(payload));
  const current = await getAidApplicationRecordOrThrow(applicationId);

  if (current.status !== "REJECTED_INVALID") {
    throw new AidWorkflowError(
      "Only invalid applications can be resubmitted.",
      409,
      "INVALID_RESUBMISSION_STATUS",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    let encryptedNik: Buffer | undefined;
    if (patch.nik) {
      encryptedNik = encrypt(patch.nik);
    }

    await tx.aid_application.update({
      where: { id: applicationId },
      data: {
        nik: encryptedNik,
        nama_lengkap: patch.nama_lengkap,
        tanggal_lahir: patch.tanggal_lahir,
        jenis_kelamin: patch.jenis_kelamin,
        alamat: patch.alamat,
        nomor_telepon: patch.nomor_telepon,
        jumlah_anggota_keluarga: patch.jumlah_anggota_keluarga,
        jenis_pekerjaan: patch.jenis_pekerjaan,
        status_kepemilikan_rumah: patch.status_kepemilikan_rumah,
        keterangan_ekonomi: patch.keterangan_ekonomi,
        rejection_reason: null,
        validation_summary: null,
      },
    });

    if (patch.documents) {
      await tx.aid_application_document.deleteMany({
        where: { application_id: applicationId },
      });
      await tx.aid_application_document.createMany({
        data: patch.documents.map((document) => ({
          application_id: applicationId,
          document_type: document.document_type,
          file_url: encrypt(document.file_url),
          file_name: document.file_name,
        })),
      });
    }

    return updateAidApplicationStatus({
      tx,
      applicationId,
      currentStatus: current.status,
      nextStatus: "SUBMITTED",
      actorType: "CITIZEN",
      notes: "Citizen resubmitted the application.",
    });
  });

  await broadcastAidApplicationUpdate(updated);
  return formatAidApplication(updated);
}

export async function resubmitAidApplicationWorkflow(
  applicationId: string,
  payload: unknown,
) {
  await resubmitAidApplication(applicationId, payload);
  return validateAidApplication(applicationId);
}

export { validateAidApplication };
export { verifyAidApplication };
export { centralizeAidApplication };
export { assignAidProgram };
export { distributeAid };

export async function listAidApplications(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 100);
  const rawStatus = searchParams.get("status");
  const status = isAidApplicationStatus(rawStatus) ? rawStatus : undefined;
  const search = searchParams.get("search")?.trim();

  const where = {
    status,
    OR: search
      ? [
          { application_number: { contains: search } },
          { nama_lengkap: { contains: search } },
        ]
      : undefined,
  };

  const rows = await prisma.aid_application.findMany({
    where,
    include: aidApplicationDetailInclude,
    orderBy: { submitted_at: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.aid_application.count({ where });

  return {
    data: rows.map(formatAidApplication),
    total,
    page,
    limit,
  };
}

export async function getAidApplication(applicationId: string) {
  const row = await prisma.aid_application.findUnique({
    where: { id: applicationId },
    include: aidApplicationDetailInclude,
  });

  if (!row) {
    throw new AidWorkflowError("Application not found.", 404, "APPLICATION_NOT_FOUND");
  }

  return formatAidApplication(row);
}

export async function getAidDashboardSummary() {
  const [
    totalApplications,
    byStatus,
    distributedCount,
    pendingAdmin,
    totalDistributedAmount,
  ] = await Promise.all([
    prisma.aid_application.count(),
    prisma.aid_application.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.aid_application.count({
      where: { status: "DISTRIBUTED" },
    }),
    prisma.aid_application.count({
      where: { status: "PENDING_ADMIN_VERIFICATION" },
    }),
    prisma.aid_distribution.aggregate({
      where: { status: "SUCCESS" },
      _sum: { nominal_bantuan: true },
    }),
  ]);

  const byStatusMap = new Map<AidApplicationStatus, number>(
    byStatus.map((item) => [item.status, item._count.status]),
  );

  return {
    total_applications: totalApplications,
    pending_admin_verification: pendingAdmin,
    distributed_count: distributedCount,
    total_distributed_amount:
      totalDistributedAmount._sum.nominal_bantuan?.toNumber() ?? 0,
    by_status: Object.values(AidApplicationStatus).map((status) => ({
      status,
      count: byStatusMap.get(status) ?? 0,
    })),
  };
}
