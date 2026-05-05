import {
  AidActorType,
  AidDistributionExecutionStatus,
} from "@prisma/client";

export const SUCCESSFUL_DISTRIBUTION_STATUSES: readonly AidDistributionExecutionStatus[] = [
  "SUCCESS",
];

export function mapRoleToActorType(role?: string | null): AidActorType {
  if (role === "ADMINISTRATOR" || role === "PETUGAS_VERIFIKATOR") {
    return "ADMIN";
  }

  if (role === "KEPALA_BIDANG") {
    return "SUPERVISOR";
  }

  return "SYSTEM";
}
