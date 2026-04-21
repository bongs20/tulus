// src/components/shared/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { StatusAkun, StatusVerifikasi, StatusPenyaluran, StatusSinkronisasi, StatusSanggahan } from '@prisma/client';

interface StatusBadgeProps {
  status: StatusAkun | StatusVerifikasi | StatusPenyaluran | StatusSinkronisasi | StatusSanggahan;
}

const getBadgeVariant = (status: string) => {
  switch (status) {
    case StatusAkun.AKTIF:
    case StatusVerifikasi.DISETUJUI:
    case StatusPenyaluran.BERHASIL:
    case StatusSinkronisasi.MATCH:
    case StatusSanggahan.SELESAI:
      return 'success';
    case StatusAkun.TERKUNCI:
    case StatusVerifikasi.DITOLAK:
    case StatusPenyaluran.GAGAL:
    case StatusSinkronisasi.MISMATCH:
      return 'destructive';
    case StatusVerifikasi.MENUNGGU:
    case StatusPenyaluran.MENUNGGU:
    case StatusSinkronisasi.TERTUNDA:
    case StatusSanggahan.PENDING:
      return 'default'; // gray
    case StatusPenyaluran.DIPROSES:
    case StatusSanggahan.DITINJAU:
      return 'info'; // blue or similar
    case StatusAkun.NONAKTIF:
      return 'secondary'; // subtle
    default:
      return 'default';
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  // Translate Prisma enum values to more readable text if needed
  const displayStatus = status.replace(/_/g, ' ').toLowerCase();

  return (
    <Badge variant={getBadgeVariant(status)} className="capitalize">
      {displayStatus}
    </Badge>
  );
}
