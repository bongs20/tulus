import { AidApplicationStatus } from "@prisma/client";
import { sendSms } from "@/lib/sms";

function buildCitizenMessage(
  status: AidApplicationStatus,
  applicationNumber: string,
  note?: string | null,
) {
  switch (status) {
    case "REJECTED_INVALID":
      return `Pengajuan ${applicationNumber} ditolak karena data tidak valid.${note ? ` ${note}` : ""}`;
    case "PENDING_ADMIN_VERIFICATION":
      return `Pengajuan ${applicationNumber} lolos validasi sistem dan sedang menunggu verifikasi petugas.`;
    case "REJECTED_ADMIN":
      return `Pengajuan ${applicationNumber} ditolak oleh petugas.${note ? ` ${note}` : ""}`;
    case "APPROVED":
      return `Pengajuan ${applicationNumber} disetujui dan sedang diproses untuk penyaluran bantuan.`;
    case "DISTRIBUTED":
      return `Pengajuan ${applicationNumber} telah disalurkan.`;
    default:
      return `Status pengajuan ${applicationNumber} diperbarui menjadi ${status}.`;
  }
}

export async function notifyCitizenStatus(params: {
  phoneNumber: string;
  applicationNumber: string;
  status: AidApplicationStatus;
  note?: string | null;
}) {
  const message = buildCitizenMessage(
    params.status,
    params.applicationNumber,
    params.note,
  );

  return sendSms(params.phoneNumber, message);
}
