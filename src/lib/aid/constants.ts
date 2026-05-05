import { AidApplicationStatus } from "@prisma/client";

export const AID_APPLICATION_STATUSES = [
  "SUBMITTED",
  "VALIDATING",
  "REJECTED_INVALID",
  "PENDING_ADMIN_VERIFICATION",
  "REJECTED_ADMIN",
  "APPROVED",
  "CENTRALIZED",
  "PROGRAM_ASSIGNED",
  "DISTRIBUTION_IN_PROGRESS",
  "DISTRIBUTED",
] as const satisfies readonly AidApplicationStatus[];

export const AID_ALLOWED_TRANSITIONS: Record<
  AidApplicationStatus,
  readonly AidApplicationStatus[]
> = {
  SUBMITTED: ["VALIDATING"],
  VALIDATING: ["REJECTED_INVALID", "PENDING_ADMIN_VERIFICATION"],
  REJECTED_INVALID: ["SUBMITTED"],
  PENDING_ADMIN_VERIFICATION: ["REJECTED_ADMIN", "APPROVED"],
  REJECTED_ADMIN: [],
  APPROVED: ["CENTRALIZED"],
  CENTRALIZED: ["PROGRAM_ASSIGNED"],
  PROGRAM_ASSIGNED: ["DISTRIBUTION_IN_PROGRESS"],
  DISTRIBUTION_IN_PROGRESS: ["PROGRAM_ASSIGNED", "DISTRIBUTED"],
  DISTRIBUTED: [],
};

export const FINAL_AID_APPLICATION_STATUSES: readonly AidApplicationStatus[] = [
  "REJECTED_ADMIN",
  "DISTRIBUTED",
];

export function isAidApplicationStatus(
  value: string | null,
): value is AidApplicationStatus {
  return Boolean(value && AID_APPLICATION_STATUSES.includes(value as AidApplicationStatus));
}
