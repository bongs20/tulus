import {
  AidApplicationStatus,
  AidDistributionMethod,
  AidProgram,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAidApplicationStatus } from "@/lib/aid/constants";

function parseDateParam(value: string | null, fallback?: Date) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function getAidMonitoringReport(searchParams: URLSearchParams) {
  const startDate = parseDateParam(searchParams.get("start_date"));
  const endDate = parseDateParam(searchParams.get("end_date"));
  const rawStatus = searchParams.get("status");
  const status = isAidApplicationStatus(rawStatus) ? rawStatus : undefined;
  const rawProgram = searchParams.get("program");
  const program = rawProgram && Object.values(AidProgram).includes(rawProgram as AidProgram)
    ? (rawProgram as AidProgram)
    : undefined;
  const rawMethod = searchParams.get("method");
  const method =
    rawMethod &&
    Object.values(AidDistributionMethod).includes(rawMethod as AidDistributionMethod)
      ? (rawMethod as AidDistributionMethod)
      : undefined;

  const applicationWhere: Prisma.aid_applicationWhereInput = {
    status,
    assigned_program: program,
    assigned_distribution_method: method,
    submitted_at:
      startDate || endDate
        ? {
            gte: startDate,
            lte: endDate,
          }
        : undefined,
  };

  const distributionWhere: Prisma.aid_distributionWhereInput = {
    program,
    method,
    created_at:
      startDate || endDate
        ? {
            gte: startDate,
            lte: endDate,
          }
        : undefined,
  };

  const [
    totalApplications,
    statusBreakdown,
    programBreakdown,
    methodBreakdown,
    distributionSummary,
    latestApplications,
  ] = await Promise.all([
    prisma.aid_application.count({ where: applicationWhere }),
    prisma.aid_application.groupBy({
      by: ["status"],
      where: applicationWhere,
      _count: { status: true },
    }),
    prisma.aid_application.groupBy({
      by: ["assigned_program"],
      where: {
        ...applicationWhere,
        assigned_program: program ?? { not: null },
      },
      _count: { assigned_program: true },
    }),
    prisma.aid_application.groupBy({
      by: ["assigned_distribution_method"],
      where: {
        ...applicationWhere,
        assigned_distribution_method: method ?? { not: null },
      },
      _count: { assigned_distribution_method: true },
    }),
    prisma.aid_distribution.aggregate({
      where: distributionWhere,
      _count: { id: true },
      _sum: { nominal_bantuan: true },
    }),
    prisma.aid_application.findMany({
      where: applicationWhere,
      select: {
        id: true,
        application_number: true,
        nama_lengkap: true,
        status: true,
        assigned_program: true,
        assigned_distribution_method: true,
        nominal_bantuan: true,
        submitted_at: true,
        approved_at: true,
        distributed_at: true,
      },
      orderBy: { submitted_at: "desc" },
      take: 100,
    }),
  ]);

  const statusMap = new Map<AidApplicationStatus, number>(
    statusBreakdown.map((item) => [item.status, item._count.status]),
  );

  return {
    filters: {
      start_date: startDate?.toISOString() ?? null,
      end_date: endDate?.toISOString() ?? null,
      status: status ?? null,
      program: program ?? null,
      method: method ?? null,
    },
    summary: {
      total_applications: totalApplications,
      total_distribution_records: distributionSummary._count.id,
      total_distributed_amount:
        distributionSummary._sum.nominal_bantuan?.toNumber() ?? 0,
    },
    status_breakdown: Object.values(AidApplicationStatus).map((item) => ({
      status: item,
      count: statusMap.get(item) ?? 0,
    })),
    program_breakdown: programBreakdown.map((item) => ({
      program: item.assigned_program,
      count: item._count.assigned_program,
    })),
    method_breakdown: methodBreakdown.map((item) => ({
      method: item.assigned_distribution_method,
      count: item._count.assigned_distribution_method,
    })),
    recent_applications: latestApplications.map((item) => ({
      ...item,
      nominal_bantuan: item.nominal_bantuan?.toNumber() ?? null,
    })),
  };
}
