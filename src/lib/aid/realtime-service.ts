import { AidApplicationStatus } from "@prisma/client";
import { triggerPusherEvent } from "@/lib/pusher-server";

type AidRealtimePayload = {
  id: string;
  application_number: string;
  status: AidApplicationStatus;
  nama_lengkap: string;
  submitted_at?: Date;
  approved_at?: Date | null;
  distributed_at?: Date | null;
};

export async function broadcastAidApplicationUpdate(
  application: AidRealtimePayload,
) {
  await Promise.all([
    triggerPusherEvent("aid-applications", "application-updated", {
      id: application.id,
      application_number: application.application_number,
      status: application.status,
      nama_lengkap: application.nama_lengkap,
      submitted_at: application.submitted_at?.toISOString() ?? null,
      approved_at: application.approved_at?.toISOString() ?? null,
      distributed_at: application.distributed_at?.toISOString() ?? null,
    }),
    triggerPusherEvent("dashboard-channel", "aid-application-update", {
      id: application.id,
      application_number: application.application_number,
      status: application.status,
      nama_lengkap: application.nama_lengkap,
    }),
  ]);
}
